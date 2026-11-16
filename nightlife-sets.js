// ATL Nightclub Mogul: the nine venues, rebuilt from Darnell's reference images.
// Replaces window.createTurnUpVenue (nightlife-worlds.js) with real rooms, furniture, lighting rigs and a motion-capture crowd.
import * as T from 'three';
import * as K from './nightlife-kit.js?v=sets1';
import {makePartygoer, REGULARS} from './nightlife-crowd.js?v=sets1';

const {rnd, pick, Tex, M} = K;
const ENV = id => K.photo('venues/env_' + id + '.jpg');

/* ------------------------------------------------------------ crowd helpers */
function freeSpot(S, x, z, taken){
  const hit = (px, pz) => S.blocks.some(([a, b, c, d]) => px > a - .3 && px < b + .3 && pz > c - .3 && pz < d + .3) || taken.some(([qx, qz]) => Math.hypot(qx - px, qz - pz) < .62);
  if (!hit(x, z)) return [x, z];
  for (let r = .3; r < 2.2; r += .3) for (let a = 0; a < 6.28; a += .7){ const px = x + Math.cos(a)*r, pz = z + Math.sin(a)*r; if (!hit(px, pz)) return [px, pz]; }
  return null;
}
/* a dance floor: people in a loose ring or blob, facing the stage or each other */
function floor(S, cx, cz, n, {r = 3, face = null, hole = 0, beh = 'dance', cheer = .2} = {}){
  for (let i = 0; i < n; i++){
    const a = rnd(0, 6.28), d = hole + Math.sqrt(Math.random())*(r - hole), x = cx + Math.cos(a)*d, z = cz + Math.sin(a)*d*.85;
    const ry = face ? Math.atan2(face[0] - x, face[1] - z) + rnd(-.5, .5) : Math.atan2(cx - x, cz - z) + rnd(-.8, .8);
    S.spots[beh].push({x, z, ry, beh: Math.random() < cheer ? 'cheer' : beh});
  }
}
/* a group chatting in a small circle */
function huddle(S, cx, cz, n = 3, beh = 'talk'){
  for (let i = 0; i < n; i++){ const a = i*6.28/n + rnd(-.3, .3); const x = cx + Math.cos(a)*.62, z = cz + Math.sin(a)*.62; S.spots.talk.push({x, z, ry: Math.atan2(cx - x, cz - z), beh: i === 0 ? beh : pick(['talk', 'idle', 'talk'])}); }
}
function person(S, x, z, ry, beh, extra = {}){ S.spots.idle.push({x, z, ry, beh, fixed: true, ...extra}); }

async function populate(S, {regulars = [], scale = 1, onReady} = {}){
  const all = [...S.spots.dance, ...S.spots.cheer, ...S.spots.talk, ...S.spots.idle];
  const keep = scale >= 1 ? all : all.filter((s, i) => s.fixed || i % Math.round(1/scale) === 0);
  const taken = [], blob = new T.MeshBasicMaterial({map: Tex.glow('rgb(0,0,0)'), transparent: true, opacity: .55, depthWrite: false});
  const blobGeo = new T.PlaneGeometry(.95, .95).rotateX(-Math.PI/2);
  let regIdx = 0, women = 0;
  const people = [];
  const jobs = keep.map((s, i) => {
    const spot = s.fixed ? [s.x, s.z] : freeSpot(S, s.x, s.z, taken); if (!spot) return null; taken.push(spot);
    const gender = s.gender || (Math.random() < .6 ? 'f' : 'm');
    let regular = s.regular;
    if (!regular && gender === 'f' && regIdx < regulars.length && (s.beh === 'dance' || s.beh === 'cheer') && (women++ % 3 === 0)) regular = regulars[regIdx++];
    return makePartygoer({gender: regular ? 'f' : gender, regular, avatar: s.avatar, behavior: s.beh, seed: Math.random(), height: s.height || (regular ? undefined : gender === 'm' ? rnd(1.74, 1.88) : rnd(1.6, 1.72))}).then(p => {
      if (S.disposed){ p.dispose(); return; }
      p.root.position.set(spot[0], s.y || 0, spot[1]); p.root.rotation.y = s.ry;
      if (s.beh !== 'sit'){ const b = new T.Mesh(blobGeo, blob); b.position.set(spot[0], .014 + (s.y || 0), spot[1]); S.g.add(b); }
      S.g.add(p.root); people.push(p); if (regular) p.root.userData.regular = regular;
    }).catch(e => console.warn('partygoer', e));
  });
  S.tick(dt => { for (const p of people) p.update(dt); });
  S.people = people;
  await Promise.all(jobs.filter(Boolean)); onReady?.();
}

/* named staff you can talk to (Meshy characters from nightlife-npcs.js) */
function staff(S, x, z, ry, model, height){
  const a = new T.Group(); a.position.set(x, 0, z); a.rotation.y = ry; S.g.add(a);
  window.loadAtlantaNPC?.(a, model, height).then(({actor, mixer, walk, head, spine}) => {
    if (S.disposed) return; a.add(actor);
    if (walk){ const act = mixer.clipAction(walk).play(); act.paused = true; act.time = walk.duration*.22; mixer.update(0); }
    const hb = head?.quaternion.clone(), sb = spine?.quaternion.clone(), q = new T.Quaternion(), Y = new T.Vector3(0, 1, 0), Z = new T.Vector3(0, 0, 1), ph = rnd(0, 6);
    S.tick((dt, t) => { if (head) head.quaternion.copy(hb).multiply(q.setFromAxisAngle(Y, Math.sin(t*.55 + ph)*.18)); if (spine) spine.quaternion.copy(sb).multiply(q.setFromAxisAngle(Z, Math.sin(t*.9 + ph)*.03)); });
  }).catch(e => console.warn('staff', e));
  S.block(x - .3, x + .3, z - .3, z + .3);
  return a;
}

/* ------------------------------------------------------------ the venues */
const V = {};

/* The Atlantic (Southside warehouse club): trusses of moving heads, the ATL screen, a long lit bar, VIP door */
V.club = S => {
  const W = 20, D = 24, H = 7;
  K.haze(S, 0x140a24, .028);
  const fl = K.floorMat(Tex.concrete(48, .5), 6, 7, .32);
  K.room(S, {w: W, d: D, h: H, floor: fl, walls: {all: K.brickMat('black', 5, 2)}, ceiling: M.std(0x0c0c0e, .9)});
  K.openCeiling(S, {w: W, d: D, h: H, ductColor: 0x8d8f96});
  // draped black fabric over the stage
  for (let i = 0; i < 3; i++){ const c = S.mesh(new T.PlaneGeometry(6, 2.2, 20, 4), M.std(0x0a0a0c, .95, 0, {side: T.DoubleSide}), rnd(-2, 2), H - 1.4, -19 + i*1.2, S.g, {cast: false}); c.rotation.x = Math.PI/2 - .3; const p = c.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k)*1.6)*.35); c.geometry.computeVertexNormals(); }
  // stage, DJ and the big screen
  S.box(8, .6, 3.4, M.std(0x111113, .6), 0, .3, -21.8); S.block(-4, 4, -23.5, -20);
  K.djBooth(S, 0, -21.2, {y: .6, logo: 'ON KEEP FRIDAYS', w: 2.6});
  K.ledScreen(S, {x: 0, y: 3.6, z: -23.85, w: 7.2, h: 3.9, title: 'ATL', sub: 'THE ATLANTIC', accent: '#ff3d6e', accent2: '#4de1ff'});
  K.speakerStack(S, -4.6, -21.8, {n: 5}); K.speakerStack(S, 4.6, -21.8, {n: 5});
  // the arc of trusses with moving heads, as in the photo
  K.truss(S, [-6, 6, -22], [6, 6, -22]); K.truss(S, [-6, 6, -22], [-6.5, 6, -6]); K.truss(S, [6, 6, -22], [6.5, 6, -6]); K.truss(S, [-6.5, 6, -6], [6.5, 6, -6]);
  const cols = [0xb07cff, 0xffffff, 0x8a6cff, 0xffffff];
  for (let i = 0; i < 6; i++){ K.movingHead(S, -5 + i*2, 5.75, -22, {color: cols[i % 4], aim: [(i - 2.5)*1.4, 0, -12], sweep: .45, speed: .5 + i*.05, phase: i}); }
  for (let i = 0; i < 4; i++){ for (const s of [-1, 1]) K.movingHead(S, s*6.2, 5.75, -19 + i*3.6, {color: i % 2 ? 0xffffff : 0xa070ff, aim: [s*-2, 0, -13 + i], sweep: .4, speed: .6, phase: i*2 + s}); }
  for (const s of [-1, 1]){ const red = new T.SpotLight(0xff2a3a, 40, 18, .5, .6, 1.5); red.position.set(s*3.5, 6.5, -17); red.target.position.set(s*1, 0, -12); S.g.add(red, red.target); S.box(.5, .25, .8, M.std(0x141416, .5, .6), s*3.5, 6.6, -17); S.box(.4, .02, .7, M.emissive(0xff2a3a, 3), s*3.5, 6.47, -17); }
  K.floorDots(S, 0, -12, 5);
  // the bar on the right: wood front, lit glass shelves, BEER LIQUOR COCKTAILS
  K.barCounter(S, {x: 8.2, z: -12, len: 9, ry: -Math.PI/2, front: new T.MeshStandardMaterial({map: Tex.planks('#5a3a22'), roughness: .6}), glow: 0xffa040, stools: false});
  K.backBar(S, {x: 9.85, z: -12, len: 9, ry: -Math.PI/2, rows: 4, glow: 0xffb050});
  K.neon(S, 'BEER   LIQUOR   COCKTAILS', {x: 9.75, y: 4.3, z: -12, ry: -Math.PI/2, w: 6, h: .6, color: '#ffc06a', font: '700 110px "Chakra Petch", Arial', light: 3});
  person(S, 9.2, -10, -Math.PI/2, 'talk', {gender: 'm'}); person(S, 9.2, -14.5, -Math.PI/2, 'idle', {gender: 'f'});
  // left wall: SOUTHSIDE banner and the VIP door with a warm room behind it
  K.sign(S, 'SOUTHSIDE', {x: -9.9, y: 4.8, z: -9, ry: Math.PI/2, w: 4, h: 1.1, color: '#e8e6e0', font: '800 150px "Chakra Petch", Arial', backing: 0x0c0c0e});
  K.neon(S, 'VIP', {x: -9.85, y: 3.7, z: -14, ry: Math.PI/2, w: 1.6, h: .7, color: '#ff4fd8', font: '700 170px "Chakra Petch", Arial', light: 4});
  // the VIP door: a warm, hazy room glimpsed through the frame
  const vipTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#5a2a14'); g.addColorStop(.5, '#d98a4a'); g.addColorStop(1, '#3a1a0c'); x.fillStyle = g; x.fillRect(0, 0, 256, 384);
    for (let i = 0; i < 7; i++){ x.fillStyle = 'rgba(20,8,4,.75)'; const px = 30 + i*32 + Math.random()*10, ph = 120 + Math.random()*40; x.beginPath(); x.ellipse(px, 384 - ph - 18, 11, 13, 0, 0, 7); x.fill(); x.fillRect(px - 16, 384 - ph, 32, ph); }
    const r = x.createRadialGradient(128, 120, 5, 128, 120, 140); r.addColorStop(0, 'rgba(255,220,170,.8)'); r.addColorStop(1, 'rgba(255,220,170,0)'); x.fillStyle = r; x.fillRect(0, 0, 256, 384);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  S.mesh(new T.PlaneGeometry(1.8, 2.7), new T.MeshBasicMaterial({map: vipTex, toneMapped: false}), -9.96, 1.35, -14, S.g, {ry: Math.PI/2, cast: false});
  for (const dz of [-.95, .95]) S.box(.14, 2.8, .1, M.std(0x111111, .5, .5), -9.92, 1.4, -14 + dz);
  S.box(.14, .12, 2, M.std(0x111111, .5, .5), -9.92, 2.76, -14);
  const vipL = new T.PointLight(0xffa060, 3, 5, 2); vipL.position.set(-9, 1.6, -14); vipL.userData.prio = 1; S.g.add(vipL);
  K.stanchions(S, [[-9.3, -12.6], [-8.6, -13.4], [-8.6, -14.6], [-9.3, -15.4]]);
  K.framed(S, Tex.text([['FRIDAY', '800 120px "Chakra Petch"', '#fff'], ['NIGHTS', '800 120px "Chakra Petch"', '#ff4fd8']], {bg: '#1a0d2a', w: 512, h: 768}), {x: -9.95, y: 2.4, z: -5, ry: Math.PI/2, w: 1.1, h: 1.6});
  // a VIP booth corner by the entrance
  K.curvedBooth(S, -7.2, -3.2, {r: 1.1, color: 0x2a1a3a, ry: Math.PI*.75});
  K.bistroTable(S, 6.8, -3, {chairs: 0, h: 1.05, r: .32, items: true}); K.bistroTable(S, 6.6, -5.5, {chairs: 0, h: 1.05, r: .32});
  // the crowd: a ring round the open floor, like the photo
  floor(S, 0, -12.5, 30, {r: 6.2, hole: 2.2, cheer: .3});
  floor(S, 0, -17.8, 8, {r: 2.5, face: [0, -22], beh: 'cheer', cheer: .8});
  huddle(S, -6.5, -7.5, 3); huddle(S, 6, -4.2, 3); huddle(S, 7.2, -9, 2); huddle(S, 7.2, -15.5, 3);
  return {size: [W, D], spawn: [0, 1.7, -2.4], look: [0, 1.6, -14], env: 'club', envI: .55, bg: 0x07050c,
    staff: {host: [-5.8, -14, Math.PI/2 - .4, 'marcus', 1.87], extra: [5.6, -8.2, -Math.PI/2 + .4, 'simone', 1.74]},
    regulars: ['imani', 'keisha', 'tasha', 'brielle', 'jada'], dj: [0, -21.85, 0, .6],
    lights: [[0xd0c0ff, .35]]};
};

