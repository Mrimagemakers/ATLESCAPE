// ATL Nightclub Mogul: the party crowd.
// Turn Up Music's Rocketbox partygoers (MIT, Microsoft) with motion-captured dances, cheers and conversations,
// plus five named Atlanta regulars whose body shapes and club outfits are made here.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

const BASE = new URL('assets/crowd/', import.meta.url).href;
const loader = new GLTFLoader();

export const AVATARS = {
  f: ['Female_Deep_01', 'Female_Deep_02', 'Female_Deep_03', 'Female_Deep_05', 'Female_Deep_06', 'Female_Deep_07', 'Female_Party_01', 'Female_Party_02',
      'Female_Latina_01', 'Female_Latina_03', 'Female_Adult_05', 'Female_Adult_11', 'Pilot_Female_02'],
  m: ['Male_Deep_01', 'Male_Deep_02', 'Male_Adult_04', 'Male_Adult_09', 'Male_Adult_12', 'Male_Adult_18', 'Male_Latino_01', 'Male_Latino_02', 'Business_Male_02', 'Male_Adult_15']
};

/* The five Atlanta regulars. shape: hips, seat (round rear), thighs, waist (cinch), bust; 0..1.
   outfit: the fitted club look painted over the avatar's clothes (skin stays untouched). */
export const REGULARS = [
  {key: 'imani',  name: 'Imani Brooks',   base: 'Female_Deep_01', height: 1.68, shape: {hips: .95, seat: .95, thighs: .85, waist: .7, bust: .85}, outfit: {color: '#c8102e', sheen: .55, label: 'red bodycon dress'}},
  {key: 'keisha', name: 'Keisha Monroe',  base: 'Female_Deep_02', height: 1.72, shape: {hips: .8, seat: .85, thighs: .9, waist: .55, bust: 1}, outfit: {color: '#d4a637', sheen: .8, label: 'gold satin wrap dress'}},
  {key: 'tasha',  name: 'Tasha Greene',   base: 'Female_Deep_03', height: 1.63, shape: {hips: 1, seat: 1, thighs: 1, waist: .6, bust: .7}, outfit: {color: '#0f6b4f', sheen: .5, label: 'emerald fitted set'}},
  {key: 'brielle',name: 'Brielle Carter', base: 'Female_Deep_07', height: 1.70, shape: {hips: .7, seat: .75, thighs: .7, waist: .8, bust: .9}, outfit: {color: '#5b2a86', sheen: .65, label: 'plum fitted dress'}},
  {key: 'jada',   name: 'Jada Freeman',   base: 'Pilot_Female_02', height: 1.66, shape: {hips: .9, seat: .9, thighs: .95, waist: .65, bust: .95}, outfit: {color: '#111014', sheen: .7, label: 'black leather-look set'}}
];

/* ------------------------------------------------------------ motion capture */
let clipsPromise;
function buildClips(pack){
  const b64 = (s, A) => new A(Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer), out = {};
  for (const [name, c] of Object.entries(pack)){
    out[name] = new T.AnimationClip(name, c.d, c.tr.map(t => {
      const times = new Float32Array(t.k); for (let i = 0; i < t.k; i++) times[i] = t.t0 + i*t.dt;
      if (t.p === 'quaternion'){
        const q = b64(t.q, Int16Array), v = new Float32Array(q.length);
        for (let i = 0; i < q.length; i += 4){ const x = q[i]/32767, y = q[i+1]/32767, z = q[i+2]/32767, w = q[i+3]/32767, l = Math.hypot(x, y, z, w) || 1; v[i] = x/l; v[i+1] = y/l; v[i+2] = z/l; v[i+3] = w/l; }
        return new T.QuaternionKeyframeTrack(t.n + '.quaternion', times, v);
      }
      // keep the dancer on their spot: hips may bob and sway, but not wander across the room
      const v = b64(t.f, Float32Array), x0 = v[0], z0 = v[2];
      for (let i = 0; i < v.length; i += 3){ v[i] = x0 + (v[i] - x0)*.25; v[i+2] = z0 + (v[i+2] - z0)*.25; }
      return new T.VectorKeyframeTrack(t.n + '.position', times, v);
    }));
  }
  return out;
}
export function loadClips(){
  return clipsPromise ||= Promise.all(['moves_f.json', 'moves_m.json'].map(f => fetch(BASE + f).then(r => { if (!r.ok) throw new Error(f); return r.json(); })))
    .then(([f, m]) => ({f: buildClips(f), m: buildClips(m)}));
}

