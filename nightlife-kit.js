// ATL Nightclub Mogul: building blocks for the venues (materials, furniture, lights, stage gear).
// Everything is made in code; the reference panoramas only light the rooms and fill the windows.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const rnd = (a, b) => a + Math.random()*(b - a);
export const pick = a => a[Math.floor(Math.random()*a.length)];
const texLoader = new T.TextureLoader();
export function photo(name, {repeat, srgb = true} = {}){
  const t = texLoader.load(new URL('assets/' + name, import.meta.url).href);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  if (repeat){ t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8; return t;
}

/* ------------------------------------------------------------ canvas textures */
function cv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, {repeat, srgb = true} = {}){
  const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping; if (repeat) t.repeat.set(...repeat); t.anisotropy = 8; return t;
}
function grain(x, w, h, amt){ const d = x.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4){ const n = (Math.random() - .5)*amt; d.data[i] += n; d.data[i+1] += n; d.data[i+2] += n; } x.putImageData(d, 0, 0); }
const cache = new Map();
const once = (k, f) => cache.has(k) ? cache.get(k) : (cache.set(k, f()), cache.get(k));

export const Tex = {
  brick(kind = 'red'){ return once('brick' + kind, () => {
    const [c, x] = cv(1024, 1024), [b, y] = cv(1024, 1024);
    const pal = {red: ['#8a4a35', '#7a3f2c', '#9a5640', '#6e3727', '#a0603f', '#83442f'], black: ['#1c1b1e', '#232226', '#19181b', '#262428'], white: ['#c9c6c0', '#bdb9b2', '#d3d0ca'], dark: ['#4a2d24', '#3d261f', '#55342a']}[kind];
    x.fillStyle = kind === 'black' ? '#121113' : kind === 'white' ? '#a9a59e' : '#5d5048'; x.fillRect(0, 0, 1024, 1024);
    y.fillStyle = '#000'; y.fillRect(0, 0, 1024, 1024);
    const bw = 128, bh = 42, m = 7;
    for (let r = 0; r*bh < 1024; r++) for (let k = -1; k*bw < 1024; k++){
      const ox = (r % 2)*bw/2, X = k*bw + ox + m/2, Y = r*bh + m/2;
      x.fillStyle = pick(pal); x.fillRect(X, Y, bw - m, bh - m);
      x.fillStyle = `rgba(0,0,0,${rnd(0, .18)})`; x.fillRect(X, Y + bh*.55, bw - m, bh*.4 - m);
      y.fillStyle = `rgb(${200 + rnd(-30, 30)|0},${200}, ${200})`; y.fillRect(X, Y, bw - m, bh - m);
    }
    // weathering, old paint and plaster patches like a real Atlanta warehouse
    if (kind === 'red') for (let i = 0; i < 9; i++){ x.fillStyle = `rgba(${pick(['200,190,175', '60,45,40', '120,40,30'])},${rnd(.15, .45)})`; x.beginPath(); x.ellipse(rnd(0, 1024), rnd(0, 1024), rnd(30, 140), rnd(15, 60), rnd(0, 3), 0, 7); x.fill(); }
    grain(x, 1024, 1024, kind === 'black' ? 10 : 26);
    return {map: tex(c), bump: tex(b, {srgb: false})};
  }); },
  concrete(tone = 70, stains = .35){ return once('conc' + tone + stains, () => {
    const [c, x] = cv(1024, 1024);
    x.fillStyle = `rgb(${tone},${tone},${tone + 4})`; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 70; i++){ const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(rnd(0, 1024), rnd(0, 1024)); x.scale(rnd(40, 220), rnd(30, 160));
      g.addColorStop(0, `rgba(${rnd(0, 1) < .5 ? '0,0,0' : '255,255,255'},${rnd(.02, .09)*stains*3})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 512); x.lineTo(1024, 512); x.moveTo(512, 0); x.lineTo(512, 1024); x.stroke();
    for (let i = 0; i < 6; i++){ x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; x.beginPath(); let px = rnd(0, 1024), py = rnd(0, 1024); x.moveTo(px, py); for (let k = 0; k < 12; k++){ px += rnd(-30, 30); py += rnd(-30, 30); x.lineTo(px, py); } x.stroke(); }
    grain(x, 1024, 1024, 14);
    return tex(c);
  }); },
  planks(color = '#6b4a30', w = 1024, n = 8, herring = false, parquet = false){ return once('pl' + color + herring + parquet, () => {
    const [c, x] = cv(w, w), base = new T.Color(color);
    const shade = () => { const k = rnd(.75, 1.2); return `rgb(${base.r*255*k|0},${base.g*255*k|0},${base.b*255*k|0})`; };
    const grainLines = (X, Y, W, H, vert) => { x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; for (let i = 0; i < 8; i++){ x.beginPath(); if (vert){ const gx = X + rnd(0, W); x.moveTo(gx, Y); x.bezierCurveTo(gx + rnd(-6, 6), Y + H*.3, gx + rnd(-6, 6), Y + H*.7, gx + rnd(-4, 4), Y + H); } else { const gy = Y + rnd(0, H); x.moveTo(X, gy); x.bezierCurveTo(X + W*.3, gy + rnd(-5, 5), X + W*.7, gy + rnd(-5, 5), X + W, gy + rnd(-3, 3)); } x.stroke(); } };
    if (herring){
      // chevron rows of planks: each column leans the other way, thin dark joints between boards
      x.fillStyle = '#20140c'; x.fillRect(0, 0, w, w);
      const cols = 6, cw = w/cols, ph = cw*.32, rise = cw*.5;
      for (let c = 0; c < cols; c++){ const dir = c % 2 ? 1 : -1, x0 = c*cw;
        for (let y = -cw; y < w + cw; y += ph){
          const y0 = y, y1 = y + dir*rise;
          x.fillStyle = shade(); x.beginPath(); x.moveTo(x0 + 1, y0 + 1); x.lineTo(x0 + cw - 1, y1 + 1); x.lineTo(x0 + cw - 1, y1 + ph - 2); x.lineTo(x0 + 1, y0 + ph - 2); x.closePath(); x.fill();
          x.save(); x.clip(); grainLines(x0, Math.min(y0, y1), cw, Math.abs(y1 - y0) + ph, false); x.restore();
        }
      }
    } else if (parquet){
      const S = w/4, k = 4; for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++){ const vert = (gx + gy) % 2; for (let i = 0; i < k; i++){ x.fillStyle = shade(); const X = gx*S + (vert ? i*S/k : 0), Y = gy*S + (vert ? 0 : i*S/k), W = vert ? S/k - 2 : S - 2, H = vert ? S - 2 : S/k - 2; x.fillRect(X, Y, W, H); grainLines(X, Y, W, H, vert); } }
    } else {
      const h = w/n; for (let i = 0; i < n; i++){ let X = rnd(-w, 0); while (X < w){ const L = rnd(w*.4, w*.9); x.fillStyle = shade(); x.fillRect(X, i*h, L - 2, h - 2); grainLines(X, i*h, L - 2, h - 2, false); X += L; } }
    }
    grain(x, w, w, 12);
    return tex(c);
  }); },
  marble(base = '#e9e6e1', vein = 'rgba(90,90,95,.5)', dark = false){ return once('mb' + base + vein, () => {
    const [c, x] = cv(1024, 1024); x.fillStyle = base; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 22; i++){ x.strokeStyle = vein; x.lineWidth = rnd(.6, 3); x.beginPath(); let px = rnd(0, 1024), py = rnd(-100, 300); x.moveTo(px, py); while (py < 1100){ px += rnd(-40, 50); py += rnd(20, 70); x.lineTo(px, py); } x.stroke(); }
    grain(x, 1024, 1024, dark ? 6 : 10); return tex(c);
  }); },
  onyx(){ return once('onyx', () => {
    const [c, x] = cv(1024, 512); const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f5d9a8'); g.addColorStop(.5, '#ffe9c4'); g.addColorStop(1, '#e9b871'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 40; i++){ x.strokeStyle = `rgba(${pick(['150,90,40', '120,70,30', '255,250,235', '190,120,60'])},${rnd(.2, .6)})`; x.lineWidth = rnd(1, 9); x.beginPath(); let px = -20, py = rnd(0, 512); x.moveTo(px, py); while (px < 1050){ px += rnd(30, 80); py += rnd(-30, 30); x.lineTo(px, py); } x.stroke(); }
    return tex(c);
  }); },
  fabric(color, tuft = false){ return once('fab' + color + tuft, () => {
    const [c, x] = cv(512, 512), base = new T.Color(color);
    x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, 512, 512);
    grain(x, 512, 512, 18);
    if (tuft){ for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++){ const X = k*86 + (r % 2)*43, Y = r*86; const g = x.createRadialGradient(X, Y, 1, X, Y, 40); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.25, 'rgba(0,0,0,.1)'); g.addColorStop(1, 'rgba(255,255,255,.06)'); x.fillStyle = g; x.fillRect(X - 43, Y - 43, 86, 86); } }
    return tex(c);
  }); },
  rug(){ return once('rug', () => {
    const [c, x] = cv(1024, 700); x.fillStyle = '#7a2e22'; x.fillRect(0, 0, 1024, 700);
    x.strokeStyle = '#1d2a4a'; x.lineWidth = 40; x.strokeRect(40, 40, 944, 620); x.strokeStyle = '#d9b98a'; x.lineWidth = 8; x.strokeRect(70, 70, 884, 560); x.strokeRect(20, 20, 984, 660);
    for (let i = 0; i < 260; i++){ x.fillStyle = pick(['#1d2a4a', '#d9b98a', '#a8462f', '#2f4a5a', '#e8d6b0']); x.save(); x.translate(rnd(100, 924), rnd(100, 600)); x.rotate(rnd(0, 3)); x.beginPath(); x.ellipse(0, 0, rnd(4, 18), rnd(3, 9), 0, 0, 7); x.fill(); x.restore(); }
    x.fillStyle = '#1d2a4a'; x.beginPath(); x.ellipse(512, 350, 170, 120, 0, 0, 7); x.fill(); x.fillStyle = '#d9b98a'; x.beginPath(); x.ellipse(512, 350, 90, 60, 0, 0, 7); x.fill();
    grain(x, 1024, 700, 30); return tex(c);
  }); },
  glow(color = '#ffffff'){ return once('glow' + color, () => {
    const [c, x] = cv(128, 128), g = x.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, color); g.addColorStop(.25, color.replace(')', ',.5)').replace('rgb', 'rgba')); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return tex(c);
  }); },
  beam(){ return once('beam', () => {
    const [c, x] = cv(64, 256), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,.85)'); h.addColorStop(.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,.85)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 256);
    const t = tex(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; return t;
  }); },
  leaf(color = '#3f6b35', shape = 'fig'){ return once('leaf' + color + shape, () => {
    const [c, x] = cv(128, 256); x.clearRect(0, 0, 128, 256); x.fillStyle = color; x.beginPath();
    if (shape === 'fig'){ x.moveTo(64, 250); x.bezierCurveTo(-10, 170, 0, 30, 64, 6); x.bezierCurveTo(128, 30, 138, 170, 64, 250); }
    else if (shape === 'olive'){ x.ellipse(64, 128, 18, 120, 0, 0, 7); }
    else { x.moveTo(64, 256); for (let i = 0; i < 24; i++){ const yy = 250 - i*10; x.lineTo(64 + (i % 2 ? 1 : -1)*rnd(20, 60)*(1 - i/26), yy); } x.lineTo(64, 0); }
    x.fill(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 250); x.lineTo(64, 10); x.stroke();
    const t = tex(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; return t;
  }); },
  text(lines, {w = 1024, h = 512, bg = null, font = '700 120px "Chakra Petch", Arial, sans-serif', color = '#fff', glow = null, align = 'center', chalk = false} = {}){
    const [c, x] = cv(w, h); if (bg){ x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    if (chalk){ grain(x, w, h, 18); }
    x.textAlign = align; x.textBaseline = 'middle';
    const L = [].concat(lines);
    L.forEach((ln, i) => {
      const [txt, f, col] = Array.isArray(ln) ? ln : [ln, font, color];
      x.font = f || font; const y = h*(i + 1)/(L.length + 1), X = align === 'center' ? w/2 : 40;
      // shrink the font until the line fits, with room for the glow
      const room = w*(glow ? .84 : .92), mw = x.measureText(txt).width; if (mw > room){ x.font = (f || font).replace(/(\d+)px/, (m, n) => Math.floor(n*room/mw) + 'px'); }
      if (glow){ for (const [blur, a] of [[48, .9], [20, .9], [6, 1]]){ x.shadowColor = glow; x.shadowBlur = blur; x.globalAlpha = a; x.fillStyle = col || color; x.fillText(txt, X, y); } x.globalAlpha = 1; x.shadowBlur = 0; x.fillStyle = '#fff'; x.globalAlpha = .85; x.fillText(txt, X, y); x.globalAlpha = 1; }
      else { x.fillStyle = col || color; x.fillText(txt, X, y); }
    });
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
};

/* ------------------------------------------------------------ materials */
export const M = {
  std: (color, roughness = .7, metalness = 0, extra = {}) => new T.MeshStandardMaterial({color, roughness, metalness, ...extra}),
  phys: (o) => new T.MeshPhysicalMaterial(o),
  brass: () => once('m-brass', () => new T.MeshStandardMaterial({color: 0xc9a056, roughness: .28, metalness: 1})),
  steel: () => once('m-steel', () => new T.MeshStandardMaterial({color: 0xb9bcc0, roughness: .32, metalness: 1})),
  blackMetal: () => once('m-black', () => new T.MeshStandardMaterial({color: 0x1a1b1d, roughness: .45, metalness: .8})),
  chrome: () => once('m-chrome', () => new T.MeshStandardMaterial({color: 0xffffff, roughness: .08, metalness: 1})),
  glass: () => once('m-glass', () => new T.MeshPhysicalMaterial({color: 0xeaf4ff, roughness: .05, metalness: 0, transparent: true, opacity: .25, ior: 1.45, depthWrite: false})),
  emissive: (color, intensity = 2) => new T.MeshStandardMaterial({color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1}),
  basic: (color, opts = {}) => new T.MeshBasicMaterial({color, ...opts}),
  add: (color, opacity = 1, map) => new T.MeshBasicMaterial({color, map, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false})
};

/* ------------------------------------------------------------ the set: a group plus collisions, spawns and animation */
export class Set_ {
  constructor(scene){ this.g = new T.Group(); scene.add(this.g); this.blocks = []; this.updaters = []; this.spots = {dance: [], cheer: [], talk: [], idle: [], bar: [], sit: []}; this.screens = []; this.lights = []; }
  add(o, parent = this.g){ parent.add(o); return o; }
  mesh(geo, mat, x = 0, y = 0, z = 0, parent = this.g, {ry = 0, cast = true, recv = true} = {}){ const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m; }
  box(w, h, d, mat, x, y, z, opts = {}){ return this.mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, opts.parent || this.g, opts); }
  cyl(rt, rb, h, mat, x, y, z, opts = {}){ return this.mesh(new T.CylinderGeometry(rt, rb, h, opts.seg || 24, 1, opts.open || false, opts.t0 || 0, opts.tl || Math.PI*2), mat, x, y, z, opts.parent || this.g, opts); }
  block(x0, x1, z0, z1){ this.blocks.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]); }
  blockAround(o, pad = .15){ o.updateWorldMatrix(true, true); const b = new T.Box3().setFromObject(o); this.block(b.min.x - pad, b.max.x + pad, b.min.z - pad, b.max.z + pad); }
  tick(f){ this.updaters.push(f); }
  update(dt, t){ for (const f of this.updaters) f(dt, t); }
  /* weld every static mesh that shares a look into one draw call (phones and Quest can't draw thousands of small pieces) */
  optimize(){
    const sig = m => [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.map?.uuid, m.bumpMap?.uuid, m.emissiveMap?.uuid, m.transparent, m.opacity, m.side, m.blending, m.toneMapped, m.depthWrite, m.alphaTest, m.fog, m.sheen].join('|');
    const groups = new Map(), victims = [];
    this.g.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(this.g.matrixWorld).invert(), mtx = new T.Matrix4();
    const walk = (o, dyn) => {
      dyn = dyn || o.userData.dynamic;
      if (o.isMesh && !dyn && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.renderOrder === 0 && o.geometry.attributes.uv && o.geometry.attributes.normal && !o.geometry.morphAttributes.position){
        const k = sig(o.material) + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
        if (!groups.has(k)) groups.set(k, {mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: []});
        let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        for (const n of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(n)) geo.deleteAttribute(n);
        geo.applyMatrix4(mtx.multiplyMatrices(inv, o.matrixWorld));
        groups.get(k).geos.push(geo); victims.push(o);
      }
      for (const c of o.children.slice()) walk(c, dyn);
    };
    walk(this.g, false);
    for (const o of victims){ o.parent.remove(o); }
    let n = 0;
    for (const {mat, cast, recv, geos} of groups.values()){
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      const m = new T.Mesh(merged, mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; this.g.add(m); n++;
    }
    return {before: victims.length, after: n};
  }
  budget(max){
    const L = []; this.g.traverse(o => { if (o.isLight && !o.isHemisphereLight && !o.isAmbientLight && !o.userData.keep) L.push(o); });
    L.sort((a, b) => (a.userData.prio || 2) - (b.userData.prio || 2) || b.intensity - a.intensity);
    // spread the kept moving-head spots over the rig instead of taking the first few
    let spots = 0;
    L.forEach((l, i) => { const keep = i < max && !(l.isSpotLight && l.userData.prio === 2.5 && spots++ % 3); if (!keep) l.parent.remove(l); });
  }
  group(x = 0, y = 0, z = 0, ry = 0, parent = this.g){ const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
}

/* ------------------------------------------------------------ room shell */
export function room(S, {w, d, h, floor, walls, ceiling, front = true, z0 = 0, holes = {}}){
  // the room spans x -w/2..w/2, z from z0 (entrance side) to z0 - d. holes: {left|right|back: [[center, width, y0, y1]]}
  const cz = z0 - d/2;
  const fl = S.mesh(new T.PlaneGeometry(w, d), floor, 0, 0, cz, S.g, {cast: false}); fl.rotation.x = -Math.PI/2;
  if (ceiling){ const c = S.mesh(new T.PlaneGeometry(w, d), ceiling, 0, h, cz, S.g, {cast: false}); c.rotation.x = Math.PI/2; }
  const wall = (mat, W, x, z, ry, cuts, toLocal) => {
    if (!mat) return null;
    let geo;
    if (cuts && cuts.length){
      const sh = new T.Shape(); sh.moveTo(-W/2, -h/2); sh.lineTo(W/2, -h/2); sh.lineTo(W/2, h/2); sh.lineTo(-W/2, h/2); sh.lineTo(-W/2, -h/2);
      for (const [c, cw, y0, y1] of cuts){ const lx = toLocal(c), hp = new T.Path(); hp.moveTo(lx - cw/2, y0 - h/2); hp.lineTo(lx - cw/2, y1 - h/2); hp.lineTo(lx + cw/2, y1 - h/2); hp.lineTo(lx + cw/2, y0 - h/2); hp.lineTo(lx - cw/2, y0 - h/2); sh.holes.push(hp); }
      geo = new T.ShapeGeometry(sh); const uv = geo.attributes.uv, P = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, P.getX(i)/W + .5, P.getY(i)/h + .5);
    } else geo = new T.PlaneGeometry(W, h);
    return S.mesh(geo, mat, x, h/2, z, S.g, {cast: false, ry});
  };
  const wm = k => walls[k] === undefined ? walls.all : walls[k];
  return {
    back: wall(wm('back'), w, 0, z0 - d, 0, holes.back, c => c),
    front: front ? wall(wm('front'), w, 0, z0, Math.PI, holes.front, c => -c) : null,
    left: wall(wm('left'), d, -w/2, cz, Math.PI/2, holes.left, c => -(c - cz)),
    right: wall(wm('right'), d, w/2, cz, -Math.PI/2, holes.right, c => c - cz)
  };
}
export function brickMat(kind, rx, ry){ const b = Tex.brick(kind), m = b.map.clone(), bm = b.bump.clone(); m.needsUpdate = bm.needsUpdate = true; m.repeat.set(rx, ry); bm.repeat.set(rx, ry); return new T.MeshStandardMaterial({map: m, bumpMap: bm, bumpScale: 1.6, roughness: .92}); }
export function floorMat(t, rx, ry, rough = .35){ const m = t.clone(); m.needsUpdate = true; m.repeat.set(rx, ry); return new T.MeshStandardMaterial({map: m, roughness: rough, metalness: .05}); }

/* open ceiling: joists, ducts, conduit */
export function openCeiling(S, {w, d, h, z0 = 0, joist = 0x161618, duct = true, ductColor = 0x9fa3a8, spacing = 1.6}){
  const jm = M.std(joist, .8, .2);
  for (let z = z0 - .4; z > z0 - d; z -= spacing) S.box(w, .28, .12, jm, 0, h - .14, z, {cast: false});
  for (const x of [-w/2 + .2, w/2 - .2]) S.box(.18, .35, d, jm, x, h - .18, z0 - d/2, {cast: false});
  if (duct){
    const dm = new T.MeshStandardMaterial({color: ductColor, roughness: .38, metalness: .9});
    for (const x of [-w*.28, w*.3]){
      const c = S.cyl(.32, .32, d - .4, dm, x, h - .7, z0 - d/2, {seg: 18, cast: false}); c.rotation.x = Math.PI/2;
      for (let z = z0 - 1; z > z0 - d + .5; z -= 1.4){ const ring = S.cyl(.335, .335, .05, dm, x, h - .7, z, {seg: 18, cast: false}); ring.rotation.x = Math.PI/2; }
    }
  }
}

/* windows: mullion grid in a wall with a city view behind */
export function windowWall(S, {x0, x1, z, y0 = .9, y1 = 3.6, cols = 4, rows = 3, view, frame = 0x111214, viewDist = 6, viewH, side = 'back', glow = 1}){
  const W = Math.abs(x1 - x0), H = y1 - y0, fm = M.std(frame, .5, .6), g = new T.Group(); S.g.add(g);
  const cx = (x0 + x1)/2;
  for (let i = 0; i <= cols; i++){ const b = new T.Mesh(new T.BoxGeometry(.07, H, .1), fm); b.position.set(x0 + (x1 - x0)*i/cols, y0 + H/2, 0); g.add(b); }
  for (let j = 0; j <= rows; j++){ const b = new T.Mesh(new T.BoxGeometry(W, .07, .1), fm); b.position.set(cx, y0 + H*j/rows, 0); g.add(b); }
  if (view){
    const vh = viewH || H*1.6, vm = new T.MeshBasicMaterial({map: view, toneMapped: false, fog: false, color: new T.Color(glow, glow, glow)});
    const v = new T.Mesh(new T.PlaneGeometry(W*1.9, vh), vm); v.position.set(cx, y0 + H*.45, -viewDist); g.add(v);
  }
  const glass = new T.Mesh(new T.PlaneGeometry(W, H), M.glass()); glass.position.set(cx, y0 + H/2, -.02); g.add(glass);
  // place the group into the wall it belongs to
  if (side === 'back'){ g.position.z = z; }
  else if (side === 'left'){ g.rotation.y = Math.PI/2; g.position.set(z, 0, 0); g.children.forEach(c => { c.position.x = c.position.x; }); }
  else if (side === 'right'){ g.rotation.y = -Math.PI/2; g.position.set(z, 0, 0); }
  return g;
}

/* one continuous view behind a whole wall of windows: the photo sits on the horizon, its top row stretches up as sky */
export function wallView(S, view, {side = 'left', at, from, to, y0 = -2, h = 22, imgH = 9, aspect = 3.8, bright = 1}){
  const L = Math.abs(to - from), t = view.clone(); if (view.image) t.needsUpdate = true;
  t.wrapS = T.MirroredRepeatWrapping; t.wrapT = T.ClampToEdgeWrapping; t.repeat.set(L/(imgH*aspect), h/imgH); t.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(new T.PlaneGeometry(L, h), new T.MeshBasicMaterial({map: t, toneMapped: false, fog: false, color: new T.Color(bright, bright, bright)}));
  const c = (from + to)/2;
  if (side === 'left'){ m.position.set(at, y0 + h/2, c); m.rotation.y = Math.PI/2; }
  else if (side === 'right'){ m.position.set(at, y0 + h/2, c); m.rotation.y = -Math.PI/2; }
  else { m.position.set(c, y0 + h/2, at); }
  m.userData.dynamic = true; S.g.add(m); return m;
}
/* a cylinder of skyline far outside: for rooftops and glass rooms */
export function skyline(S, view, {r = 60, h = 26, y = -3, arc = Math.PI*2, start = 0, bright = 1, fade = true} = {}){
  // fade the top of the photo out so the towers stand against the real sky behind them
  const mat = new T.MeshBasicMaterial({side: T.BackSide, toneMapped: false, color: new T.Color(bright, bright, bright), fog: false, transparent: fade, depthWrite: !fade});
  const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 64, 1, true, start, arc), mat);
  const setMap = img => {
    let t;
    if (fade){ const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'destination-out'; const g = x.createLinearGradient(0, 0, 0, img.height*.62); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, img.width, img.height*.62);
      t = new T.CanvasTexture(c); } else t = view;
    t.colorSpace = T.SRGBColorSpace; t.wrapS = T.MirroredRepeatWrapping; t.repeat.set(arc > 4 ? 2 : 1, 1); mat.map = t; mat.needsUpdate = true;
  };
  if (view.image) setMap(view.image); else { const src = view.source?.data; const iv = setInterval(() => { if (view.image){ clearInterval(iv); setMap(view.image); } }, 100); }
  m.position.y = y + h/2; m.renderOrder = -1; S.g.add(m); return m;
}
/* ------------------------------------------------------------ signs, screens, art */
export function neon(S, text, {x = 0, y = 3, z = 0, ry = 0, w = 3, h = 1, color = '#ff4fd8', font = 'italic 700 150px "Chakra Petch", Arial, sans-serif', sub, subColor, backing = null, light = 2.5, parent} = {}){
  const lines = sub ? [[text, font, color], [sub, '700 70px "Chakra Petch", Arial, sans-serif', subColor || color]] : [[text, font, color]];
  const t = Tex.text(lines, {glow: color, w: 1024, h: Math.round(1024*h/w)});
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || S.g).add(g);
  if (backing !== null){ const b = new T.Mesh(new T.BoxGeometry(w*1.04, h*1.08, .06), M.std(backing, .7, .3)); b.position.z = -.05; g.add(b); }
  const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map: t, transparent: true, toneMapped: false, blending: T.AdditiveBlending, depthWrite: false})); g.add(p);
  if (light){ const L = new T.PointLight(new T.Color(color), light, 6, 2); L.position.set(0, 0, .6); L.userData.prio = 2; g.add(L); }
  return g;
}
export function sign(S, text, opts){ return neon(S, text, {...opts, light: 0}); }
export function framed(S, map, {x, y, z, ry = 0, w = 1.2, h = .8, frame = 0x111111}){
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.g.add(g);
  const f = new T.Mesh(new T.BoxGeometry(w + .08, h + .08, .04), M.std(frame, .6)); g.add(f);
  const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map, roughness: .5})); p.position.z = .022; g.add(p);
  return g;
}
export function chalkboard(S, lines, {x, y = 1.2, z, ry = 0, w = .7, h = 1, aframe = false}){
  const t = Tex.text(lines.map(l => [l, '400 92px "Comic Sans MS", "Chalkboard", cursive', '#f2efe6']), {bg: '#1c201f', w: 512, h: Math.round(512*h/w), chalk: true});
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.g.add(g);
  const wood = M.std(0x5a3a22, .8);
  const b = new T.Mesh(new T.BoxGeometry(w + .08, h + .08, .04), wood); g.add(b);
  const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map: t, roughness: .95})); p.position.z = .022; g.add(p);
  if (aframe){ g.rotation.x = -.18; const leg = new T.Mesh(new T.BoxGeometry(.04, h*1.1, .04), wood); leg.position.set(0, -h*.05, -.3); leg.rotation.x = .35; g.add(leg); }
  return g;
}

/* an LED video wall: shows its own visuals until you set an image or video (see Screens) */
export function ledScreen(S, {x, y, z, ry = 0, w = 6, h = 3.4, title = 'ATL', sub = '', accent = '#ff4fd8', accent2 = '#4de1ff', frame = true}){
  const [c, ctx] = cv(1024, Math.round(1024*h/w));
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const mat = new T.MeshBasicMaterial({map: t, toneMapped: false});
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.g.add(g);
  if (frame){ const f = new T.Mesh(new T.BoxGeometry(w + .14, h + .14, .14), M.std(0x0c0c0e, .5, .6)); f.position.z = -.08; g.add(f); }
  const p = new T.Mesh(new T.PlaneGeometry(w, h), mat); p.userData.dynamic = true; g.add(p);
  const glow = new T.PointLight(new T.Color(accent2), 4, 9, 2); glow.position.set(0, 0, 1.4); glow.userData.prio = 1; g.add(glow);
  const W = c.width, H = c.height;
  const scr = {mesh: p, mat, own: t, glow, custom: false};
  let k = 0;
  S.tick((dt, time) => {
    if (scr.custom) return; if ((k += dt) < 1/24) return; k = 0;
    // a night-drive city in neon with a title, a bit like the Atlantic's DJ visuals
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05030c'); gr.addColorStop(.62, '#1a0730'); gr.addColorStop(1, '#03020a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const hz = H*.62;
    for (let i = 0; i < 26; i++){ const bw = W/26, bh = (Math.sin(i*1.7) + 1.3)*H*.16 + (i % 5 === 2 ? H*.12 : 0); const X = i*bw;
      ctx.fillStyle = i % 2 ? '#0e1430' : '#111a3a'; ctx.fillRect(X + 2, hz - bh, bw - 4, bh);
      ctx.fillStyle = i % 3 ? accent2 : accent; for (let yy = hz - bh + 6; yy < hz - 4; yy += 9) for (let xx = X + 5; xx < X + bw - 6; xx += 8) if (Math.sin(xx*12.3 + yy*7.1 + Math.floor(time*.6 + i)) > .55) ctx.fillRect(xx, yy, 3, 4); }
    for (let i = 0; i < 18; i++){ const p = ((time*.5 + i/18) % 1), yy = hz + p*p*(H - hz), sp = p*W*.9;
      ctx.strokeStyle = i % 2 ? accent : accent2; ctx.globalAlpha = p; ctx.lineWidth = 1 + p*4; ctx.beginPath(); ctx.moveTo(W/2 - sp, yy); ctx.lineTo(W/2 + sp, yy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (let i = -6; i <= 6; i++){ ctx.strokeStyle = i % 2 ? accent : accent2; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(W/2, hz); ctx.lineTo(W/2 + i*W*.16, H); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const beat = Math.pow(Math.max(0, Math.sin(time*Math.PI*2*2.05)), 8);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${H*.3}px "Chakra Petch", Arial, sans-serif`; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20 + beat*30; ctx.fillStyle = '#fff'; ctx.fillText(title, W/2, H*.3);
    if (sub){ ctx.font = `italic 700 ${H*.1}px "Chakra Petch", Arial, sans-serif`; ctx.shadowColor = accent; ctx.fillStyle = accent; ctx.fillText(sub, W/2, H*.5); }
    ctx.shadowBlur = 0;
    t.needsUpdate = true; glow.intensity = 3 + beat*4;
  });
  S.screens.push(scr);
  return g;
}

/* ------------------------------------------------------------ bar */
const bottleGeo = once('bottleGeo', () => { const pts = [[0, 0], [.038, 0], [.04, .02], [.04, .2], [.03, .24], [.013, .27], [.013, .33], [0, .33]].map(p => new T.Vector2(...p)); return new T.LatheGeometry(pts, 10); });
export function bottles(S, {x, y, z, len, ry = 0, rows = 3, rowH = .42, depth = .25, parent}){
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || S.g).add(g);
  const per = Math.floor(len/.1), n = per*rows;
  const mat = new T.MeshPhysicalMaterial({roughness: .12, metalness: 0, transparent: true, opacity: .92, vertexColors: false});
  const inst = new T.InstancedMesh(bottleGeo, mat, n), m = new T.Matrix4(), col = new T.Color();
  const cols = [0x2f5e2a, 0x7a3b12, 0xb36b1c, 0xe8e2d0, 0x5a1a14, 0x1a3a5a, 0xc8a24a, 0x3a2414, 0x8a8a8a, 0x9e2a2a];
  let i = 0;
  for (let r = 0; r < rows; r++) for (let k = 0; k < per; k++){ const s = rnd(.8, 1.15); m.compose(new T.Vector3(-len/2 + .05 + k*len/per + rnd(-.01, .01), r*rowH, rnd(-depth*.3, depth*.3)), new T.Quaternion(), new T.Vector3(s, s*rnd(.85, 1.15), s)); inst.setMatrixAt(i, m); inst.setColorAt(i, col.setHex(pick(cols))); i++; }
  g.add(inst);
  return g;
}
export function backBar(S, {x, z, len, ry = 0, h = 2.4, rows = 3, wood = 0x3a2516, glow = 0xffb46b, shelfMat, mirror = true, frameColor = 0x111111}){
  const g = S.group(x, 0, z, ry);
  const wm = M.std(wood, .6);
  S.box(len + .2, h + .4, .12, wm, 0, (h + .4)/2, -.06, {parent: g});
  if (mirror){ const mr = new T.Mesh(new T.PlaneGeometry(len, h*.7), new T.MeshStandardMaterial({color: 0x9aa0a6, roughness: .05, metalness: 1})); mr.position.set(0, 1.05 + h*.35, .01); g.add(mr); }
  const sm = shelfMat || new T.MeshStandardMaterial({color: 0x222222, roughness: .3, metalness: .7});
  for (let r = 0; r < rows; r++){
    const y = 1.15 + r*.48;
    S.box(len, .04, .3, sm, 0, y, .17, {parent: g, cast: false});
    const strip = new T.Mesh(new T.BoxGeometry(len, .015, .02), M.emissive(glow, 3)); strip.position.set(0, y - .03, .3); g.add(strip);
  }
  bottles(S, {x: 0, y: 1.17, z: .17, len: len - .1, rows, rowH: .48, parent: g});
  // under-counter fridges and glasses rack
  S.box(len, .9, .55, M.std(0x1b1b1e, .4, .6), 0, .45, .3, {parent: g});
  const gl = new T.PointLight(glow, 3, 4, 2); gl.position.set(0, 1.9, .8); gl.userData.prio = 1; g.add(gl);
  for (let i = 0; i < 4; i++){ const f = new T.Mesh(new T.PlaneGeometry(len/4 - .05, .75), new T.MeshStandardMaterial({color: 0x101418, roughness: .1, metalness: .8})); f.position.set(-len/2 + len/8 + i*len/4, .45, .58); g.add(f); }
  return g;
}
/* the counter: straight or curved, a lit underglow, a foot rail and stools */
export function barCounter(S, {x, z, len, ry = 0, curve = 0, top, front, glow = 0xffb46b, stools = 'metal', stoolN, depth = .7, h = 1.08, taps = false, rail = true, onyx = false}){
  const g = S.group(x, 0, z, ry);
  const fm = front || M.std(0x3a2416, .55);
  const tm = top || M.std(0x221410, .25, .1);
  const seg = (L, X, Z, rotY) => {
    const s = S.group(X, 0, Z, rotY, g);
    if (onyx){ const panel = new T.Mesh(new T.BoxGeometry(L, h - .1, depth), new T.MeshStandardMaterial({map: Tex.onyx(), emissive: 0xffd8a0, emissiveMap: Tex.onyx(), emissiveIntensity: 1.2, roughness: .3})); panel.position.y = (h - .1)/2; s.add(panel); }
    else { const b = new T.Mesh(new T.BoxGeometry(L, h - .06, depth), fm); b.position.y = (h - .06)/2; b.castShadow = b.receiveShadow = true; s.add(b); }
    const tp = new T.Mesh(new T.BoxGeometry(L + .08, .06, depth + .16), tm); tp.position.set(0, h - .03, .04); tp.castShadow = true; s.add(tp);
    const strip = new T.Mesh(new T.BoxGeometry(L, .03, .03), M.emissive(glow, 4)); strip.position.set(0, h - .09, depth/2 + .1); s.add(strip);
    const strip2 = new T.Mesh(new T.BoxGeometry(L, .02, .02), M.emissive(glow, 2.5)); strip2.position.set(0, .08, depth/2 + .02); s.add(strip2);
    if (rail){ const r = new T.Mesh(new T.CylinderGeometry(.025, .025, L, 10), M.brass()); r.rotation.z = Math.PI/2; r.position.set(0, .22, depth/2 + .2); s.add(r); }
    return s;
  };
  if (!curve){ seg(len, 0, 0, 0); }
  else { const n = 6; for (let i = 0; i < n; i++){ const a = -curve/2 + curve*(i + .5)/n, R = len/curve; seg(R*curve/n + .02, Math.sin(a)*R, Math.cos(a)*R - R, a); } }
  const under = new T.PointLight(glow, 2.2, 3.5, 2); under.position.set(0, .4, depth/2 + .8); under.userData.prio = 2; g.add(under);
  // stools along the guest side
  const n = stoolN ?? Math.floor(len/.75);
  for (let i = 0; i < n; i++){
    let px, pz, a = 0;
    if (!curve){ px = -len/2 + .4 + i*(len - .8)/Math.max(1, n - 1); pz = depth/2 + .5; }
    else { a = -curve/2 + curve*(i + .5)/n; const R = len/curve + depth/2 + .5; px = Math.sin(a)*R; pz = Math.cos(a)*R - len/curve; }
    if (stools) stool(S, stools, px, pz, g, a);
  }
  if (taps){ for (let i = 0; i < 6; i++){ const tp = new T.Mesh(new T.CylinderGeometry(.018, .018, .32, 8), M.chrome()); tp.position.set(-.5 + i*.2, h + .16, -.15); g.add(tp); const hd = new T.Mesh(new T.CylinderGeometry(.022, .022, .12, 8), M.std(pick([0xc8102e, 0x1d4e9a, 0xd4a637, 0x0f6b4f, 0xffffff]), .5)); hd.position.set(-.5 + i*.2, h + .38, -.15); g.add(hd); } }
  // a few drinks on the bar
  for (let i = 0; i < Math.floor(len/1.2); i++) glass(S, rnd(-len/2 + .3, len/2 - .3), h, rnd(-.05, .15), g);
  S.blockAround(g, .25);
  return g;
}
export function stool(S, kind, x, z, parent = S.g, ry = 0){
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const seatH = .76;
  if (kind === 'metal' || kind === 'wood'){
    const leg = M.blackMetal(), top = new T.Mesh(new T.CylinderGeometry(.19, .19, .05, 20), kind === 'wood' ? new T.MeshStandardMaterial({map: Tex.planks('#c9a46a'), roughness: .6}) : M.std(0x111111, .5, .6));
    top.position.y = seatH; g.add(top);
    for (let i = 0; i < 4; i++){ const a = i*Math.PI/2 + Math.PI/4, l = new T.Mesh(new T.CylinderGeometry(.015, .018, seatH, 6), leg); l.position.set(Math.cos(a)*.13, seatH/2, Math.sin(a)*.13); l.rotation.set(Math.sin(a)*.08, 0, -Math.cos(a)*.08); g.add(l); }
    const ring = new T.Mesh(new T.TorusGeometry(.15, .01, 6, 20), leg); ring.rotation.x = Math.PI/2; ring.position.y = .28; g.add(ring);
  } else if (kind === 'velvet' || kind === 'green'){
    const seat = new T.Mesh(new T.CylinderGeometry(.2, .19, .12, 24), M.std(kind === 'green' ? 0x0f4a44 : 0x6e1a2c, .9)); seat.position.y = seatH; g.add(seat);
    const post = new T.Mesh(new T.CylinderGeometry(.03, .03, seatH, 10), M.brass()); post.position.y = seatH/2; g.add(post);
    const base = new T.Mesh(new T.CylinderGeometry(.2, .22, .03, 24), M.brass()); base.position.y = .015; g.add(base);
    const ring = new T.Mesh(new T.TorusGeometry(.16, .012, 6, 24), M.brass()); ring.rotation.x = Math.PI/2; ring.position.y = .3; g.add(ring);
  } else if (kind === 'wicker'){
    const seat = new T.Mesh(new T.CylinderGeometry(.21, .2, .08, 20), M.std(0xb69468, .9)); seat.position.y = seatH; g.add(seat);
    const back = new T.Mesh(new T.CylinderGeometry(.22, .21, .22, 20, 1, true, Math.PI*.15, Math.PI*.7), M.std(0xb69468, .9, 0, {side: T.DoubleSide})); back.position.y = seatH + .14; g.add(back);
    for (let i = 0; i < 4; i++){ const a = i*Math.PI/2 + Math.PI/4, l = new T.Mesh(new T.CylinderGeometry(.012, .012, seatH, 6), M.blackMetal()); l.position.set(Math.cos(a)*.14, seatH/2, Math.sin(a)*.14); g.add(l); }
  }
  return g;
}
export function glass(S, x, y, z, parent = S.g, kind){
  const k = kind || pick(['rocks', 'pint', 'coupe', 'wine']);
  const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
  const gm = new T.MeshPhysicalMaterial({color: 0xffffff, roughness: .05, transparent: true, opacity: .4});
  const liquid = M.std(pick([0xd99a2b, 0x8a2a1a, 0xf2c14e, 0xe8e0c0, 0x2a8a6a]), .2, 0, {transparent: true, opacity: .85});
  if (k === 'pint'){ g.add(new T.Mesh(new T.CylinderGeometry(.04, .033, .15, 12), gm)); const l = new T.Mesh(new T.CylinderGeometry(.037, .031, .13, 12), M.std(0xe0a030, .3)); g.add(l); const foam = new T.Mesh(new T.CylinderGeometry(.039, .039, .02, 12), M.std(0xf5ecd8, .8)); foam.position.y = .065; g.add(foam); g.children.forEach(c => c.position.y += .075); }
  else if (k === 'rocks'){ const a = new T.Mesh(new T.CylinderGeometry(.04, .04, .09, 12), gm); a.position.y = .045; g.add(a); const l = new T.Mesh(new T.CylinderGeometry(.036, .036, .05, 12), liquid); l.position.y = .03; g.add(l); }
  else { const stem = new T.Mesh(new T.CylinderGeometry(.005, .005, .1, 6), gm); stem.position.y = .05; g.add(stem); const base = new T.Mesh(new T.CylinderGeometry(.03, .03, .005, 12), gm); g.add(base);
    const bowl = new T.Mesh(k === 'coupe' ? new T.CylinderGeometry(.05, .02, .04, 14) : new T.SphereGeometry(.04, 12, 8, 0, Math.PI*2, 0, Math.PI*.65), gm); bowl.position.y = k === 'coupe' ? .12 : .13; if (k !== 'coupe') bowl.rotation.x = Math.PI; g.add(bowl);
    const l = new T.Mesh(new T.CylinderGeometry(.04, .02, .025, 12), liquid); l.position.y = .115; g.add(l); }
  return g;
}
export function candle(S, x, y, z, parent = S.g){
  const g = new T.Group(); g.position.set(x, y, z); g.userData.dynamic = true; parent.add(g);
  const holder = new T.Mesh(new T.CylinderGeometry(.035, .03, .07, 12), new T.MeshPhysicalMaterial({color: 0xffc070, roughness: .1, transparent: true, opacity: .7})); holder.position.y = .035; g.add(holder);
  const flame = new T.Sprite(new T.SpriteMaterial({map: Tex.glow('rgb(255,190,110)'), color: 0xffaa55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false})); flame.scale.set(.12, .12, 1); flame.position.y = .07; g.add(flame);
  S.tick((dt, t) => { const f = .1 + Math.sin(t*13 + x*7)*.012 + Math.sin(t*7.3 + z)*.01; flame.scale.set(f, f, 1); });
  return g;
}

/* ------------------------------------------------------------ seating and tables */
export function bistroTable(S, x, z, {round = true, top, h = .76, r = .32, chairs = 2, chair = 'tolix', chairColor, base = 'black', items = true} = {}){
  const g = S.group(x, 0, z, rnd(0, Math.PI));
  const tm = top || new T.MeshStandardMaterial({map: Tex.planks('#7a5232'), roughness: .5});
  const tp = new T.Mesh(round ? new T.CylinderGeometry(r, r, .04, 28) : new T.BoxGeometry(r*2, .04, r*2), tm); tp.position.y = h; tp.castShadow = tp.receiveShadow = true; g.add(tp);
  const bm = base === 'brass' ? M.brass() : M.blackMetal();
  const post = new T.Mesh(new T.CylinderGeometry(.03, .03, h, 10), bm); post.position.y = h/2; g.add(post);
  const foot = new T.Mesh(new T.CylinderGeometry(.22, .24, .03, 24), bm); foot.position.y = .015; g.add(foot);
  for (let i = 0; i < chairs; i++){ const a = i*Math.PI*2/chairs; chairAt(S, chair, Math.sin(a)*(r + .38), Math.cos(a)*(r + .38), a + Math.PI, g, chairColor); }
  if (items){ candle(S, rnd(-.08, .08), h + .02, rnd(-.08, .08), g); for (let i = 0; i < chairs; i++) if (Math.random() < .7){ const a = i*Math.PI*2/chairs; glass(S, Math.sin(a)*r*.6, h + .02, Math.cos(a)*r*.6, g); } }
  S.blockAround(g, .05);
  return g;
}
export function chairAt(S, kind, x, z, ry, parent = S.g, color){
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  if (kind === 'tolix'){
    const m = M.std(color ?? pick([0x2b2d30, 0x2b2d30, 0x5a1f22, 0x3a3d40]), .45, .8);
    const seat = new T.Mesh(new T.BoxGeometry(.4, .03, .4), m); seat.position.y = .45; g.add(seat);
    const back = new T.Mesh(new T.CylinderGeometry(.22, .2, .32, 16, 1, true, -Math.PI*.35, Math.PI*.7), new T.MeshStandardMaterial({color: m.color, roughness: .45, metalness: .8, side: T.DoubleSide})); back.position.set(0, .65, -.05); back.rotation.y = Math.PI; g.add(back);
    for (const [lx, lz] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]){ const l = new T.Mesh(new T.CylinderGeometry(.012, .016, .45, 6), m); l.position.set(lx*1.05, .225, lz*1.05); g.add(l); }
  } else if (kind === 'velvet' || kind === 'armchair'){
    const col = color ?? 0x7a1f2b, fm = new T.MeshStandardMaterial({map: Tex.fabric('#' + new T.Color(col).getHexString()), roughness: .95});
    const seat = new T.Mesh(new T.BoxGeometry(.6, .18, .55), fm); seat.position.y = .42; g.add(seat);
    const back = new T.Mesh(new T.BoxGeometry(.62, .5, .12), fm); back.position.set(0, .68, -.24); back.rotation.x = -.12; g.add(back);
    for (const s of [-1, 1]){ const arm = new T.Mesh(new T.BoxGeometry(.1, .22, .5), fm); arm.position.set(s*.3, .55, 0); g.add(arm); }
    for (const [lx, lz] of [[-.24, -.2], [.24, -.2], [-.24, .2], [.24, .2]]){ const l = new T.Mesh(new T.CylinderGeometry(.015, .01, .33, 6), kind === 'velvet' ? M.brass() : M.std(0x2a1a10, .6)); l.position.set(lx, .165, lz); g.add(l); }
  } else if (kind === 'director'){
    const wood = M.std(0xb07a3a, .6), cloth = M.std(0x111111, .9);
    for (const s of [-1, 1]) for (const f of [-1, 1]){ const l = new T.Mesh(new T.BoxGeometry(.03, .9, .03), wood); l.position.set(s*.24, .45, f*.12); l.rotation.x = f*.35; g.add(l); }
    const seat = new T.Mesh(new T.BoxGeometry(.5, .02, .36), cloth); seat.position.y = .5; g.add(seat);
    const back = new T.Mesh(new T.BoxGeometry(.52, .2, .02), cloth); back.position.set(0, .82, -.18); g.add(back);
  }
  return g;
}
/* a curved tufted booth (velvet or leather) around a table, like the Peachtree Terrace and Auburn rooms */
export function curvedBooth(S, x, z, {r = 1.3, arc = Math.PI*1.2, ry = 0, color = 0x6e1a2c, leather = false, table = true, tableTop} = {}){
  const g = S.group(x, 0, z, ry);
  const col = '#' + new T.Color(color).getHexString();
  const fm = new T.MeshStandardMaterial({map: Tex.fabric(col, !leather), roughness: leather ? .45 : .95});
  // ring-shaped seat that wraps behind the table; its middle faces +z
  const p0 = Math.PI/2 - arc/2, ri = r - .25, ro = r + .3;
  const sh = new T.Shape(); sh.absarc(0, 0, ro, p0, p0 + arc, false); sh.absarc(0, 0, ri, p0 + arc, p0, true);
  const seatGeo = new T.ExtrudeGeometry(sh, {depth: .42, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 3, curveSegments: 32}); seatGeo.rotateX(-Math.PI/2);
  const seat = new T.Mesh(seatGeo, fm); seat.castShadow = seat.receiveShadow = true; g.add(seat);
  const sh2 = new T.Shape(); sh2.absarc(0, 0, ro + .12, p0, p0 + arc, false); sh2.absarc(0, 0, ro - .08, p0 + arc, p0, true);
  const backGeo = new T.ExtrudeGeometry(sh2, {depth: .95, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 3, curveSegments: 32}); backGeo.rotateX(-Math.PI/2);
  const back = new T.Mesh(backGeo, new T.MeshStandardMaterial({map: Tex.fabric(col, true), roughness: leather ? .45 : .95})); back.castShadow = true; g.add(back);
  // the shape's +y becomes -z after the rotation, so the booth wraps the far side and opens toward +z
  if (table){ const tm = tableTop || new T.MeshStandardMaterial({map: Tex.marble(), roughness: .2}); const tp = new T.Mesh(new T.CylinderGeometry(.45, .45, .04, 30), tm); tp.position.set(0, .72, 0); tp.castShadow = true; g.add(tp);
    const post = new T.Mesh(new T.CylinderGeometry(.04, .04, .7, 10), M.brass()); post.position.y = .35; g.add(post); const foot = new T.Mesh(new T.CylinderGeometry(.25, .28, .03, 24), M.brass()); g.add(foot);
    candle(S, 0, .74, 0, g); for (let i = 0; i < 3; i++){ const a = rnd(0, 6.28); glass(S, Math.cos(a)*.28, .74, Math.sin(a)*.28, g, 'wine'); } }
  S.blockAround(g, .05);
  return g;
}
export function sofa(S, x, z, {w = 2.4, d = .95, ry = 0, color = 0xe9e4da, legs = 'brass', cushions = [0xb5502e, 0x3a3a3a, 0xb5502e], chaise = 0, boucle = false} = {}){
  const g = S.group(x, 0, z, ry);
  const fm = new T.MeshStandardMaterial({map: Tex.fabric('#' + new T.Color(color).getHexString()), roughness: .98});
  const base = new T.Mesh(new T.BoxGeometry(w, .36, d), fm); base.position.y = .3; base.castShadow = true; g.add(base);
  const back = new T.Mesh(new T.BoxGeometry(w, .45, .22), fm); back.position.set(0, .66, -d/2 + .11); g.add(back);
  for (const s of [-1, 1]){ const arm = new T.Mesh(new T.BoxGeometry(.2, .28, d), fm); arm.position.set(s*(w/2 - .1), .58, 0); g.add(arm); }
  if (chaise){ const c = new T.Mesh(new T.BoxGeometry(.9, .36, chaise), fm); c.position.set(w/2 - .45, .3, d/2 + chaise/2 - .05); g.add(c); }
  const nC = Math.max(2, Math.round(w/.8)); for (let i = 0; i < nC; i++){ const cu = new T.Mesh(new T.BoxGeometry(w/nC - .04, .14, d - .3), fm); cu.position.set(-w/2 + w/nC*(i + .5), .55, .08); g.add(cu); }
  cushions.forEach((c, i) => { const p = new T.Mesh(new T.BoxGeometry(.42, .42, .12), M.std(c, .95)); p.position.set(-w/2 + .45 + i*(w - .9)/Math.max(1, cushions.length - 1), .75, -d/2 + .3); p.rotation.set(-.25, rnd(-.15, .15), rnd(-.1, .1)); g.add(p); });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const l = new T.Mesh(new T.CylinderGeometry(.02, .015, .12, 8), legs === 'brass' ? M.brass() : M.std(0x1a1a1a, .6)); l.position.set(sx*(w/2 - .1), .06, sz*(d/2 - .1)); g.add(l); }
  S.blockAround(g, .05);
  return g;
}
export function coffeeTable(S, x, z, {r = .45, glassTop = false, ry = 0, w, d} = {}){
  const g = S.group(x, 0, z, ry);
  if (w){ const tp = new T.Mesh(new T.BoxGeometry(w, .05, d), new T.MeshStandardMaterial({map: Tex.planks('#6b4426'), roughness: .5})); tp.position.y = .42; g.add(tp); const sh = new T.Mesh(new T.BoxGeometry(w - .1, .03, d - .1), tp.material); sh.position.y = .15; g.add(sh); for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const l = new T.Mesh(new T.BoxGeometry(.05, .42, .05), M.std(0x3a2414, .6)); l.position.set(sx*(w/2 - .06), .21, sz*(d/2 - .06)); g.add(l); } }
  else { const tp = new T.Mesh(new T.CylinderGeometry(r, r, .03, 32), glassTop ? new T.MeshPhysicalMaterial({color: 0x8a6a40, roughness: .05, metalness: .3, transparent: true, opacity: .7}) : new T.MeshStandardMaterial({map: Tex.marble(), roughness: .2})); tp.position.y = .45; g.add(tp);
    const ring = new T.Mesh(new T.TorusGeometry(r, .012, 6, 40), M.brass()); ring.rotation.x = Math.PI/2; ring.position.y = .45; g.add(ring);
    const post = new T.Mesh(new T.CylinderGeometry(.04, .04, .45, 10), M.brass()); post.position.y = .225; g.add(post); const foot = new T.Mesh(new T.CylinderGeometry(r*.6, r*.65, .03, 28), M.brass()); g.add(foot); }
  S.blockAround(g, .05);
  return g;
}
export function rug(S, x, z, w, d, ry = 0){ const m = S.mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({map: Tex.rug(), roughness: 1}), x, .006, z, S.g, {cast: false, ry}); m.rotation.x = -Math.PI/2; m.rotation.z = ry; m.rotation.y = 0; return m; }