/* The Volt (Downtown concert hall): brick, a wall of windows on the skyline, drums on a thrust stage, confetti */
V.concert = S => {
  const W = 24, D = 26, H = 8.5;
  K.haze(S, 0x1a1028, .02);
  K.room(S, {w: W, d: D, h: H, holes: {left: [[-3, 5.2, .9, 6.2], [-9, 5.2, .9, 6.2], [-15, 5.2, .9, 6.2]]}, floor: K.floorMat(Tex.concrete(66, .45), 6, 7, .3), walls: {all: K.brickMat('red', 6, 2.4)}, ceiling: new T.MeshStandardMaterial({map: Tex.planks('#3a2a20', 1024, 10), roughness: .8})});
  K.openCeiling(S, {w: W, d: D, h: H, joist: 0x2a1e18, ductColor: 0xa8adb3, spacing: 2.2});
  // the window wall on the left, dusk skyline outside
  const sky = K.photo('venues/sky_dusk.jpg');
  for (const z of [-3, -9, -15]) K.windowWall(S, {x0: -2.6, x1: 2.6, z: 0, y0: .9, y1: 6.2, cols: 3, rows: 4, side: 'left'}).position.set(-W/2 + .05, 0, z);
  K.wallView(S, sky, {side: 'left', at: -W/2 - 5, from: 2, to: -D - 2, y0: -1.5, h: 24, imgH: 10, aspect: 1800/470});
  // the stage
  const stage = S.mesh(new T.CylinderGeometry(5.5, 5.5, 1, 40, 1, false, Math.PI*.7, Math.PI*.6), M.std(0x1a1a1e, .5), 0, .5, -16);
  S.box(11, 1, 5, M.std(0x1a1a1e, .5), 0, .5, -22); S.block(-5.5, 5.5, -24.5, -15.6);
  const carpet = S.mesh(new T.CircleGeometry(3.4, 32), new T.MeshStandardMaterial({map: Tex.rug(), color: 0x9a7a9a, roughness: 1}), 0, 1.012, -18.5); carpet.rotation.x = -Math.PI/2;
  K.drumKit(S, 0, -18.6, {y: 1}); K.micStand(S, -1.4, -17, 1); K.micStand(S, 1.6, -17.2, 1);
  for (const s of [-1, 1]){ K.speakerStack(S, s*4.6, -18, {n: 6, y0: 1, ry: -s*.25}); K.wedge(S, s*1.4, -16.2, Math.PI, 1); }
  K.ledScreen(S, {x: 0, y: 5.2, z: -25.85, w: 8, h: 3.6, title: 'TONIGHT', sub: 'MAGIC CITY TOUR', accent: '#ff5fa8', accent2: '#5fb8ff'});
  // barricade
  for (let i = -5; i <= 5; i++) S.box(.9, 1.1, .08, M.std(0x111114, .5, .6), i*.95, .55, -14.6);
  S.block(-5.4, 5.4, -14.8, -14.4);
  // the rig: pink and blue moving heads all along the curved truss
  K.truss(S, [-9, 7.6, -20], [9, 7.6, -20]); K.truss(S, [-9, 7.6, -12], [9, 7.6, -12]); K.truss(S, [-9, 7.6, -20], [-9, 7.6, -12]); K.truss(S, [9, 7.6, -20], [9, 7.6, -12]);
  for (let i = 0; i < 8; i++) K.movingHead(S, -7.5 + i*2.15, 7.35, -20, {color: i % 2 ? 0x4da8ff : 0xff5fa8, aim: [(i - 3.5)*1.6, 0, -10], sweep: .35, speed: .45, phase: i, beamLen: 9});
  for (let i = 0; i < 6; i++) K.movingHead(S, -6 + i*2.4, 7.35, -12, {color: i % 2 ? 0xff5fa8 : 0x4da8ff, aim: [(i - 2.5)*1.2, 1, -18], sweep: .3, speed: .5, phase: i*1.7, beamLen: 9});
  // confetti in the air
  const conf = new T.InstancedMesh(new T.PlaneGeometry(.05, .03), new T.MeshBasicMaterial({side: T.DoubleSide, toneMapped: false}), 320), mm = new T.Matrix4(), cc = new T.Color(), P = [];
  for (let i = 0; i < 320; i++){ P.push([rnd(-7, 7), rnd(0, 7.5), rnd(-20, -6), rnd(0, 6), rnd(.3, .7)]); conf.setColorAt(i, cc.setHex(pick([0xffffff, 0xff5fa8, 0x5fb8ff, 0xffd34a, 0xb07cff]))); }
  S.g.add(conf);
  S.tick((dt, t) => { const q = new T.Quaternion(), e = new T.Euler(); P.forEach((p, i) => { p[1] -= dt*p[4]; if (p[1] < 0) p[1] = 7.5; e.set(t*3 + p[3], t*2 + p[3], 0); q.setFromEuler(e); mm.compose(new T.Vector3(p[0] + Math.sin(t + p[3])*.3, p[1], p[2]), q, new T.Vector3(1, 1, 1)); conf.setMatrixAt(i, mm); }); conf.instanceMatrix.needsUpdate = true; });
  // the DJ riser by the windows
  S.box(4, .6, 2.6, M.std(0x141416, .6), -8.6, .3, -9.5); S.block(-10.6, -6.6, -10.8, -8.2);
  const desk = S.box(3, .05, .8, M.steel(), -8.6, 1.5, -9.8); for (const s of [-1, 1]) S.box(.05, .9, .7, M.steel(), -8.6 + s*1.4, 1.05, -9.8);
  for (let i = 0; i < 4; i++){ const m = S.box(.5, .3, .03, M.emissive(pick([0x4de1ff, 0xff4fd8, 0xb07cff]), 1.4), -9.7 + i*.72, 1.75, -10.05); m.rotation.x = -.15; }
  K.stool(S, 'metal', -9.3, -8.7).position.y = .6; K.stool(S, 'metal', -8, -8.7).position.y = .6;
  // the bar on the right with neon
  K.barCounter(S, {x: 10.6, z: -8, len: 8, ry: -Math.PI/2, glow: 0xffa040, stools: false, taps: true});
  K.backBar(S, {x: 11.85, z: -8, len: 7, ry: -Math.PI/2, rows: 4, glow: 0xffb050});
  K.neon(S, 'THE VOLT', {x: 11.85, y: 6.2, z: -8, ry: -Math.PI/2, w: 5, h: 1.3, color: '#ffd27a', font: '700 200px "Chakra Petch", Arial', sub: 'ATLANTA', backing: 0x111111, light: 5});
  K.neon(S, 'COLD BEER', {x: 11.8, y: 4.4, z: -6.2, ry: -Math.PI/2, w: 2.2, h: .5, color: '#4d7bff', font: '700 130px Arial', light: 2});
  K.neon(S, 'Cocktails', {x: 11.8, y: 4.4, z: -9.8, ry: -Math.PI/2, w: 2.2, h: .55, color: '#ff3a3a', font: 'italic 700 140px Georgia', light: 2});
  K.neon(S, 'EXIT', {x: 11.9, y: 3, z: -13.5, ry: -Math.PI/2, w: .6, h: .25, color: '#3aff7a', font: '700 140px Arial', light: .5});
  for (const z of [-4, -12]){ const sc = S.mesh(new T.SphereGeometry(.12, 10, 8, 0, Math.PI*2, 0, Math.PI/2), M.emissive(0xffb060, 3), -11.9, 3.2, z); sc.rotation.z = Math.PI/2; }
  // the crowd packs the front, hands up
  floor(S, 0, -10.5, 34, {r: 6.5, face: [0, -18], beh: 'cheer', cheer: .55});
  floor(S, -8.3, -6.5, 6, {r: 1.8, face: [-8.6, -9.8]});
  huddle(S, 8.5, -4, 3); huddle(S, 8.6, -11.5, 3); huddle(S, -5, -3, 3);
  person(S, 11.2, -6.5, -Math.PI/2, 'talk', {gender: 'm'});
  return {size: [W, D], spawn: [1, 1.7, -2.2], look: [0, 2, -16], env: 'concert', envI: .7, bg: 0x0a0812,
    staff: {host: [-7.6, -8.4, Math.PI*.15, 'minh', 1.76], promoter: [3.8, -4.8, Math.PI*.9, 'simone', 1.72], extra: [6.4, -13, -Math.PI*.3, 'elena', 1.74]},
    regulars: ['keisha', 'jada', 'imani'], drummer: [0, -19.15, 0, 1], lights: [[0xffd0e0, .3]]};
};

