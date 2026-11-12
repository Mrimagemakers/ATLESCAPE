import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { questRoom } from './quest-room.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const rooms = new Map();
const mime = {
  '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.mp3':'audio/mpeg', '.glb':'model/gltf-binary', '.woff2':'font/woff2'
};

function reply(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}

function prune() {
  const cutoff = Date.now() - 45_000;
  for (const [code, room] of rooms) {
    if (room.host.seen < cutoff) rooms.delete(code);
    else if (room.guest?.seen < cutoff) room.guest = null;
  }
}
setInterval(prune, 10_000).unref();

async function roomRequest(req, res, action) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 4096) return reply(res, 413, {error:'Request too large.'});
  }
  let input;
  try { input = JSON.parse(body); } catch { return reply(res,400,{error:'Invalid request.'}); }
  if (action.startsWith('quest/')) {
    const {status,data} = questRoom(action.slice(6),input);
    return reply(res,status,data);
  }
  if (!input || typeof input !== 'object') return reply(res,400,{error:'Invalid request.'});
  prune();
  const player = () => ({token:randomUUID(), seen:Date.now(), state:null});
  if (action === 'create') {
    if (rooms.size >= 1000) return reply(res,503,{error:'All rooms are busy.'});
    let code;
    do { code = randomBytes(4).toString('hex').toUpperCase(); } while (rooms.has(code));
    const host = player();
    rooms.set(code,{host,guest:null,run:null});
    return reply(res,200,{code,token:host.token,host:true});
  }
  const code = String(input.code).toUpperCase();
  const room = rooms.get(code);
  if (!room) return reply(res,404,{error:'Room expired or could not be found.'});
  if (action === 'join') {
    if (room.guest) return reply(res,409,{error:'This room is full.'});
    if (room.run && Date.now() < room.run.until) return reply(res,409,{error:'Wait for the current chase to finish.'});
    room.guest = player();
    room.run = null;
    return reply(res,200,{code,token:room.guest.token,host:false});
  }
  const isHost = input.token === room.host.token;
  const member = isHost ? room.host : room.guest;
  if (!member || input.token !== member.token) return reply(res,403,{error:'Room membership expired.'});
  member.seen = Date.now();
  if (action === 'leave') {
    if (isHost) rooms.delete(code);
    else room.guest = null;
    return reply(res,200,{});
  }
  if (action === 'start') {
    if (!isHost || !room.guest) return reply(res,409,{error:'Both players must be in the room.'});
    if (!/^[a-z0-9_-]{1,60}$/i.test(String(input.gig)) || !Number.isFinite(input.seconds)) {
      return reply(res,400,{error:'Invalid chase.'});
    }
    if (room.run && Date.now() < room.run.until &&
      ![room.host,room.guest].every(p=>['caught','escaped','left'].includes(p.state?.mode))) {
      return reply(res,409,{error:'A chase is still in progress.'});
    }
    room.host.state = room.guest.state = null;
    const startAt = Date.now() + 3000;
    room.run = {id:randomUUID(), gig:input.gig, seed:randomBytes(2).readUInt16LE(), startAt,
      until:startAt + Math.max(15,Math.min(input.seconds,300))*1000 + 15_000};
  } else if (action === 'sync') {
    const s = input.state;
    if (s && s.run === room.run?.id && ['running','paused','caught','escaped','left'].includes(s.mode) &&
      [s.x,s.y,s.z].every(v=>Number.isFinite(v) && Math.abs(v)<100000)) {
      member.state = {x:s.x,y:s.y,z:s.z,mode:s.mode,shots:Math.max(0,Math.min(10000,Number(s.shots)||0))};
    }
  } else return reply(res,404,{error:'Unknown room action.'});
  const peer = isHost ? room.guest : room.host;
  return reply(res,200,{run:room.run,connected:!!peer,peer:peer?.state ?? null,now:Date.now()});
}

export async function handleRequest(req,res) {
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname.startsWith('/room/')) {
      if (req.method !== 'POST') return reply(res,405,{error:'Use POST.'});
      return await roomRequest(req,res,url.pathname.slice(6));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res,405,{error:'Use GET or HEAD.'});
    const file = resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(resolve(root)+sep) || !mime[extname(file)]) return reply(res,404,{error:'File not found.'});
    const info = await stat(file).catch(()=>null);
    if (!info?.isFile()) return reply(res,404,{error:'File not found.'});
    res.writeHead(200,{'Content-Type':mime[extname(file)],'Content-Length':info.size});
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) reply(res,400,{error:'Could not process the request.'});
    else res.destroy();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer(handleRequest).listen(Number(process.env.PORT || 8080),'0.0.0.0',function () {
    console.log('ATL Escape is listening on port '+this.address().port);
  });
}
