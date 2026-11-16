// ATL Nightclub Mogul: the three newest venues, rebuilt for realism. Aquarium Night, Penthouse Loft and The Escape Room.
// Used by nightlife-sets.js. The Escape Room game itself lives in nightlife-escape.js.
import * as T from 'three';
import * as K from './nightlife-kit.js?v=sets1';
import {buildEscapeRoom} from './nightlife-escape.js?v=escape1';

const {rnd, pick, Tex, M} = K;

/* animated light ripples from water */
function causticTex(){
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512);
  // cells of a jittered grid, their edges drawn as soft bright lines
  const pts = []; for (let i = 0; i < 9; i++) for (let k = 0; k < 9; k++) pts.push([i*64 + rnd(8, 56), k*64 + rnd(8, 56)]);
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.shadowColor = '#fff'; x.shadowBlur = 8;
  for (const [px, py] of pts){ x.beginPath(); for (let a = 0; a <= 6.4; a += .5){ const r = 26 + Math.sin(a*3 + px)*7; const X = px + Math.cos(a)*r, Y = py + Math.sin(a)*r; a ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function caustics(S, x, y, z, w, d, {color = 0x5fd8ff, opacity = .35, speed = .03, ry = 0, rx = -Math.PI/2} = {}){
  const tex = causticTex(), t2 = tex.clone(); t2.needsUpdate = true;
  tex.repeat.set(w/3, d/3); t2.repeat.set(w/4.2, d/4.2);
  const mk = (map, o) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), M.add(color, o, map)); m.position.set(x, y, z); m.rotation.set(rx, 0, ry); m.userData.dynamic = true; S.g.add(m); return m; };
  mk(tex, opacity); mk(t2, opacity*.7).position.y += .002;
  S.tick((dt, t) => { tex.offset.set(t*speed, t*speed*.6); t2.offset.set(-t*speed*.8, t*speed*.9); });
}