/* The Pinnacle (rooftop lounge): pavers, glass rail, the wood-slat bar under string lights, a boucle sectional */
V.rooftop = S => {
  const R = 9;
  const sky = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 512; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#0a1a3a'); g.addColorStop(.55, '#1d3a6a'); g.addColorStop(.8, '#6a7fa0'); g.addColorStop(.92, '#e9a46a'); g.addColorStop(1, '#3a2a2a'); x.fillStyle = g; x.fillRect(0, 0, 16, 512); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  S.bgTex = sky;
  const pav = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#6c6f74'; x.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 6000; i++){ x.fillStyle = `rgba(${pick(['0,0,0', '255,255,255'])},${rnd(.02, .06)})`; x.fillRect(rnd(0, 1024), rnd(0, 1024), 3, 3); } x.strokeStyle = 'rgba(40,40,45,.6)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++){ x.beginPath(); x.moveTo(i*256, 0); x.lineTo(i*256, 1024); x.moveTo(0, i*256); x.lineTo(1024, i*256); x.stroke(); } x.fillStyle = '#55595f'; for (let i = 0; i <= 4; i++) for (let k = 0; k <= 4; k++){ x.beginPath(); for (let s = 0; s < 6; s++){ const a = s*Math.PI/3; x.lineTo(i*256 + Math.cos(a)*18, k*256 + Math.sin(a)*18); } x.fill(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 4); return t; })();
  const deck = S.mesh(new T.PlaneGeometry(R*2, R*2), new T.MeshStandardMaterial({map: pav, roughness: .55}), 0, 0, -R + 1, S.g, {cast: false}); deck.rotation.x = -Math.PI/2;
  S.box(R*2 + .4, .9, R*2 + .4, M.std(0x5a5d62, .8), 0, -.46, -R + 1, {cast: false});
  K.skyline(S, K.photo('venues/sky_dusk.jpg'), {r: 46, h: 34, y: -8, bright: 1.05});
  // parapet and glass rail with brass, all round except the entrance stair
  for (const [x0, z0, x1, z1] of [[-R, -2*R + 1, R, -2*R + 1], [-R, 1, -R, -2*R + 1], [R, 1, R, -2*R + 1]]){ K.glassRail(S, x0, z0, x1, z1); }
  S.box(R*2, .45, .25, M.std(0x8a8d92, .8), 0, .22, -2*R + 1.05); S.box(.25, .45, R*2, M.std(0x8a8d92, .8), -R + .1, .22, -R + 1); S.box(.25, .45, R*2, M.std(0x8a8d92, .8), R - .1, .22, -R + 1);
  // the bar: a wood-slat wall with the sign and glowing shelves
  const slat = new T.MeshStandardMaterial({map: (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 32; i++){ x.fillStyle = i % 2 ? '#5a3a24' : '#6a4630'; x.fillRect(i*16, 0, 16, 512); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(i*16 + 14, 0, 2, 512); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 1); return t; })(), roughness: .7});
  S.box(7, 3.4, .4, slat, 0, 1.7, -14.6); S.block(-3.6, 3.6, -15, -14.3);
  K.neon(S, 'THE PINNACLE', {x: 0, y: 3, z: -14.38, w: 3.6, h: .6, color: '#ffe0a8', font: '700 150px "Chakra Petch", Arial', light: 3});
  K.sign(S, 'ROOFTOP LOUNGE  ·  ATLANTA', {x: 0, y: 2.55, z: -14.37, w: 3, h: .22, color: '#2a1d14', font: '700 64px Arial', backing: 0xc9a46a});
  K.bottles(S, {x: 0, y: 1.45, z: -14.25, len: 2.8, rows: 3, rowH: .36});
  for (let r = 0; r < 3; r++){ S.box(2.9, .03, .2, M.std(0x2a1a10, .5), 0, 1.43 + r*.36, -14.27, {cast: false}); S.box(2.9, .01, .01, M.emissive(0xffb46b, 4), 0, 1.41 + r*.36, -14.17, {cast: false}); }
  K.barCounter(S, {x: 0, z: -13.2, len: 4.8, stools: 'wicker', stoolN: 4, top: new T.MeshStandardMaterial({map: Tex.marble('#f0ece6'), roughness: .2}), front: slat, glow: 0xffb46b});
  // string lights between two poles over the lounge
  for (const x of [-5.2, 5.2]){ S.cyl(.05, .05, 5, M.blackMetal(), x, 2.5, -10.5, {seg: 8}); }
  K.stringLights(S, [[-5.2, 4.9, -10.5], [0, 3.6, -14.3], [5.2, 4.9, -10.5]], {n: 18, sag: .5});
  K.stringLights(S, [[-5.2, 4.7, -10.5], [0, 4.2, -6.5], [5.2, 4.7, -10.5]], {n: 16, sag: .6});
  // boucle sectional with rust and charcoal cushions, a brass and glass table
  K.sofa(S, -.8, -8.6, {w: 3.4, d: 1.05, color: 0xece6da, chaise: 1.3, cushions: [0xb5502e, 0x3a3a3a, 0xe8e2d6, 0xb5502e, 0x3a3a3a]});
  K.sofa(S, -3.3, -7.5, {w: 2, d: 1.05, ry: Math.PI/2.4, color: 0xece6da, cushions: [0xe8e2d6, 0xb5502e]});
  K.coffeeTable(S, -.9, -7, {r: .55, glassTop: true}); K.glass(S, -1, .47, -7, S.g, 'coupe');
  // leather lounge chairs and an ottoman on the right
  K.chairAt(S, 'armchair', 4.6, -6.6, -Math.PI*.7, S.g, 0x8a4a28); K.chairAt(S, 'armchair', 5.4, -9, -Math.PI*.5, S.g, 0x8a4a28);
  S.box(.6, .4, .5, new T.MeshStandardMaterial({color: 0x8a4a28, roughness: .5}), 3.6, .2, -7.4); K.coffeeTable(S, 5.6, -7.6, {r: .32, glassTop: true});
  // olive trees and pampas grass in black pots
  for (const [x, z, k] of [[-3.9, -13.6, 'olive'], [3.9, -13.6, 'olive'], [-8, -15.5, 'pampas'], [8, -14, 'pampas'], [-8.1, -2.5, 'pampas'], [8, -3, 'olive'], [-6.5, -15.8, 'olive']]) K.plant(S, x, z, {kind: k, h: k === 'olive' ? 2 : 1.4, pot: 0x18181a, potH: .7});
  // cocktail tables for standing groups
  for (const [x, z] of [[-6, -4.5], [6.5, -12], [2.6, -3.5], [-6.5, -11.5]]) K.bistroTable(S, x, z, {chairs: 0, h: 1.05, r: .3, top: new T.MeshStandardMaterial({map: Tex.marble('#f0ece6'), roughness: .2}), base: 'brass'});
  // an outdoor LED screen on posts by the bar
  for (const dx of [-1.5, 1.5]) S.cyl(.05, .05, 3.3, M.blackMetal(), 6.6 + dx*.85, 1.65, -14.4 + dx*.47, {seg: 8});
  K.ledScreen(S, {x: 6.6, y: 2.6, z: -14.4, ry: -.5, w: 3.2, h: 1.8, title: 'THE PINNACLE', sub: 'ROOFTOP SESSIONS', accent: '#ffb46b', accent2: '#7ab8ff'});
  // guests
  huddle(S, -6, -4.5, 3); huddle(S, 2.6, -3.5, 4); huddle(S, 6.5, -12, 3); huddle(S, -6.5, -11.5, 3);
  floor(S, 2.4, -10.6, 9, {r: 2.1});
  person(S, -.6, -14.3, 0, 'talk', {gender: 'm'}); person(S, .9, -14.3, 0, 'idle', {gender: 'f'});
  return {size: [R*2, R*2], spawn: [0, 1.7, .2], look: [0, 1.6, -12], env: 'rooftop', envI: .9, bg: null, outdoor: true,
    staff: {host: [1.8, -11.8, Math.PI, 'elena', 1.68], extra: [-2.2, -4.2, Math.PI*.15, 'marcus', 1.84]},
    regulars: ['brielle', 'keisha'], lights: [[0xffd8b0, .6], [0x8aa8ff, .5, true]]};
};