/* ------------------------------------------------------------ plants */
export function plant(S, x, z, {kind = 'fig', h = 1.8, pot = 0x1a1a1a, potH = .45, parent} = {}){
  const g = new T.Group(); g.position.set(x, 0, z); (parent || S.g).add(g);
  const pm = M.std(pot, .6, .1);
  const p = new T.Mesh(new T.CylinderGeometry(.28, .22, potH, 20), pm); p.position.y = potH/2; p.castShadow = true; g.add(p);
  const soil = new T.Mesh(new T.CylinderGeometry(.26, .26, .02, 20), M.std(0x2a1d14, 1)); soil.position.y = potH - .02; g.add(soil);
  const shape = kind === 'pampas' ? 'grass' : kind === 'olive' ? 'olive' : 'fig';
  const leafCol = {fig: '#2f5a2a', olive: '#7f8f6a', pampas: '#d8c8a8', palm: '#3a6b34', monstera: '#2d5a2a'}[kind] || '#2f5a2a';
  const lm = new T.MeshStandardMaterial({map: Tex.leaf(leafCol, shape), alphaTest: .4, side: T.DoubleSide, roughness: .8});
  const trunkM = M.std(0x4a3626, .9);
  if (kind === 'olive' || kind === 'fig'){
    const tr = new T.Mesh(new T.CylinderGeometry(.025, .04, h*.7, 6), trunkM); tr.position.y = potH + h*.35; g.add(tr);
    const n = kind === 'olive' ? 140 : 46;
    for (let i = 0; i < n; i++){ const a = rnd(0, 6.28), rr = rnd(.05, kind === 'olive' ? .5 : .45), yy = potH + h*rnd(.35, 1);
      const L = new T.Mesh(new T.PlaneGeometry(kind === 'olive' ? .06 : .2, kind === 'olive' ? .22 : .32), lm); L.position.set(Math.cos(a)*rr, yy, Math.sin(a)*rr); L.rotation.set(rnd(-1, 1), a, rnd(-.6, .6)); g.add(L); }
  } else {
    const n = kind === 'pampas' ? 26 : 18;
    for (let i = 0; i < n; i++){ const a = rnd(0, 6.28), L = new T.Mesh(new T.PlaneGeometry(kind === 'pampas' ? .14 : .4, h*rnd(.6, 1)), lm); L.position.set(Math.cos(a)*.05, potH + h*.4, Math.sin(a)*.05); L.rotation.set(0, a, rnd(-.45, .45)); L.translateY(h*.05); g.add(L); }
  }
  S.block(x - .3, x + .3, z - .3, z + .3);
  return g;
}