/* fish made of turned profiles: a body, a tail that swishes, fins */
function fishBody(len, girth, color, spots){
  const pts = [[0, 0], [.08, .55], [.2, .9], [.42, 1], [.65, .85], [.85, .45], [1, .12]].map(([u, r]) => new T.Vector2(r*girth, u*len));
  const geo = new T.LatheGeometry(pts, 18); geo.rotateZ(-Math.PI/2); geo.translate(len/2, 0, 0); // nose at -x... tail at +x
  let map = null;
  if (spots){ const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#' + new T.Color(color).getHexString(); x.fillRect(0, 0, 512, 256); const g = x.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.35)'); x.fillStyle = g; x.fillRect(0, 0, 512, 256); x.fillStyle = 'rgba(235,240,245,.9)'; for (let i = 0; i < 260; i++){ x.beginPath(); x.arc(rnd(0, 512), rnd(0, 256), rnd(2, 5), 0, 7); x.fill(); } map = new T.CanvasTexture(c); map.colorSpace = T.SRGBColorSpace; }
  return new T.Mesh(geo, new T.MeshStandardMaterial({color: spots ? 0xffffff : color, map, roughness: .55, metalness: .1}));
}
function finShape(w, h){ const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(w*.6, h*.4, w, h); s.quadraticCurveTo(w*.75, h*.25, w*.9, 0); s.lineTo(0, 0); return new T.ShapeGeometry(s); }
function makeFish(len, color, {spots = false, dorsal = true} = {}){
  const g = new T.Group(), body = fishBody(len, len*.16, color, spots); body.rotation.y = Math.PI; g.add(body);
  const fm = new T.MeshStandardMaterial({color, roughness: .6, side: T.DoubleSide, map: body.material.map});
  const tail = new T.Group(); tail.position.x = len*.48; g.add(tail);
  const up = new T.Mesh(finShape(len*.28, len*.3), fm); tail.add(up); const dn = new T.Mesh(finShape(len*.22, len*.22), fm); dn.scale.y = -1; tail.add(dn);
  if (dorsal){ const d = new T.Mesh(finShape(len*.18, len*.16), fm); d.position.set(-len*.05, len*.13, 0); g.add(d); }
  for (const s of [-1, 1]){ const p = new T.Mesh(finShape(len*.16, len*.1), fm); p.rotation.set(Math.PI/2*s, 0, -.5); p.position.set(-len*.18, -len*.06, s*len*.1); g.add(p); }
  return {g, tail};
}

/* ------------------------------------------------------------ Aquarium Night */
export function aquarium(S){
  const W = 24, D = 17, H = 6.4, tankZ = -10.5, tankD = 6.5;
  K.haze(S, 0x061a2a, .022);
  // dark terrazzo that catches the blue
  const terr = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#1d2228'; x.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 9000; i++){ x.fillStyle = pick(['#3a4048', '#5a6068', '#0e1216', '#7a8088', '#2a3a48']); x.fillRect(rnd(0, 1024), rnd(0, 1024), rnd(2, 6), rnd(2, 5)); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 4); return t; })();
  K.room(S, {w: W, d: D, h: H, holes: {}, floor: new T.MeshStandardMaterial({map: terr, roughness: .25, metalness: .1}), walls: {all: M.std(0x0b1a26, .85), back: null}, ceiling: M.std(0x060b10, .9)});
  // the acrylic window: framed, slightly tinted, floor to ceiling across the back
  S.box(W, .5, .7, M.std(0x0a0d10, .5, .4), 0, .25, tankZ + .1); S.box(W, .6, .7, M.std(0x0a0d10, .5, .4), 0, H - .3, tankZ + .1);
  for (const x of [-W/2 + .3, W/2 - .3]) S.box(.6, H, .7, M.std(0x0a0d10, .5, .4), x, H/2, tankZ + .1);
  S.mesh(new T.PlaneGeometry(W - 1.2, H - 1.1), new T.MeshPhysicalMaterial({color: 0x9adfff, roughness: .02, metalness: 0, transparent: true, opacity: .08, depthWrite: false}), 0, H/2 + .05, tankZ + .12, S.g, {cast: false});
  S.block(-W/2, W/2, tankZ - .3, tankZ + .5);
  // inside the tank: deep water, sand, rockwork, coral, kelp, light shafts
  const water = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 512; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#9ae8ff'); g.addColorStop(.2, '#3ab0e0'); g.addColorStop(.6, '#1a6aa8'); g.addColorStop(1, '#0e4a7a'); x.fillStyle = g; x.fillRect(0, 0, 16, 512); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const wm = new T.MeshBasicMaterial({map: water, fog: false, toneMapped: false});
  S.mesh(new T.PlaneGeometry(W + 4, H + 2), wm, 0, H/2, tankZ - tankD, S.g, {cast: false});
  for (const s of [-1, 1]) S.mesh(new T.PlaneGeometry(tankD, H + 2), wm, s*(W/2 + 1), H/2, tankZ - tankD/2, S.g, {ry: -s*Math.PI/2, cast: false});
  const sand = S.mesh(new T.PlaneGeometry(W + 2, tankD, 40, 12), new T.MeshStandardMaterial({color: 0xc8b48a, roughness: 1}), 0, .35, tankZ - tankD/2, S.g, {cast: false}); sand.rotation.x = -Math.PI/2;
  const sp = sand.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getX(i)*.7)*.15 + Math.random()*.06 + (sp.getY(i) > 1.5 ? .5 : 0)); sand.geometry.computeVertexNormals();
  caustics(S, 0, .5, tankZ - tankD/2, W + 2, tankD, {opacity: .5});
  const rockM = new T.MeshStandardMaterial({color: 0x6a6258, roughness: .95, flatShading: true});
  for (let i = 0; i < 16; i++){ const g = new T.DodecahedronGeometry(rnd(.5, 1.6), 1), p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k)*rnd(.85, 1.15), p.getY(k)*rnd(.7, 1.2), p.getZ(k)*rnd(.85, 1.15)); g.computeVertexNormals(); const r = S.mesh(g, rockM, -W/2 + 1 + i*1.5 + rnd(-.4, .4), rnd(.3, 1), tankZ - tankD + rnd(.8, 2.5)); r.scale.y = rnd(1, 2.4); }
  for (let i = 0; i < 40; i++){ const c = S.mesh(new T.ConeGeometry(rnd(.06, .16), rnd(.3, .9), 6), M.std(pick([0xe0607a, 0xf2a03a, 0x9a6ae0, 0x40c0a0, 0xf27a5a]), .7), rnd(-W/2 + 1, W/2 - 1), .55, tankZ - rnd(.8, tankD - .5)); c.rotation.z = rnd(-.4, .4); }
  // kelp ribbons that sway
  const kelpM = new T.MeshStandardMaterial({color: 0x7aa84a, emissive: 0x1a3a10, roughness: .7, side: T.DoubleSide, transparent: true, opacity: .85});
  const kelp = [];
  for (let i = 0; i < 12; i++){ const h = rnd(2.5, 5), geo = new T.PlaneGeometry(.25, h, 1, 10); geo.translate(0, h/2, 0); const m = new T.Mesh(geo, kelpM); m.position.set(rnd(-W/2 + .6, W/2 - .6), .4, tankZ - rnd(tankD*.5, tankD - .3)); m.rotation.y = rnd(0, 3); m.userData.dynamic = true; S.g.add(m); kelp.push([m, geo.attributes.position.array.slice(), rnd(0, 6)]); }
  // light shafts from the surface
  for (let i = 0; i < 9; i++){ const m = new T.Mesh(new T.PlaneGeometry(rnd(.8, 1.8), H + 1.5), M.add(0x9adfff, .07, Tex.beam())); m.position.set(-W/2 + 1.5 + i*2.6, H/2, tankZ - rnd(1.5, tankD - 1)); m.rotation.set(0, rnd(-.3, .3), rnd(-.25, .25)); m.userData.dynamic = true; S.g.add(m); }
  // sea life: a whale shark, two manta rays, schools of fish, a few big groupers
  const shark = makeFish(6.5, 0x6a8090, {spots: true}); shark.g.userData.dynamic = true; S.g.add(shark.g);
  const mantas = [0, 1].map(i => { const g = new T.Group(); g.userData.dynamic = true; const mm = new T.MeshStandardMaterial({color: 0x3a4450, roughness: .6, side: T.DoubleSide});
    const wing = s => { const sh = new T.Shape(); sh.moveTo(0, -.8); sh.quadraticCurveTo(s*1.2, -.2, s*2.1, .15); sh.quadraticCurveTo(s*1.1, .5, 0, .9); sh.lineTo(0, -.8); const w = new T.Mesh(new T.ShapeGeometry(sh), mm); w.rotation.x = -Math.PI/2; const p = new T.Group(); p.add(w); g.add(p); return p; };
    const L = wing(1), R = wing(-1); const tail = new T.Mesh(new T.CylinderGeometry(.01, .03, 1.6, 5), mm); tail.rotation.x = Math.PI/2; tail.position.z = -1.3; g.add(tail); S.g.add(g); return {g, L, R, ph: i*3}; });
  const school = (n, color, len) => { const geo = fishBody(len, len*.18, color).geometry, inst = new T.InstancedMesh(geo, new T.MeshStandardMaterial({color, roughness: .35, metalness: .5}), n); inst.userData.dynamic = true; S.g.add(inst); return {inst, n, off: Array.from({length: n}, () => [rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), rnd(.8, 1.2)])}; };
  const schools = [school(90, 0xd8e8f0, .22), school(70, 0xf2c14e, .18), school(60, 0x5fb8ff, .2)];
  const groupers = [0, 1, 2].map(i => { const f = makeFish(1.1, pick([0x7a6a50, 0x5a5a62, 0x8a7a5a])); f.g.userData.dynamic = true; S.g.add(f.g); return f; });
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
  S.tick((dt, t) => {
    // whale shark: a slow lap along the window
    const a = t*.06; shark.g.position.set(Math.sin(a)*8.5, 3.1 + Math.sin(a*2)*.4, tankZ - 3.2 + Math.cos(a)*1.4); shark.g.rotation.y = Math.atan2(-Math.cos(a)*8.5, Math.sin(a)*1.4) + Math.PI/2; shark.tail.rotation.y = Math.sin(t*2.2)*.35;
    for (const m of mantas){ const b = t*.11 + m.ph; m.g.position.set(Math.sin(b)*7, 2 + m.ph*.4 + Math.sin(b*3)*.3, tankZ - 2.5 - Math.cos(b)*1.5); m.g.rotation.y = Math.atan2(Math.cos(b)*7, Math.sin(b)*1.5); const f = Math.sin(t*1.6 + m.ph)*.45; m.L.rotation.z = f; m.R.rotation.z = -f; }
    schools.forEach((s, k) => { const c = t*(.18 + k*.04) + k*2; const cx = Math.sin(c)*7.5, cy = 1.6 + k*1.1 + Math.sin(c*1.7)*.4, cz = tankZ - 2 - k*1.1; const heading = Math.atan2(-Math.cos(c)*7.5, 0.0001) ;
      for (let i = 0; i < s.n; i++){ const o = s.off[i]; v.set(cx + o[0]*1.3 + Math.sin(t*o[3] + i)*.15, cy + o[1]*.6, cz + o[2]*.8); e.set(0, Math.cos(c) >= 0 ? Math.PI : 0, Math.sin(t*6 + i)*.15); q.setFromEuler(e); sc.setScalar(o[3]); m4.compose(v, q, sc); s.inst.setMatrixAt(i, m4); }
      s.inst.instanceMatrix.needsUpdate = true; });
    groupers.forEach((f, i) => { const g = t*.09 + i*2.1; f.g.position.set(Math.sin(g)*6, .9 + i*.5, tankZ - 4 + Math.cos(g*1.3)*.8); f.g.rotation.y = Math.cos(g) >= 0 ? Math.PI : 0; f.tail.rotation.y = Math.sin(t*4 + i)*.3; });
    for (const [m, base, ph] of kelp){ const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++){ const y = base[i*3 + 1]; p.setX(i, base[i*3] + Math.sin(t*.9 + ph + y*.8)*y*.08); } p.needsUpdate = true; }
  });
  // light inside the tank so the animals and rockwork read clearly
  for (const x of [-7, 0, 7]){ const p = new T.PointLight(0x8ae0ff, 18, 12, 1.6); p.position.set(x, H - .6, tankZ - 3); p.userData.prio = 1; S.g.add(p); }
  // the blue room light through the glass, and ripples on the room floor
  const blue = new T.SpotLight(0x5fd0ff, 120, 26, .9, .8, 1.4); blue.position.set(0, H - .5, tankZ - 1); blue.target.position.set(0, 0, -3); blue.userData.prio = 1; S.g.add(blue, blue.target);
  for (const x of [-7, 7]){ const p = new T.PointLight(0x3aa8e0, 14, 14, 2); p.position.set(x, 2.5, tankZ + 1.2); p.userData.prio = 1; S.g.add(p); }
  caustics(S, 0, .012, tankZ + 4, W - 1, 8, {opacity: .16, speed: .02});
  caustics(S, 0, H - .02, -5, W, 10, {opacity: .1, speed: .015, rx: Math.PI/2});
  K.sign(S, 'AQUARIUM NIGHT', {x: 0, y: H - .3, z: tankZ + .47, w: 4.6, h: .42, color: '#e8f6ff', font: '700 120px "Chakra Petch", Arial'});
  // the party: a blue bar, the DJ, cocktail tables in white linen with uplights, curved benches at the glass
  K.barCounter(S, {x: 10.4, z: -4.6, len: 6, ry: -Math.PI/2, front: M.std(0x0e1a24, .3, .5), top: new T.MeshStandardMaterial({map: Tex.marble('#e8ecf0'), roughness: .15}), glow: 0x4dc8ff, stools: false});
  K.backBar(S, {x: W/2 - .2, z: -4.6, len: 5, ry: -Math.PI/2, rows: 3, glow: 0x6ad8ff, wood: 0x0c141c});
  K.neon(S, 'Blue Hour Bar', {x: W/2 - .1, y: 4.2, z: -4.6, ry: -Math.PI/2, w: 3.4, h: .7, color: '#6ad8ff', font: 'italic 700 120px Georgia', light: 2});
  K.djBooth(S, -9.4, -4.2, {ry: Math.PI/2.4, w: 2, facade: 0x0c141c, logo: 'AQUARIUM NIGHT'});
  K.ledScreen(S, {x: -6, y: 3.6, z: -.08, ry: Math.PI, w: 4.2, h: 2.3, title: 'AQUARIUM', sub: 'NIGHT · CENTENNIAL PARK', accent: '#5fd0ff', accent2: '#b07cff'});
  const linen = new T.MeshStandardMaterial({color: 0xf4f4f0, roughness: .9});
  for (const [x, z] of [[-5.5, -3.5], [-2, -2.2], [3.2, -2.6], [6.6, -6.2], [-6.4, -7.4]]){
    const t = S.group(x, 0, z); const cloth = new T.Mesh(new T.CylinderGeometry(.42, .55, 1.06, 24, 1, true), linen); cloth.position.y = .53; t.add(cloth); const top = new T.Mesh(new T.CylinderGeometry(.42, .42, .02, 24), linen); top.position.y = 1.06; t.add(top);
    const tie = new T.Mesh(new T.TorusGeometry(.33, .02, 6, 24), M.std(0x2a6aa8, .6)); tie.rotation.x = Math.PI/2; tie.position.y = .7; t.add(tie); K.glass(S, .1, 1.07, 0, t, 'coupe'); K.candle(S, -.1, 1.07, .05, t);
    const up = S.mesh(new T.CylinderGeometry(.08, .1, .12, 12), M.emissive(0x4dc8ff, 3), x + .7, .06, z + .3); S.block(x - .55, x + .55, z - .55, z + .55);
  }
  for (const x of [-6.5, 0, 6.5]){ const b = S.group(x, 0, tankZ + 2.2); const seat = new T.Mesh(new T.BoxGeometry(3.6, .45, .8), new T.MeshStandardMaterial({map: Tex.fabric('#1d3a5a'), roughness: .95})); seat.position.y = .23; b.add(seat); const base = new T.Mesh(new T.BoxGeometry(3.4, .08, .7), M.emissive(0x2a8ac8, 1.2)); base.position.y = .04; b.add(base); S.blockAround(b, .05); }
  K.stanchions(S, [[-11, -1.2], [-11, -3], [-9.8, -3]], 0x1d3a5a);
  for (const [x, z] of [[-11, -8.8], [11, -8.8], [11, -1.4]]) K.plant(S, x, z, {kind: 'palm', h: 1.8, pot: 0x0c141c, potH: .5});
  // guests at the glass and dancing in the middle
  const glassSpots = [[-8, -8.4], [-4.2, -8.6], [-1, -8.4], [2.4, -8.6], [5.6, -8.4], [8.8, -8.6]];
  for (const [x, z] of glassSpots) S.spots.dance.push({x, z, ry: Math.PI + rnd(-.4, .4), beh: 'dance'});
  for (let i = 0; i < 14; i++){ const a = rnd(0, 6.28), d = Math.sqrt(Math.random())*3; S.spots.dance.push({x: Math.cos(a)*d*1.3, z: -5 + Math.sin(a)*d*.8, ry: rnd(0, 6.28), beh: Math.random() < .25 ? 'cheer' : 'dance'}); }
  for (let i = 0; i < 3; i++) S.spots.dance.push({x: 9.6, z: -3 - i*1.3, ry: Math.PI/2, beh: 'dance', fixed: true});
  return {size: [W, D], spawn: [0, 1.7, -1], look: [0, 2.6, -12], env: 'jazz', envI: .45, bg: 0x02060c,
    staff: {host: [3.2, -1.6, Math.PI*.9, 'camila-reyes', 1.68]}, regulars: ['imani', 'brielle', 'keisha'], dj: [-9.95, -4.45, Math.PI/2.4 + Math.PI, 0],
    lights: [[0x7ac8ff, .4]]};
}