/* Westside Soundstage: a film stage with steel bow trusses, tall windows, a mezzanine and a music-video shoot */
V.warehouse = S => {
  const W = 22, D = 24, H = 9;
  K.haze(S, 0x1c2230, .012);
  const conc = Tex.concrete(92, .55);
  const fl = K.floorMat(conc, 5, 5, .22); fl.metalness = .1;
  const cuts = [-5, -12, -19].map(z => [z, 2.2, 1.2, 6.6]);
  K.room(S, {w: W, d: D, h: H, holes: {left: cuts, right: cuts}, floor: fl, walls: {all: K.brickMat('white', 6, 2.4)}, ceiling: M.std(0xd8dce2, .7, .2)});
  // spike tape marks on the floor
  const tape = M.std(0xe8e8e0, .6);
  for (const [x, z] of [[-3, -8], [2, -12], [4, -6], [-1, -15], [0, -10]]){ for (const r of [0, Math.PI/2]){ const t = S.mesh(new T.PlaneGeometry(1, .05), tape, x, .006, z, S.g, {cast: false}); t.rotation.set(-Math.PI/2, 0, r + .4); } }
  // bow-string roof trusses and skylight panels
  for (let z = -2; z > -D; z -= 3.2){ const curve = new T.QuadraticBezierCurve3(new T.Vector3(-W/2, H - 1.4, z), new T.Vector3(0, H + .8, z), new T.Vector3(W/2, H - 1.4, z)); S.mesh(new T.TubeGeometry(curve, 30, .07, 6), M.std(0xc9ccd2, .5, .6), 0, 0, 0, S.g, {cast: false}); S.box(W, .06, .06, M.std(0xc9ccd2, .5, .6), 0, H - 1.4, z, {cast: false}); for (let i = -4; i <= 4; i++){ const x = i*W/10, y = H - 1.4 + (1 - (x/(W/2))**2)*1.1; S.box(.04, y - (H - 1.4), .04, M.std(0xc9ccd2, .5, .6), x, (H - 1.4 + y)/2, z, {cast: false}); } }
  for (const [x, z] of [[-3, -6], [2, -11], [-2, -16], [3, -19]]){ S.box(1.2, .04, .6, new T.MeshBasicMaterial({color: 0xf4f6ff, toneMapped: false}), x, H - .05, z, {cast: false}); const L = new T.PointLight(0xe8eeff, 6, 14, 2); L.position.set(x, H - 1, z); S.g.add(L); }
  // tall windows on both sides with acoustic panels between
  const sky = K.photo('venues/sky_dusk.jpg');
  for (const side of [-1, 1]) K.wallView(S, sky, {side: side < 0 ? 'left' : 'right', at: side*(W/2 + 6), from: 2, to: -D - 2, y0: -1, h: 26, imgH: 12, aspect: 1800/470, bright: 1.25});
  for (const side of [-1, 1]) for (const z of [-5, -12, -19]){ const w = K.windowWall(S, {x0: -1.1, x1: 1.1, z: 0, y0: 1.2, y1: 6.6, cols: 3, rows: 6, side: side < 0 ? 'left' : 'right'}); w.position.set(side*(W/2 - .05), 0, z);
    for (const dz of [-2.4, 2.4]) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) S.box(.08, .6, .6, M.std(0x111214, 1), side*(W/2 - .08), 4.6 + i*.62, z + dz + k*.62 - .3, {cast: false}); }
  // the back wall: stencilled name, roll-up door with warm brick corridor, black curtains
  K.sign(S, 'WESTSIDE SOUNDSTAGE', {x: 0, y: 6.8, z: -D + .06, w: 9, h: 1, color: '#c9ccd2', font: '800 120px "Chakra Petch", Arial'});
  K.sign(S, 'ATLANTA  ·  EST. 2014', {x: 0, y: 6.05, z: -D + .06, w: 4.2, h: .35, color: '#b9bcc2', font: '700 70px Arial'});
  const door = S.mesh(new T.PlaneGeometry(3.4, 3.6), new T.MeshStandardMaterial({map: K.brickMat('red', 1.5, 1.5).map, emissive: 0xff9a50, emissiveIntensity: .35}), 0, 1.8, -D + .02);
  const dl = new T.PointLight(0xffa060, 4, 8, 2); dl.position.set(0, 2.6, -D + 1); S.g.add(dl);
  K.curtain(S, -4.6, -D + .3, 5.6, 4.6); K.curtain(S, 4.6, -D + .3, 5.6, 4.6);
  K.neon(S, 'EXIT', {x: 0, y: 3.9, z: -D + .05, w: .5, h: .2, color: '#3aff7a', font: '700 140px Arial', light: .3});
  // mezzanine on the right
  S.box(7, .25, 3.4, M.std(0x9a9da2, .6, .5), W/2 - 3.5, 4.3, -D + 1.7); S.block(W/2 - 7, W/2, -D, -D + 3.5);
  for (const x of [W/2 - 6.8, W/2 - 3.5]) S.cyl(.08, .08, 4.3, M.std(0xc9ccd2, .5, .6), x, 2.15, -D + 3.3, {seg: 8});
  K.glassRail(S, W/2 - 7, -D + 3.4, W/2, -D + 3.4, {brass: false}); K.glassRail(S, W/2 - 7, -D + 3.4, W/2 - 7, -D, {brass: false});
  // overhead lighting grid with fixtures
  K.truss(S, [-7, 7.2, -4], [-7, 7.2, -20]); K.truss(S, [7, 7.2, -4], [7, 7.2, -20]); K.truss(S, [-7, 7.2, -12], [7, 7.2, -12]);
  for (let i = 0; i < 5; i++){ K.movingHead(S, -7, 6.95, -6 - i*3, {color: 0xfff2e0, aim: [0, 0, -11], sweep: .12, speed: .2, phase: i, intensity: 18}); K.movingHead(S, 7, 6.95, -6 - i*3, {color: i % 2 ? 0xff5fa8 : 0x4de1ff, aim: [0, 0, -11], sweep: .25, speed: .35, phase: i*1.3}); }
  // gear: C-stand with sandbags, director's chair, equipment rack, caution column
  const cs = S.group(-6, 0, -3.5); const pole = new T.Mesh(new T.CylinderGeometry(.02, .025, 3.4, 8), M.chrome()); pole.position.y = 1.7; cs.add(pole); for (let i = 0; i < 3; i++){ const leg = new T.Mesh(new T.CylinderGeometry(.015, .015, .7, 6), M.chrome()); leg.position.set(Math.cos(i*2.1)*.3, .15, Math.sin(i*2.1)*.3); leg.rotation.set(Math.sin(i*2.1)*1.2, 0, -Math.cos(i*2.1)*1.2); cs.add(leg); } for (let i = 0; i < 2; i++){ const bag = new T.Mesh(new T.SphereGeometry(.2, 10, 6), M.std(0x6a6258, 1)); bag.scale.set(1.3, .45, .7); bag.position.set(.25 - i*.45, .08, .2); cs.add(bag); }
  K.chairAt(S, 'director', 4, -5.5, -2.4, S.g);
  const rack = S.group(6.6, 0, -6, -.8); const rb = new T.Mesh(new T.BoxGeometry(.6, 1.4, .6), M.std(0x1a1a1c, .5, .4)); rb.position.y = .75; rack.add(rb); for (let i = 0; i < 6; i++){ const led = new T.Mesh(new T.PlaneGeometry(.45, .05), M.emissive(pick([0x5fd38d, 0xffc21a, 0xff4d3d]), 2)); led.position.set(0, .4 + i*.16, .301); rack.add(led); } for (const s of [-1, 1]){ const sp = new T.Mesh(new T.BoxGeometry(.32, .5, .32), M.std(0x111111, .6)); sp.position.set(s*.17, 1.7, 0); rack.add(sp); } S.blockAround(rack);
  const col = S.box(.45, H, .45, M.std(0xe0e2e6, .7), 8.4, H/2, -9.5); const ct = S.mesh(new T.PlaneGeometry(.3, 1.6), new T.MeshStandardMaterial({map: Tex.text([['CAUTION — LOW HANGING TRUSS', '800 60px Arial', '#111']], {bg: '#f2d21a', w: 1024, h: 128}), roughness: .6}), 8.4 - .23, 2.6, -9.5); ct.rotation.set(0, -Math.PI/2, Math.PI/2); S.block(8.1, 8.7, -9.8, -9.2);
  K.sign(S, 'STAGE 3', {x: -W/2 + .06, y: 1.5, z: -3.5, ry: Math.PI/2, w: 1.8, h: .5, color: '#d8dade', font: '800 110px Arial'});
  // the shoot: a DJ set for a music video, the crew round it
  K.djBooth(S, 0, -16, {logo: 'WESTSIDE'});
  for (const dx of [-2.6, 2.6]) S.box(.12, 5, .12, M.blackMetal(), dx, 2.5, -18.4);
  K.ledScreen(S, {x: 0, y: 3.3, z: -18.4, w: 5, h: 2.8, title: 'WESTSIDE', sub: 'MUSIC VIDEO SHOOT', accent: '#ff5fa8', accent2: '#4de1ff'}); K.speakerStack(S, -2.4, -16.2, {n: 4}); K.speakerStack(S, 2.4, -16.2, {n: 4});
  floor(S, 0, -11.5, 18, {r: 4, face: [0, -16], cheer: .25});
  huddle(S, 4.6, -4.6, 3); huddle(S, -5, -7, 2);
  return {size: [W, D], spawn: [0, 1.7, -1.8], look: [0, 2.5, -14], env: 'warehouse', envI: .9, bg: 0x10141c,
    staff: {host: [3, -5.2, -Math.PI*.8, 'minh', 1.76]}, regulars: ['tasha', 'imani'], dj: [0, -16.6, 0, 0],
    lights: [[0xdfe6ff, .9], [0x8aa0c0, .6, true]]};
};

