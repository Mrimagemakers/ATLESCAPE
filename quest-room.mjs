import {randomBytes, randomUUID} from 'node:crypto';

const rooms = new Map();
const idle = 10 * 60_000;

export function questRoom(action, input, now = Date.now()) {
  const respond = (status, data) => ({status, data});
  const fail = (status, error) => respond(status, {error});
  if (!input || typeof input !== 'object') return fail(400, 'Invalid room request.');
  for (const [code, room] of rooms) {
    for (const [token, player] of room.players) {
      if (player.seen < now - idle) room.players.delete(token);
    }
    if (!room.players.size) rooms.delete(code);
  }
  let code = String(input.code || '').toUpperCase();
  if (action === 'create') {
    if (rooms.size >= 500) return fail(503, 'All quest rooms are busy.');
    do { code = randomBytes(4).toString('hex').toUpperCase(); } while (rooms.has(code));
    rooms.set(code, {players:new Map(), finds:new Map(), stamps:new Map(), nextPlayer:1});
  }
  const room = rooms.get(code);
  if (!room) return fail(404, 'Quest room expired or could not be found.');
  if (action === 'create' || action === 'join') {
    if (room.players.size >= 4) return fail(409, 'This quest room is full.');
    const token = randomUUID();
    room.players.set(token, {seen:now, name:'Explorer '+room.nextPlayer++, zone:null, mode:null});
    return respond(200, {code,token});
  }
  const player = room.players.get(input.token);
  if (!player) return fail(403, 'Quest room membership expired.');
  if (action === 'leave') {
    room.players.delete(input.token);
    if (!room.players.size) rooms.delete(code);
    return respond(200, {});
  }
  if (action !== 'sync') return fail(404, 'Unknown quest room action.');
  player.seen = now;
  const valid = zone => Number.isInteger(zone) && zone >= 0 && zone < 8;
  player.zone = valid(input.zone) ? input.zone : null;
  player.mode = ['VR','AR','Map'].includes(input.mode) ? input.mode : 'Map';
  const position = input.position;
  player.position = player.mode === 'VR' && Array.isArray(position) && position.length===2 &&
    position.every(value=>Number.isFinite(value) && Math.abs(value)<=30) ? position : null;
  for (const award of Array.isArray(input.awards) ? input.awards.slice(0,16) : []) {
    if (!award || !valid(award.zone) || !['relic','ar'].includes(award.type)) continue;
    const record = award.type === 'ar' ? room.stamps : room.finds;
    if (!record.has(award.zone)) record.set(award.zone,player.name);
    if (award.type === 'ar' && !room.finds.has(award.zone)) room.finds.set(award.zone,player.name);
  }
  const players = [...room.players.values()].map(({name,zone,mode,position})=>({name,zone,mode,position}));
  return respond(200, {self:player.name, players, finds:[...room.finds], stamps:[...room.stamps]});
}