/* ------------------------------------------------------------ Penthouse Loft */
export function penthouse(S){
  const W = 22, D = 18, H = 7.4, MZ = 3.3, mzFront = -10.4, stairX0 = 9.4, stairX1 = 10.8, stairZ0 = -2.6, steps = 15;
  K.haze(S, 0x070a14, .01);
  const floorM = K.floorMat(Tex.planks('#9a6a40', 1024, 8, true), 3.5, 3, .45);
  K.room(S, {w: W, d: D, h: H, floor: floorM, walls: {all: M.std(0x6e5a4a, .7), back: null}, ceiling: M.std(0x2a2420, .9)});
  // the double-height glass wall with Midtown at night
  K.skyline(S, K.photo('venues/sky_night.jpg'), {r: 45, h: 30, y: -14, bright: 1.15});
  S.mesh(new T.PlaneGeometry(W, H), M.glass(), 0, H/2, -D, S.g, {cast: false});
  for (let i = 0; i <= 11; i++) S.box(.08, H, .12, M.blackMetal(), -W/2 + i*W/11, H/2, -D, {cast: false});
  for (const y of [.05, MZ + .15, H - .05]) S.box(W, .1, .12, M.blackMetal(), 0, y, -D, {cast: false});
  // a wall of glass on the left too, onto the pool terrace
  S.mesh(new T.PlaneGeometry(D, H), M.glass(), -W/2 + .02, H/2, -D/2, S.g, {ry: Math.PI/2, cast: false});
  // the mezzanine at the back right, reached by floating stairs on the right wall
  const mzW = W/2 - 1 + 1.2, mzX = W/2 - mzW/2, mzD = D + mzFront, mzZ = mzFront - mzD/2;
  S.box(mzW, .3, mzD, M.std(0xeeeae4, .7), mzX, MZ - .15, mzZ);
  const mzFloor = S.mesh(new T.PlaneGeometry(mzW, mzD), K.floorMat(Tex.planks('#9a6a40', 1024, 8, true), 2, 1.4, .45), mzX, MZ + .006, mzZ, S.g, {cast: false}); mzFloor.rotation.x = -Math.PI/2;
  for (const r of [K.glassRail(S, mzX - mzW/2, mzFront, stairX0 - .05, mzFront, {brass: false}), K.glassRail(S, mzX - mzW/2, mzFront, mzX - mzW/2, -D, {brass: false})]) r.position.y = MZ;
  const run = (stairZ0 - mzFront)/steps;
  for (let i = 0; i < steps; i++){ const h = (i + 1)*MZ/steps; S.box(stairX1 - stairX0, .08, run + .02, new T.MeshStandardMaterial({map: Tex.planks('#9a6a40'), roughness: .5}), (stairX0 + stairX1)/2, h - .04, stairZ0 - (i + .5)*run); }
  S.box(.04, MZ + 1, Math.abs(stairZ0 - mzFront), M.glass(), stairX0 - .02, (MZ + 1)/2, (stairZ0 + mzFront)/2, {cast: false});
  // the bar under the mezzanine, a marble island and a lit back bar
  K.backBar(S, {x: 5.6, z: -D + .25, len: 6, rows: 2, h: 2, glow: 0xffc890, wood: 0x1a1a1c});
  K.barCounter(S, {x: 5.6, z: -14.2, len: 5.4, top: new T.MeshStandardMaterial({map: Tex.marble(), roughness: .12}), front: new T.MeshStandardMaterial({map: Tex.marble('#d8d4ce'), roughness: .2}), glow: 0xffd8a0, stools: 'velvet'});
  for (let i = 0; i < 4; i++) K.pendant(S, 4 + i*1, MZ - .1, -14.2, {drop: .7, kind: 'globe', light: i % 2 === 0});
  // the pool terrace on the left, glowing water
  const poolTex = causticTex(); poolTex.repeat.set(2, 3);
  const pool = S.mesh(new T.PlaneGeometry(4.2, 6.6), new T.MeshStandardMaterial({color: 0x1aa8c8, emissive: 0x0a6a8a, emissiveIntensity: .9, roughness: .05, metalness: .2}), -W/2 - 3.4, .02, -9, S.g, {cast: false}); pool.rotation.x = -Math.PI/2;
  caustics(S, -W/2 - 3.4, .03, -9, 4.2, 6.6, {opacity: .4, color: 0xaaf0ff});
  const deck = S.mesh(new T.PlaneGeometry(9, D + 2), new T.MeshStandardMaterial({map: Tex.planks('#7a6a5a', 1024, 10), roughness: .8}), -W/2 - 4.5, 0, -D/2, S.g, {cast: false}); deck.rotation.x = -Math.PI/2; deck.position.y = -.01;
  for (const z of [-4.5, -13.5]){ const l = S.group(-W/2 - 6.6, 0, z, Math.PI/2); const b = new T.Mesh(new T.BoxGeometry(.7, .3, 1.9), M.std(0xf2eee6, .9)); b.position.y = .3; l.add(b); const back = new T.Mesh(new T.BoxGeometry(.7, .5, .2), b.material); back.position.set(0, .55, -.85); back.rotation.x = .5; l.add(back); }
  const pl = new T.PointLight(0x4ad8ff, 6, 9, 2); pl.position.set(-W/2 - 3.4, .6, -9); pl.userData.prio = 1; S.g.add(pl);
  // living area: a sectional on a rug, a linear fireplace with a screen above, a grand piano by the glass
  K.rug(S, -4.2, -6.2, 5, 3.6);
  K.sofa(S, -4.2, -4.4, {w: 3.6, d: 1, color: 0xe8e2d6, chaise: 1.4, ry: Math.PI, cushions: [0x2a3a5a, 0xc9a46a, 0x2a3a5a]});
  K.sofa(S, -6.9, -7, {w: 2.4, d: 1, color: 0xe8e2d6, ry: -Math.PI/2, cushions: [0xc9a46a, 0x2a3a5a]});
  K.coffeeTable(S, -4, -6.6, {r: .6});
  const fire = S.group(-W/2 + .05, 0, -6.4, Math.PI/2);
  const fb = new T.Mesh(new T.BoxGeometry(4.2, 1.1, .2), M.std(0x1a1a1c, .4, .3)); fb.position.y = .9; fire.add(fb);
  const flame = new T.Mesh(new T.PlaneGeometry(3.6, .35), new T.MeshBasicMaterial({map: Tex.glow('rgb(255,150,60)'), color: 0xff8a3a, transparent: true, blending: T.AdditiveBlending, toneMapped: false})); flame.position.set(0, .8, .11); flame.userData.dynamic = true; fire.add(flame);
  S.tick((dt, t) => { flame.scale.y = .8 + Math.sin(t*9)*.12 + Math.sin(t*13.7)*.08; });
  const fl = new T.PointLight(0xff8a3a, 3, 6, 2); fl.position.set(-W/2 + .8, 1, -6.4); fl.userData.prio = 1; S.g.add(fl);
  K.ledScreen(S, {x: -W/2 + .12, y: 3, z: -6.4, ry: Math.PI/2, w: 3.6, h: 2, title: 'PENTHOUSE', sub: 'MIDTOWN · TONIGHT', accent: '#ffb46b', accent2: '#9ab8ff'});
  K.grandPiano(S, -3.6, -15.2, {ry: -.6});
  // art, plants, a sculptural chandelier through the double height
  K.framed(S, Tex.text([['', '1px a', '#fff']], {bg: '#c46a3a', w: 512, h: 512}), {x: 1.4, y: 3.6, z: -.08, ry: Math.PI, w: 2.2, h: 2.2});
  K.framed(S, Tex.text([['', '1px a', '#fff']], {bg: '#2a3a5a', w: 512, h: 512}), {x: -2.2, y: 3.6, z: -.08, ry: Math.PI, w: 1.4, h: 2.2});
  for (const [x, z] of [[-10.2, -1.2], [-10.2, -16.8], [1.2, -16.8], [8.4, -1.2]]) K.plant(S, x, z, {kind: pick(['fig', 'olive', 'palm']), h: 2.4, pot: 0xe8e2d6, potH: .5});
  for (let i = 0; i < 24; i++){ const a = i*Math.PI*2/24, r = 1.2 + (i % 3)*.3; K.pendant(S, -2 + Math.cos(a)*r, H, -10 + Math.sin(a)*r, {drop: 2.2 + (i % 4)*.4, kind: 'globe', light: i % 8 === 0}); }
  // the DJ on the mezzanine, overlooking the room
  K.djBooth(S, 6, -11.4, {y: MZ, ry: Math.PI, w: 2.2, facade: 0x1a1a1c});
  K.truss(S, [-6, H - .3, -12], [6, H - .3, -12]);
  for (let i = 0; i < 5; i++) K.movingHead(S, -5 + i*2.5, H - .55, -12, {color: i % 2 ? 0xffb46b : 0x9a7cff, aim: [-2 + i, 0, -7], sweep: .3, speed: .4, phase: i, beamLen: 7});
  // guests: dancing in the living room, by the bar, up on the mezzanine
  for (let i = 0; i < 16; i++){ const a = rnd(0, 6.28), d = Math.sqrt(Math.random())*2.6; S.spots.dance.push({x: 1.4 + Math.cos(a)*d*1.2, z: -8.6 + Math.sin(a)*d*.9, ry: rnd(0, 6.28), beh: Math.random() < .25 ? 'cheer' : 'dance'}); }
  for (let i = 0; i < 6; i++) S.spots.dance.push({x: 2.4 + i*1.1, z: -12.8 - (i % 2)*1.2, y: MZ, ry: rnd(0, 6.28), beh: 'dance', fixed: true});
  for (let i = 0; i < 4; i++) S.spots.dance.push({x: -8.6 + (i % 2)*1.3, z: -2.4 - Math.floor(i/2)*1.2, ry: rnd(0, 6.28), beh: 'dance'});
  const floorAt = (x, z) => {
    if (x > stairX0 && x < stairX1 + .4 && z < stairZ0 && z > mzFront) return Math.min(MZ, Math.ceil((stairZ0 - z)/run)*MZ/steps);
    if (x > mzX - mzW/2 && z <= mzFront) return MZ;
    return 0;
  };
  return {size: [W, D], spawn: [-1, 1.7, -1.2], look: [-1, 2.4, -14], env: 'terrace', envI: .9, bg: 0x04060c, floorAt,
    staff: {host: [0, -4, Math.PI*.8, 'nia-wallace', 1.72]}, regulars: ['keisha', 'jada', 'tasha'], dj: [6, -10.8, 0, MZ],
    lights: [[0xfff0e0, .7], [0x9ab4ff, .35, true]]};
}

/* ------------------------------------------------------------ The Escape Room */
export function escape(S){ return buildEscapeRoom(S, K); }