/* Peters Street Social: red brick, a curved wood bar with taps, a long communal table, Edison bulbs and a jukebox */
V.speakeasy = S => {
  const W = 16, D = 18, H = 5.6;
  K.haze(S, 0x1a120c, .012);
  K.room(S, {w: W, d: D, h: H, floor: K.floorMat(Tex.concrete(58, .7), 4, 4, .3), walls: {all: K.brickMat('red', 4, 1.6)}, ceiling: M.std(0x1a1a1c, .9)});
  K.openCeiling(S, {w: W, d: D, h: H, joist: 0x1c1c1e, ductColor: 0x2a2a2e, spacing: 2});
  // the curved bar on the left
  K.barCounter(S, {x: -3.6, z: -12.4, len: 6.6, curve: .9, front: new T.MeshStandardMaterial({map: Tex.planks('#4a2a18'), roughness: .55}), glow: 0xffb050, stools: 'wood', stoolN: 9, taps: true});
  K.backBar(S, {x: -4, z: -D + .25, len: 4.2, rows: 4, glow: 0xffc070});
  K.neon(S, 'Peters Street Social', {x: -4, y: 4.3, z: -D + .2, w: 4.2, h: .9, color: '#ffc87a', font: 'italic 700 120px Georgia', sub: 'EST. ATLANTA', subColor: '#e8d2a8', backing: 0x111111, light: 4});
  K.chalkboard(S, ['TAP', '—', 'LIST'], {x: -.9, y: 2.2, z: -D + .1, w: 1.1, h: 1.6});
  for (let i = 0; i < 4; i++) K.pendant(S, -5.4 + i*1.1, H, -15.6, {drop: 2.2, kind: 'cone'});
  // a side cabinet with glasses and a little neon
  S.box(1.8, .9, .5, M.std(0x2a1a10, .6), -W/2 + 1.2, .45, -13); K.neon(S, 'Open', {x: -W/2 + .06, y: 1.6, z: -13, ry: Math.PI/2, w: .7, h: .3, color: '#4d7bff', font: 'italic 700 140px Georgia', light: 1});
  // the long communal table, live-edge walnut, with tolix chairs, beers, papers and succulents
  const wal = new T.MeshStandardMaterial({map: Tex.planks('#5a3a22', 1024, 3), roughness: .45});
  S.box(1.1, .06, 6.5, wal, 1.2, .76, -8.5); for (const z of [-5.6, -11.4]) S.box(.9, .74, .08, M.blackMetal(), 1.2, .37, z); S.block(.6, 1.8, -11.8, -5.2);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) K.chairAt(S, 'tolix', 1.2 + s*.85, -6 - i*1.05, s < 0 ? Math.PI/2 : -Math.PI/2, S.g, pick([0x2b2d30, 0x5a1f22, 0x2b2d30]));
  for (let i = 0; i < 7; i++) K.glass(S, 1.2 + rnd(-.3, .3), .79, -5.6 - i*.9, S.g, pick(['pint', 'pint', 'rocks']));
  for (const z of [-6.4, -8.8, -11]){ const p = S.cyl(.07, .06, .1, M.std(0xb06a4a, .8), 1.2, .84, z, {seg: 12}); for (let k = 0; k < 8; k++){ const l = S.mesh(new T.ConeGeometry(.025, .09, 5), M.std(0x5a8a5a, .7), 1.2 + rnd(-.04, .04), .93, z + rnd(-.04, .04)); l.rotation.set(rnd(-.6, .6), 0, rnd(-.6, .6)); } }
  for (const z of [-7.4, -10]) S.box(.35, .01, .45, M.std(0xd8d4c8, .9), 1.1, .795, z).rotation.y = rnd(-.4, .4);
  for (let i = 0; i < 4; i++) K.pendant(S, 1.2, H, -5.8 - i*1.8, {drop: 1.9 + (i % 2)*.5, kind: 'edison'});
  // square tables on the right
  for (const [x, z] of [[5.5, -6], [5.6, -10], [5.4, -14.4], [3.2, -15.6]]) K.bistroTable(S, x, z, {round: false, r: .42, chairs: 4, chair: 'tolix', top: wal});
  // the jukebox, the open garage door to the alley, street sign, OPEN LATE neon and a framed skyline photo
  K.jukebox(S, W/2 - .5, -3.4, -Math.PI/2);
  const alley = S.mesh(new T.PlaneGeometry(2.6, 3.2), new T.MeshBasicMaterial({map: K.photo('venues/env_speakeasy.jpg'), toneMapped: false}), W/2 - .02, 1.6, -1.8, S.g, {ry: -Math.PI/2});
  alley.material.map = (() => { const t = K.photo('venues/env_speakeasy.jpg'); t.repeat.set(.06, .35); t.offset.set(.66, .3); return t; })();
  S.box(.3, .3, 3, M.std(0x111111, .6), W/2 - .15, 3.35, -1.8);
  K.sign(S, 'WEST END · ATLANTA GA', {x: W/2 - .06, y: 3.85, z: -1.8, ry: -Math.PI/2, w: 2.8, h: .35, color: '#f0f0e8', font: '700 90px Arial', backing: 0x1a4a2a});
  K.neon(S, 'OPEN LATE', {x: W/2 - .1, y: 1.3, z: -5.2, ry: -Math.PI/2, w: .7, h: .45, color: '#ff2a2a', font: '700 110px Arial', light: 1.5});
  const sk = K.photo('venues/env_speakeasy.jpg'); sk.repeat.set(.07, .11); sk.offset.set(.81, .47);
  K.framed(S, sk, {x: W/2 - .04, y: 2.6, z: -11, ry: -Math.PI/2, w: 1.7, h: 1.2});
  for (let i = 0; i < 6; i++) K.pendant(S, W/2 - 1.2, H, -8 - i*1.4, {drop: 1.5 + rnd(0, 1.4), kind: 'edison', light: i % 2 === 0});
  K.ledScreen(S, {x: -W/2 + .1, y: 3, z: -6, ry: Math.PI/2, w: 2.2, h: 1.25, title: 'GAME NIGHT', sub: 'PETERS STREET SOCIAL', accent: '#ffc87a', accent2: '#5fd38d'});
  // regulars at the bar and the tables
  person(S, -4.2, -15.9, Math.PI*0, 'talk', {gender: 'm'});
  huddle(S, 4.2, -3.6, 3); huddle(S, -1.4, -4.5, 3);
  floor(S, 4.4, -2.4, 5, {r: 1.4}); // a few dancing by the jukebox
  for (let i = 0; i < 5; i++){ const a = -.45 + i*.22, R = 6.6/.9 + .35 + .5; S.spots.idle.push({x: -3.6 + Math.sin(a)*R, z: -12.4 + Math.cos(a)*R - 6.6/.9, ry: a + Math.PI, beh: pick(['talk', 'idle'])}); }
  return {size: [W, D], spawn: [3, 1.7, -1.2], look: [-3, 1.5, -14], env: 'speakeasy', envI: 1.1, bg: 0x0c0806,
    staff: {host: [-2.6, -16.2, Math.PI*.15, 'simone', 1.74]}, regulars: ['brielle', 'tasha'], lights: [[0xffc890, 1.1]]};
};

