// ATL Nightclub Mogul: the bridge between the Mogul jobs and the ATL 3D venues.
// The Mogul code was written for Turn Up Music's lounge; this gives it the same things to work with here:
// the scene and camera, moving you to your post, people to serve and fight, things to tap, bursts of confetti.
// World ids follow Turn Up Music: "club" is Club Mogul (where the jobs are worked), "atlantic" is The Atlantic.
'use strict';

const Lounge = {
  WORLDS: [],
  jobSlots: [], clickables: [], grabbables: [], notes: [], surfaces: {},
  buildingWorld: null, userLooked: false, standing: true, camRoll: 0, camLift: 0, glide: null,
  peopleSet: {mode: 'real', list: []}, dj: null, esApi: null, mode: 'vr',
  atlId(id){ return id === 'club' ? 'mogul' : id === 'atlantic' ? 'club' : id; },
  tumId(id){ return id === 'mogul' ? 'club' : id === 'club' ? 'atlantic' : id; },
  // the people in the room: whoever a job brought in, plus the venue's own crowd (the bar regulars take orders)
  get slots(){
    const w = window.ATLVenue && ATLVenue.world, ppl = (w && w.S && w.S.people) || [];
    if (this._crowdFor !== ppl || this._crowdN !== ppl.length){ this._crowdFor = ppl; this._crowdN = ppl.length; this._crowd = ppl.map(pg => ({p: pg.root, real: pg.root, mixer: pg.mixer, behavior: pg.behavior, world: this.worldId, crowd: true, frozen: true, clips: null})); }
    return [...this.jobSlots, ...(this._crowd || [])];
  },
  set slots(v){ this.jobSlots = (v || []).filter(s => !s.crowd); },
  get built(){ return !!(window.ATLVenue && ATLVenue.current && ATLVenue.world); },
  get worldId(){ return window.ATLVenue && ATLVenue.current ? this.tumId(ATLVenue.current) : null; },
  get worlds(){ const id = this.worldId, w = window.ATLVenue && ATLVenue.world; return id && w ? {[id]: {group: w.group || ATLVenue.scene, floorY: 0, decorated: true}} : {}; },
  get scene(){ return ATLVenue.scene; },
  get camera(){ return ATLVenue.camera; },
  get renderer(){ return ATLVenue.renderer; },
  get yaw(){ return ATLVenue.camera ? ATLVenue.camera.rotation.y : 0; },
  set yaw(v){ if (ATLVenue.camera) ATLVenue.camera.rotation.y = v; },
  get pitch(){ return ATLVenue.camera ? ATLVenue.camera.rotation.x : 0; },
  set pitch(v){ if (ATLVenue.camera) ATLVenue.camera.rotation.x = v; },
  get xrCtls(){ try{ const r = ATLVenue.renderer; return r && r.xr.isPresenting ? [0, 1].map(i => r.xr.getController(i)) : []; }catch(e){ return []; } },
  get listener(){ if (!this._listener && ATLVenue.camera){ this._listener = new THREE.AudioListener(); ATLVenue.camera.add(this._listener); } return this._listener; },
  // the player's feet: the camera stands 1.7 m above them
  rig: {position: null},
  get AVATARS(){
    if (!this._av){ this._av = {}; const C = window.ATLCrowd; if (C){ for (const n of C.AVATARS.f) this._av[n] = 'f'; for (const n of C.AVATARS.m) this._av[n] = 'm'; }
      for (const n of (typeof AV_NAMES !== 'undefined' ? AV_NAMES : [])) if (!this._av[n]) this._av[n] = /Female/.test(n) ? 'f' : 'm'; }
    return this._av;
  },
  get glowT(){
    if (!this._glow){ const [c, x] = Tex.canvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); this._glow = Tex.make(c); }
    return this._glow;
  },

  /* where you are and where you look */
  headPos(v = new THREE.Vector3()){
    const r = ATLVenue.renderer, cam = r && r.xr.isPresenting ? r.xr.getCamera() : ATLVenue.camera;
    cam.updateMatrixWorld(true); return v.setFromMatrixPosition(cam.matrixWorld);
  },
  headYaw(){ const r = ATLVenue.renderer, cam = r && r.xr.isPresenting ? r.xr.getCamera() : ATLVenue.camera, d = new THREE.Vector3(); cam.getWorldDirection(d); return Math.atan2(-d.x, -d.z); },
  floorAt(x, z){ return ATLVenue.floorAt(x, z) || 0; },
  moveTo(x, z, opts = {}){
    const cam = ATLVenue.camera; if (!cam) return;
    const y = (opts.y != null ? opts.y : this.floorAt(x, z)) + 1.7;
    if (this.renderer && this.renderer.xr.isPresenting){
      // in a headset the room moves you: shift the rig so your head lands over the spot
      const head = this.headPos(), rig = cam.parent;
      if (rig){ rig.position.x += x - head.x; rig.position.z += z - head.z; rig.position.y = y - 1.7; }
    } else if (opts.instant){ cam.position.set(x, y, z); this.glide = null; }
    else this.glide = {from: cam.position.clone().setY(cam.position.y - 1.7), to: new THREE.Vector3(x, y - 1.7, z), t: 0};
    try{ ATLVenue.clearMovement(); }catch(e){}
    this.standing = true;
  },
  goToBooth(){ this.moveTo(0, -12.35, {instant: true}); this.yaw = Math.PI; },
  chooseWorld(id){
    const atl = this.atlId(id);
    document.querySelector('#venues')?.scrollIntoView({block: 'start', behavior: 'smooth'});
    if (ATLVenue.current !== atl) ATLVenue.open(atl);
  },
  setWorld(id){ this.chooseWorld(id); },

  /* people: the same Rocketbox cast and moves as the crowd, brought in for a job */
  person(parent, x, y, z, ry, behavior = 'dance', opts = {}){
    const T = THREE, p = new T.Group(); p.position.set(x, y, z); p.rotation.y = ry; parent.add(p);
    const slot = {home: p.position.clone(), p, behavior, world: this.buildingWorld || this.worldId, speed: opts.speed || 1.2, gender: opts.gender, avatar: opts.avatar, clip: opts.clip, sync: opts.sync, fade: 0};
    p.userData.slot = slot; this.jobSlots.push(slot);
    const C = window.ATLCrowd, have = C ? [...C.AVATARS.f, ...C.AVATARS.m] : [];
    const gender = opts.gender || (opts.avatar && this.AVATARS[opts.avatar]) || (Math.random() < .6 ? 'f' : 'm');
    const avatar = have.includes(opts.avatar) ? opts.avatar : undefined;
    if (C) Promise.all([C.makePartygoer({gender, avatar, behavior: behavior === 'walk' ? 'idle' : behavior, height: gender === 'm' ? rnd(1.74, 1.88) : rnd(1.6, 1.72)}), C.loadClips()]).then(([pg, clips]) => {
      if (!this.jobSlots.includes(slot)){ pg.dispose(); return; }
      const m = pg.root; p.add(m);
      m.traverse(o => { if (o.isMesh){ o.material = Array.isArray(o.material) ? o.material.map(q => q.clone()) : o.material.clone(); for (const q of [].concat(o.material)){ q.userData.baseOpacity = q.opacity; q.transparent = true; q.opacity = 0; } } });
      const CL = clips[gender === 'm' ? 'm' : 'f'];
      let name = slot.clip || {dance: 'dance1', dj: 'dance2', walk: 'walk', idle: 'idle', talk: 'talk', sit: 'sit', cheer: 'cheer'}[behavior] || 'idle'; if (!CL[name]) name = 'idle';
      pg.mixer.stopAllAction(); const action = pg.mixer.clipAction(CL[name]); action.play(); action.time = slot.sync ? 0 : Math.random()*CL[name].duration;
      Object.assign(slot, {real: m, mixer: pg.mixer, action, clips: CL, pg});
      if (!this.blobGeo){ const [c, x] = Tex.canvas(128, 128), g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); this.blobMat = new T.MeshBasicMaterial({map: Tex.make(c), transparent: true, depthWrite: false}); this.blobGeo = new T.PlaneGeometry(.9, .9).rotateX(-Math.PI/2); }
      if (behavior !== 'sit'){ const blob = new T.Mesh(this.blobGeo, this.blobMat); blob.position.y = .012; blob.renderOrder = -1; p.add(blob); }
    }).catch(e => console.warn('Mogul person', e));
    return p;
  },
  unstickSlot(){}, groundSlot(){},
  npcBones(s){
    if (s.tb) return s.tb; if (!s.real) return null; const b = {}; s.real.traverse(o => { if (o.isBone){ const n = o.name; if (/Head$/.test(n)) b.head = o; else if (/Spine2$/.test(n)) b.chest = o; else if (/Pelvis$/.test(n)) b.pelvis = o; } });
    return s.tb = (b.head && b.chest && b.pelvis) ? b : null;
  },
  touchDist(s, hp){ const B = this.npcBones(s); if (!B) return 9; const v = new THREE.Vector3();
    return Math.min(B.head.getWorldPosition(v).distanceTo(hp) - .05, B.chest.getWorldPosition(v).distanceTo(hp) - .1, B.pelvis.getWorldPosition(v).distanceTo(hp) - .1); },
  // someone turns to look at you
  npcReact(s, from){
    const now = performance.now(); if (s.touchT && now - s.touchT < 1100) return; s.touchT = now;
    if (s.behavior === 'walk' || !from) return;
    if (s.baseRy === undefined) s.baseRy = s.p.rotation.y;
    const lp = s.p.parent ? s.p.parent.worldToLocal(from.clone()) : from.clone();
    s.faceYaw = Math.atan2(lp.x - s.p.position.x, lp.z - s.p.position.z); s.faceT = 3;
  },
  // performer moves layered over the recorded animation: bend a few joints toward where they should point
  _ov: null,
  ovInit(){ if (!this._ov){ const T = THREE; this._ov = {a: new T.Vector3(), b: new T.Vector3(), q: new T.Quaternion(), q1: new T.Quaternion(), q2: new T.Quaternion(), q3: new T.Quaternion(), id: new T.Quaternion()}; } return this._ov; },
  ovBones(s){ if (s.ovB) return s.ovB; const b = {}; s.real.traverse(o => { if (o.isBone) b[o.name.replace(/^Bip01[ _]/, '').replace(/_/g, ' ')] = b[o.name.replace(/^Bip01[ _]/, '')] = o; }); return s.ovB = b; },
  ovApply(bone, qw){ const V = this.ovInit(); bone.getWorldQuaternion(V.q1); bone.parent.getWorldQuaternion(V.q2); V.q2.invert(); V.q3.copy(qw).multiply(V.q1); bone.quaternion.copy(V.q2.multiply(V.q3)); bone.updateMatrixWorld(true); },
  ovRot(bone, axis, ang){ if (!bone) return; const V = this.ovInit(); V.q.setFromAxisAngle(axis, ang); this.ovApply(bone, V.q); },
  ovAim(bone, child, dir, w = 1){
    if (!bone || !child) return; const V = this.ovInit();
    bone.getWorldPosition(V.a); child.getWorldPosition(V.b); V.b.sub(V.a).normalize();
    V.q.setFromUnitVectors(V.b, dir); if (w < 1) V.q.slerp(V.id, 1 - w);
    this.ovApply(bone, V.q);
  },

  /* things you can tap (or point at in VR) and things you can pick up */
  addClickable(mesh, fn){ mesh.userData.onClick = fn; this.clickables.push(mesh); },
  grabbable(obj, opts = {}){ obj.updateMatrixWorld(true); obj.userData.grab = Object.assign({world: this.buildingWorld || this.worldId, home: obj.position.clone(), homeQ: obj.quaternion.clone(), homeParent: obj.parent, vel: new THREE.Vector3(), spin: new THREE.Vector3(), resting: true, held: null, upright: true, bounce: .25, hist: []}, opts); this.grabbables.push(obj); return obj; },
  surface(mesh){ const w = this.buildingWorld || this.worldId; (this.surfaces[w] || (this.surfaces[w] = [])).push(mesh); return mesh; },
  release(o){ const gd = o.userData.grab; if (!gd) return; (this.worlds[gd.world] ? this.worlds[gd.world].group : this.scene).attach(o); gd.held = null; gd.resting = true; },
  grabEnd(ctl){ const o = ctl && ctl.userData.holding; if (!o) return; ctl.userData.holding = null; this.release(o); },
  haptic(ctl, strength, ms){ try{ const g = ctl.userData.source && ctl.userData.source.gamepad; const a = g && g.hapticActuators && g.hapticActuators[0]; if (a) a.pulse(strength, ms); }catch(e){} },

  /* a burst of sparkles from a spot (a good pour, a knockout, a sold-out night) */
  burst(worldPos, n = 12, kind){
    const T = THREE, foam = kind === 'foam', cols = [0xffc21a, 0xff4fd8, 0x4de1ff, 0xffffff];
    for (let i = 0; i < n; i++){
      const s = new T.Sprite(new T.SpriteMaterial({map: this.glowT, color: foam ? 0xfff8e6 : cols[i % cols.length], transparent: true, depthWrite: false, blending: T.AdditiveBlending}));
      s.position.copy(worldPos); const size = foam ? rnd(.02, .05) : rnd(.12, .26); s.scale.set(size, size, 1);
      s.userData = {v: new T.Vector3(rnd(-1, 1), rnd(.6, 2), rnd(-1, 1)), age: 0, life: rnd(1.6, 2.8), spin: rnd(-1, 1)};
      this.scene.add(s); this.notes.push(s);
    }
  },

  /* every frame of the venue */
  frame(dt){
    const cam = ATLVenue.camera; if (!cam) return;
    if (!this.rig.position) this.rig.position = new THREE.Vector3();
    if (this.glide){
      const g = this.glide; g.t = Math.min(1, g.t + dt*1.6); const k = g.t*g.t*(3 - 2*g.t);
      cam.position.set(g.from.x + (g.to.x - g.from.x)*k, g.from.y + (g.to.y - g.from.y)*k + 1.7, g.from.z + (g.to.z - g.from.z)*k);
      if (g.t >= 1) this.glide = null;
    }
    this.rig.position.set(cam.position.x, cam.position.y - 1.7 - (this.camLift || 0), cam.position.z);
    for (const s of this.jobSlots){
      if (!s.real) continue;
      if (s.fade < 1){ s.fade = Math.min(1, s.fade + dt*1.5); s.real.traverse(o => { if (o.isMesh) for (const q of [].concat(o.material)){ q.opacity = (q.userData.baseOpacity ?? 1)*s.fade; if (s.fade >= 1) q.transparent = q.userData.baseOpacity < 1; } }); }
      if (s.mixer && !s.frozen) s.mixer.update(dt);
      if (s.faceT > 0){ s.faceT -= dt; const want = s.faceT > 0 ? s.faceYaw : s.baseRy; let d = want - s.p.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); s.p.rotation.y += d*Math.min(1, dt*5); }
    }
    for (let i = this.notes.length - 1; i >= 0; i--){
      const s = this.notes[i], u = s.userData; u.age += dt;
      s.position.addScaledVector(u.v, dt); u.v.y -= dt*.8; s.material.rotation += u.spin*dt; s.material.opacity = Math.max(0, 1 - u.age/u.life);
      if (u.age >= u.life){ s.removeFromParent(); s.material.dispose(); this.notes.splice(i, 1); }
    }
    try{ Mogul.update(dt); }catch(e){ console.warn('Mogul', e); }
  },
  // a tap or a VR trigger: the Mogul panel floating in VR first, then the job's own things in the room
  tap(ray){
    try{ if (Mogul.pressRay(ray.ray.origin, ray.ray.direction)) return true; }catch(e){}
    const list = this.clickables.filter(o => o.parent); if (!list.length) return false;
    const hit = ray.intersectObjects(list, true)[0]; if (!hit || hit.distance > 12) return false;
    for (let o = hit.object; o; o = o.parent) if (o.userData.onClick){ o.userData.onClick(hit); return true; }
    return false;
  },
  // leaving a venue drops everyone and everything the jobs brought in
  reset(){
    for (const s of this.jobSlots){ try{ s.pg && s.pg.dispose(); }catch(e){} }
    this.jobSlots = []; this._crowd = null; this._crowdFor = null; this.clickables = []; this.grabbables = []; this.notes = []; this.surfaces = {}; this.glide = null; this._listener = null;
  }
};

(function hook(){
  if (!window.ATLVenue){ setTimeout(hook, 200); return; }
  ATLVenue.frameHooks.push(dt => Lounge.frame(dt));
  ATLVenue.tapHooks.unshift(ray => Lounge.tap(ray));
  ATLVenue.enterHooks.push(() => { Lounge.reset(); try{ if (Mogul.on && Mogul.view === 'game' && Mogul.game && !Mogul.game.anyWorld && Lounge.worldId !== 'club') Mogul.quitGame(); }catch(e){} try{ if (Mogul.mesh) Mogul.mesh = null; }catch(e){} });
})();