/* ------------------------------------------------------------ avatars */
const sources = new Map();
function loadSource(name){
  if (!sources.has(name)) sources.set(name, loader.loadAsync(BASE + name + '.glb').then(g => {
    g.scene.traverse(o => { if (o.isMesh){ o.frustumCulled = false; o.castShadow = true; if (o.material?.map) o.material.map.anisotropy = 4; } });
    return g.scene;
  }).catch(e => { sources.delete(name); throw e; }));
  return sources.get(name);
}

/* Reshape the bind-pose body so the curves move with every dance.
   Works in the body's own frame (pelvis, spine and thigh bones), only on vertices driven by the torso and legs. */
const TORSO = /Pelvis|Spine$|Spine1|Spine2|Thigh|Calf/;   // names arrive as Bip01_L_Thigh
export function shapeBody(root, s){
  root.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !/body/i.test([].concat(mesh.material)[0]?.name || mesh.name)) return;
    const bones = mesh.skeleton.bones, at = n => { const i = bones.findIndex(b => b.name.replace(/_/g, ' ').endsWith(n)); return i < 0 ? null : new T.Vector3().setFromMatrixPosition(mesh.skeleton.boneInverses[i].clone().invert()); };
    const pelvis = at('Pelvis'), chest = at('Spine2'), lT = at('L Thigh'), rT = at('R Thigh'), lC = at('L Calf');
    if (!pelvis || !chest || !lT || !rT) return;
    const up = chest.clone().sub(pelvis), S = up.length(); up.normalize();
    const lat = lT.clone().sub(rT); lat.addScaledVector(up, -lat.dot(up)).normalize();
    const fwd = new T.Vector3().crossVectors(lat, up).normalize();
    // the front of the body is where the toes point
    const toe = at('L Toe0'); if (toe && toe.clone().sub(lC || lT).dot(fwd) < 0) fwd.negate();
    const thighOff = lT.clone().sub(pelvis).dot(lat);
    const g = (h, c, w) => Math.exp(-(((h - c)/w)**2));
    const geo = mesh.geometry = mesh.geometry.clone(), P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight;
    const torsoBone = bones.map(b => TORSO.test(b.name)), v = new T.Vector3(), r = new T.Vector3();
    for (let i = 0; i < P.count; i++){
      let k = 0; for (let j = 0; j < 4; j++) if (torsoBone[SI.getComponent(i, j)]) k += SW.getComponent(i, j);
      if (k < .02) continue;
      v.fromBufferAttribute(P, i); r.copy(v).sub(pelvis);
      const h = r.dot(up)/S, l = r.dot(lat), f = r.dot(fwd);
      let dl = 0, df = 0;
      // hips and seat, centered just below the pelvis
      const hip = g(h, -.12, .32);
      dl += l*.30*s.hips*hip;
      if (f < 0) df += f*(.55*s.seat*g(h, -.2, .26)) - .045*S*s.seat*g(h, -.18, .2);
      // thighs, around each leg's own axis
      const th = g(h, -.62, .32)*(h < .05 ? 1 : 0);
      const cl = Math.sign(l)*thighOff;
      dl += (l - cl)*.28*s.thighs*th + cl*.08*s.thighs*th; df += f*.22*s.thighs*th;
      // waist, cinched between ribs and hips
      const w = g(h, .5, .17);
      dl -= l*.2*s.waist*w; df -= f*.14*s.waist*w;
      // bust, forward and a little outward
      if (f > 0){ const b = g(h, .93, .17); df += f*.55*s.bust*b + .03*S*s.bust*b; dl += l*.08*s.bust*b; }
      v.addScaledVector(lat, dl*k).addScaledVector(fwd, df*k);
      P.setXYZ(i, v.x, v.y, v.z);
    }
    P.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  });
}

