'use strict';

const fieldSites = [
  ['Ponce City Market',33.77277,-84.36560,'https://www.aylaonkrog.com/neighborhood','Look beyond the warehouse crates.'],
  ['Historic Fourth Ward Park',33.76940,-84.36480,'https://www.h4wpc.org/faq/','Search beside the low water wall.'],
  ['Krog Street Tunnel',33.75299,-84.36365,'https://www.aylaonkrog.com/neighborhood','Look past the last mural panel.'],
  ['Lang-Carson Park',33.75176,-84.35496,'https://reynoldstownrangers.com/event/walks-with-resident-experts-004-placemaking-teri-nye-and-annie-appleton/','Check the far end of the track.'],
  ['Springvale Park',33.75759,-84.35767,'https://oakcrestheritage.com/markers/georgia/fulton-county/springvale-park','Look near the garden arch.'],
  ['Piedmont Park',33.78509,-84.37378,'https://piedmontpark.org/directions/','Search where the trees thin out.'],
  ['West End Park',33.74150,-84.42437,'https://www.topoquest.com/map/usgs-24k/georgia/southwest-atlanta/42350','Look behind the tall sculpture.'],
  ['Underground Atlanta',33.75274,-84.39008,'https://en.wikipedia.org/wiki/Underground_Atlanta','Follow the rail to the stone column.']
];

const fieldRadius = 100;
const beltlineItem = 'https://www.arcgis.com/home/item.html?id=4e1283d00f78485ebcde8301bc6290f0&sublayer=0#overview';
const trailService = 'https://gis.beltline.org/server/rest/services/ABI_Trails_public/FeatureServer/0';
let trailData;
function fieldPoint(lat, lon) {
  return [(lon+84.434)/.089*100,(33.791-lat)/.057*100];
}
async function drawBeltline(svg,status) {
  const query = new URL(trailService+'/query');
  query.search = new URLSearchParams({where:'1=1',outFields:'usestatus',outSR:'4326',f:'geojson',
    returnGeometry:'true',geometry:'-84.434,33.734,-84.345,33.791',geometryType:'esriGeometryEnvelope',inSR:'4326'});
  try {
    trailData ||= fetch(query,{signal:AbortSignal.timeout(7000)}).then(async response=>{
      const data=await response.json();
      if(!response.ok || !Array.isArray(data.features)) throw new Error('Trail layer unavailable');
      return data.features;
    }).catch(error=>{trailData=null;throw error;});
    const features=await trailData;
    if(!svg.isConnected) return;
    const ns='http://www.w3.org/2000/svg';
    for (const {geometry,properties} of features) {
      const lines=geometry?.type==='LineString'?[geometry.coordinates]:
        geometry?.type==='MultiLineString'?geometry.coordinates:[];
      for (const line of lines) {
        const points=line.filter(point=>point.length>=2 && point.slice(0,2).every(Number.isFinite));
        if(points.length<2)continue;
        const path=document.createElementNS(ns,'polyline');
        path.setAttribute('points',points.map(([lon,lat])=>fieldPoint(lat,lon).join(',')).join(' '));
        if (!/^open\b/i.test(properties?.usestatus || '')) path.classList.add('trail-other');
        svg.append(path);
      }
    }
    status.textContent='BeltLine GIS · Solid lines indicate segments marked open. Dashed lines show other segments.';
  } catch {
    if(svg.isConnected) status.textContent='BeltLine trail layer unavailable. Landmark pins are still available.';
  }
}
function fieldDistance(lat, lon, site) {
  const rad = Math.PI / 180;
  const a = Math.sin((site[1]-lat)*rad/2)**2 +
    Math.cos(lat*rad)*Math.cos(site[1]*rad)*Math.sin((site[2]-lon)*rad/2)**2;
  return 12742000*Math.asin(Math.sqrt(Math.min(1,a)));
}

function verifyFieldLocation(i) {
  return new Promise((resolve,reject)=>{
    if (!navigator.geolocation) { reject(new Error('This browser cannot read GPS. Open the quest over HTTPS on a GPS-enabled phone.')); return; }
    navigator.geolocation.getCurrentPosition(({coords})=>{
      const distance = fieldDistance(coords.latitude,coords.longitude,fieldSites[i]);
      resolve({distance,accuracy:coords.accuracy,near:coords.accuracy <= 65 && distance+coords.accuracy <= fieldRadius});
    },error=>reject(new Error(error.code === 1 ? 'Location access was denied.' : 'GPS unavailable. Try again from an open public area.')),
    {enableHighAccuracy:true,maximumAge:0,timeout:12000});
  });
}