/* ------------------------------------------------------------ lights */
export function stringLights(S, pts, {n = 14, sag = .4, color = 0xffd9a0} = {}){
  const bm = new T.MeshBasicMaterial({color, toneMapped: false}), wire = new T.LineBasicMaterial({color: 0x111111});
  const glowM = new T.SpriteMaterial({map: Tex.glow('rgb(255,210,150)'), color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8});
  for (let s = 0; s < pts.length - 1; s++){
    const a = new T.Vector3(...pts[s]), b = new T.Vector3(...pts[s + 1]), line = [];
    for (let i = 0; i <= n; i++){ const t = i/n, p = a.clone().lerp(b, t); p.y -= Math.sin(t*Math.PI)*sag; line.push(p);
      if (i && i < n){ const bulb = new T.Mesh(new T.SphereGeometry(.035, 8, 6), bm); bulb.position.copy(p).y -= .05; S.g.add(bulb); const gl = new T.Sprite(glowM); gl.scale.set(.3, .3, 1); gl.position.copy(bulb.position); S.g.add(gl); } }
    S.g.add(new T.Line(new T.BufferGeometry().setFromPoints(line), wire));
  }
}
export function pendant(S, x, y, z, {drop = 1.2, kind = 'edison', color = 0xffc070, shade = 0x111111, light = true} = {}){
  const g = new T.Group(); g.position.set(x, y, z); S.g.add(g);
  const cord = new T.Mesh(new T.CylinderGeometry(.004, .004, drop, 4), M.std(0x111111)); cord.position.y = -drop/2; g.add(cord);
  if (kind === 'edison' || kind === 'globe'){
    const r = kind === 'globe' ? .12 : .065;
    const bulb = new T.Mesh(new T.SphereGeometry(r, 16, 12), kind === 'globe' ? new T.MeshPhysicalMaterial({color: 0xffffff, roughness: .02, transparent: true, opacity: .35}) : new T.MeshBasicMaterial({color, toneMapped: false})); bulb.position.y = -drop - r; g.add(bulb);
    const fil = new T.Mesh(new T.SphereGeometry(kind === 'globe' ? .025 : .03, 8, 6), new T.MeshBasicMaterial({color: 0xffd090, toneMapped: false})); fil.position.y = -drop - r; g.add(fil);
    const gl = new T.Sprite(new T.SpriteMaterial({map: Tex.glow('rgb(255,200,140)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .7})); gl.scale.set(.5, .5, 1); gl.position.y = -drop - r; g.add(gl);
  } else {
    const sh = new T.Mesh(new T.ConeGeometry(.22, .2, 24, 1, true), M.std(shade, .4, .7, {side: T.DoubleSide})); sh.position.y = -drop - .1; g.add(sh);
    const b = new T.Mesh(new T.SphereGeometry(.06, 10, 8), new T.MeshBasicMaterial({color, toneMapped: false})); b.position.y = -drop - .17; g.add(b);
  }
  if (light){ const L = new T.PointLight(color, 1.2, 4, 2); L.position.y = -drop - .3; L.userData.prio = 3; g.add(L); }
  return g;
}
export function chandelier(S, x, y, z, {tiers = 4, r = .9} = {}){
  const g = new T.Group(); g.position.set(x, y, z); S.g.add(g);
  const crystal = new T.MeshPhysicalMaterial({color: 0xfff4e0, roughness: 0, transparent: true, opacity: .8, emissive: 0x332010});
  for (let t = 0; t < tiers; t++){ const R = r*(1 - t*.2), n = Math.floor(R*60), yy = -t*.28;
    const ring = new T.Mesh(new T.TorusGeometry(R, .015, 6, 48), M.brass()); ring.rotation.x = Math.PI/2; ring.position.y = yy; g.add(ring);
    const inst = new T.InstancedMesh(new T.CylinderGeometry(.008, .008, .35, 4), crystal, n), m = new T.Matrix4();
    for (let i = 0; i < n; i++){ const a = i*6.283/n; m.makeTranslation(Math.cos(a)*R, yy - .18, Math.sin(a)*R); inst.setMatrixAt(i, m); } g.add(inst); }
  const L = new T.PointLight(0xffd8a8, 6, 10, 2); L.position.y = -.5; L.userData.prio = 1; g.add(L);
  const gl = new T.Sprite(new T.SpriteMaterial({map: Tex.glow('rgb(255,220,170)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: .6})); gl.scale.set(2.6, 2, 1); gl.position.y = -.4; g.add(gl);
  return g;
}
/* stage truss: a box-lattice beam between two points */
export function truss(S, a, b, {size = .3, color = 0x1a1a1c} = {}){
  const A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B), g = new T.Group(); S.g.add(g);
  g.position.copy(A).lerp(B, .5); g.lookAt(B);
  const m = M.std(color, .4, .85), s = size/2;
  for (const [x, y] of [[-s, -s], [s, -s], [-s, s], [s, s]]){ const c = new T.Mesh(new T.CylinderGeometry(.022, .022, L, 6), m); c.rotation.x = Math.PI/2; c.position.set(x, y, 0); g.add(c); }
  const n = Math.max(2, Math.floor(L/size));
  const inst = new T.InstancedMesh(new T.CylinderGeometry(.01, .01, size*1.42, 4), m, n*4), mt = new T.Matrix4(), q = new T.Quaternion(); let k = 0;
  for (let i = 0; i < n; i++){ const z = -L/2 + (i + .5)*L/n;
    for (const [px, py, rx, rz] of [[-s, 0, (i % 2 ? 1 : -1)*Math.PI/4, 0], [s, 0, (i % 2 ? -1 : 1)*Math.PI/4, 0], [0, -s, 0, 0], [0, s, 0, 0]]){
      if (rz === 0 && px === 0){ q.setFromEuler(new T.Euler(0, (i % 2 ? 1 : -1)*Math.PI/4, Math.PI/2)); } else q.setFromEuler(new T.Euler(rx, 0, 0));
      mt.compose(new T.Vector3(px, py, z), q, new T.Vector3(1, 1, 1)); inst.setMatrixAt(k++, mt); } }
  g.add(inst);
  return g;
}
/* a moving-head light with a visible beam in the haze; sweeps on its own */
export function movingHead(S, x, y, z, {color = 0xb07cff, aim = [0, 0, -2], sweep = .5, speed = .6, phase = 0, beamLen = 7, width = .35, intensity = 30} = {}){
  const g = new T.Group(); g.position.set(x, y, z); g.userData.dynamic = true; S.g.add(g);
  const body = M.std(0x141416, .5, .6);
  const yoke = new T.Mesh(new T.BoxGeometry(.28, .08, .18), body); yoke.position.y = .02; g.add(yoke);
  const head = new T.Group(); head.position.y = -.18; g.add(head);
  const can = new T.Mesh(new T.CylinderGeometry(.13, .11, .3, 16), body); head.add(can);
  const lens = new T.Mesh(new T.CircleGeometry(.1, 16), new T.MeshBasicMaterial({color, toneMapped: false})); lens.position.y = -.151; lens.rotation.x = Math.PI/2; head.add(lens);
  const beam = new T.Mesh(new T.CylinderGeometry(.08, width*beamLen*.18 + .3, beamLen, 20, 1, true), M.add(color, .32, Tex.beam())); beam.position.y = -beamLen/2 - .15; head.add(beam);
  beam.geometry.rotateY(Math.PI); // gradient faces the light
  const spot = new T.SpotLight(color, intensity, beamLen + 4, width*.6, .5, 1.5); spot.position.set(0, -.2, 0); spot.userData.prio = 2.5; head.add(spot); const tgt = new T.Object3D(); tgt.position.set(0, -5, 0); head.add(tgt); spot.target = tgt;
  const base = new T.Vector3(...aim).sub(new T.Vector3(x, y, z)).normalize();
  const baseYaw = Math.atan2(base.x, base.z), basePitch = Math.acos(-base.y);
  S.tick((dt, t) => { const k = t*speed + phase; head.rotation.set(0, 0, 0); g.rotation.y = baseYaw + Math.sin(k)*sweep; head.rotation.x = -(basePitch + Math.sin(k*1.31 + 1)*sweep*.6); });
  S.lights.push(spot);
  return g;
}
/* floor gobos: soft moving dots of coloured light on the dance floor */
export function floorDots(S, cx, cz, r, colors = [0xb07cff, 0x4de1ff, 0xffffff]){
  const mats = colors.map(c => M.add(c, .22, Tex.glow('rgb(255,255,255)')));
  const dots = [];
  for (let i = 0; i < 26; i++){ const m = new T.Mesh(new T.CircleGeometry(rnd(.25, .5), 20), mats[i % mats.length]); m.userData.dynamic = true; m.rotation.x = -Math.PI/2; m.position.set(cx, .012, cz); S.g.add(m); dots.push([m, rnd(0, 6.28), rnd(.2, .6), rnd(.3, 1)]); }
  S.tick((dt, t) => { for (const [m, ph, sp, rr] of dots){ m.position.x = cx + Math.cos(t*sp + ph)*r*rr; m.position.z = cz + Math.sin(t*sp*1.3 + ph)*r*rr*.8; } });
}
export function haze(S, color, density){ S.fog = new T.FogExp2(color, density); }

/* ------------------------------------------------------------ stage gear */
export function speakerStack(S, x, z, {ry = 0, n = 4, w = .7, y0 = 0, hang = false} = {}){
  const g = S.group(x, y0, z, ry), m = M.std(0x121214, .7, .2), grille = M.std(0x1e1e22, .95);
  for (let i = 0; i < n; i++){ const b = new T.Mesh(new T.BoxGeometry(w, .32, .45), m); b.position.y = .16 + i*.33; b.rotation.x = hang ? i*.04 : 0; g.add(b); const gr = new T.Mesh(new T.PlaneGeometry(w - .06, .26), grille); gr.position.set(0, .16 + i*.33, .226); g.add(gr); }
  if (!hang) S.blockAround(g, .05);
  return g;
}
export function wedge(S, x, z, ry = 0, y = 0){ const g = S.group(x, y, z, ry); const b = new T.Mesh(new T.BoxGeometry(.6, .32, .45), M.std(0x121214, .7)); b.position.y = .16; b.rotation.x = -.45; g.add(b); return g; }
export function djBooth(S, x, z, {ry = 0, w = 2.2, y = 0, facade = 0x111114, logo} = {}){
  const g = S.group(x, y, z, ry);
  const desk = new T.Mesh(new T.BoxGeometry(w, 1.0, .75), M.std(facade, .5, .4)); desk.position.y = .5; desk.castShadow = true; g.add(desk);
  if (logo){ const p = new T.Mesh(new T.PlaneGeometry(w*.5, .22), new T.MeshBasicMaterial({map: Tex.text([[logo, '700 90px "Chakra Petch", Arial, sans-serif', '#ffffff']], {w: 512, h: 110}), transparent: true, toneMapped: false})); p.position.set(0, .7, .38); g.add(p); }
  const strip = new T.Mesh(new T.BoxGeometry(w, .03, .03), M.emissive(0x4de1ff, 3)); strip.position.set(0, .05, .38); g.add(strip);
  const dark = M.std(0x1a1a1c, .4, .5);
  for (const s of [-1, 0, 1]){
    const unit = new T.Mesh(new T.BoxGeometry(s ? .42 : .38, .08, .45), dark); unit.position.set(s*.52, 1.04, 0); g.add(unit);
    if (s){ const plat = new T.Mesh(new T.CylinderGeometry(.14, .14, .015, 32), new T.MeshStandardMaterial({color: 0x222, emissive: s > 0 ? 0xff4fd8 : 0x4de1ff, emissiveIntensity: .8, roughness: .3})); plat.position.set(s*.52, 1.09, -.02); plat.userData.dynamic = true; g.add(plat); S.tick((dt, t) => plat.rotation.y = t*3.5*s); }
    else for (let i = 0; i < 4; i++){ const f = new T.Mesh(new T.BoxGeometry(.02, .015, .2), M.emissive(i % 2 ? 0xffc21a : 0x5fd38d, 2)); f.position.set(-.12 + i*.08, 1.09, 0); g.add(f); }
  }
  const laptop = new T.Mesh(new T.BoxGeometry(.32, .01, .22), dark); laptop.position.set(0, 1.12, -.25); g.add(laptop); const scr = new T.Mesh(new T.PlaneGeometry(.32, .2), M.emissive(0x8ab4ff, 1.5)); scr.position.set(0, 1.23, -.36); scr.rotation.x = -.2; g.add(scr);
  S.blockAround(g, .1);
  return g;
}
export function drumKit(S, x, z, {ry = 0, y = 0} = {}){
  const g = S.group(x, y, z, ry), shell = M.std(0x0c0c0e, .3, .4), head = M.std(0xe8e6e0, .6), cym = new T.MeshStandardMaterial({color: 0xd4a637, roughness: .25, metalness: 1});
  const kick = new T.Mesh(new T.CylinderGeometry(.28, .28, .4, 24), shell); kick.rotation.x = Math.PI/2; kick.position.set(0, .3, 0); g.add(kick);
  const kh = new T.Mesh(new T.CircleGeometry(.27, 24), new T.MeshStandardMaterial({map: Tex.text([['TAMA', '800 120px Arial', '#111']], {bg: '#eeeae0', w: 256, h: 256}), roughness: .6})); kh.position.set(0, .3, .205); g.add(kh);
  for (const [dx, dz, r, hh] of [[-.28, .1, .17, .62], [.28, .15, .16, .66], [-.15, -.12, .14, .9], [.15, -.12, .14, .9], [.5, -.25, .22, .55]]){ const d = new T.Mesh(new T.CylinderGeometry(r, r, .18, 20), shell); d.position.set(dx, hh, dz); g.add(d); const tp = new T.Mesh(new T.CylinderGeometry(r, r, .005, 20), head); tp.position.set(dx, hh + .092, dz); g.add(tp); }
  for (const [dx, dz, hh, r] of [[-.55, .05, 1.0, .22], [-.4, -.4, 1.35, .25], [.45, -.45, 1.4, .27], [.65, .05, 1.15, .24]]){ const st = new T.Mesh(new T.CylinderGeometry(.01, .01, hh, 6), M.chrome()); st.position.set(dx, hh/2, dz); g.add(st); const c = new T.Mesh(new T.CylinderGeometry(r, .01, .02, 24), cym); c.position.set(dx, hh, dz); c.rotation.z = .15; g.add(c); }
  const throne = new T.Mesh(new T.CylinderGeometry(.18, .18, .1, 20), M.std(0x111111, .8)); throne.position.set(0, .55, -.6); g.add(throne);
  S.blockAround(g, .1);
  return g;
}
export function grandPiano(S, x, z, {ry = 0, y = 0} = {}){
  const g = S.group(x, y, z, ry), lac = new T.MeshPhysicalMaterial({color: 0x050505, roughness: .08, clearcoat: 1, metalness: .1});
  const shape = new T.Shape(); shape.moveTo(-.75, 0); shape.lineTo(.75, 0); shape.lineTo(.75, -.8); shape.bezierCurveTo(.75, -1.9, .1, -1.5, -.05, -2.1); shape.lineTo(-.75, -2.1); shape.lineTo(-.75, 0);
  const body = new T.Mesh(new T.ExtrudeGeometry(shape, {depth: .3, bevelEnabled: false}), lac); body.rotation.x = Math.PI/2; body.position.y = 1.0; g.add(body);
  const lid = new T.Mesh(new T.ShapeGeometry(shape), lac); lid.rotation.set(Math.PI/2 - .5, 0, 0); lid.position.set(0, 1.02, 0); lid.rotation.order = 'XYZ'; g.add(lid); lid.position.y = 1.0; lid.rotateY(0);
  const keys = new T.Mesh(new T.BoxGeometry(1.4, .03, .16), M.std(0xf2efe8, .4)); keys.position.set(0, .75, .1); g.add(keys);
  for (let i = 0; i < 36; i++){ const k = new T.Mesh(new T.BoxGeometry(.018, .02, .09), M.std(0x080808, .4)); k.position.set(-.68 + i*.039, .77, .07); if (i % 7 !== 2 && i % 7 !== 6) g.add(k); }
  for (const [lx, lz] of [[-.65, -.05], [.65, -.05], [-.5, -1.9]]){ const l = new T.Mesh(new T.CylinderGeometry(.05, .04, .7, 10), lac); l.position.set(lx, .35, lz); g.add(l); }
  const bench = new T.Mesh(new T.BoxGeometry(.8, .45, .35), lac); bench.position.set(0, .225, .55); g.add(bench);
  S.blockAround(g, .1);
  return g;
}
export function uprightBass(S, x, z, {ry = 0, y = 0} = {}){
  const g = S.group(x, y, z, ry), wood = new T.MeshPhysicalMaterial({color: 0x7a3a12, roughness: .25, clearcoat: .8});
  const pts = [[0, 0], [.28, .05], [.32, .25], [.22, .5], [.27, .75], [.24, .95], [.12, 1.05], [0, 1.08]].map(p => new T.Vector2(...p));
  const body = new T.Mesh(new T.LatheGeometry(pts, 24), wood); body.scale.z = .45; body.position.y = .15; g.add(body);
  const neck = new T.Mesh(new T.BoxGeometry(.06, .85, .05), M.std(0x111111, .4)); neck.position.y = 1.55; g.add(neck);
  const scroll = new T.Mesh(new T.TorusGeometry(.04, .015, 6, 12), wood); scroll.position.y = 2.0; g.add(scroll);
  const pin = new T.Mesh(new T.CylinderGeometry(.01, .01, .15, 6), M.chrome()); pin.position.y = .07; g.add(pin);
  g.rotation.z = .12;
  return g;
}
export function micStand(S, x, z, y = 0){ const g = S.group(x, y, z); const p = new T.Mesh(new T.CylinderGeometry(.01, .01, 1.5, 6), M.chrome()); p.position.y = .75; g.add(p); const b = new T.Mesh(new T.CylinderGeometry(.15, .15, .02, 16), M.blackMetal()); g.add(b); const m = new T.Mesh(new T.SphereGeometry(.035, 10, 8), M.std(0x333333, .4, .6)); m.position.y = 1.52; g.add(m); return g; }
export function stanchions(S, pts, color = 0x9a1a2a){
  const rope = M.std(color, .8);
  pts.forEach((p, i) => { const post = S.cyl(.03, .03, 1, M.brass(), p[0], .5, p[1], {seg: 10}); S.cyl(.15, .17, .03, M.brass(), p[0], .015, p[1]); S.mesh(new T.SphereGeometry(.05, 10, 8), M.brass(), p[0], 1.02, p[1]);
    if (i){ const a = new T.Vector3(pts[i - 1][0], .92, pts[i - 1][1]), b = new T.Vector3(p[0], .92, p[1]), mid = a.clone().lerp(b, .5); mid.y -= .18; const curve = new T.QuadraticBezierCurve3(a, mid, b); S.mesh(new T.TubeGeometry(curve, 16, .025, 8), rope); } });
}
export function jukebox(S, x, z, ry = 0){
  const g = S.group(x, 0, z, ry);
  const body = new T.Mesh(new T.BoxGeometry(.8, 1.2, .55), M.std(0x6a1a12, .4, .2)); body.position.y = .6; g.add(body);
  const top = new T.Mesh(new T.CylinderGeometry(.4, .4, .55, 24, 1, false, -Math.PI/2, Math.PI), new T.MeshStandardMaterial({color: 0xff7a2a, emissive: 0xff5a10, emissiveIntensity: 1.6})); top.rotation.x = Math.PI/2; top.rotation.z = Math.PI/2; top.position.y = 1.2; g.add(top);
  top.rotation.set(0, 0, 0); top.rotation.x = Math.PI/2; top.rotation.y = 0;
  const arch = new T.Mesh(new T.TorusGeometry(.33, .04, 8, 24, Math.PI), M.emissive(0xffc21a, 3)); arch.position.set(0, 1.2, .28); g.add(arch);
  const win = new T.Mesh(new T.PlaneGeometry(.5, .35), M.emissive(0xffd890, 1.5)); win.position.set(0, .95, .28); g.add(win);
  const L = new T.PointLight(0xff8a3a, 2.5, 3, 2); L.position.set(0, 1, .6); L.userData.prio = 2; g.add(L);
  S.blockAround(g, .1);
  return g;
}
export function curtain(S, x, z, w, h, {ry = 0, color = 0x0b0b0c} = {}){
  const geo = new T.PlaneGeometry(w, h, Math.floor(w*12), 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i)*9)*.06);
  geo.computeVertexNormals();
  return S.mesh(geo, M.std(color, .95, 0, {side: T.DoubleSide}), x, h/2, z, S.g, {ry, cast: false});
}
export function glassRail(S, x0, z0, x1, z1, {h = 1.05, brass = true} = {}){
  const a = new T.Vector3(x0, 0, z0), b = new T.Vector3(x1, 0, z1), L = a.distanceTo(b), ry = Math.atan2(x1 - x0, z1 - z0) - Math.PI/2;
  const g = S.group((x0 + x1)/2, 0, (z0 + z1)/2, ry);
  const top = new T.Mesh(new T.BoxGeometry(L, .05, .06), brass ? M.brass() : M.blackMetal()); top.position.y = h; g.add(top);
  const pane = new T.Mesh(new T.PlaneGeometry(L, h - .1), M.glass()); pane.position.y = (h - .1)/2 + .05; g.add(pane);
  const n = Math.max(1, Math.round(L/1.6)); for (let i = 0; i <= n; i++){ const p = new T.Mesh(new T.BoxGeometry(.05, h, .05), brass ? M.brass() : M.blackMetal()); p.position.set(-L/2 + i*L/n, h/2, 0); g.add(p); }
  return g;
}