/* Needle & Groove: black brick, paint splashes, a neon bar with hanging glasses, the DJ at the end of the bar, a packed floor */
V.vinyl = S => {
  const W = 14, D = 17, H = 4.8;
  K.haze(S, 0x10081c, .035);
  K.room(S, {w: W, d: D, h: H, floor: K.floorMat(Tex.concrete(52, .6), 4, 4, .28), walls: {all: K.brickMat('black', 4, 1.6)}, ceiling: M.std(0x0e0e10, .9)});
  K.openCeiling(S, {w: W, d: D, h: H, joist: 0x18181a, ductColor: 0x5a5d62, spacing: 1.5});
  // paint splashes on the left wall
  const splash = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 14; i++){ x.fillStyle = pick(['#ff5fa8', '#7aff6a', '#ff7ac8', '#c9ff5a', '#ff3d8a']); x.beginPath(); const cx = rnd(60, 960), cy = rnd(60, 450); x.moveTo(cx, cy); for (let k = 0; k < 9; k++){ x.lineTo(cx + rnd(-90, 90), cy + rnd(-120, 120)); } x.fill(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  S.mesh(new T.PlaneGeometry(8, 3.6), new T.MeshStandardMaterial({map: splash, transparent: true, roughness: .9}), -W/2 + .03, 1.9, -9, S.g, {ry: Math.PI/2, cast: false});
  // the bar on the right
  K.barCounter(S, {x: 5.6, z: -9, len: 8, ry: -Math.PI/2, front: new T.MeshStandardMaterial({map: Tex.planks('#4a2a18'), roughness: .55}), glow: 0xffa040, stools: false});
  K.backBar(S, {x: W/2 - .2, z: -9, len: 7, ry: -Math.PI/2, rows: 3, glow: 0xffb050});
  // hanging wine glasses
  for (let i = 0; i < 16; i++){ const g = K.glass(S, W/2 - .9, 2.5, -12 + i*.38, S.g, 'wine'); g.rotation.x = Math.PI; g.position.y = 2.75; }
  K.neon(S, 'NEEDLE & GROOVE', {x: W/2 - .12, y: 3.85, z: -9, ry: -Math.PI/2, w: 4.6, h: .75, color: '#ff4fd8', font: 'italic 700 120px "Chakra Petch", Arial', sub: 'LITTLE FIVE POINTS · ATL', subColor: '#4de1ff', light: 4});
  // a record on the wall
  const rec = S.mesh(new T.CircleGeometry(.55, 40), new T.MeshStandardMaterial({color: 0x0a0a0a, roughness: .25, metalness: .3}), W/2 - .05, 2.9, -3.2, S.g, {ry: -Math.PI/2}); const lab = S.mesh(new T.CircleGeometry(.18, 24), M.std(0xd8c8a0, .8), W/2 - .06, 2.9, -3.2, S.g, {ry: -Math.PI/2});
  const rg = new T.PointLight(0xffc070, 2, 3, 2); rg.position.set(W/2 - .6, 2.9, -3.2); S.g.add(rg);
  // the DJ at the end of the bar
  K.djBooth(S, 4.3, -4.4, {ry: -Math.PI/2 - .3, w: 1.8});
  K.chalkboard(S, ['TONIGHT', 'KAITO', 'ON DECKS'], {x: 6.2, y: .75, z: -2.2, ry: -Math.PI/2 - .4, w: .7, h: 1.1, aframe: true});
  K.chalkboard(S, ['PINTS $7'], {x: 4.9, y: .6, z: -9.5, ry: -Math.PI/2, w: .7, h: .35});
  K.framed(S, Tex.text([['NO COVER', '800 110px Arial', '#111'], ['BEFORE 11', '800 110px Arial', '#111']], {bg: '#f2f0e8', w: 512, h: 600}), {x: W/2 - .04, y: 2, z: -1.2, ry: -Math.PI/2, w: .6, h: .7, frame: 0xd8d2b8});
  // rig with moving heads, string bulbs and pin spots
  K.truss(S, [-5, 4.4, -12], [3.5, 4.4, -5]); K.truss(S, [-5, 4.4, -5], [3.5, 4.4, -12]);
  for (let i = 0; i < 6; i++){ const t = i/5; K.movingHead(S, -5 + t*8.5, 4.2, -12 + t*7, {color: i % 2 ? 0x4de1ff : 0xb07cff, aim: [0, 0, -8.5], sweep: .5, speed: .7, phase: i*1.1, beamLen: 6}); }
  K.stringLights(S, [[-6.8, 4.5, -2], [-2, 4.3, -8], [-6.8, 4.5, -14]], {n: 14, sag: .35});
  for (let i = 0; i < 10; i++){ const d = S.mesh(new T.CircleGeometry(.07, 12), new T.MeshBasicMaterial({color: 0xffd090, toneMapped: false}), rnd(-5, 3), H - .02, rnd(-15, -2)); d.rotation.x = Math.PI/2; }
  K.floorDots(S, -1, -8.5, 3.6, [0x4de1ff, 0xb07cff, 0x5fd38d]);
  K.ledScreen(S, {x: -2.4, y: 2.6, z: -D + .1, w: 4, h: 2.2, title: 'NEEDLE & GROOVE', sub: 'KAITO ON DECKS', accent: '#ff4fd8', accent2: '#4de1ff'});
  // a little table and chair by the camera, beer on it, like the photo
  K.bistroTable(S, -5.4, -1.8, {chairs: 1, chair: 'tolix', r: .35});
  // a packed floor
  floor(S, -1, -8.5, 30, {r: 4.2, cheer: .4});
  person(S, 6.7, -6.5, -Math.PI/2, 'talk', {gender: 'f'});
  return {size: [W, D], spawn: [-3.5, 1.7, -1.2], look: [2, 1.8, -9], env: 'vinyl', envI: .6, bg: 0x07050a,
    staff: {host: [3, -11.8, -Math.PI*.3, 'simone', 1.72]}, regulars: ['imani', 'jada', 'keisha'], dj: [4.65, -4.3, -Math.PI/2 - .3 + Math.PI, 0],
    lights: [[0xc0a0ff, .35]]};
};

/* Peachtree Terrace: a glass-walled high-rise lounge, herringbone floor, an onyx bar, tufted velvet booths */
V.terrace = S => {
  const W = 18, D = 17, H = 4.2;
  K.haze(S, 0x0a1020, .012);
  const herr = K.floorMat(Tex.planks('#8a5a36', 1024, 8, true), 3, 3, .6);
  K.room(S, {w: W, d: D, h: H, floor: herr, walls: {front: M.std(0x1a1d24, .8), back: null, left: null, right: null}, ceiling: M.std(0x15171c, .85)});
  // glass on three sides, night skyline beyond
  const sky = K.photo('venues/sky_night.jpg');
  K.skyline(S, sky, {r: 40, h: 26, y: -12, bright: 1.1});
  for (let i = 0; i < 9; i++){ S.box(.1, H, .1, M.blackMetal(), -W/2 + i*W/8, H/2, -D, {cast: false}); }
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) S.box(.1, H, .1, M.blackMetal(), s*W/2, H/2, -i*D/8, {cast: false});
  for (const [x, z, w, ry] of [[0, -D, W, 0], [-W/2, -D/2, D, Math.PI/2], [W/2, -D/2, D, -Math.PI/2]]) S.mesh(new T.PlaneGeometry(w, H), M.glass(), x, H/2, z, S.g, {ry, cast: false});
  S.box(W, .1, .1, M.blackMetal(), 0, .05, -D); S.box(.1, .1, D, M.blackMetal(), -W/2, .05, -D/2); S.box(.1, .1, D, M.blackMetal(), W/2, .05, -D/2);
  // cove lighting round the ceiling and a raised tray in the middle
  for (const [x, z, w, d] of [[0, -D + .3, W - .6, .1], [-W/2 + .3, -D/2, .1, D - .6], [W/2 - .3, -D/2, .1, D - .6]]) S.box(w, .05, d, new T.MeshBasicMaterial({color: 0xcfe0ff, toneMapped: false}), x, H - .3, z, {cast: false});
  S.box(6, .05, 5, M.std(0x101218, .8), 0, H - .02, -8.5, {cast: false});
  for (const [x, z, w, d] of [[0, -6.05, 6, .06], [0, -10.95, 6, .06], [-3, -8.5, .06, 5], [3, -8.5, .06, 5]]) S.box(w, .04, d, new T.MeshBasicMaterial({color: 0x9ab8ff, toneMapped: false}), x, H - .12, z, {cast: false});
  // the onyx bar on the right with globe pendants and the name over the shelves
  K.barCounter(S, {x: 5.4, z: -9.5, len: 6.4, curve: .8, ry: -Math.PI/2, onyx: true, top: M.std(0x111111, .2, .4), glow: 0xffe0b0, stools: false});
  K.backBar(S, {x: 8.7, z: -10, len: 4, ry: -Math.PI/2, rows: 3, glow: 0xffc890, wood: 0x15161a});
  K.sign(S, 'PEACHTREE TERRACE', {x: 8.6, y: 3.65, z: -10, ry: -Math.PI/2, w: 4, h: .45, color: '#f2e6d0', font: '700 110px Arial'});
  for (let i = 0; i < 16; i++) K.pendant(S, rnd(4.2, 6.6), H, rnd(-13, -6.5), {drop: rnd(.7, 1.6), kind: 'globe', light: i % 4 === 0});
  for (const z of [-7.6, -11.6]){ const b = S.cyl(.15, .12, .25, M.steel(), 5.1, 1.2, z, {seg: 16}); }
  // the DJ by the glass with a truss of moving heads
  K.djBooth(S, -5.4, -14.8, {ry: .5, w: 1.8, facade: 0x1a1a22});
  K.truss(S, [-8.5, 3.9, -15.6], [-1.5, 3.9, -16.4]);
  for (let i = 0; i < 6; i++) K.movingHead(S, -8 + i*1.3, 3.65, -15.7 - i*.12, {color: i % 2 ? 0x4de1ff : 0xff4fd8, aim: [-2 + i*.5, 0, -9], sweep: .35, speed: .5, phase: i, beamLen: 5});
  const atl = S.box(1.4, 2.6, .12, new T.MeshStandardMaterial({map: Tex.marble('#5a5d62', 'rgba(220,220,225,.5)', true), roughness: .3}), -7.8, 1.3, -12, {ry: Math.PI/2}); K.sign(S, 'ATL', {x: -7.73, y: 1.9, z: -12, ry: Math.PI/2, w: 1, h: .4, color: '#d8dade', font: '800 170px Arial'});
  K.ledScreen(S, {x: -4.5, y: 2.3, z: -.08, ry: Math.PI, w: 3.2, h: 1.8, title: 'PEACHTREE', sub: 'TERRACE · MIDTOWN', accent: '#ff4fd8', accent2: '#9ab8ff'});
  // tufted burgundy booths with marble tables, red armchairs by the windows
  K.curvedBooth(S, -2.6, -8.5, {r: 1.3, color: 0x5e1a24, ry: Math.PI*.15});
  K.curvedBooth(S, -1.2, -12.6, {r: 1, color: 0x5e1a24, ry: Math.PI});
  for (const [x, z, ry] of [[-8, -3, Math.PI/2], [-8, -5.2, Math.PI/2], [8, -2.2, -Math.PI/2], [8, -15, -Math.PI*.8]]){ K.chairAt(S, 'velvet', x, z, ry, S.g, 0x8a2a2a); }
  K.coffeeTable(S, -7.9, -4.1, {r: .35}); K.coffeeTable(S, 7.9, -3.4, {r: .35});
  for (const [x, z] of [[-1, -15.8], [2.8, -16], [-8.2, -9]]) K.plant(S, x, z, {kind: 'palm', h: 2, pot: 0x222226, potH: .6});
  // dancers in the middle, guests in the booths and at the bar
  floor(S, 1.2, -9.6, 12, {r: 2.3});
  person(S, 7.4, -8.2, -Math.PI/2, 'talk', {gender: 'm'}); person(S, 7.4, -11.4, -Math.PI/2, 'idle', {gender: 'm'});
  huddle(S, 3.2, -5, 3); huddle(S, -5, -5.5, 2);
  return {size: [W, D], spawn: [0, 1.7, -1.2], look: [0, 1.6, -11], env: 'terrace', envI: 1, bg: 0x050814,
    staff: {host: [3.4, -12.6, -Math.PI*.6, 'simone', 1.72]}, regulars: ['keisha', 'jada', 'brielle'], dj: [-5.75, -15.35, .5 + Math.PI, 0],
    lights: [[0xffd8b0, .55], [0xffd8b0, .35, true]]};
};

