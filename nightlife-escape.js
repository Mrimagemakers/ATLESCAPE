// ATL Nightclub Mogul: The Escape Room, a working puzzle in a 1920s Sweet Auburn study.
// Tap things in the room (or use the buttons in the panel) to find the clues. Every game deals new answers.
//   1. The four glass lamps flash a colour order. Repeat it on the lamps to unlock the desk drawer.
//   2. The drawer holds a cipher card: a scrambled word and a note to shift it back by the number in the red book.
//   3. The red book on the shelf hides that number.
//   4. The framed map has a coloured pin per lamp, each with a digit. The vault code is those digits in the lamp order.
//   5. At the vault, enter the 4-digit code, then the decoded word. The door swings open.
import * as T from 'three';

const COLORS = [{key: 'gold', name: 'Gold', hex: 0xffc45e, css: '#ffc45e'}, {key: 'red', name: 'Red', hex: 0xf04255, css: '#f04255'}, {key: 'blue', name: 'Blue', hex: 0x519afb, css: '#519afb'}, {key: 'green', name: 'Green', hex: 0x4fd18b, css: '#4fd18b'}];
const WORDS = ['PEACH', 'HAWKS', 'BRAVE', 'DREAM', 'SOUTH', 'MARTA', 'GRITS', 'TRAIN', 'SWEET', 'CROWN'];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const shift = (w, n) => w.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + n + 26) % 26 + 65));

/* tiny sounds, no files */
let ac;
function beep(f = 660, d = .12, type = 'sine', vol = .12){ try{ ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); }catch(e){} }
const chime = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .25, 'triangle', .1), i*110));
const buzz = () => beep(110, .35, 'sawtooth', .08);

/* the map of Sweet Auburn with four coloured pins, drawn on a canvas so it can carry this game's digits */
function mapCanvas(pins){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 700; const x = c.getContext('2d');
  x.fillStyle = '#e9dcb8'; x.fillRect(0, 0, 1024, 700);
  for (let i = 0; i < 3000; i++){ x.fillStyle = `rgba(120,90,50,${Math.random()*.08})`; x.fillRect(Math.random()*1024, Math.random()*700, 3, 3); }
  x.strokeStyle = '#7a5a3a'; x.lineWidth = 10; x.strokeRect(14, 14, 996, 672);
  // streets
  x.strokeStyle = '#a8916a'; x.lineCap = 'round';
  const road = (pts, w, name, lx, ly, rot = 0) => { x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); if (name){ x.save(); x.translate(lx, ly); x.rotate(rot); x.fillStyle = '#4a3420'; x.font = 'italic 600 24px Georgia'; x.fillText(name, 0, 0); x.restore(); } };
  road([[40, 330], [990, 300]], 26, 'AUBURN AVE', 120, 322);
  road([[40, 470], [990, 450]], 22, 'EDGEWOOD AVE', 120, 462);
  road([[300, 40], [320, 660]], 20, 'PIEDMONT', 312, 600, -Math.PI/2);
  road([[640, 40], [655, 660]], 20, 'JACKSON ST', 650, 640, -Math.PI/2);
  road([[880, 40], [870, 660]], 22, 'BOULEVARD', 884, 640, -Math.PI/2);
  road([[40, 160], [990, 140]], 14, 'JOHN WESLEY DOBBS', 420, 152);
  x.fillStyle = '#4a3420'; x.font = '700 46px Georgia'; x.textAlign = 'center'; x.fillText('SWEET AUBURN', 512, 82);
  x.font = 'italic 24px Georgia'; x.fillText('Atlanta · Historic District', 512, 112);
  // landmarks, each with a pin and a digit
  const marks = [[470, 250, 'Ebenezer Church'], [740, 380, 'Prince Hall'], [210, 400, 'Atlanta Daily World'], [560, 560, 'Royal Peacock']];
  pins.forEach((p, i) => { const [mx, my, label] = marks[i];
    x.fillStyle = '#4a3420'; x.font = '600 20px Georgia'; x.fillText(label, mx, my + 64);
    x.fillStyle = p.css; x.strokeStyle = '#2a1a10'; x.lineWidth = 4; x.beginPath(); x.arc(mx, my, 30, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(mx - 14, my + 22); x.lineTo(mx, my + 48); x.lineTo(mx + 14, my + 22); x.fill();
    x.fillStyle = '#1a0e08'; x.font = '800 34px Georgia'; x.fillText(p.digit, mx, my + 12); });
  x.textAlign = 'left'; x.fillStyle = '#4a3420'; x.font = 'italic 20px Georgia'; x.fillText('“Every light points somewhere.”', 40, 660);
  return c;
}

