// ATL Nightclub Mogul: real dancing for the Meshy characters.
// Retargets Turn Up Music's motion-captured dances (Rocketbox Bip01 skeleton) onto the Mixamo staff rigs
// and the simple guest rigs from nightlife-dance.js, then plays them back. Baked once per model and cached.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {loadClips} from './nightlife-crowd.js?v=sets1';

const FPS = 30;
const CROWD = new URL('assets/crowd/', import.meta.url).href;
const SOURCES = {f: 'Female_Deep_01', m: 'Male_Deep_01'};
const FEMALE = /simone|elena|camila|nia|priya/i;
// target bone (Mixamo name without prefix) -> source Biped bone
const MAP = {
  Hips: 'Pelvis', Spine: 'Spine', Spine1: 'Spine1', Spine2: 'Spine2', Neck: 'Neck', Head: 'Head',
  LeftShoulder: 'L Clavicle', LeftArm: 'L UpperArm', LeftForeArm: 'L Forearm', LeftHand: 'L Hand',
  RightShoulder: 'R Clavicle', RightArm: 'R UpperArm', RightForeArm: 'R Forearm', RightHand: 'R Hand',
  LeftUpLeg: 'L Thigh', LeftLeg: 'L Calf', LeftFoot: 'L Foot', LeftToeBase: 'L Toe0',
  RightUpLeg: 'R Thigh', RightLeg: 'R Calf', RightFoot: 'R Foot', RightToeBase: 'R Toe0'
};
// which child gives a limb its direction (to line up T-pose and A-pose rests)
const AIM = {LeftShoulder: 'LeftArm', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', RightShoulder: 'RightArm', RightArm: 'RightForeArm', RightForeArm: 'RightHand',
  LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', RightUpLeg: 'RightLeg', RightLeg: 'RightFoot'};
const DANCES = ['dance1', 'dance2', 'dance3', 'dance4', 'cheer'];

const tName = n => n.replace(/^mixamorig[:_]?/i, '');
const sName = n => n.replace(/_/g, ' ').replace(/^Bip01 /, '');

/* the Rocketbox source skeleton for each gender, posed by the clips */
const sourcePromises = {};
function source(g){
  return sourcePromises[g] ||= Promise.all([new GLTFLoader().loadAsync(CROWD + SOURCES[g] + '.glb'), loadClips()]).then(([gltf, clips]) => {
    const root = cloneSkeleton(gltf.scene); root.updateMatrixWorld(true);
    let skin; root.traverse(o => { if (o.isSkinnedMesh && !skin) skin = o; });
    const bones = {}; skin.skeleton.bones.forEach((b, i) => { bones[sName(b.name)] = {bone: b, rest: new T.Matrix4().multiplyMatrices(skin.matrixWorld, skin.skeleton.boneInverses[i].clone().invert())}; });
    return {root, bones, clips: clips[g], mixer: new T.AnimationMixer(root)};
  });
}

/* work out the target rig: its mapped bones, rest pose (from the bind) and alignment to the source rest */
function rigOf(hips){
  let skin, top = hips; while (top.parent && top.parent.isBone) top = top.parent;
  // the skinned mesh that uses this skeleton
  let root = top; while (root.parent) root = root.parent;
  root.traverse(o => { if (o.isSkinnedMesh && o.skeleton.bones.includes(hips) && !skin) skin = o; });
  if (!skin) return null;
  root.updateMatrixWorld(true);
  const bones = {};
  skin.skeleton.bones.forEach((b, i) => { const n = tName(b.name); if (MAP[n]) bones[n] = {bone: b, rest: new T.Matrix4().multiplyMatrices(skin.matrixWorld, skin.skeleton.boneInverses[i].clone().invert())}; });
  return {bones, skin, list: skin.skeleton.bones.filter(b => MAP[tName(b.name)])};
}

const bakes = new Map();
async function bake(key, hips, gender){
  if (bakes.has(key)) return bakes.get(key);
  const p = (async () => {
    const src = await source(gender), rig = rigOf(hips);
    if (!rig) throw new Error('no rig');
    const q = () => new T.Quaternion(), v = () => new T.Vector3(), d = (m) => { const p = v(), r = q(), s = v(); m.decompose(p, r, s); return {p, r}; };
    // rests in world space
    const tr = {}, sr = {}, align = {};
    for (const [n, b] of Object.entries(rig.bones)){ tr[n] = d(b.rest); const s = src.bones[MAP[n]]; if (s) sr[n] = d(s.rest); }
    for (const n of Object.keys(rig.bones)){
      align[n] = q();
      const c = AIM[n]; if (!c || !rig.bones[c] || !sr[n] || !src.bones[MAP[c]]) continue;
      const tDir = d(rig.bones[c].rest).p.sub(tr[n].p).normalize(), sDir = d(src.bones[MAP[c]].rest).p.sub(sr[n].p).normalize();
      align[n].setFromUnitVectors(tDir, sDir);
    }
    // a limb without its own aim (no hand bone on the guest rig) follows its parent's correction
    for (const n of ['LeftForeArm', 'RightForeArm', 'LeftLeg', 'RightLeg']) if (align[n] && align[n].equals(new T.Quaternion()) && rig.bones[n]){ const par = {LeftForeArm: 'LeftArm', RightForeArm: 'RightArm', LeftLeg: 'LeftUpLeg', RightLeg: 'RightUpLeg'}[n]; if (align[par]) align[n].copy(align[par]); }
    const restLocal = new Map(); rig.skin.skeleton.bones.forEach(b => restLocal.set(b, b.quaternion.clone()));
    const hipsBone = rig.bones.Hips?.bone, hipsRestPos = hipsBone?.position.clone();
    const srcPelvis = src.bones.Pelvis, srcY0 = d(srcPelvis.rest).p;
    const scale = tr.Hips ? tr.Hips.p.y/Math.max(.01, srcY0.y) : 1;
    const parentInv = hipsBone ? new T.Matrix3().setFromMatrix4(new T.Matrix4().copy(hipsBone.parent.matrixWorld).invert()) : null;
    const out = {};
    for (const name of DANCES){
      const clip = src.clips[name]; if (!clip) continue;
      src.mixer.stopAllAction(); const act = src.mixer.clipAction(clip); act.reset().play();
      const frames = Math.floor(clip.duration*FPS), tracks = {}, hipPos = new Float32Array(frames*3);
      for (const b of rig.list) tracks[tName(b.name)] = new Float32Array(frames*4);
      const world = new Map(), sq = q(), tmp = q(), dw = v();
      for (let f = 0; f < frames; f++){
        src.mixer.setTime(f/FPS); src.root.updateMatrixWorld(true);
        world.clear();
        const worldOf = b => { if (world.has(b)) return world.get(b); let w; if (b.parent && b.parent.isBone) w = worldOf(b.parent).clone().multiply(restLocal.get(b) || b.quaternion); else { const pq = q(); (b.parent || b).matrixWorld.decompose(v(), pq, v()); w = pq.multiply(restLocal.get(b) || b.quaternion); } world.set(b, w); return w; };
        for (const b of rig.list){
          const n = tName(b.name), s = src.bones[MAP[n]]; if (!s || !sr[n]) continue;
          s.bone.matrixWorld.decompose(v(), sq, v());
          const tw = sq.clone().multiply(tmp.copy(sr[n].r).invert()).multiply(align[n]).multiply(tr[n].r);
          let pw; if (b.parent && b.parent.isBone) pw = worldOf(b.parent); else { pw = q(); b.parent.matrixWorld.decompose(v(), pw, v()); }
          const local = pw.clone().invert().multiply(tw); world.set(b, tw);
          local.toArray(tracks[n], f*4);
        }
        if (hipsBone){ const sp = v().setFromMatrixPosition(srcPelvis.bone.matrixWorld); dw.copy(sp).sub(srcY0).multiplyScalar(scale).applyMatrix3(parentInv); hipPos.set([hipsRestPos.x + dw.x, hipsRestPos.y + dw.y, hipsRestPos.z + dw.z], f*3); }
      }
      out[name] = {frames, tracks, hipPos};
      // let the page breathe between clips
      await new Promise(r => setTimeout(r, 0));
    }
    src.mixer.stopAllAction();
    return out;
  })();
  bakes.set(key, p);
  return p;
}

/* replaces the old "sway from the ribs up" dancer: full-body motion capture, changing dances every so often */
const legacy = window.createVenueDancer;
window.createVenueDancer = function(joints, style = 0, phase = 0){
  const hips = joints?.Hips; if (!hips) return legacy ? legacy(joints, style, phase) : () => {};
  const model = joints.__model || '';
  const gender = FEMALE.test(model) ? 'f' : model ? 'm' : (style % 2 ? 'f' : 'm');
  let root = hips; while (root.parent) root = root.parent;
  let data = null, bones = null, failed = false;
  const fallback = legacy ? legacy(joints, style, phase) : () => {};
  // bake per model and rig: the Mixamo staff share a skeleton per model, the guests share the simple rig
  const key = (model || 'guest') + ':' + gender + ':' + (joints.LeftHand ? 'full' : 'simple');
  bake(key, hips, gender).then(d => {
    data = d; bones = {};
    let skin; root.traverse(o => { if (o.isSkinnedMesh && o.skeleton.bones.includes(hips) && !skin) skin = o; });
    for (const b of skin.skeleton.bones){ const n = tName(b.name); if (MAP[n]) bones[n] = b; }
  }).catch(e => { failed = true; console.warn('mocap retarget', e); });
  const order = DANCES.slice(0, 4).sort(() => Math.random() - .5);
  let i = style % order.length, cur = order[i], clipStart = null, speed = 1 + Math.random()*.15;
  return time => {
    if (!data){ fallback(time); return; }
    if (clipStart === null) clipStart = time - phase*3.7;
    let c = data[cur] || data[order[0]];
    let f = Math.floor((time - clipStart)*FPS*speed);
    if (f >= c.frames || f < 0){ // next dance, now and then a cheer with hands up
      i = (i + 1) % order.length; clipStart = time; speed = 1 + Math.random()*.15;
      cur = Math.random() < .3 && data.cheer ? 'cheer' : order[i]; c = data[cur]; f = 0;
    }
    const k = Math.min(f, c.frames - 1);
    for (const n in c.tracks){ const b = bones[n]; if (b) b.quaternion.fromArray(c.tracks[n], k*4); }
    if (bones.Hips) bones.Hips.position.fromArray(c.hipPos, k*3);
  };
};