function addFieldMarker(parent, i, onStamp) {
  const site = fieldSites[i];
  const panel = add(parent,'article','');
  panel.className = 'quest-card field-marker';
  add(panel,'h3','Real-world AR marker · '+site[0]);
  add(panel,'p','Stop in a public pedestrian area within 100 m of the pin to unlock the relic.');
  const directions = add(panel,'a','Open walking directions');
  directions.href = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+site[1]+','+site[2];
  directions.target = '_blank';
  directions.rel = 'noopener noreferrer';
  const status = add(panel,'p',done(i,'ar') ? 'AR stamp collected.' : 'Location is checked on your device.');
  status.setAttribute('role','status');
  const launch = button(panel,'Open AR marker',async ()=>{
    if (!verifiedUntil || performance.now() > verifiedUntil) {
      launch.disabled = true;
      status.textContent = 'Check your location again.';
      return;
    }
    const startedInRoom = questRoomSession;
    questPresence = {zone:i,mode:'AR'};
    launch.disabled = true;
    try {
      await openRelicSession('immersive-ar',i,async ()=>{
        status.textContent = 'Confirming location…';
        try {
          const fix = await verifyFieldLocation(i);
          if (fix.near) onStamp(startedInRoom);
          else status.textContent = 'GPS no longer confirms you are inside the marker area.';
        } catch (error) { status.textContent = error.message; }
      },()=>{questPresence=null;});
    } catch { status.textContent = 'This browser could not open WebXR AR. Use an AR-capable browser and device.'; questPresence=null; }
    finally { launch.disabled = false; }
  });
  launch.disabled = true;
  let verifiedUntil = 0;
  const check = button(panel,'Check my location',async ()=>{
    check.disabled = launch.disabled = true;
    status.textContent = 'Checking GPS…';
    try {
      const fix = await verifyFieldLocation(i);
      status.textContent = fix.near ? 'Marker in range. Open AR, point at a surface, then tap to place and tap the relic to collect.' :
        Math.round(fix.distance)+' m from marker · GPS accuracy ±'+Math.round(fix.accuracy)+' m.';
      verifiedUntil = fix.near ? performance.now()+30_000 : 0;
      launch.disabled = !fix.near;
    } catch (error) { status.textContent = error.message; }
    finally { check.disabled = false; }
  });
  panel.insertBefore(check,launch);
}

let questRoomSession = null;
let questPresence = null;
let questRoomBusy = false;
const questRoomNodes = {};
async function questRoomCall(action, body) {
  const response = await fetch(new URL('room/quest/'+action,location.href), {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
    signal:AbortSignal.timeout(5000)
  });
  const result = await response.json().catch(()=>null);
  if (!result) throw new Error('Quest multiplayer requires the ATL Escape Node server.');
  if (!response.ok) throw Object.assign(new Error(result.error),{status:response.status});
  return result;
}
function queueQuestFind(i,type,session=questRoomSession) {
  if (session && questRoomSession === session) session.pending.set(type+i,{zone:i,type});
}
function updateQuestRoom() {
  const {create,join,leave,input,status,team}=questRoomNodes;
  create.disabled = join.disabled = questRoomBusy || !!questRoomSession;
  leave.disabled = questRoomBusy;
  leave.hidden = !questRoomSession;
  input.readOnly = !!questRoomSession;
  const snapshot = questRoomSession?.snapshot;
  team.textContent = snapshot ? snapshot.players.map(player=>player.name+' · '+(player.mode || 'Lobby')+
    (player.zone === null ? '' : ' · '+fieldSites[player.zone][0])).join(' | ') : '';
  if (snapshot) {
    const summary = snapshot.finds.length+'/8 team relics · '+snapshot.stamps.length+'/8 team AR stamps';
    const message = 'Room '+questRoomSession.code+' · '+summary;
    if(status.textContent !== message) status.textContent = message;
  }
}
async function changeQuestRoom(action) {
  if (questRoomBusy) return;
  questRoomBusy = true;
  updateQuestRoom();
  try {
    if (action === 'leave') {
      const {code,token}=questRoomSession;
      questRoomSession=null;
      questRoomNodes.status.textContent = 'Room left.';
      await questRoomCall(action,{code,token}).catch(()=>{});
    } else {
      const code = questRoomNodes.input.value.trim().toUpperCase();
      if (action === 'join' && !/^[0-9A-F]{8}$/.test(code)) throw new Error('Enter the eight-character room code.');
      questRoomSession = {...await questRoomCall(action,{code}),pending:new Map(),snapshot:null};
      questRoomNodes.input.value = questRoomSession.code;
      questRoomNodes.status.textContent = 'Room '+questRoomSession.code+' · Share this code with up to three friends.';
    }
  } catch (error) { questRoomNodes.status.textContent = error.message; }
  finally {questRoomBusy=false;updateQuestRoom();if(tab==='hunt') render();}
}
async function pollQuestRoom() {
  const session = questRoomSession;
  if (session) {
    const sent = [...session.pending].slice(0,16);
    try {
      const result = await questRoomCall('sync',{code:session.code,token:session.token,
        ...(questPresence || {mode:'Map',zone:tab === 'map' ? zone : null}),awards:sent.map(([,award])=>award)});
      if (session === questRoomSession) {
        const changed = JSON.stringify(session.snapshot?.finds) !== JSON.stringify(result.finds) ||
          JSON.stringify(session.snapshot?.stamps) !== JSON.stringify(result.stamps);
        session.snapshot=result;
        for (const [key,award] of sent) if (session.pending.get(key)===award) session.pending.delete(key);
        updateQuestRoom();
        if (changed && tab==='hunt') updateHuntProgress();
      }
    } catch (error) {
      if (session === questRoomSession) {
        if ([403,404].includes(error.status)) {questRoomSession=null;updateQuestRoom();if(tab==='hunt')updateHuntProgress();}
        questRoomNodes.status.textContent=error.message;
      }
    }
  }
  setTimeout(pollQuestRoom,session ? 900 : 600);
}
function initQuestRoom() {
  for (const name of ['create','join','leave','input','status','team']) questRoomNodes[name]=document.querySelector('#quest-room-'+name);
  for (const action of ['create','join','leave']) questRoomNodes[action].onclick=()=>changeQuestRoom(action);
  updateQuestRoom();
  pollQuestRoom();
}