export function buildEscapeRoom(S, K){
  const {Tex, M} = K, rnd = K.rnd;
  const W = 10, D = 11, H = 3.6;
  const taps = [];
  const tappable = (obj, label, fn) => { obj.userData.dynamic = true; obj.traverse(o => { o.userData.tap = fn; o.userData.label = label; }); taps.push(obj); return obj; };

  /* ---------- the room ---------- */
  K.haze(S, 0x140c06, .018);
  const paper = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#1f3a2e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(214,176,98,.55)'; x.lineWidth = 3;
    for (const [cx, cy] of [[64, 64], [192, 192], [192, 64], [64, 192]]){ x.beginPath(); for (let a = 0; a < 6.3; a += .05){ const r = 34 + Math.sin(a*4)*16; x.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r*1.3); } x.closePath(); x.stroke(); x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.stroke(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(8, 3); return t; })();
  const paperM = new T.MeshStandardMaterial({map: paper, roughness: .85});
  K.room(S, {w: W, d: D, h: H, floor: K.floorMat(Tex.planks('#6a4426', 1024, 8, false, true), 3, 3, .4), walls: {all: paperM}, ceiling: M.std(0x2a1d14, .8)});
  const wal = new T.MeshStandardMaterial({map: Tex.planks('#4a2c18', 512, 12), roughness: .5});
  const trim = M.std(0x2e1a0e, .45);
  // wainscot panels, chair rail and crown moulding on all four walls
  const walls = [[0, -D + .03, W, 0], [0, -.03, W, Math.PI], [-W/2 + .03, -D/2, D, Math.PI/2], [W/2 - .03, -D/2, D, -Math.PI/2]];
  for (const [x, z, len, ry] of walls){
    const g = S.group(x, 0, z, ry);
    const base = new T.Mesh(new T.BoxGeometry(len, 1.15, .05), wal); base.position.y = .575; g.add(base);
    for (let i = 0; i < Math.floor(len/1.1); i++){ const p = new T.Mesh(new T.BoxGeometry(.85, .7, .03), trim); p.position.set(-len/2 + .55 + i*1.1, .6, .035); g.add(p); }
    const rail = new T.Mesh(new T.BoxGeometry(len, .07, .08), trim); rail.position.y = 1.17; g.add(rail);
    const crown = new T.Mesh(new T.BoxGeometry(len, .18, .12), trim); crown.position.y = H - .09; g.add(crown);
    const skirt = new T.Mesh(new T.BoxGeometry(len, .14, .07), trim); skirt.position.y = .07; g.add(skirt);
  }
  // coffered ceiling
  for (let i = 1; i < 4; i++){ S.box(W, .16, .16, trim, 0, H - .08, -i*D/4, {cast: false}); S.box(.16, .16, D, trim, -W/2 + i*W/4, H - .08, -D/2, {cast: false}); }
  K.rug(S, 0, -5.4, 5.4, 3.8);
  // a small brass chandelier and wall sconces
  K.chandelier(S, 0, H - .25, -5.2, {tiers: 2, r: .45});
  for (const [x, z, ry] of [[-W/2 + .06, -2, Math.PI/2], [-W/2 + .06, -8.6, Math.PI/2], [W/2 - .06, -2, -Math.PI/2], [W/2 - .06, -9.4, -Math.PI/2]]){ const sc = S.group(x, 2.1, z, ry); const b = new T.Mesh(new T.CylinderGeometry(.06, .04, .2, 10), M.brass()); sc.add(b); const sh = new T.Mesh(new T.CylinderGeometry(.09, .13, .18, 14, 1, true), new T.MeshStandardMaterial({color: 0xffe2b0, emissive: 0xffb060, emissiveIntensity: 1.6, side: T.DoubleSide})); sh.position.set(0, .2, .08); sc.add(sh); }

  /* ---------- the game state ---------- */
  const st = {};
  function deal(){
    const order = shuffle(COLORS), digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), n = 1 + Math.floor(Math.random()*5), word = WORDS[Math.floor(Math.random()*WORDS.length)];
    Object.assign(st, {order, pins: COLORS.map((c, i) => ({...c, digit: digits[i]})), n, word, cipher: shift(word, n),
      input: [], lamps: false, drawer: false, card: false, book: false, map: false, codeOk: false, open: false, hints: 0, start: performance.now(), end: 0, playing: -1, nextShow: 1.5});
    st.code = st.order.map(c => st.pins.find(p => p.key === c.key).digit).join('');
  }
  deal();

  /* ---------- the vault: a round bank door in a steel frame ---------- */
  const steel = new T.MeshStandardMaterial({color: 0x8a8c90, roughness: .3, metalness: 1});
  S.box(3, 3.1, .3, M.std(0x2a2a2e, .4, .8), 0, 1.55, -D + .16);
  const vg = S.group(0, 1.5, -D + .35); vg.userData.dynamic = true;
  const hinge = new T.Group(); hinge.position.x = -1.08; vg.add(hinge);
  const door = new T.Group(); door.position.x = 1.08; hinge.add(door);
  const disc = new T.Mesh(new T.CylinderGeometry(1.05, 1.05, .36, 48), steel); disc.rotation.x = Math.PI/2; door.add(disc);
  const ring = new T.Mesh(new T.TorusGeometry(.95, .04, 8, 48), M.brass()); ring.position.z = .19; door.add(ring);
  for (let i = 0; i < 16; i++){ const a = i*Math.PI/8, b = new T.Mesh(new T.SphereGeometry(.04, 8, 6), M.brass()); b.position.set(Math.cos(a)*.86, Math.sin(a)*.86, .19); door.add(b); }
  const wheel = new T.Group(); wheel.position.z = .26; door.add(wheel);
  for (let i = 0; i < 3; i++){ const sp = new T.Mesh(new T.CylinderGeometry(.03, .03, .9, 8), M.brass()); sp.rotation.z = i*Math.PI/3; wheel.add(sp); }
  const hub = new T.Mesh(new T.CylinderGeometry(.11, .11, .1, 16), M.brass()); hub.rotation.x = Math.PI/2; wheel.add(hub);
  // the keypad and word dial beside the door
  const pad = S.group(1.9, 1.45, -D + .34); const pb = new T.Mesh(new T.BoxGeometry(.42, .62, .08), M.std(0x1a1a1c, .4, .6)); pad.add(pb);
  const screen = new T.Mesh(new T.PlaneGeometry(.32, .1), M.emissive(0x3aff7a, 1.5)); screen.position.set(0, .21, .045); pad.add(screen);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++){ const k = new T.Mesh(new T.BoxGeometry(.08, .07, .02), M.brass()); k.position.set(-.1 + c*.1, .08 - r*.09, .05); pad.add(k); }
  // the treasure inside: a gold record of the Sweet Auburn sound
  const prize = new T.Group(); prize.position.set(0, 1.4, -D - .2); S.g.add(prize); prize.userData.dynamic = true;
  const rec = new T.Mesh(new T.CylinderGeometry(.42, .42, .03, 48), new T.MeshStandardMaterial({color: 0xffd060, metalness: 1, roughness: .15, emissive: 0x6a4a10})); rec.rotation.x = Math.PI/2; prize.add(rec);
  const prizeLight = new T.PointLight(0xffc860, 0, 4, 2); prizeLight.position.set(0, 1.5, -D + .3); prizeLight.userData.keep = true; S.g.add(prizeLight);
  S.box(2.2, 2.6, .05, M.std(0x2a1a10, .8), 0, 1.5, -D - .5); // the vault's back wall, seen when it opens
  // the brass plate
  K.sign(S, 'ATL VAULT', {x: 0, y: 3.25, z: -D + .33, w: 1.8, h: .3, color: '#3a2412', font: '800 90px Georgia', backing: 0xc9a056});
  tappable(vg, 'the vault', () => game.vault()); tappable(pad, 'the keypad', () => game.vault());
  S.block(-1.6, 2.2, -D, -D + .7);

  /* ---------- the lamps: four coloured glass shades on a console ---------- */
  const console_ = S.group(W/2 - .35, 0, -7.4, -Math.PI/2);
  const ct = new T.Mesh(new T.BoxGeometry(2.4, .06, .5), wal); ct.position.y = .85; console_.add(ct);
  for (const s of [-1, 1]){ const l = new T.Mesh(new T.BoxGeometry(.06, .85, .06), trim); l.position.set(s*1.1, .42, 0); console_.add(l); }
  S.block(W/2 - .7, W/2, -8.7, -6.1);
  const lamps = COLORS.map((c, i) => {
    const g = new T.Group(); g.position.set(-.84 + i*.56, .88, 0); console_.add(g);
    const base = new T.Mesh(new T.CylinderGeometry(.07, .09, .32, 12), M.brass()); base.position.y = .16; g.add(base);
    const shade = new T.Mesh(new T.SphereGeometry(.2, 20, 12, 0, Math.PI*2, 0, Math.PI/2), new T.MeshStandardMaterial({color: c.hex, emissive: c.hex, emissiveIntensity: .25, roughness: .3, side: T.DoubleSide})); shade.position.y = .34; g.add(shade);
    const L = new T.PointLight(c.hex, 0, 3.5, 2); L.position.y = .3; L.userData.keep = true; g.add(L);
    tappable(g, c.name + ' lamp', () => game.lamp(i));
    return {g, shade, L, c};
  });
  const plate = K.sign(S, 'FOLLOW THE LIGHT', {x: W/2 - .06, y: 1.55, z: -7.4, ry: -Math.PI/2, w: 1.2, h: .18, color: '#3a2412', font: '800 70px Georgia', backing: 0xc9a056});

  /* ---------- the map ---------- */
  const mapTex = new T.CanvasTexture(mapCanvas(st.pins)); mapTex.colorSpace = T.SRGBColorSpace;
  const mapG = K.framed(S, mapTex, {x: W/2 - .04, y: 2.05, z: -3.6, ry: -Math.PI/2, w: 1.7, h: 1.16, frame: 0x3a2412});
  tappable(mapG, 'the map', () => game.map());

  /* ---------- the bookshelf and the red book ---------- */
  const shelf = S.group(-W/2 + .3, 0, -4.4, Math.PI/2);
  const sb = new T.Mesh(new T.BoxGeometry(4.2, H - .2, .5), wal); sb.position.set(0, (H - .2)/2, 0); shelf.add(sb);
  const books = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({roughness: .7}), 260), m4 = new T.Matrix4(), col = new T.Color();
  let bi = 0;
  for (let r = 0; r < 6; r++){ const y = .25 + r*.55; const s = new T.Mesh(new T.BoxGeometry(4.1, .04, .42), trim); s.position.set(0, y - .02, .06); shelf.add(s);
    let x = -1.95; while (x < 1.9 && bi < 260){ const w = rnd(.035, .07), h = rnd(.32, .46); if (r === 3 && x > .3 && x < .45){ x += .1; continue; }
      m4.compose(new T.Vector3(x + w/2, y + h/2, .1 + rnd(-.02, .02)), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), Math.random() < .06 ? .25 : 0), new T.Vector3(w, h, .28)); books.setMatrixAt(bi, m4);
      books.setColorAt(bi, col.setHex(K.pick([0x5a1a14, 0x1a3a2a, 0x2a2440, 0x6a4a20, 0x3a2414, 0x1a2a3a, 0x7a6a50]))); bi++; x += w + .004; } }
  books.count = bi; shelf.add(books);
  const red = new T.Mesh(new T.BoxGeometry(.08, .44, .3), new T.MeshStandardMaterial({color: 0xb0141e, roughness: .5, emissive: 0x3a0306})); red.position.set(.38, .25 + 3*.55 + .22, .1); shelf.add(red);
  const gilt = new T.Mesh(new T.BoxGeometry(.082, .04, .302), M.brass()); gilt.position.copy(red.position).y += .12; shelf.add(gilt);
  tappable(red, 'the red book', () => game.book()); gilt.userData.tap = red.userData.tap;
  S.block(-W/2, -W/2 + .6, -6.6, -2.2);

  /* ---------- the desk with its drawer ---------- */
  const desk = S.group(1.5, 0, -6.2);
  const top = new T.Mesh(new T.BoxGeometry(2, .07, 1), new T.MeshStandardMaterial({map: Tex.planks('#5a3218', 512, 4), roughness: .35})); top.position.y = .78; desk.add(top);
  const leather = new T.Mesh(new T.BoxGeometry(1.2, .005, .6), M.std(0x1a3a2a, .7)); leather.position.y = .816; desk.add(leather);
  for (const s of [-1, 1]){ const ped = new T.Mesh(new T.BoxGeometry(.5, .74, .9), wal); ped.position.set(s*.72, .37, 0); desk.add(ped); }
  const drawer = new T.Group(); drawer.position.set(0, .66, .3); desk.add(drawer);
  const dfront = new T.Mesh(new T.BoxGeometry(.9, .14, .04), trim); dfront.position.z = .2; drawer.add(dfront);
  const dbox = new T.Mesh(new T.BoxGeometry(.86, .1, .4), wal); drawer.add(dbox);
  const knob = new T.Mesh(new T.SphereGeometry(.025, 8, 6), M.brass()); knob.position.set(0, 0, .23); drawer.add(knob);
  const keyhole = new T.Mesh(new T.CircleGeometry(.012, 8), M.std(0x000000)); keyhole.position.set(0, .04, .221); drawer.add(keyhole);
  const card = new T.Mesh(new T.PlaneGeometry(.22, .14), new T.MeshStandardMaterial({map: Tex.text([[st.cipher, '700 90px "Courier New", monospace', '#2a1a10']], {bg: '#efe2c0', w: 512, h: 320}), roughness: .9})); card.rotation.x = -Math.PI/2; card.position.set(0, .056, 0); drawer.add(card);
  tappable(drawer, 'the desk drawer', () => game.drawer());
  // banker's lamp, typewriter, papers, a pen
  const bl = S.group(2.1, .815, -6.45); const bb = new T.Mesh(new T.CylinderGeometry(.08, .1, .03, 16), M.brass()); bl.add(bb); const bs = new T.Mesh(new T.CylinderGeometry(.012, .012, .3, 8), M.brass()); bs.position.y = .15; bl.add(bs);
  const bsh = new T.Mesh(new T.CylinderGeometry(.06, .06, .38, 16, 1, false, 0, Math.PI), new T.MeshStandardMaterial({color: 0x1a6a3a, emissive: 0x0a3a1a, roughness: .2, side: T.DoubleSide})); bsh.rotation.set(0, 0, Math.PI/2); bsh.position.y = .32; bl.add(bsh);
  const bll = new T.PointLight(0xffd8a0, 2.4, 3, 2); bll.position.set(2.1, 1.05, -6.3); bll.userData.prio = 1; S.g.add(bll);
  const tw = S.group(1, .815, -6.3); const twb = new T.Mesh(new T.BoxGeometry(.42, .14, .3), M.std(0x111111, .3, .5)); twb.position.y = .07; tw.add(twb); const twp = new T.Mesh(new T.PlaneGeometry(.3, .26), M.std(0xf2ecdc, .9)); twp.position.set(0, .25, -.1); twp.rotation.x = -.2; tw.add(twp);
  for (let i = 0; i < 4; i++){ const p = S.box(.21, .003, .3, M.std(0xefe6d0, .9), 1.7 + rnd(-.1, .1), .82 + i*.004, -6 + rnd(-.1, .1)); p.rotation.y = rnd(-.4, .4); }
  K.chairAt(S, 'armchair', 1.5, -6.95, 0, S.g, 0x4a1a12);
  S.block(.4, 2.6, -6.8, -5.6);

  /* ---------- a reading corner, a globe and a ticking clock ---------- */
  K.chairAt(S, 'armchair', -2.6, -2.6, Math.PI*.8, S.g, 0x5a2014); K.chairAt(S, 'armchair', -3.6, -4, Math.PI*.6, S.g, 0x5a2014);
  K.bistroTable(S, -3.4, -2.9, {chairs: 0, r: .26, h: .55, base: 'brass', top: wal});
  const globe = S.group(-2.6, 0, -7.6); const gs = new T.Mesh(new T.CylinderGeometry(.04, .2, .7, 12), trim); gs.position.y = .35; globe.add(gs);
  const gt = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#c9b88a'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#7a6a3a'; for (let i = 0; i < 26; i++){ x.beginPath(); x.ellipse(rnd(0, 512), rnd(30, 226), rnd(20, 70), rnd(10, 40), rnd(0, 3), 0, 7); x.fill(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const ball = new T.Mesh(new T.SphereGeometry(.3, 24, 16), new T.MeshStandardMaterial({map: gt, roughness: .5})); ball.position.y = 1; globe.add(ball);
  const mer = new T.Mesh(new T.TorusGeometry(.33, .012, 6, 32), M.brass()); mer.position.y = 1; globe.add(mer);
  let spin = 0; tappable(globe, 'the globe', () => { spin = 6; game.say('The globe spins. Atlanta is marked with a tiny gold peach.'); });
  S.tick(dt => { if (spin > 0){ ball.rotation.y += spin*dt; spin = Math.max(0, spin - dt*2); } });
  S.block(-2.95, -2.25, -7.95, -7.25);
  const clock = S.group(W/2 - .4, 0, -1.1, -Math.PI/2); const cb = new T.Mesh(new T.BoxGeometry(.5, 2.1, .32), wal); cb.position.y = 1.05; clock.add(cb);
  const face = new T.Mesh(new T.CircleGeometry(.18, 24), M.std(0xf2ead6, .6)); face.position.set(0, 1.7, .165); clock.add(face);
  const hand = new T.Mesh(new T.BoxGeometry(.012, .14, .005), M.std(0x111111)); hand.position.set(0, 1.7, .17); hand.geometry.translate(0, .06, 0); clock.add(hand);
  const pend = new T.Group(); pend.position.set(0, 1.45, .17); clock.add(pend); const rod = new T.Mesh(new T.BoxGeometry(.01, .7, .01), M.brass()); rod.position.y = -.35; pend.add(rod); const bob = new T.Mesh(new T.CylinderGeometry(.07, .07, .01, 20), M.brass()); bob.rotation.x = Math.PI/2; bob.position.y = -.72; pend.add(bob);
  S.tick((dt, t) => { pend.rotation.z = Math.sin(t*Math.PI)*.18; hand.rotation.z = -t*.1; });
  clock.userData.dynamic = true; S.block(W/2 - .7, W/2, -1.4, -.8);
  // portraits of the avenue
  for (const [z, label, colr] of [[-9.6, 'AUBURN AVE · 1956', '#3a2a1a'], [-1.6, 'THE ROYAL PEACOCK', '#2a1a2a']]) K.framed(S, Tex.text([[label, 'italic 600 54px Georgia', '#e8d8b8']], {bg: colr, w: 512, h: 640}), {x: -W/2 + .05, y: 2.2, z, ry: Math.PI/2, w: .8, h: 1});

  /* ---------- sparkles over things worth a closer look ---------- */
  const sparkM = new T.SpriteMaterial({map: Tex.glow('rgb(255,230,160)'), color: 0xffe0a0, blending: T.AdditiveBlending, depthWrite: false, transparent: true});
  const sparks = [[vg, [0, 1.5, 0]], [console_, [0, 1.4, 0]], [mapG, [0, .75, 0]], [red, [0, .3, 0]], [drawer, [0, .2, .3]]].map(([o, off]) => { const s = new T.Sprite(sparkM); s.scale.set(.22, .22, 1); s.position.set(...off); o.add(s); return s; });
  S.tick((dt, t) => sparks.forEach((s, i) => { const k = .18 + Math.sin(t*3 + i)*.06; s.scale.set(k, k, 1); }));

  /* ---------- animation of lamps, drawer, door ---------- */
  let drawerT = 0, doorT = 0, wheelSpin = 0;
  S.tick((dt, t) => {
    // the lamp show: the order, one lamp at a time, every few seconds until you solve it
    if (!st.lamps){
      st.nextShow -= dt;
      if (st.nextShow <= 0 && st.playing < 0){ st.playing = 0; st.playT = 0; }
      if (st.playing >= 0){ st.playT += dt; const idx = Math.floor(st.playT/.75); if (idx >= st.order.length){ st.playing = -1; st.nextShow = 6; } else st.playing = idx; }
    }
    lamps.forEach((l, i) => {
      const showing = !st.lamps && st.playing >= 0 && st.order[st.playing].key === l.c.key && (st.playT % .75) < .6;
      const flash = l.flash > 0 ? (l.flash -= dt, 1) : 0;
      const on = st.lamps ? .8 : showing || flash ? 3.5 : .25;
      l.shade.material.emissiveIntensity += (on - l.shade.material.emissiveIntensity)*Math.min(1, dt*14);
      l.L.intensity = l.shade.material.emissiveIntensity*.9;
    });
    drawerT += ((st.drawer ? 1 : 0) - drawerT)*Math.min(1, dt*4); drawer.position.z = .3 + drawerT*.38;
    if (wheelSpin > 0){ wheel.rotation.z += dt*6; wheelSpin -= dt; }
    doorT += ((st.open ? 1 : 0) - doorT)*Math.min(1, dt*1.2); hinge.rotation.y = -doorT*1.9; prizeLight.intensity = doorT*6; rec.rotation.z += dt*doorT;
    sparks[0].visible = !st.open; sparks[1].visible = !st.lamps; sparks[2].visible = !st.map; sparks[3].visible = !st.book; sparks[4].visible = st.lamps && !st.card;
    red.position.z = .1 + (st.book ? .16 : 0); gilt.position.z = red.position.z;
    card.visible = st.drawer && !st.card;
  });

  /* ---------- the game ---------- */
  let ui = null;
  const game = {
    get state(){ return st; },
    say(m){ ui?.say(m); },
    lamp(i){
      const l = lamps[i]; l.flash = .35; beep(330 + i*110, .18, 'triangle');
      if (st.lamps){ game.say('The lamps glow warmly. You already opened the drawer.'); return; }
      st.input.push(l.c.key);
      const k = st.input.length - 1;
      if (st.order[k].key !== l.c.key){ st.input = []; buzz(); lamps.forEach(x => x.flash = .5); st.nextShow = .8; game.say('Wrong order. The lamps flicker and reset. Watch them again.'); ui?.render(); return; }
      if (st.input.length === st.order.length){ st.lamps = true; st.drawer = true; chime(); game.say('Click! A latch releases somewhere. The desk drawer slides open.'); }
      else game.say(`${l.c.name}… so far so good (${st.input.length} of 4).`);
      ui?.render();
    },
    drawer(){
      if (!st.lamps){ beep(180, .1, 'square', .05); game.say('The drawer is locked. A brass plate on the console reads “Follow the light.”'); return; }
      if (!st.card){ st.card = true; beep(880, .12); game.say(`You take a cipher card: “${st.cipher}”. On the back: “Move each letter back by the number hidden in the red book.”`); }
      else game.say(`The cipher card reads “${st.cipher}”.`);
      ui?.render();
    },
    book(){ if (!st.book){ st.book = true; beep(520, .15); } game.say(`The red book slides out. Inside the cover, in gold ink: “${st.n}”.`); ui?.render(); },
    map(){ st.map = true; beep(600, .1); ui?.showMap(); game.say('A map of Sweet Auburn. Four coloured pins, each with a number.'); ui?.render(); },
    vault(){ ui?.showVault(); },
    tryCode(v){
      if (st.codeOk) return true;
      if (v === st.code){ st.codeOk = true; wheelSpin = 1.2; chime(); game.say('The keypad turns green. The outer lock spins free. Now the word dial.'); ui?.render(); return true; }
      buzz(); game.say('The keypad flashes red. Which digits, in which order?'); return false;
    },
    tryWord(v){
      if (!st.codeOk) return false;
      if (v.toUpperCase() === st.word){ st.open = true; st.end = performance.now(); chime(); setTimeout(chime, 450); game.say(`The dial clicks to ${st.word}. The vault door swings open: a gold record of the Sweet Auburn sound!`); game.reward(); ui?.render(); return true; }
      buzz(); game.say('The dial won’t turn. Decode the card again.'); return false;
    },
    hint(){
      st.hints++;
      const h = !st.lamps ? 'Watch the four lamps on the console by the right wall. When they light up one at a time, tap them in that same order.'
        : !st.card ? 'The desk drawer is open now. Tap it to take what’s inside.'
        : !st.book ? 'The card says the number is in the red book. Look along the bookshelf on the left wall.'
        : !st.map ? 'The framed map on the right wall has a coloured pin for each lamp.'
        : !st.codeOk ? `Read the map digits in the lamp order: ${st.order.map(c => c.name).join(', ')}.`
        : !st.open ? `Shift each letter of “${st.cipher}” back by ${st.n} (B→A, C→B…).`
        : 'You did it. Play again for a new set of clues.';
      game.say('Morgan Price: “' + h + '”'); ui?.render();
    },
    reward(){
      const secs = Math.round((st.end - st.start)/1000), cash = Math.max(100, 300 - st.hints*50), rep = Math.max(1, 4 - st.hints);
      st.reward = {secs, cash, rep};
      try{ if (typeof profile !== 'undefined'){ profile.cash += cash; profile.rep += rep; if (typeof saveCareer === 'function') saveCareer(); if (typeof refreshCareer === 'function') refreshCareer(); } }catch(e){}
      try{ const best = +localStorage.getItem('atl-escape-best') || 0; if (!best || secs < best){ localStorage.setItem('atl-escape-best', secs); st.reward.best = true; } }catch(e){}
    },
    restart(){
      deal(); lamps.forEach(l => l.flash = 0);
      mapTex.image = mapCanvas(st.pins); mapTex.needsUpdate = true;
      card.material.map = Tex.text([[st.cipher, '700 90px "Courier New", monospace', '#2a1a10']], {bg: '#efe2c0', w: 512, h: 320}); card.material.needsUpdate = true;
      game.say('New game. New clues are hidden around the study. The clock is running.'); ui?.render();
    },
    mount(panel){ ui = escapeUI(panel, game, () => mapTex.image); ui.render(); },
    unmount(){ ui = null; }
  };

  return {size: [W, D], spawn: [0, 1.7, -.9], look: [0, 1.5, -10], env: 'jazz', envI: .5, bg: 0x0a0604,
    staff: {host: [-3.4, -1.2, Math.PI*.75, 'evan-mckay', 1.78]}, regulars: [], noCrowd: true,
    lights: [[0xffc890, .9]], escape: game, taps};
}