/* Auburn Listening Room: parquet, a round stage under a crystal chandelier, a curved leather banquette along the windows */
V.jazz = S => {
  const W = 18, D = 18, H = 4.6;
  K.haze(S, 0x0c0a08, .02);
  K.room(S, {w: W, d: D, h: H, floor: K.floorMat(Tex.planks('#5a3a20', 1024, 8, false, true), 4, 4, .38), walls: {front: M.std(0x1c1612, .8), left: new T.MeshStandardMaterial({map: Tex.planks('#2a1d14', 1024, 14), roughness: .7}), back: null, right: null}, ceiling: M.std(0x14110e, .9)});
  // coffered ceiling ring
  const ring = S.mesh(new T.TorusGeometry(3.2, .25, 8, 48), M.std(0x1a1612, .8), 0, H - .3, -9.5); ring.rotation.x = Math.PI/2;
  // windows on the right and back, night skyline
  const sky = K.photo('venues/sky_night.jpg');
  K.skyline(S, sky, {r: 36, h: 24, y: -10, bright: 1.15, arc: Math.PI*1.2, start: Math.PI*.15});
  for (let i = 0; i < 10; i++) S.box(.08, H, .08, M.std(0x1a1612, .6, .4), W/2, H/2, -i*D/9, {cast: false});
  for (let i = 0; i < 8; i++) S.box(.08, H, .08, M.std(0x1a1612, .6, .4), -W/2 + 6 + i*1.7, H/2, -D, {cast: false});
  S.mesh(new T.PlaneGeometry(D, H), M.glass(), W/2, H/2, -D/2, S.g, {ry: -Math.PI/2, cast: false});
  S.mesh(new T.PlaneGeometry(W - 6, H), M.glass(), 3, H/2, -D, S.g, {cast: false});
  S.box(6, H, .2, new T.MeshStandardMaterial({map: Tex.planks('#2a1d14', 1024, 14), roughness: .7}), -W/2 + 3, H/2, -D);
  // brass railing along the windows
  for (const [x0, z0, x1, z1] of [[W/2 - .5, -1, W/2 - .5, -D + .5], [-2.5, -D + .5, W/2 - .5, -D + .5]]){ const a = new T.Vector3(x0, 1, z0), b = new T.Vector3(x1, 1, z1); const tube = S.mesh(new T.TubeGeometry(new T.LineCurve3(a, b), 2, .03, 8), M.brass()); const n = Math.floor(a.distanceTo(b)/.15); for (let i = 0; i <= n; i++){ const p = a.clone().lerp(b, i/n); S.cyl(.008, .008, 1, M.brass(), p.x, .5, p.z, {seg: 5, cast: false}); } }
  // the round stage with piano, bass and drums, under a ring of spots and the chandelier
  S.cyl(2.3, 2.3, .3, M.std(0x111113, .5), 0, .15, -10.5, {seg: 48}); S.block(-2.3, 2.3, -12.8, -8.2);
  const edge = S.mesh(new T.TorusGeometry(2.3, .015, 6, 64), M.emissive(0xffd8a0, 2), 0, .3, -10.5); edge.rotation.x = Math.PI/2;
  K.grandPiano(S, -.6, -11.2, {ry: .5, y: .3}); K.drumKit(S, 1.1, -11.4, {ry: -.4, y: .3}); K.uprightBass(S, -1.5, -9.7, {y: .3});
  const tr = S.mesh(new T.TorusGeometry(2.6, .1, 6, 48), M.blackMetal(), 0, H - .55, -10.5); tr.rotation.x = Math.PI/2;
  for (let i = 0; i < 10; i++){ const a = i*Math.PI/5; K.movingHead(S, Math.cos(a)*2.6, H - .7, -10.5 + Math.sin(a)*2.6, {color: 0xfff0d8, aim: [0, .3, -10.5], sweep: .02, speed: .1, phase: i, beamLen: 4.6, width: .25, intensity: 12}); }
  K.chandelier(S, 0, H - .5, -10.5, {tiers: 4, r: .8});
  // the bar on the left with brass AUBURN letters
  K.barCounter(S, {x: -6.6, z: -6.8, len: 5.2, curve: .7, ry: Math.PI/2, front: new T.MeshStandardMaterial({map: Tex.planks('#3a2214', 512, 16), roughness: .5}), top: new T.MeshStandardMaterial({map: Tex.marble('#1a1a1a', 'rgba(200,190,170,.35)', true), roughness: .15}), glow: 0xffb060, stools: false});
  K.backBar(S, {x: -W/2 + .25, z: -6.8, len: 4, ry: Math.PI/2, rows: 3, glow: 0xffb060});
  K.neon(S, 'AUBURN', {x: -W/2 + .2, y: 3.85, z: -6.8, ry: Math.PI/2, w: 3.4, h: .9, color: '#ffc06a', font: '700 200px Georgia', sub: 'LISTENING ROOM', subColor: '#d8b880', backing: 0x16110c, light: 3});
  for (let i = 0; i < 3; i++) K.pendant(S, -6.4, H, -5.5 - i*1.3, {drop: 1.4, kind: 'cone', shade: 0x2a2a2a});
  for (const z of [-2.5, -12, -15]){ const sc = S.mesh(new T.CylinderGeometry(.07, .05, .25, 10), M.emissive(0xffb870, 2.5), -W/2 + .1, 2.3, z); }
  K.ledScreen(S, {x: -W/2 + .1, y: 2.4, z: -13.2, ry: Math.PI/2, w: 2.6, h: 1.5, title: 'AUBURN', sub: 'LIVE JAZZ TONIGHT', accent: '#ffc06a', accent2: '#8ab4ff'});
  // the curved leather banquette along the windows, small black tables with candles and green velvet stools
  const ban = S.group(W/2 - 1.2, 0, -9);
  for (let i = 0; i < 6; i++){ const z = 6 - i*2.2; const s = new T.Mesh(new T.BoxGeometry(.75, .45, 2.1), new T.MeshStandardMaterial({map: Tex.fabric('#5a1a1c', true), roughness: .45})); s.position.set(0, .23, z - 5); ban.add(s); const b = new T.Mesh(new T.BoxGeometry(.2, .55, 2.1), s.material); b.position.set(.4, .7, z - 5); ban.add(b); }
  S.block(W/2 - 1.7, W/2, -D, -1);
  for (const [x, z] of [[6.2, -3.5], [6.2, -7], [6.2, -10.5], [6.2, -14], [3.4, -15.6], [-3.6, -3.4], [3.4, -3.4], [-4, -14.6]]) K.bistroTable(S, x, z, {r: .32, chairs: x > 6 ? 0 : 2, chair: 'velvet', chairColor: 0x0f4a44, top: M.std(0x0c0c0c, .3, .2), base: 'brass'});
  // listeners
  for (const [x, z] of [[5.6, -3.5], [5.6, -7], [5.6, -10.5]]) person(S, x + .8, z, -Math.PI/2, 'sit', {y: 0});
  huddle(S, -3.6, -4.6, 3); huddle(S, 3.2, -6, 2);
  for (let i = 0; i < 5; i++){ const a = rnd(-.8, .8); S.spots.idle.push({x: Math.sin(a)*4.2, z: -10.5 + Math.cos(a)*4.2, ry: a + Math.PI, beh: pick(['idle', 'talk'])}); }
  floor(S, 0, -6.2, 4, {r: 1.2, face: [0, -10.5]});
  person(S, -7.6, -6.8, Math.PI/2, 'talk', {gender: 'm'});
  return {size: [W, D], spawn: [0, 1.7, -1.4], look: [0, 1.5, -10.5], env: 'jazz', envI: .75, bg: 0x04060c,
    staff: {host: [-4.6, -8.4, Math.PI*.6, 'minh', 1.76]}, regulars: ['brielle', 'imani'], band: true,
    lights: [[0xffd8a8, .35]]};
};