/* Paint a fitted club outfit over the avatar's clothes. Skin is found from the face texture and kept. */
const paintCache = new Map();
export function paintOutfit(root, outfit, key){
  let body, head;
  root.traverse(o => { if (!o.isMesh) return; const n = [].concat(o.material)[0]?.name || ''; if (/body/i.test(n)) body = o; if (/head/i.test(n)) head = o; });
  if (!body?.material?.map?.image) return;
  const id = key + ':' + outfit.color;
  let tex = paintCache.get(id);
  if (!tex){
    const img = body.material.map.image, W = img.width, H = img.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, W, H), d = data.data;
    // skin reference: the middle of the face texture
    const skin = [0, 0, 0];
    if (head?.material?.map?.image){
      const hi = head.material.map.image, hc = document.createElement('canvas'); hc.width = 64; hc.height = 64; const hx = hc.getContext('2d'); hx.drawImage(hi, 0, 0, 64, 64);
      const hd = hx.getImageData(16, 20, 32, 28).data; let n = 0;
      for (let i = 0; i < hd.length; i += 4){ const s = hd[i] + hd[i+1] + hd[i+2]; if (s > 60 && hd[i] > hd[i+2]){ skin[0] += hd[i]; skin[1] += hd[i+1]; skin[2] += hd[i+2]; n++; } }
      if (n) for (let k = 0; k < 3; k++) skin[k] /= n;
    }
    const target = new T.Color(outfit.color), tr = target.r*255, tg = target.g*255, tb = target.b*255;
    for (let i = 0; i < d.length; i += 4){
      const r = d[i], g = d[i+1], b = d[i+2];
      const ds = Math.hypot(r - skin[0], g - skin[1], b - skin[2]);
      const skinLike = ds < 46 || (r > g && g > b && r - b > 18 && r - b < 110 && Math.abs((r - g) - (g - b)*1.2) < 30 && ds < 70);
      if (skinLike) continue;
      const lum = (r*.3 + g*.59 + b*.11)/255;
      // keep folds and seams: shade the new colour by the old brightness, plus a soft satin highlight
      const shade = .45 + lum*1.1, hl = Math.max(0, lum - .5)*outfit.sheen*90;
      d[i] = Math.min(255, tr*shade + hl); d[i+1] = Math.min(255, tg*shade + hl); d[i+2] = Math.min(255, tb*shade + hl);
    }
    x.putImageData(data, 0, 0);
    tex = new T.CanvasTexture(c); tex.flipY = body.material.map.flipY; tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    paintCache.set(id, tex);
  }
  body.material = body.material.clone(); body.material.map = tex;
  if ('roughness' in body.material) body.material.roughness = 1 - outfit.sheen*.45;
  body.material.needsUpdate = true;
}

const regularSources = new Map();
async function regularSource(r){
  if (!regularSources.has(r.key)) regularSources.set(r.key, loadSource(r.base).then(src => {
    const m = cloneSkeleton(src);
    m.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(x => x.clone()) : o.material.clone(); });
    shapeBody(m, r.shape); paintOutfit(m, r.outfit, r.key); return m;
  }));
  return regularSources.get(r.key);
}

/* ------------------------------------------------------------ one partygoer */
const CLIP = {dance: ['dance1', 'dance2', 'dance3', 'dance4'], cheer: ['cheer', 'dance2'], talk: ['talk'], idle: ['idle', 'talk'], dj: ['dance2'], sit: ['sit']};
export async function makePartygoer({gender = 'f', avatar, regular, behavior = 'dance', height, seed = Math.random()} = {}){
  const clips = (await loadClips())[gender === 'm' ? 'm' : 'f'];
  let m;
  if (regular){ const r = REGULARS.find(x => x.key === regular); m = cloneSkeleton(await regularSource(r)); height ??= r.height; }
  else m = cloneSkeleton(await loadSource(avatar || AVATARS[gender][Math.floor(seed*AVATARS[gender].length) % AVATARS[gender].length]));
  // size the person to the requested height
  m.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(m, true), h0 = box.max.y - box.min.y;
  if (height && h0 > .5) m.scale.multiplyScalar(height/h0);
  const mixer = new T.AnimationMixer(m), list = CLIP[behavior] || CLIP.idle;
  let i = Math.floor(seed*97) % list.length, action = mixer.clipAction(clips[list[i]] || clips.idle);
  action.play(); action.time = seed*action.getClip().duration; action.timeScale = .92 + (seed*13 % 1)*.16;
  let next = 10 + seed*12;
  return {
    root: m, mixer, behavior,
    update(dt){
      mixer.update(dt);
      // dancers change it up every so often, with a smooth crossfade
      if (list.length > 1 && (next -= dt) <= 0){
        next = 12 + Math.random()*14; i = (i + 1 + Math.floor(Math.random()*(list.length - 1))) % list.length;
        const a = mixer.clipAction(clips[list[i]] || clips.idle); a.reset(); a.timeScale = .92 + Math.random()*.16; a.play(); action.crossFadeTo(a, 1.2, false); action = a;
      }
    },
    dispose(){ mixer.stopAllAction(); m.traverse(o => o.skeleton?.dispose()); }
  };
}

window.ATLCrowd = {AVATARS, REGULARS, makePartygoer, loadClips, shapeBody, paintOutfit};