/* ---------- the panel beside the 3D view ---------- */
function escapeUI(panel, game, mapImage){
  panel.replaceChildren(); panel.hidden = false; panel.classList.add('escape-hud');
  panel.innerHTML = `
    <div class="esc-head"><div><p class="esc-kick">Sweet Auburn Archive</p><h3>The Escape Room</h3></div><div class="esc-timer" aria-live="off">00:00</div></div>
    <p class="esc-say" role="status">Find the clues hidden in the study and open the ATL Vault. Tap things in the room (or use the buttons below).</p>
    <div class="esc-grid">
      <div><h4>Clues</h4><ul class="esc-steps"></ul></div>
      <div><h4>Notes</h4><ul class="esc-notes"></ul></div>
    </div>
    <div class="esc-objects" role="group" aria-label="Look at"></div>
    <div class="esc-map" hidden></div>
    <form class="esc-vault" hidden>
      <label>Keypad code<input inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="4 digits" autocomplete="off"></label>
      <label>Word dial<input maxlength="5" placeholder="5 letters" autocomplete="off" disabled></label>
      <button type="submit">Try the vault</button>
    </form>
    <div class="esc-win" hidden></div>
    <div class="esc-actions"><button type="button" class="esc-hint">💡 Ask Morgan for a hint</button><button type="button" class="esc-restart">↻ New game</button></div>`;
  const $ = q => panel.querySelector(q), st = game.state;
  const objects = $('.esc-objects');
  const lampBtns = [['Gold', 0], ['Red', 1], ['Blue', 2], ['Green', 3]];
  for (const [n, i] of lampBtns){ const b = document.createElement('button'); b.type = 'button'; b.className = 'esc-lamp esc-' + n.toLowerCase(); b.textContent = n + ' lamp'; b.onclick = () => game.lamp(i); objects.append(b); }
  for (const [label, fn] of [['🗄 Desk drawer', 'drawer'], ['📕 Red book', 'book'], ['🗺 Map', 'map'], ['🔐 Vault', 'vault']]){ const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => game[fn](); objects.append(b); }
  const form = $('.esc-vault'), [codeIn, wordIn] = form.querySelectorAll('input');
  form.onsubmit = e => { e.preventDefault(); if (!st.codeOk){ if (game.tryCode(codeIn.value.trim())){ codeIn.disabled = true; wordIn.disabled = false; wordIn.focus(); } } else game.tryWord(wordIn.value.trim()); };
  $('.esc-hint').onclick = () => game.hint();
  $('.esc-restart').onclick = () => { codeIn.value = wordIn.value = ''; codeIn.disabled = false; wordIn.disabled = true; form.hidden = true; $('.esc-map').hidden = true; game.restart(); };
  const timer = $('.esc-timer');
  const tick = setInterval(() => { if (!panel.isConnected || panel.hidden){ clearInterval(tick); return; } const s = Math.floor(((st.end || performance.now()) - st.start)/1000); timer.textContent = String(Math.floor(s/60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 500);
  return {
    say(m){ $('.esc-say').textContent = m; },
    showMap(){ const box = $('.esc-map'); box.hidden = false; box.replaceChildren(); const img = new Image(); img.alt = 'Map of Sweet Auburn with four coloured pins: ' + st.pins.map(p => p.name + ' ' + p.digit).join(', '); img.src = mapImage().toDataURL('image/jpeg', .85); box.append(img); },
    showVault(){ form.hidden = false; (st.codeOk ? wordIn : codeIn).focus({preventScroll: true}); game.say(st.open ? 'The vault stands open.' : st.codeOk ? 'The outer lock is open. Set the five-letter word dial.' : 'A keypad for a 4-digit code, and a five-letter word dial beneath it.'); },
    render(){
      const steps = [['Repeat the lamp order', st.lamps], ['Open the desk drawer', st.card], ['Find the red book', st.book], ['Read the map', st.map], ['Crack the keypad', st.codeOk], ['Open the vault', st.open]];
      $('.esc-steps').replaceChildren(...steps.map(([t, done]) => { const li = document.createElement('li'); li.textContent = (done ? '✓ ' : '○ ') + t; li.className = done ? 'done' : ''; return li; }));
      const notes = [];
      if (st.card) notes.push(`Cipher card: ${st.cipher} (shift back by the red book’s number)`);
      if (st.book) notes.push(`Red book: ${st.n}`);
      if (st.map) notes.push('Map pins: ' + st.pins.map(p => `${p.name} ${p.digit}`).join(' · '));
      if (st.lamps) notes.push('Lamp order: ' + st.order.map(c => c.name).join(' → '));
      if (st.hints) notes.push(`Hints used: ${st.hints}`);
      $('.esc-notes').replaceChildren(...(notes.length ? notes : ['Nothing yet.']).map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
      const win = $('.esc-win');
      if (st.open && st.reward){ const r = st.reward; win.hidden = false; win.innerHTML = `<strong>Vault opened in ${Math.floor(r.secs/60)}m ${r.secs % 60}s!</strong> +$${r.cash} club cash · +${r.rep} reputation${r.best ? ' · New best time 🏆' : ''}`; }
      else win.hidden = true;
    }
  };
}