/* BeltLine Loft: brick, black steel, a wood plank ceiling, big grid windows on the trail, a green sectional and a kitchen */
V.loft = S => {
  const W = 14, D = 20, H = 4.4;
  K.room(S, {w: W, d: D, h: H, holes: {left: [[-4, 5.4, .9, 3.8], [-10.5, 5.4, .9, 3.8]]}, floor: K.floorMat(Tex.concrete(88, .6), 4, 5, .28), walls: {all: K.brickMat('red', 4, 1.4)}, ceiling: new T.MeshStandardMaterial({map: Tex.planks('#7a5232', 1024, 12), roughness: .7})});
  // steel beams and columns
  for (let z = -2; z > -D; z -= 4.5){ S.box(W, .35, .25, M.blackMetal(), 0, H - .18, z, {cast: false}); for (const x of [-2.2, 2.6]) S.box(.25, H, .25, M.blackMetal(), x, H/2, z); S.block(-2.4, -2, z - .2, z + .2); S.block(2.4, 2.8, z - .2, z + .2); }
  const dm = new T.MeshStandardMaterial({color: 0xa8adb3, roughness: .35, metalness: .9}); const duct = S.cyl(.3, .3, D - 1, dm, 0, H - .7, -D/2, {seg: 18, cast: false}); duct.rotation.x = Math.PI/2;
  // big grid windows on the left, the BeltLine outside in late sun
  const view = K.photo('venues/sky_loft.jpg');
  for (const z of [-4, -10.5]) K.windowWall(S, {x0: -2.7, x1: 2.7, z: 0, y0: .9, y1: 3.8, cols: 7, rows: 5, side: 'left'}).position.set(-W/2 + .05, 0, z);
  K.wallView(S, view, {side: 'left', at: -W/2 - 4, from: 2, to: -D - 2, y0: -1, h: 12, imgH: 6.5, aspect: 615/380, bright: 1.15});
  const sun = new T.DirectionalLight(0xffd8a8, 2.6); sun.position.set(-14, 6, -3); sun.target.position.set(2, 0, -8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, {left: -12, right: 12, top: 12, bottom: -12}); sun.userData.keep = true; S.g.add(sun, sun.target);
  // living area: green velvet sectional on a Persian rug, a mid-century coffee table, an arc lamp and a fig tree
  K.rug(S, -3.6, -4.6, 4, 2.8);
  K.sofa(S, -4.6, -3.4, {w: 3, d: 1, color: 0x3a4a2a, chaise: 1.4, ry: Math.PI/2.1, legs: 'black', cushions: [0x3a4a2a, 0x3a4a2a]});
  K.coffeeTable(S, -3.3, -4.8, {w: 1.2, d: .65});
  const book = S.box(.38, .03, .26, M.std(0xe8e2d0, .9), -3.4, .46, -4.8); const mug = S.cyl(.045, .04, .1, M.std(0x5a7a6a, .5), -3, .5, -4.6, {seg: 12});
  const arc = new T.QuadraticBezierCurve3(new T.Vector3(-6.4, 0, -6.2), new T.Vector3(-6.4, 2.6, -6.2), new T.Vector3(-4.8, 2.1, -5.4)); S.mesh(new T.TubeGeometry(arc, 20, .02, 6), M.brass()); const shade = S.mesh(new T.SphereGeometry(.22, 16, 8, 0, Math.PI*2, 0, Math.PI/2), M.brass(), -4.8, 2.1, -5.4); const al = new T.PointLight(0xffc890, 2, 4, 2); al.position.set(-4.8, 1.9, -5.4); S.g.add(al);
  K.plant(S, -6.3, -1.4, {kind: 'fig', h: 2.2, pot: 0xa0522d, potH: .45});
  // the kitchen run on the right
  const oak = new T.MeshStandardMaterial({map: Tex.planks('#b98a52', 1024, 6), roughness: .55});
  S.box(.7, .9, 6, oak, W/2 - .4, .45, -6.5); S.box(.75, .05, 6.05, new T.MeshStandardMaterial({map: Tex.marble(), roughness: .2}), W/2 - .42, .92, -6.5); S.block(W/2 - .8, W/2, -9.6, -3.4);
  const tile = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#c8c6c0'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#f4f2ee'; for (let r = 0; r < 8; r++) for (let k = -1; k < 9; k++) x.fillRect(k*64 + (r % 2)*32 + 2, r*32 + 2, 60, 28); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(6, 1); return t; })();
  S.mesh(new T.PlaneGeometry(6, .9), new T.MeshStandardMaterial({map: tile, roughness: .25}), W/2 - .03, 1.4, -6.5, S.g, {ry: -Math.PI/2, cast: false});
  for (const z of [-4.4, -8.4]){ const em = S.group(W/2 - .45, .95, z, -Math.PI/2); const b = new T.Mesh(new T.BoxGeometry(.35, .38, .35), M.steel()); b.position.y = .19; em.add(b); const t = new T.Mesh(new T.BoxGeometry(.3, .03, .3), M.blackMetal()); t.position.set(0, .4, 0); em.add(t); }
  S.box(.3, .3, .3, M.steel(), W/2 - .45, 1.1, -6.2); // faucet base stand-in
  for (const y of [2.1, 2.7]){ S.box(.28, .04, 3.2, oak, W/2 - .14, y, -6.4); for (let i = 0; i < 18; i++){ const r = S.box(.22, .3, .015, M.std(pick([0xc8102e, 0x1a1a1a, 0xe8e2d0, 0x1d4e9a, 0xd4a637]), .7), W/2 - .16, y + .17, -7.8 + i*.16 + rnd(-.02, .02)); r.rotation.y = Math.PI/2; } }
  K.plant(S, W/2 - .3, -10.6, {kind: 'monstera', h: .9, pot: 0xe8e2d6, potH: .3});
  K.framed(S, Tex.text([['ATLANTA', '800 120px Georgia', '#111']], {bg: '#e8d48a', w: 512, h: 700}), {x: W/2 - .04, y: 2.9, z: -3.6, ry: -Math.PI/2, w: .55, h: .75});
  const sk = K.photo('venues/env_speakeasy.jpg'); sk.repeat.set(.07, .11); sk.offset.set(.81, .47);
  K.framed(S, sk, {x: W/2 - .04, y: 2.2, z: -2.6, ry: -Math.PI/2, w: .7, h: .9});
  // the glass meeting room at the back
  const gx = 3.4, gz = -15.5;
  for (const [x, z, w, ry] of [[gx, gz + 2, 4, 0], [gx - 2, gz, 4, Math.PI/2]]){ S.mesh(new T.PlaneGeometry(w, 3), M.glass(), x, 1.5, z, S.g, {ry, cast: false}); S.box(ry ? .05 : w, .05, ry ? w : .05, M.blackMetal(), x, 3, z); S.box(ry ? .05 : w, .05, ry ? w : .05, M.blackMetal(), x, .02, z); }
  S.block(gx - 2.1, W/2, gz - 2, gz + 2.1);
  K.sign(S, 'THE BELTLINE', {x: gx, y: 2.1, z: gz + 2.02, w: 1.4, h: .25, color: '#f0f0f0', font: '700 90px Arial'});
  S.box(2, .06, .9, oak, gx + .4, .75, gz - .3); for (let i = 0; i < 3; i++) K.chairAt(S, 'tolix', gx - .4 + i*.8, gz + .45, Math.PI, S.g, 0x1a2a4a);
  for (let i = 0; i < 4; i++) K.pendant(S, gx + .4 + (i - 1.5)*.4, H, gz - .3, {drop: 2 + (i % 2)*.3, kind: 'edison', light: i === 0});
  const art = Tex.text([['', '1px a', '#fff']], {bg: '#9ab0a8', w: 512, h: 512}); K.framed(S, art, {x: gx + .5, y: 1.9, z: -D + .04, w: 1.6, h: 1.2});
  K.ledScreen(S, {x: -3.2, y: 2.1, z: -D + .1, w: 2.4, h: 1.35, title: 'THE BELTLINE', sub: 'LOFT SESSIONS', accent: '#ffb46b', accent2: '#5fd38d'});
  // a loft party: a DJ in the corner and friends
  K.djBooth(S, -4.2, -15.6, {ry: .4, w: 1.8, facade: 0x2a1a10});
  floor(S, -1.6, -11.2, 10, {r: 2.2, face: [-4.2, -15.6]});
  huddle(S, -3.4, -6.6, 3); huddle(S, 5.4, -10.8, 3); huddle(S, 4.6, -2.6, 2);
  person(S, -3.9, -3.6, Math.PI/2, 'sit');
  return {size: [W, D], spawn: [1.8, 1.7, -1], look: [-1.5, 1.6, -10], env: 'loft', envI: 1, bg: 0x1a140e,
    staff: {host: [0, -7.6, Math.PI*.9, 'minh', 1.76]}, regulars: ['tasha', 'keisha'], dj: [-4.45, -16.2, .4 + Math.PI, 0],
    lights: [[0xffe8c8, .8], [0xa8b8d0, .5, true]]};
};

/* ------------------------------------------------------------ build a venue for nightlife-venues.js */
window.createTurnUpVenue = function(scene, id, onPerson){
  const S = new K.Set_(scene);
  const ultra = (document.querySelector('#venueQuality')?.value || 'ultra') === 'ultra';
  const cfg = (V[id] || V.club)(S);
  // lighting: the reference panorama lights and reflects in the room
  const env = ENV(cfg.env); env.mapping = T.EquirectangularReflectionMapping;
  scene.environment = env; scene.environmentIntensity = cfg.envI;
  if (cfg.bg !== null) scene.background = new T.Color(cfg.bg);
  else { S.bgTex.mapping = T.EquirectangularReflectionMapping; scene.background = S.bgTex; }
  scene.fog = S.fog || null;
  for (const [c, i, dir] of cfg.lights || []){ if (dir){ const d = new T.DirectionalLight(c, i); d.position.set(4, 10, 6); d.userData.keep = true; S.g.add(d); } else S.g.add(new T.HemisphereLight(c, 0x1a1214, i)); }
  const key = new T.SpotLight(0xffe2c4, 30, 30, .7, .7, 1.6); key.position.set(-2, cfg.size ? 8 : 8, -2); key.target.position.set(0, 0, -cfg.size[1]/2); key.castShadow = ultra; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0005; key.userData.keep = true; S.g.add(key, key.target);
  S.budget(ultra ? 10 : 5);
  const opt = S.optimize(); console.info('venue', id, 'welded', opt.before, 'pieces into', opt.after, 'draw calls');
  // named staff you can talk to
  const st = cfg.staff || {};
  const host = st.host ? staff(S, ...st.host) : null;
  const promoter = st.promoter ? staff(S, ...st.promoter) : null;
  const extra = st.extra ? staff(S, ...st.extra) : null;
  onPerson(host, promoter, extra);
  // performers: the DJ, the drummer, the jazz trio
  if (cfg.dj){ const [x, z, ry, y] = cfg.dj; S.spots.idle.push({x, z, ry, y, beh: 'dj', fixed: true, gender: 'm', avatar: 'Male_Deep_02'}); }
  if (cfg.drummer){ const [x, z, ry, y] = cfg.drummer; S.spots.idle.push({x, z, ry, y, beh: 'cheer', fixed: true, gender: 'm', avatar: 'Male_Adult_12'}); }
  if (cfg.band){ S.spots.idle.push({x: -1.2, z: -9.3, ry: -.4, y: .3, beh: 'idle', fixed: true, gender: 'm', avatar: 'Male_Deep_01'}); S.spots.idle.push({x: .3, z: -10.4, ry: .5, y: .3, beh: 'idle', fixed: true, gender: 'f', avatar: 'Female_Deep_07'}); }
  // the crowd
  populate(S, {regulars: cfg.regulars || [], scale: ultra ? 1 : .55});
  // screens can be changed from the Screens panel
  window.ATLScreens?.attach(S.screens, id);
  const [w, d] = cfg.size;
  const pad = .45;
  return {
    bounds: id === 'rooftop' ? [-w/2 + pad + .3, w/2 - pad - .3, -d + 1 + pad + .3, 1.4] : [-w/2 + pad, w/2 - pad, -d + pad, -.3],
    blocks: S.blocks, spawn: cfg.spawn, look: cfg.look, floorAt: () => 0,
    update(dt, t){ S.update(dt, t); },
    dispose(){ S.disposed = true; for (const p of S.people || []) p.dispose(); window.ATLScreens?.detach(); }
  };
};
window.ATLVenueNames = {club: 'The Atlantic · Southside', rooftop: 'The Pinnacle · Rooftop', concert: 'The Volt · Downtown'};
