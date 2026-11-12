(() => {
  'use strict';

  const mb = window.mindblown;
  const $ = (id) => document.getElementById(id);
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage may be blocked */ } }
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const rand = (() => { let s = 88172645; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); }; })();

  let W = window.innerWidth, H = window.innerHeight;
  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const mobile = coarse;
  if (coarse) document.body.classList.add('touch');

  const ATL = window.ATL;
  const P = { schemaVersion: 2, cash: 0, rep: 0, heat: 0, owned: [], done: {}, tracks: {}, gigs: 0, escapes: 0, won: false, best: 0, district: 'westend', helpSeen: false, level: 1, bestSeconds: 0 };
  let loadedProgress = null;

  const DEFAULT_TUNE = {
    survive_seconds: 90, run_speed: 7.6, obstacle_gap: 1.0, cop_pressure: 1.0,
    exposure: 1.3, lamp: '#E28A34', police_blue: '#2E6BFF', police_red: '#D8322E'
  };
  let tune = { ...DEFAULT_TUNE };

  async function loadTune() {
    let raw = null;
    try {
      const values = mb && mb.tune ? await mb.tune() : null;
      if (values) raw = values;
    } catch (e) { /* ignore */ }
    if (!raw) {
      try {
        const fromFile = await fetch('tune.json').then((r) => r.json());
        raw = Object.fromEntries(Object.entries(fromFile).map(([k, v]) => [k, v.value]));
      } catch (e) { raw = null; }
    }
    if (raw) {
      for (const k of Object.keys(tune)) {
        if (raw[k] !== undefined) tune[k] = raw[k];
      }
    }
  }

  async function loadProgress() {
    if (!mb || !mb.load) return;
    try {
      const r = await mb.load('empire');
      if (r && r.value && typeof r.value === 'object') Object.assign(P, r.value);
      if (!Array.isArray(P.owned)) P.owned = [];
      if (!P.done || typeof P.done !== 'object') P.done = {};
      if (!P.tracks || typeof P.tracks !== 'object') P.tracks = {};
      loadedProgress = r;
    } catch (e) { /* first visit */ }
  }

  async function saveProgress() {
    if (!mb || !mb.save) return;
    try {
      const opts = loadedProgress && loadedProgress.revision
        ? { ifRevision: loadedProgress.revision, binding: loadedProgress.binding } : undefined;
      const r = await mb.save('empire', { ...P }, opts);
      if (r) loadedProgress = r;
    } catch (e) {
      if (e && e.reason === 'REVISION_CONFLICT' && e.current) {
        // keep whichever empire is further along, then write it again
        const theirs = e.current.value;
        loadedProgress = e.current;
        if (theirs && typeof theirs === 'object' && netWorthOf(theirs) > netWorthOf(P)) Object.assign(P, theirs);
        try { const r2 = await mb.save('empire', { ...P }, { ifRevision: e.current.revision, binding: e.current.binding }); if (r2) loadedProgress = r2; } catch (e2) { /* next checkpoint */ }
      } else if (e && (e.reason === 'LOAD_FIRST' || e.reason === 'AUTH_CHANGED')) {
        try { loadedProgress = await mb.load('empire'); } catch (e3) { /* ignore */ }
      }
    }
  }

  function netWorthOf(p) {
    let v = (p && p.cash) || 0;
    for (const id of ((p && p.owned) || [])) { const pr = ATL.PROPERTIES.find((x) => x.id === id); if (pr) v += pr.price; }
    return v;
  }

  function playSound(name, opts) { Sound.play(name, opts); }

  const G = {
    mode: 'boot',
    level: 1,
    elapsed: 0,
    wave: 1,
    pressure: 0,
    nearestGap: 22,
    speed: 0,
    ready: false,
    started: false,
    shake: 0,
    dip: 0,
    wide: 0,
    blue: 0,
    red: 0,
    lastNow: performance.now(),
    acc: 0,
    frames: 0,
    fpsCheck: 0,
    lowQuality: false,
    perfStart: 0,
    perfFrames: 0,
    perfAdjusted: false,
    endKind: null,
    surviveSeconds: 90,
    firstFlash: false,
    flashT: 0,
    tutorialVault: false,
    pendingStart: false,
    tutorialSlide: false,
    toastUntil: 0,
    gig: null,
    district: null,
    crew: ['police'],
    hasPolice: true,
    runCash: 0,
    caughtBy: null,
    result: null
  };

  const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: !coarse, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 3));
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  let software = false;
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    software = /swiftshader|llvmpipe|software|basic render|mesa offscreen/i.test(name);
  } catch (e) { /* ignore */ }
  if (software) {
    renderer.setPixelRatio(0.7);
    renderer.shadowMap.enabled = false;
    G.lowQuality = true;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, W / H, 0.08, 340);
  camera.position.set(0, 2.2, 6);

  const mirrorCam = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 90);
  const mirrorW = software ? 160 : (mobile ? 192 : 320);
  const mirrorH = Math.round(mirrorW * 9 / 16);
  const mirrorRT = new THREE.WebGLRenderTarget(mirrorW, mirrorH, { depthBuffer: true, stencilBuffer: false });
  mirrorRT.texture.colorSpace = THREE.SRGBColorSpace;
  const mirrorScene = new THREE.Scene();
  const mirrorOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  const mirrorMat = new THREE.MeshBasicMaterial({ map: mirrorRT.texture, depthTest: false, depthWrite: false, toneMapped: false, color: 0xdde6ee });
  mirrorMat.color.setRGB(1.3, 1.3, 1.3);
  const mirrorQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mirrorMat);
  mirrorScene.add(mirrorQuad);
  let mirrorAcc = 0;

  const hemi = new THREE.HemisphereLight(0x3d5270, 0x0b0f14, 0.62);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0x2c3846, 0.42);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0x8ea6c6, 0.38);
  dir.position.set(22, 34, 16);
  dir.castShadow = !software && !mobile;
  dir.shadow.mapSize.set(software ? 512 : 2048, software ? 512 : 2048);
  dir.shadow.camera.left = -26; dir.shadow.camera.right = 26;
  dir.shadow.camera.top = 26; dir.shadow.camera.bottom = -26;
  dir.shadow.camera.near = 1; dir.shadow.camera.far = 90;
  dir.shadow.normalBias = 0.04;
  dir.shadow.bias = -0.0004;
  scene.add(dir);
  scene.add(dir.target);

  const lampLights = [];
  for (let i = 0; i < (software ? 1 : (mobile ? 2 : 4)); i++) {
    const l = new THREE.PointLight(new THREE.Color(tune.lamp), 0, 52, 2);
    scene.add(l); lampLights.push(l);
  }
  const blueLight = new THREE.PointLight(new THREE.Color(tune.police_blue), 0, 40, 2);
  const redLight = new THREE.PointLight(new THREE.Color(tune.police_red), 0, 40, 2);
  scene.add(blueLight, redLight);
  const flankLight = new THREE.PointLight(new THREE.Color(tune.police_blue), 0, 18, 2);
  scene.add(flankLight);
  const fillLight = new THREE.DirectionalLight(0xcfe0ff, mobile ? 0.8 : 0.9);
  scene.add(fillLight, fillLight.target);
  const walkLight = new THREE.PointLight(0xd6eede, 0, 20, 2);
  scene.add(walkLight);

  const chaseSpot = new THREE.SpotLight(0xdfe9ff, 0, 42, 0.42, 0.65, 1.5);
  if (!mobile) scene.add(chaseSpot, chaseSpot.target);

  const shopLight = new THREE.PointLight(0x9ec6a2, 16, 18, 2);
  shopLight.position.set(-6.4, 2.4, -212);
  if (!software && !mobile) scene.add(shopLight);

  const washTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 64, 6, 128, 64, 128);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.38)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const washMatL = new THREE.MeshBasicMaterial({ map: washTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const washMatR = washMatL.clone();
  const washL = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), washMatL);
  const washR = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), washMatR);
  washL.rotation.y = Math.PI / 2; washR.rotation.y = -Math.PI / 2;
  scene.add(washL, washR);

  const player = {
    hook: new THREE.Group(), root: null, mixer: null, actions: {}, clipSpeed: 4.734,
    x: 0, z: 0, y: 0, speed: 0, lateral: 0, vy: 0,
    jumping: false, jumpT: 0, sliding: false, slideT: 0, stumbleT: 0, inv: 0, flinch: 0,
    activeClip: 'run', blendT: 0, blob: null
  };
  scene.add(player.hook);

  const cops = [];
  const flankCops = [];
  const copGLTFs = [];
  let copTemplate = null;
  const kindData = {};
  let suv = null;
  let copHeightScale = 1;
  let assets = { car: null, police: null, van: null, tree: null };
  let world = null;
  let policeCar = null;
  let door = { group: null, open: 0, target: 0, z: -17, x: -3.5 };

  const obstacleGroup = new THREE.Group();
  scene.add(obstacleGroup);
  const carObstacles = [];
  let colliders = [];

  let rain = null;

  const keys = Object.create(null);
  const combatCamera = new THREE.PerspectiveCamera(68, W / H, .08, 340);
  const blaster = new THREE.Group();
  const casing = new THREE.MeshBasicMaterial({color:0x33445b, depthTest:false, depthWrite:false});
  const trim = new THREE.MeshBasicMaterial({color:0x45f5da, depthTest:false, depthWrite:false});
  for (const [size, position, material] of [
    [[.14,.13,.29],[0,0,0],casing],
    [[.09,.08,.16],[0,.01,-.21],casing],
    [[.10,.028,.10],[0,.045,-.27],trim],
    [[.075,.02,.16],[0,.074,-.04],trim]
  ]) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    part.position.set(...position);
    part.renderOrder = 100;
    blaster.add(part);
  }
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.048,8,6), trim);
  flash.position.set(0,.01,-.35);
  flash.renderOrder = 101;
  blaster.add(flash);
  blaster.visible = false;
  combatCamera.add(blaster);
  scene.add(combatCamera);
  const shotRay = new THREE.Ray();
  const targetSphere = new THREE.Sphere(new THREE.Vector3(), .85);
  const cover = new THREE.Box3();
  const aim = new THREE.Vector3(), offset = new THREE.Vector3();
  let view = 0, ammo = 6, cooldown = 0;
  let aimYaw = 0, aimPitch = 0;
  let reloadAt = 0, hitUntil = 0, shotAt = -Infinity;
  const combatStats = { shots:0, hits:0, shoves:0 };
  const aimStick = { x:0, y:0 };
  function adjustAim(x, y) {
    aimYaw = clamp(aimYaw-x,-1.25,1.25);
    aimPitch = clamp(aimPitch-y,-0.7,0.7);
  }
  function syncCombat() {
    $('fightView').textContent = ['Enter FPS','First person','Rear aim'][view];
    $('fightFire').textContent = 'Fire · ' + ammo + '/6';
    $('fightFire').disabled = !view || !!reloadAt || !ammo;
    $('fightReload').textContent = reloadAt ? 'Reloading…' : 'Reload';
    $('fightReload').disabled = !!reloadAt || ammo === 6;
    $('crosshair').hidden = !view || G.mode !== 'running';
    $('combatAimArea').hidden = !view || G.mode !== 'running';
    if ((!view || G.mode !== 'running') && document.pointerLockElement === $('combatAimArea')) {
      document.exitPointerLock();
    }
  }
  function aimCamera() {
    combatCamera.aspect = camera.aspect;
    combatCamera.updateProjectionMatrix();
    combatCamera.position.set(player.x,player.y+1.5,player.z);
    combatCamera.rotation.set(aimPitch,(view===2?Math.PI:0)+aimYaw,0,'YXZ');
    combatCamera.updateMatrixWorld();
  }
  function fight(action) {
    if (G.mode !== 'running') return;
    if (action==='view') {view=(view+1)%3;aimYaw=aimPitch=0;syncCombat();return;}
    if (G.elapsed<cooldown) return;
    if (action==='reload') {
      if (ammo<6 && !reloadAt) {reloadAt=G.elapsed+1.1;cooldown=reloadAt;syncCombat();}
      return;
    }
    const fire=action==='fire';
    if (fire && (!view || !ammo)) {if(view) toast('Reload to fire.',700);return;}
    cooldown=G.elapsed+(fire?.35:.9);
    let target=null, nearest=fire?22:2.6;
    if (fire) {
      ammo--;
      combatStats.shots++;
      shotAt = G.elapsed;
      syncCombat();
      Sound.play('hit_obstacle', {vol:.2, rate:1.6});
      aimCamera();
      combatCamera.getWorldDirection(aim);
      shotRay.set(combatCamera.position, aim);
      for (const c of colliders) {
        if (!c.h || c.kind === 'tape' || (c.kind === 'door' && door.open > .5)) continue;
        cover.min.set(c.x-c.w/2,0,c.z-c.d/2);
        cover.max.set(c.x+c.w/2,c.h,c.z+c.d/2);
        if (shotRay.intersectBox(cover, offset)) nearest = Math.min(nearest, offset.distanceTo(shotRay.origin));
      }
    }
    for(const c of [...cops,...flankCops]){
      if(!c.active || c.stunnedUntil>G.elapsed) continue;
      const position = c.hook.position;
      let distance = Math.hypot(position.x-player.x,position.z-player.z);
      if (fire) {
        targetSphere.center.copy(position);
        targetSphere.center.y += 1.15;
        if (!shotRay.intersectSphere(targetSphere, offset)) continue;
        distance = offset.distanceTo(shotRay.origin);
      }
      if(distance>=nearest)continue;
      target=c;nearest=distance;
    }
    if(target){
      if(fire){combatStats.hits++;hitUntil=G.elapsed+.22;}
      else combatStats.shoves++;
      target.stunnedUntil=G.elapsed+(fire?3:2);
      target.hook.visible=false;
      toast(fire?'Pursuer staggered':'Pursuer shoved back',850);
    }else toast(fire?'Shot missed':'No pursuer in reach',650);
  }
  let joy = { active: false, id: null, x: 0, y: 0 };

  const ui = {
    hud: $('hud'), start: $('startScreen'), pause: $('pauseScreen'), end: $('endScreen'),
    timerNum: $('timerNum'), timerArc: $('timerArc'), timerWrap: document.querySelector('.timer-wrap'),
    pips: $('waveMask'), waveLabel: $('waveLabel'), pursuitFill: $('pursuitFill'),
    pursuit: document.querySelector('.pursuit'), wanted: $('wantedState'), levelLine: $('hudLevel'),
    toast: $('toast'), copHint: $('copHint'), fxBlue: $('fxBlue'), fxRed: $('fxRed'),
    joyThumb: $('joyThumb'), joyZone: $('joyZone'), startLevel: $('startLevel'), startBest: $('startBest'),
    loadNote: $('loadNote'), soundBtn: $('soundBtn'), pauseSoundBtn: $('pauseSoundBtn'),
    endStamp: $('endStamp'), endLine: $('endLine'), endSub: $('endSub'),
    statLeftK: $('statLeftK'), statLeftV: $('statLeftV'), statMidK: $('statMidK'),
    statMidV: $('statMidV'), statRightK: $('statRightK'), statRightV: $('statRightV'),
    againBtn: $('againBtn'), menuBtn: $('menuBtn'), endCredit: $('endCredit'),
    startHint: $('startHint'), startBtn: $('startBtn'), mirrorSlot: $('mirrorSlot'),
    hudCash: $('hudCash'), hudGig: $('hudGig'), crewTags: $('crewTags'), hubScreen: $('hubScreen'), help: $('helpScreen')
  };

  const ARC_LEN = 270.18;

  function fmt(sec) {
    const s = Math.max(0, Math.ceil(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const Sound = (() => {
    let ctx = null, master = null, bed = null, sfx = null;
    const buffers = {};
    const loops = {};
    let enabled = true;
    let started = false;
    const names = ['amb_street2', 'footsteps', 'siren_far', 'vault', 'hit_obstacle', 'caught', 'escaped', 'heart', 'ui_start', 'cash_pickup', 'buy_property', 'hub_beat'];
    let music = null, musicWanted = false, radioPlaying = false;
    document.addEventListener('atl-radio-playing',event=>{
      radioPlaying = event.detail;
      if (music && ctx) music.g.gain.setTargetAtTime(radioPlaying ? 0 : .34,ctx.currentTime,.2);
    });

    function ensureCtx() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.9 : 0;
      master.connect(ctx.destination);
      bed = ctx.createGain(); bed.gain.value = 0.55; bed.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = 0.95; sfx.connect(master);
      for (const n of names) {
        fetch(`assets/audio/${n}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b))
          .then((d) => { buffers[n] = d; if (n === 'hub_beat' && musicWanted) startMusic(); }).catch(() => {});
      }
    }

    function unlock() {
      ensureCtx();
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    }

    function startLoops() {
      ensureCtx();
      if (!ctx) return;
      started = true;
      const make = (name, vol, rate) => {
        if (!buffers[name] || loops[name]) return;
        const src = ctx.createBufferSource();
        src.buffer = buffers[name];
        src.loop = true;
        src.playbackRate.value = rate || 1;
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        src.connect(g); g.connect(bed);
        src.start();
        loops[name] = { src, gain: g, vol };
      };
      const tv = (name, vol, rate) => {
        if (!loops[name]) { make(name, vol, rate); return; }
        const l = loops[name];
        if (l && l.gain) l.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.25);
      };
      make('amb_street2', 0.42, 1);
      make('footsteps', 0.0, 1.1);
      make('siren_far', 0.0, 1);
      make('heart', 0.0, 1);
      const iv = setInterval(() => {
        if (!started) { clearInterval(iv); return; }
        if (!ctx) return;
        tv('footsteps', G.mode === 'running' ? 0.32 : 0.0, clamp(player.speed / 6.5, 0.85, 1.7));
        tv('siren_far', G.hasPolice && (G.mode === 'running' || G.mode === 'caught') ? 0.03 + G.pressure * 0.38 : 0.0, 0.96 + G.wave * 0.02);
        tv('heart', G.mode === 'running' && G.pressure > 0.58 ? (G.pressure - 0.58) * 1.5 : 0.0, 1.0);
      }, 240);
    }

    function startMusic() {
      musicWanted = true;
      ensureCtx();
      if (!ctx || music || !buffers.hub_beat) return;
      const src = ctx.createBufferSource();
      src.buffer = buffers.hub_beat; src.loop = true;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      src.connect(g); g.connect(master);
      src.start();
      g.gain.setTargetAtTime(radioPlaying ? 0 : .34, ctx.currentTime, 0.6);
      music = { src, g };
    }
    function stopMusic() {
      musicWanted = false;
      if (!music || !ctx) return;
      const m = music; music = null;
      try { m.g.gain.setTargetAtTime(0.0, ctx.currentTime, 0.2); setTimeout(() => { try { m.src.stop(); } catch (e) {} }, 800); } catch (e) {}
    }

    function stopLoops() {
      started = false;
      for (const k of Object.keys(loops)) {
        const l = loops[k];
        try {
          l.gain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.25);
          setTimeout(() => { try { l.src.stop(); } catch (e) {} }, 900);
        } catch (e) { /* ignore */ }
        delete loops[k];
      }
    }

    function play(name, opts) {
      opts = opts || {};
      if (!enabled || !ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const buf = buffers[name];
      if (!buf) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = (opts.rate || 1) * (0.97 + Math.random() * 0.06);
      const g = ctx.createGain();
      g.gain.value = opts.vol === undefined ? 0.8 : opts.vol;
      src.connect(g); g.connect(sfx);
      src.start();
    }

    function setEnabled(v) {
      enabled = v;
      store.set('atl-escape-sound', v ? '1' : '0');
      if (master && ctx) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.08);
      if (mb && mb.sound && typeof mb.sound.set === 'function') {
        try { mb.sound.set(v); } catch (e) { /* ignore */ }
      }
      updateSoundLabels();
    }

    function toggle() {
      ensureCtx(); unlock();
      setEnabled(!enabled);
      if (enabled) play('ui_start', { vol: 0.4 });
    }

    return { ensureCtx, unlock, startLoops, stopLoops, startMusic, stopMusic, play, setEnabled, toggle, get enabled() { return enabled; }, set enabled(v) { setEnabled(v); } };
  })();

  function updateSoundLabels() {
    const label = Sound.enabled ? 'SOUND ON' : 'SOUND OFF';
    ui.soundBtn.textContent = label;
    const hs = $('hubSoundBtn'); if (hs) hs.textContent = label;
    ui.pauseSoundBtn.textContent = label;
    ui.soundBtn.classList.toggle('off', !Sound.enabled);
    ui.pauseSoundBtn.classList.toggle('off', !Sound.enabled);
  }

  function initSoundPref() {
    let on = store.get('atl-escape-sound') !== '0';
    if (mb && mb.sound && typeof mb.sound.on === 'boolean') {
      on = mb.sound.on;
      try { mb.sound.onchange((v) => { if (v !== Sound.enabled) Sound.setEnabled(v); }); } catch (e) { /* ignore */ }
    }
    Sound.enabled = on;
    updateSoundLabels();
  }

  function toast(text, ms) {
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.remove('show'), ms || 1900);
  }

  function pulseButton(which) {
    const el = which === 'slide' ? $('slideBtn') : $('vaultBtn');
    if (!el) return;
    el.classList.add('pressed');
    clearTimeout(pulseButton[which]);
    pulseButton[which] = setTimeout(() => el.classList.remove('pressed'), 420);
  }

  function buildTexturesCache() {}

  function gltfLoader() {
    if (!THREE.GLTFLoader) throw new Error('GLTFLoader missing');
    return new THREE.GLTFLoader();
  }

  function loadGLTF(url) {
    return new Promise((resolve) => {
      const loader = gltfLoader();
      loader.load(url, resolve, undefined, () => resolve(null));
    });
  }

  function parallelTraverse(a, b, cb) {
    cb(a, b);
    for (let i = 0; i < a.children.length; i++) parallelTraverse(a.children[i], b.children[i], cb);
  }

  function cloneSkinned(source) {
    const sourceLookup = new Map();
    const cloneLookup = new Map();
    const clone = source.clone(true);
    parallelTraverse(source, clone, (sn, cn) => { sourceLookup.set(cn, sn); cloneLookup.set(sn, cn); });
    clone.traverse((node) => {
      if (!node.isSkinnedMesh) return;
      const sm = sourceLookup.get(node);
      if (!sm || !sm.skeleton) return;
      node.skeleton = sm.skeleton.clone();
      node.bindMatrix.copy(sm.bindMatrix);
      node.skeleton.bones = sm.skeleton.bones.map((bone) => cloneLookup.get(bone)).filter(Boolean);
      node.bind(node.skeleton, node.bindMatrix);
    });
    return clone;
  }

  function wetMaterial(m, clearcoat, clearRough, env) {
    if (!m) return m;
    if (m.isMeshPhysicalMaterial) {
      m.clearcoat = clearcoat; m.clearcoatRoughness = clearRough; m.envMapIntensity = env;
      return m;
    }
    const p = new THREE.MeshPhysicalMaterial({
      map: m.map || null, normalMap: m.normalMap || null, bumpMap: m.bumpMap || null,
      roughnessMap: m.roughnessMap || null, metalnessMap: m.metalnessMap || null,
      alphaMap: m.alphaMap || null, aoMap: m.aoMap || null, emissiveMap: m.emissiveMap || null,
      color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
      emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
      roughness: m.roughness !== undefined ? m.roughness : 0.8,
      metalness: m.metalness !== undefined ? m.metalness : 0.05,
      envMapIntensity: env, clearcoat, clearcoatRoughness: clearRough,
      transparent: !!m.transparent, opacity: m.opacity !== undefined ? m.opacity : 1,
      side: m.side, alphaTest: m.alphaTest || 0
    });
    if (m.normalScale && p.normalScale) p.normalScale.copy(m.normalScale).multiplyScalar(1.3);
    return p;
  }

  function prepareCharacter(gltf, height) {
    if (!gltf) return null;
    const root = gltf.scene;
    root.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        if (o.material) {
          o.material = Array.isArray(o.material)
            ? o.material.map((m) => wetMaterial(m, 0.2, 0.45, 1.2))
            : wetMaterial(o.material, 0.2, 0.45, 1.2);
        }
      }
    });
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    const h = box.max.y - box.min.y;
    if (h > 0.01) root.scale.multiplyScalar(height / h);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    root.position.y -= box.min.y;
    root.position.y += 0.01;
    root.userData.baseScale = root.scale.clone();
    return root;
  }

  function setupCharacterModel(root, height) {
    const hook = new THREE.Group();
    hook.add(root);
    hook.rotation.y = Math.PI;
    scene.add(hook);
    const mixer = new THREE.AnimationMixer(root);
    return { hook, root, mixer };
  }

  function prepVehicle(gltf, targetLength, allowTall) {
    if (!gltf) return null;
    const root = gltf.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        if (o.material) {
          o.material = Array.isArray(o.material)
            ? o.material.map((m) => wetMaterial(m, 0.55, 0.2, 1.5))
            : wetMaterial(o.material, 0.55, 0.2, 1.5);
        }
      }
    });
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());
    const horiz = Math.max(size.x, size.z);
    if (!horiz) return null;
    if (!allowTall && size.y > horiz * 0.82) return null;
    root.scale.multiplyScalar(targetLength / horiz);
    root.updateMatrixWorld(true);
    if (size.x > size.z) {
      root.rotation.y = Math.PI / 2;
      root.updateMatrixWorld(true);
    }
    box = new THREE.Box3().setFromObject(root);
    root.position.y -= box.min.y;
    root.position.x -= (box.min.x + box.max.x) / 2;
    root.position.z -= (box.min.z + box.max.z) / 2;
    const wrap = new THREE.Group();
    wrap.add(root);
    return wrap;
  }

  function addBlob(parent, scale, opacity) {
    if (!world) return null;
    const mat = new THREE.MeshBasicMaterial({
      map: world.T.glow, color: 0x05070a, transparent: true, opacity: opacity || 0.34,
      depthWrite: false, blending: THREE.NormalBlending
    });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.02;
    parent.add(blob);
    return blob;
  }

  function addGlint(scale, opacity) {
    if (!world || !world.T || !world.T.glow) return null;
    const mat = new THREE.MeshBasicMaterial({
      map: world.T.glow, color: 0x8fa8c4, transparent: true, opacity: opacity || 0.06,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.032;
    scene.add(mesh);
    return mesh;
  }

  function makeFootRipples() {
    const pool = [];
    if (!world || !world.T || !world.T.glow) return pool;
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: world.T.glow, color: 0x9fb8cc, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mat.opacity = 0;
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      pool.push({ mesh, t: 1 });
    }
    return pool;
  }

  function updateFootRipples(dt) {
    if (!player.ripples) return;
    if (!player.jumping && !player.sliding && player.speed > 2.5 && G.mode === 'running') {
      player.footAcc = (player.footAcc || 0) + dt * player.speed;
      if (player.footAcc > 2.7) {
        player.footAcc = 0;
        let pick = player.ripples[0];
        for (const r of player.ripples) if (r.t > pick.t) pick = r;
        pick.t = 0;
        pick.mesh.visible = true;
        pick.mesh.position.set(player.x + (Math.random() - 0.5) * 0.22, 0.031, player.z - 0.18);
      }
    }
    for (const r of player.ripples) {
      if (r.t >= 1) { if (r.mesh.visible) { r.mesh.visible = false; r.mesh.material.opacity = 0; } continue; }
      r.t += dt * 2.3;
      const s = 0.28 + r.t * 0.8;
      r.mesh.scale.set(s, s, 1);
      r.mesh.material.opacity = Math.max(0, 0.12 * (1 - r.t));
    }
  }

  async function loadAssets() {
    const [playerG, copG, carG, vanG, treeG] = await Promise.all([
      loadGLTF('assets/models/player_runner.glb'),
      loadGLTF('assets/models/cop_officer.glb'),
      loadGLTF('assets/models/car_hatchback.glb'),
      loadGLTF('assets/models/car_van.glb'),
      loadGLTF('assets/models/tree_street.glb')
    ]);

    if (playerG) {
      const root = prepareCharacter(playerG, 1.78);
      const made = setupCharacterModel(root, 1.78);
      player.hook = made.hook;
      player.root = root;
      player.mixer = made.mixer;
      const clips = playerG.animations || [];
      for (const c of clips) player.actions[c.name] = player.mixer.clipAction(c);
      const ru = clips.find((c) => c.name === 'run') || clips.find((c) => c.name === 'walk');
      const copRun = (copG && copG.animations)
        ? (copG.animations.find((c) => c.name === 'run') || copG.animations.find((c) => c.name === 'walk'))
        : null;
      const runClip = copRun || ru;
      if (runClip) {
        player.clipSpeed = 4.5;
        player.actions.run = player.mixer.clipAction(runClip);
        player.actions.run.play();
        player.activeClip = 'run';
      }
      const jump = player.actions.jump, hurt = player.actions.hurt;
      if (jump) { jump.setLoop(THREE.LoopOnce, 1); jump.clampWhenFinished = true; }
      if (hurt) { hurt.setLoop(THREE.LoopOnce, 1); hurt.clampWhenFinished = true; }
      player.mixer.addEventListener('finished', (e) => {
        const run = player.actions.run || player.actions.walk;
        if (e.action === player.actions.jump) {
          try { e.action.fadeOut(0.16); } catch (err) {}
          if (run) { run.reset(); run.fadeIn(0.14); run.play(); }
          player.activeClip = 'run';
        }
      });
      player.blob = addBlob(scene, 1.2, 0.42);
      player.contact = addBlob(scene, 0.55, 0.55);
      for (const b of [player.blob, player.contact]) {
        if (!b) continue;
        b.position.y = 0.028;
        if (b.material) b.material.color.setHex(0x000000);
      }
      player.ripples = makeFootRipples();
      player.glint = addGlint(1.0, 0.06);
    }

    if (copG) {
      copTemplate = copG;
      copGLTFs.push(copG);
      copTemplate.userData.baseRoot = prepareCharacter(copG, 1.82);
    }
    kindData.police = { gltf: copG, base: copG ? copG.userData.baseRoot : null, pool: [], flank: [], promise: Promise.resolve() };
    kindData.police.promise = Promise.resolve(kindData.police);

    assets.car = prepVehicle(carG, 4.15);
    assets.van = prepVehicle(vanG, 4.95);
    assets.tree = prepVehicle(treeG, 9, true);
    if (assets.tree) assets.tree.traverse((o) => { if (o.isMesh && o.material) { const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const m of mats) { if (m.color) m.color.multiplyScalar(0.52); } } });

    if (assets.car) addParkedCars();
    if (assets.tree) addTrees();
    buildPoliceCar();
    buildSUV();
    buildCashPickups();
    buildSkyline();
    buildTowers();
    buildDoor();
    G.ready = true;
    ui.loadNote.textContent = 'city ready';
    setTimeout(() => { if (ui.loadNote) ui.loadNote.textContent = ''; }, 1400);
  }

  function addGroundShadow(x, z, w, d, opacity) {
    if (!world || !world.T || !world.T.glow) return;
    const mat = new THREE.MeshBasicMaterial({
      map: world.T.glow, color: 0x000000, transparent: true,
      opacity: opacity || 0.5, depthWrite: false
    });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, 0.026, z);
    scene.add(sh);
  }

  function addParkedCars() {
    if (!assets.car) return;
    const spots = [
      { x: -6.25, z: -10, flip: false },
      { x: -6.25, z: -44, flip: true }
    ];
    for (const s of spots) {
      const car = assets.car.clone(true);
      car.position.set(s.x, 0.17, s.z);
      car.rotation.y = (s.flip ? Math.PI : 0) + 0.03;
      car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(car);
      addGroundShadow(s.x, s.z, 3.6, 2.0, 0.3);
    }
    if (assets.van) {
      const van2 = assets.van.clone(true);
      van2.position.set(-6.15, 0.17, -372);
      van2.rotation.y = Math.PI - 0.02;
      van2.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(van2);
      addGroundShadow(-6.15, -372, 4.4, 2.4, 0.36);
      addHazards(van2, -372, -6.15);
    }
  }

  function spotClearOfIntersection(z) {
    const k = Math.round((z + 96) / 96);
    return Math.abs(z - (-96 + k * 96)) > 10;
  }

  const hazardPairs = [];
  function addHazards(parent, z, x) {
    const matA = new THREE.SpriteMaterial({ map: world.T.glow, color: 0xffb057, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const a = new THREE.Sprite(matA); a.scale.set(0.9, 0.9, 1); a.position.set(x > 0 ? -0.7 : 0.7, 0.75, 0.9);
    const b = new THREE.Sprite(matA.clone()); b.scale.set(0.9, 0.9, 1); b.position.set(x > 0 ? 0.7 : -0.7, 0.75, 0.9);
    parent.add(a, b);
    hazardPairs.push({ a, b, phase: rand() * 6 });
  }

  function addHeroHouses(gltf) {
    if (!gltf || !gltf.scene) return;
    const src = gltf.scene;
    const emis = new THREE.TextureLoader().load('assets/textures/house_emissive.webp');
    emis.colorSpace = THREE.SRGBColorSpace;
    let sourceMesh = null;
    src.traverse((o) => {
      if (!o.isMesh) return;
      if (!sourceMesh) sourceMesh = o;
      o.castShadow = false;
      o.receiveShadow = true;
      o.frustumCulled = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        m.emissive = new THREE.Color(0xffffff);
        m.emissiveMap = emis;
        m.emissiveIntensity = 1.5;
        m.color.setRGB(1.32, 1.16, 1.04);
        m.envMapIntensity = 0.9;
        m.needsUpdate = true;
      }
    });
    if (!sourceMesh) return;
    src.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(src);
    const size = box.getSize(new THREE.Vector3());
    const scale = 7.4 / size.y;
    const frontage = size.x * scale;
    const depth = size.z * scale;
    const spacing = Math.max(1.2, frontage - 0.08);
    const frontX = 7.3;
    const local = sourceMesh.matrixWorld.clone();
    const mat = Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const m = new THREE.Matrix4();
    const bins = new Map();
    for (const side of [-1, 1]) {
      for (let z = 40; z > -700; z -= spacing) {
        const hs = 0.96 + Math.random() * 0.07;
        pos.set(side * (frontX + depth / 2), -box.min.y * scale, z);
        quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side > 0 ? -Math.PI / 2 : Math.PI / 2);
        scl.set(scale, scale * hs, scale);
        m.compose(pos, quat, scl).multiply(local);
        const key = side + ':' + Math.floor(z / 48);
        if (!bins.has(key)) bins.set(key, []);
        bins.get(key).push(m.clone());
      }
    }
    for (const list of bins.values()) {
      const inst = new THREE.InstancedMesh(sourceMesh.geometry, mat, list.length);
      inst.castShadow = false;
      inst.receiveShadow = true;
      for (let i = 0; i < list.length; i++) inst.setMatrixAt(i, list[i]);
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.frustumCulled = true;
      scene.add(inst);
    }
  }

  function buildPoliceCar() {
    if (!assets.car || !world || !world.T) return;
    const wrap = new THREE.Group();
    const body = assets.car.clone(true);
    body.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (o.material) {
        o.material = o.material.clone();
        if (o.material.color) o.material.color.setHex(0xb8c2cc);
        if (o.material.envMapIntensity !== undefined) o.material.envMapIntensity = 1.6;
      }
    });
    wrap.add(body);
    const glow = world.T.glow;
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x2e6bff, toneMapped: false });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xd8322e, toneMapped: false });
    const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.22), blueMat);
    const rBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.22), redMat);
    bBox.position.set(-0.25, 1.46, -0.2);
    rBox.position.set(0.25, 1.46, -0.2);
    wrap.add(bBox, rBox);
    const bGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x3b74ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    const rGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff3b33, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    bGlow.position.set(-0.25, 1.5, -0.2); bGlow.scale.set(1.5, 1.1, 1);
    rGlow.position.set(0.25, 1.5, -0.2); rGlow.scale.set(1.5, 1.1, 1);
    wrap.add(bGlow, rGlow);
    for (const hx of [-0.62, 0.62]) {
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xdce9ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      h.position.set(hx, 0.62, -2.0); h.scale.set(0.85, 0.5, 1);
      wrap.add(h);
      const t = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff4b3a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      t.position.set(hx, 0.62, 2.0); t.scale.set(0.55, 0.34, 1);
      wrap.add(t);
    }
    const shMat = new THREE.MeshBasicMaterial({ map: glow, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.5), shMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.026;
    wrap.add(sh);
    wrap.position.set(1.1, 0, 17);
    scene.add(wrap);
    policeCar = { group: wrap, blueMat, redMat, bGlow, rGlow, x: 1.1, gap: 17 };
  }

  function buildSUV() {
    const src = assets.van || assets.car;
    if (!src || !world || !world.T) return;
    const wrap = new THREE.Group();
    const body = src.clone(true);
    body.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (o.material) {
        o.material = o.material.clone();
        if (o.material.color) o.material.color.multiplyScalar(0.18);
        if (o.material.envMapIntensity !== undefined) o.material.envMapIntensity = 2.2;
      }
    });
    wrap.add(body);
    const glow = world.T.glow;
    const heads = [];
    for (const hx of [-0.7, 0.7]) {
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff1d6, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      h.position.set(hx, 0.75, -2.4); h.scale.set(1.1, 0.6, 1);
      wrap.add(h); heads.push(h);
    }
    const under = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.0), new THREE.MeshBasicMaterial({
      map: glow, color: 0xff3344, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    under.rotation.x = -Math.PI / 2; under.position.y = 0.03;
    wrap.add(under);
    wrap.position.set(1.1, 0, 17);
    wrap.visible = false;
    scene.add(wrap);
    suv = { group: wrap, under, heads, x: 1.1, gap: 17 };
  }

  function activeCar() {
    if (G.hasPolice || !suv) return policeCar;
    return suv;
  }

  // ---------------------------------------------------------------- cash on the road
  const cash = { mesh: null, glow: null, items: [], max: 90 };
  function moneyTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#3f7a3a'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#86c06c'; g.fillRect(6, 6, 116, 52);
    g.fillStyle = '#2f5f2c'; g.beginPath(); g.ellipse(64, 32, 16, 20, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8f2d8'; g.font = '900 22px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('$', 64, 33);
    g.fillStyle = '#f1e6c4'; g.fillRect(50, 0, 28, 64);
    g.fillStyle = '#c9a13a'; g.fillRect(50, 0, 28, 4); g.fillRect(50, 60, 28, 4);
    g.fillStyle = '#3d2d10'; g.font = '700 10px Archivo, sans-serif'; g.fillText('$', 64, 33);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function buildCashPickups() {
    if (!world) return;
    const geo = new THREE.BoxGeometry(0.62, 0.22, 0.34);
    const tex = moneyTexture();
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05, emissive: 0x2a5a24, emissiveIntensity: 0.9 });
    cash.mesh = new THREE.InstancedMesh(geo, side, cash.max);
    cash.mesh.frustumCulled = false;
    cash.mesh.castShadow = false;
    scene.add(cash.mesh);
    const gpos = new Float32Array(cash.max * 3);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
    cash.glow = new THREE.Points(gg, new THREE.PointsMaterial({
      map: world.T.glow, color: 0x7dff8a, size: 1.5, sizeAttenuation: true, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    cash.glow.frustumCulled = false;
    scene.add(cash.glow);
    cash.gpos = gpos;
  }
  function placeCash(seed, seconds) {
    cash.items.length = 0;
    if (!cash.mesh) return;
    let s2 = seed >>> 0;
    const r = () => { s2 = (s2 * 1664525 + 1013904223) >>> 0; return s2 / 4294967296; };
    const lanes = [-2.25, 0, 2.25];
    const end = -Math.min(1000, 40 + seconds * 10.5);
    let z = -12;
    while (z > end && cash.items.length < cash.max) {
      const lane = lanes[Math.floor(r() * 3)];
      const run = 2 + Math.floor(r() * 3);
      for (let k = 0; k < run && cash.items.length < cash.max; k++) {
        const zz = z - k * 2.4;
        const blocked = colliders.some((c) => c.kind !== 'puddle' && Math.abs(c.z - zz) < c.d / 2 + 1.0 && Math.abs(c.x - lane) < c.w / 2 + 0.5);
        if (!blocked) cash.items.push({ x: lane, z: zz, taken: false, ph: r() * 6 });
      }
      z -= 9 + r() * 9;
    }
    updateCash(0, true);
  }
  const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cs = new THREE.Vector3(), _ce = new THREE.Euler();
  function updateCash(dt, force) {
    if (!cash.mesh) return;
    const t = performance.now() / 1000;
    const n = cash.max;
    for (let i = 0; i < n; i++) {
      const it = cash.items[i];
      if (!it || it.taken) {
        _cs.set(0, 0, 0); _cv.set(0, -50, 0); _cq.identity();
        cash.gpos[i * 3 + 1] = -50;
      } else {
        if (G.mode === 'running' && !force && Math.abs(it.z - player.z) < 0.9 && Math.abs(it.x - player.x) < 0.85 && player.y < 1.2) {
          it.taken = true;
          collectCash();
          i--; continue;
        }
        _ce.set(0.25, t * 2.4 + it.ph, 0);
        _cq.setFromEuler(_ce);
        _cv.set(it.x, 0.75 + Math.sin(t * 3 + it.ph) * 0.12, it.z);
        _cs.set(1, 1, 1);
        cash.gpos[i * 3] = it.x; cash.gpos[i * 3 + 1] = 0.78; cash.gpos[i * 3 + 2] = it.z;
      }
      _cm.compose(_cv, _cq, _cs);
      cash.mesh.setMatrixAt(i, _cm);
    }
    cash.mesh.instanceMatrix.needsUpdate = true;
    cash.glow.geometry.attributes.position.needsUpdate = true;
  }
  function collectCash() {
    const tier = G.district ? G.district.tier : 1;
    const v = ATL.BUNDLE[tier] || 10;
    G.runCash += v;
    playSound('cash_pickup', { vol: 0.55 });
    ui.hudCash.textContent = money(G.runCash);
    ui.hudCash.classList.remove('pop'); void ui.hudCash.offsetWidth; ui.hudCash.classList.add('pop');
  }

  // ---------------------------------------------------------------- Atlanta backdrop
  let skyline = null, towers = null;
  function buildSkyline() {
    const tex = new THREE.TextureLoader().load('assets/elements/skyline_atl.webp');
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false, opacity: 0.8, toneMapped: false, color: 0xd8c8b8 });
    skyline = new THREE.Mesh(new THREE.PlaneGeometry(200, 121), mat);
    skyline.renderOrder = -2;
    scene.add(skyline);
  }
  function officeTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#0d1219'; g.fillRect(0, 0, 256, 512);
    for (let y = 6; y < 512; y += 16) {
      for (let x = 6; x < 256; x += 14) {
        const lit = Math.random();
        g.fillStyle = lit > 0.55 ? (lit > 0.85 ? '#f6d9a0' : '#c9b38a') : (lit > 0.3 ? '#1d2a38' : '#121a24');
        g.fillRect(x, y, 9, 10);
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function buildTowers() {
    const tex = officeTexture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0.4, color: 0x8a96a4 });
    const geos = [];
    let k = 0;
    for (let z = 20; z > -1040; z -= 34) {
      for (const side of [1, -1]) {
        k++;
        const w = 14 + ((k * 7) % 9);
        const h = 34 + ((k * 37) % 70);
        const d = 14 + ((k * 5) % 8);
        const g = new THREE.BoxGeometry(w, h, d);
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 14, uv.getY(i) * h / 28);
        g.translate(side > 0 ? 18 + w / 2 + ((k * 3) % 8) : -48 - w / 2 - ((k * 5) % 10), h / 2, z - ((k * 11) % 16));
        geos.push(g);
      }
    }
    const merged = THREE.mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    towers = new THREE.Mesh(merged, mat);
    towers.visible = false;
    towers.matrixAutoUpdate = false;
    scene.add(towers);
  }

  function applyDistrict(d) {
    if (!d || !world) return;
    G.district = d;
    const ownedHere = ATL.PROPERTIES.filter((p) => p.d === d.id && P.owned.includes(p.id));
    const theme = Object.assign({}, d.theme);
    theme.signs = theme.signs.slice();
    if (ownedHere.length) { theme.signs[3] = 'PEACH CITY EMPIRE'; theme.owned = true; }
    try { world.restyle(theme); } catch (e) { /* signs stay as they were */ }
    if (scene.fog) scene.fog.color.setHex(theme.fog);
    for (const l of lampLights) l.color.set(theme.lamp);
    if (skyline) skyline.material.opacity = theme.sky;
    if (towers) towers.visible = !!theme.towers;
    if (suv) suv.under.material.color.set(ATL.KINDS[G.crew.find((k) => k !== 'police') || 'thug'].color);
  }

  function addTrees() {
    if (!assets.tree) return;
    const leaves = world && world.T && world.T.leaves;
    const leafMat = leaves ? new THREE.PointsMaterial({
      map: leaves, color: 0xa2a05e, size: 2.7, sizeAttenuation: true,
      transparent: true, opacity: 0.96, alphaTest: 0.18, depthWrite: false
    }) : null;
    const leafMatDeep = leaves ? new THREE.PointsMaterial({
      map: leaves, color: 0x666c3a, size: 3.9, sizeAttenuation: true,
      transparent: true, opacity: 0.9, alphaTest: 0.16, depthWrite: false
    }) : null;
    const spots = [[-30, -12.5], [-112, -16.5], [-238, -13.5], [-392, -17], [-606, -14], [-842, -16]];
    for (const [z, x] of spots) {
      const t = assets.tree.clone(true);
      t.position.set(x, 0.2, z);
      t.rotation.y = rand() * Math.PI * 2;
      t.scale.multiplyScalar(1.05);
      t.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(t);
      if (leafMat) {
        for (const [mat, count, rad, y0, spread] of [[leafMatDeep, 120, 3.8, 5.4, 2.6], [leafMat, 150, 3.2, 6.2, 2.4]]) {
          const pos = [];
          for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = Math.pow(Math.random(), 0.65) * rad;
            pos.push(Math.cos(a) * rr, y0 + Math.random() * spread, Math.sin(a) * rr);
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          const cloud = new THREE.Points(geo, mat);
          cloud.position.set(x, 0.2, z);
          cloud.frustumCulled = false;
          scene.add(cloud);
        }
      }
    }
  }

  function loadKind(kind) {
    if (kindData[kind]) return kindData[kind].promise;
    const info = ATL.KINDS[kind];
    const kd = { gltf: null, base: null, pool: [], flank: [] };
    kindData[kind] = kd;
    kd.promise = loadGLTF(info.model).then((g) => {
      kd.gltf = g;
      if (g) kd.base = prepareCharacter(g, info.height);
      return kd;
    });
    return kd.promise;
  }

  function makeChaser(kind, flank) {
    const kd = kindData[kind];
    const info = ATL.KINDS[kind];
    let hook, root = null, mixer = null, actions = {};
    if (kd && kd.base) {
      root = kd.baseUsed ? cloneSkinned(kd.base) : kd.base;
      kd.baseUsed = true;
      const made = setupCharacterModel(root, info.height);
      hook = made.hook; mixer = made.mixer;
      for (const c of (kd.gltf.animations || [])) actions[c.name] = mixer.clipAction(c);
      const run = actions.run || actions.walk;
      if (run) { run.play(); run.timeScale = flank ? 1.2 : 1.3; }
    } else {
      hook = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.1, 4, 8),
        new THREE.MeshStandardMaterial({ color: info.color, roughness: 0.8 }));
      body.position.y = 0.9; hook.add(body);
      scene.add(hook);
    }
    hook.visible = false;
    const blob = addBlob(hook, 0.95, 0.3);
    if (blob) blob.position.y = 0.02;
    let strobe = null, halo = null;
    if (world && world.T && world.T.glow) {
      strobe = new THREE.Sprite(new THREE.SpriteMaterial({
        map: world.T.glow, color: info.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      strobe.scale.set(flank ? 0.8 : 0.62, flank ? 0.8 : 0.62, 1);
      strobe.position.set(flank ? 0.24 : 0, flank ? 1.72 : 1.6, flank ? 0.02 : 0);
      hook.add(strobe);
      halo = new THREE.Mesh(new THREE.PlaneGeometry(flank ? 3.4 : 1.9, flank ? 3.4 : 1.9), new THREE.MeshBasicMaterial({
        map: world.T.glow, color: info.color, transparent: true, opacity: flank ? 0.4 : 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.04;
      hook.add(halo);
    }
    return { kind, hook, root, mixer, actions, strobe, halo, torch: null, gap: 14, active: false, offset: 0, phase: rand() * 6, idx: 0, side: 1, z: 0, x: 0 };
  }

  function chaserFor(kind, idx, flank) {
    const kd = kindData[kind];
    const list = flank ? kd.flank : kd.pool;
    while (list.length <= idx) list.push(makeChaser(kind, flank));
    return list[idx];
  }

  function assembleCrew(crew) {
    for (const k of Object.keys(kindData)) {
      for (const c of kindData[k].pool.concat(kindData[k].flank)) { c.active = false; c.hook.visible = false; }
    }
    cops.length = 0; flankCops.length = 0;
    const counts = {};
    for (let i = 0; i < 7; i++) {
      const kind = crew[i % crew.length];
      counts[kind] = (counts[kind] || 0);
      const c = chaserFor(kind, counts[kind]++, false);
      c.idx = i;
      cops.push(c);
    }
    const fc = {};
    for (let i = 0; i < 2; i++) {
      const kind = crew[(i + 1) % crew.length];
      fc[kind] = fc[kind] || 0;
      const c = chaserFor(kind, fc[kind]++, true);
      c.side = i ? 1 : -1;
      flankCops.push(c);
    }
  }

  function resetCop(c, i, wave) {
    c.active = false;
    c.gap = 13 + (i % 4) * 2.2 + rand() * 2;
    c.offset = [(-1.6), 1.5, -2.4, 2.3, -0.5, 2.7, 0.9][i % 7];
    c.phase = rand() * 6;
    c.x = clamp(player.x + c.offset, -3.2, 3.2);
    c.hook.visible = false;
  }

  function buildDoor() {
    if (door.group) { scene.remove(door.group); }
    const g = new THREE.Group();
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x30353a, roughness: 0.5, metalness: 0.25 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 0.12, metalness: 0.6, envMapIntensity: 1.4 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.16, 0.08), doorMat);
    panel.position.set(0.46, 0.58, 0);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.52), glassMat);
    glass.position.set(0.46, 1.05, 0.045);
    g.add(panel, glass);
    g.position.set(-3.55, 0.02, -17.2);
    g.rotation.y = 0.05;
    scene.add(g);
    door = { group: g, open: 0, target: 0, z: -17.2, x: -3.55 };
  }

  function updateHazards(t) {
    for (const h of hazardPairs) {
      const on = (Math.sin(t * 5.4 + h.phase) > 0.15) ? 1 : 0.15;
      h.a.material.opacity = 0.85 * on;
      h.b.material.opacity = 0.85 * on;
    }
  }

  const OBS_MATS = {};
  const obstacleBuckets = new Map();
  let obstacleMerged = [];
  const obsCarInstances = [];

  function addObGeo(mat, g) {
    let a = obstacleBuckets.get(mat);
    if (!a) { a = []; obstacleBuckets.set(mat, a); }
    a.push(g);
  }
  function obBox(mat, w, h, d, x, y, z, ry) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    const a = g.attributes.uv;
    if (a) {
      const su = Math.max(w, d) / 1.6, sv = h / 1.6;
      for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv);
      a.needsUpdate = true;
    }
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)),
      new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    addObGeo(mat, g);
  }
  function obCyl(mat, r1, r2, h, x, y, z, rx, rz, seg) {
    const g = new THREE.CylinderGeometry(r1, r2, h, seg || 8, 1).toNonIndexed();
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, 0, rz || 0)),
      new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    addObGeo(mat, g);
  }
  function obPlane(mat, w, h, x, y, z, ry) {
    const g = new THREE.PlaneGeometry(w, h).toNonIndexed();
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)),
      new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    addObGeo(mat, g);
  }
  function addCollider(c) { colliders.push(c); }

  function makeBin(x, z) {
    obBox('binGreen', 0.66, 0.96, 0.7, x, 0.62, z);
    obBox('binLid', 0.72, 0.09, 0.77, x, 1.13, z);
    obBox('binLid', 0.74, 0.05, 0.2, x, 1.2, z + 0.12);
    obCyl('binDark', 0.09, 0.09, 0.07, x - 0.24, 0.1, z + 0.28, 0, Math.PI / 2);
    obCyl('binDark', 0.09, 0.09, 0.07, x + 0.24, 0.1, z + 0.28, 0, Math.PI / 2);
    obPlane('binLabel', 0.34, 0.25, x, 0.8, z + 0.37, 0);
    obPlane('binLabel', 0.34, 0.25, x + 0.345, 0.8, z, Math.PI / 2);
    obPlane('binLabel', 0.34, 0.25, x - 0.345, 0.8, z, -Math.PI / 2);
    addCollider({ x, z, w: 0.78, d: 0.8, h: 1.05, jump: true });
  }

  function makeLowWall(x, z, width) {
    obBox('brick', width, 0.9, 0.55, x, 0.45, z);
    obBox('trimDark', width + 0.12, 0.09, 0.66, x, 0.94, z);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const rx = x - width / 2 + 0.35 + rand() * (width - 0.7);
      const s = 0.12 + rand() * 0.18;
      obBox('brick', s, s * 0.7, s, rx, s * 0.35, z + (rand() - 0.5) * 0.4, rand());
    }
    for (const s of [-1, 1]) {
      const cx = x + s * (width / 2 + 0.35);
      obCyl('cone', 0.02, 0.17, 0.62, cx, 0.31, z, 0, 0, 10);
      obCyl('coneBand', 0.1, 0.12, 0.09, cx, 0.42, z, 0, 0, 10);
      obBox('cone', 0.36, 0.04, 0.36, cx, 0.02, z);
    }
    addCollider({ x, z, w: width, d: 0.7, h: 0.95, jump: true });
  }

  function makeTape(x, z, width) {
    for (const s of [-1, 1]) {
      const px = x + s * width / 2;
      obCyl('darkMetal', 0.045, 0.055, 1.45, px, 0.72, z, 0, 0, 8);
      obBox('darkMetal', 0.36, 0.07, 0.36, px, 0.035, z);
    }
    obPlane('tape', width, 0.24, x, 1.15, z, 0);
    obPlane('tape', width, 0.24, x, 1.15, z, Math.PI);
    addCollider({ x, z, w: width, d: 0.35, h: 1.3, slide: true, kind: 'tape' });
  }

  function makeBoard(x, z, rot) {
    const g1 = new THREE.BoxGeometry(0.7, 0.92, 0.04).toNonIndexed();
    g1.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.46, z + 0.12),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, rot || 0, 0)), new THREE.Vector3(1, 1, 1)));
    addObGeo('wood', g1);
    const g2 = new THREE.BoxGeometry(0.7, 0.92, 0.04).toNonIndexed();
    g2.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.46, z - 0.12),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.24, rot || 0, 0)), new THREE.Vector3(1, 1, 1)));
    addObGeo('wood', g2);
    addCollider({ x, z, w: 0.9, d: 0.55, h: 0.95, jump: true });
  }

  function makeBench(x, z, rot) {
    for (let i = 0; i < 3; i++) obBox('wood', 1.9, 0.07, 0.14, x, 0.5 + 0.05 * 0, z - 0.16 + i * 0.16, rot);
    for (const s of [-1, 1]) obBox('darkMetal', 0.08, 0.48, 0.5, x + s * 0.8, 0.24, z, rot);
    obBox('wood', 1.9, 0.4, 0.07, x, 0.83, z - 0.34, rot);
    addCollider({ x, z, w: 2.0, d: 0.62, h: 0.95, jump: true });
  }

  function makeBike(x, z, rot) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0.35, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot || 0, 0.06)), new THREE.Vector3(1, 1, 1));
    const wheel = (dz) => {
      const g = new THREE.TorusGeometry(0.34, 0.025, 6, 16).toNonIndexed();
      g.applyMatrix4(m);
      g.translate(0, 0, dz);
      addObGeo('darkMetal', g);
    };
    wheel(-0.52); wheel(0.52);
    const frame = (len, x1, y1, z1, rx) => {
      const g = new THREE.CylinderGeometry(0.022, 0.022, len, 6).toNonIndexed();
      g.applyMatrix4(m);
      g.translate(x1, y1, z1);
      g.applyMatrix4(new THREE.Matrix4().makeRotationX(rx || 0));
      addObGeo('trimDark', g);
    };
    frame(1.0, 0, 0, 0, Math.PI / 2);
    frame(0.55, 0, 0.18, -0.3, 0.4);
    frame(0.55, 0, 0.18, 0.3, -0.4);
    addCollider({ x, z, w: 1.25, d: 0.55, h: 1.0, jump: true });
  }

  function makeCarObstacle(x, z, rot) {
    const src = assets.car;
    if (!src) { makeBin(x, z); return; }
    const car = src.clone(true);
    car.position.set(x, 0, z);
    car.rotation.y = (rot || 0) + Math.PI / 2;
    car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    obstacleGroup.add(car);
    obsCarInstances.push(car);
    addCollider({ x, z, w: 2.35, d: 3.6, h: 1.5, kind: 'car' });
  }

  function makePuddle(x, z, w, d) {
    const g = new THREE.CircleGeometry(1, 14).toNonIndexed();
    g.scale(w / 2, 1, d / 2);
    g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.014, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
      new THREE.Vector3(1, 1, 1)));
    addObGeo('puddle', g);
    addCollider({ x, z, w: w * 0.8, d: d * 0.8, h: 0.0, kind: 'puddle', slow: true });
  }

  function makeConeCluster(x, z) {
    for (let i = 0; i < 3; i++) {
      const cx = x + (i - 1) * 0.55;
      const cz = z + (i % 2) * 0.4;
      obCyl('cone', 0.02, 0.16, 0.6, cx, 0.3, cz, 0, 0, 10);
      obCyl('coneBand', 0.09, 0.11, 0.08, cx, 0.4, cz, 0, 0, 10);
      obBox('cone', 0.34, 0.04, 0.34, cx, 0.02, cz);
    }
    addCollider({ x, z, w: 1.6, d: 0.75, h: 0.65, jump: true });
  }

  function clearObstacles() {
    for (const m of obstacleMerged) {
      scene.remove(m);
      if (m.geometry) m.geometry.dispose();
    }
    obstacleMerged = [];
    for (const c of obsCarInstances) {
      obstacleGroup.remove(c);
    }
    obsCarInstances.length = 0;
    obstacleBuckets.clear();
    colliders = [];
  }

  function buildObstacles(level, seedExtra) {
    clearObstacles();
    let seed = (7307 + level * 7919 + (seedExtra || 0) * 104729) >>> 0;
    const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const lanes = [-2.25, 0, 2.25];

    makeLowWall(-1.55, -60, 3.9);
    makeTape(1.35, -114, 4.0);
    colliders.push({ x: -2.95, z: -17.2, w: 1.35, d: 0.42, h: 1.25, kind: 'door' });

    let z = -145;
    while (z > -940) {
      const t = clamp((-z) / 940, 0, 1);
      const density = (19 - t * 6.5) * (1 / clamp(tune.obstacle_gap || 1, 0.6, 1.6)) / (1 + (level - 1) * 0.05);
      z -= density * (0.86 + r() * 0.3);
      const roll = r();
      const lane = lanes[Math.floor(r() * 3)];
      if (roll < 0.16) {
        makeBin(lane, z);
      } else if (roll < 0.33) {
        makeLowWall(r() > 0.5 ? -1.5 : 1.5, z, 3.8);
      } else if (roll < 0.48) {
        makeTape(r() > 0.5 ? -1.35 : 1.35, z, 3.9);
      } else if (roll < 0.62) {
        makeCarObstacle(lane > 0 ? 2.3 : -2.3, z, (lane > 0 ? -1 : 1) * (0.24 + r() * 0.2));
      } else if (roll < 0.73) {
        makePuddle((r() - 0.5) * 4, z, 3.0 + r() * 1.6, 2.2 + r() * 1.4);
      } else if (roll < 0.84) {
        makeBoard(r() > 0.5 ? -2.1 : 2.1, z, r() * 0.6);
        makeBin(-lane, z - 0.3);
      } else if (roll < 0.93) {
        makeConeCluster((r() - 0.5) * 3.2, z);
      } else {
        makeBin((r() - 0.5) * 2.6, z);
      }
      if (r() > 0.72) {
        const l2 = lanes[Math.floor(r() * 3)];
        if (Math.abs(l2 - lane) > 1.6) makeBin(l2, z - 0.4);
      }
    }

    for (const [mat, geos] of obstacleBuckets) {
      if (!geos.length) continue;
      const merged = THREE.mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, world.M[mat]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      obstacleGroup.add(mesh);
      obstacleMerged.push(mesh);
      for (const g of geos) g.dispose();
    }
    obstacleBuckets.clear();
  }

  function rebuildCopsForWave(wave) {
    const counts = [2, 3, 5, 7];
    const want = counts[Math.min(3, wave - 1)];
    for (let i = 0; i < cops.length; i++) {
      const c = cops[i];
      if (i < want && c.active && wave >= 3) c.gap = Math.min(c.gap, wave >= 4 ? 7.5 : 10);
      if (i < want && !c.active) {
        c.active = true;
        c.hook.visible = true;
        c.gap = (i < want && G.elapsed < 1) ? 6 + i * 2.0 : 10 + (i % 3) * 2;
        c.hook.position.set(player.x + c.offset, 0, player.z + c.gap);
      }
      if (i >= want && c.active && G.mode !== 'running') {
        c.active = false; c.hook.visible = false;
      }
    }
  }

  function resetRun(level) {
    view=0; ammo=6; cooldown=0; aimYaw=aimPitch=0;
    reloadAt=hitUntil=0;
    shotAt = -Infinity;
    Object.assign(combatStats,{shots:0,hits:0,shoves:0});
    $('crosshair').classList.remove('confirmed-hit');
    for(const c of [...cops,...flankCops]) c.stunnedUntil=0;
    syncCombat();
    G.level = level;
    G.elapsed = 0;
    G.wave = 1;
    G.pressure = 0;
    G.nearestGap = 20;
    G.speed = 0;
    G.endKind = null;
    G.firstFlash = false;
    G.tutorialVault = false;
    G.tutorialSlide = false;
    G.shake = 0; G.dip = 0; G.wide = 0;
    G.surviveSeconds = G.gig ? G.gig.seconds : (tune.survive_seconds || 90);
    G.runCash = 0;
    G.caughtBy = null;
    G.tutorialCash = false;
    ui.hudCash.textContent = money(0);
    G.perfStart = 0;
    G.perfFrames = 0;
    G.perfAdjusted = false;
    player.x = 0; player.z = 0; player.y = 0; player.speed = 0; player.lateral = 0;
    player.jumping = false; player.jumpT = 0; player.sliding = false; player.slideT = 0;
    player.stumbleT = 0; player.inv = 0; player.flinch = 0;
    if (player.hook) { player.hook.position.set(0, 0, 0); player.hook.rotation.set(0, Math.PI, 0); }
    if (player.mixer) {
      player.mixer.setTime(0);
      for (const a of Object.values(player.actions)) {
        if (a) { a.stop(); a.setEffectiveWeight(1); }
      }
      const ra = player.actions.run || player.actions.walk;
      if (ra) { ra.reset(); ra.time = 0.22; ra.play(); player.activeClip = 'run'; }
    }
    if (player.root) { player.root.rotation.x = 0; player.root.scale.setScalar(player.root.scale.x); }
    for (let i = 0; i < cops.length; i++) resetCop(cops[i], i, 1);
    for (const c of cops) { if (c.mixer) c.mixer.setTime(0); }
    for (const c of flankCops) { c.active = false; c.hook.visible = false; if (c.mixer) c.mixer.setTime(0); }
    if (door.group) { door.open = 0; door.target = 0; door.group.rotation.y = 0.05; }
    ui.waveLabel.textContent = 'WAVE 1';
    if (!cops.length) assembleCrew(G.crew);
    rebuildCopsForWave(1);
    for (const c of cops) if (c.active) { c.gap = 7 + (c.idx % 3) * 0.4; c.hook.position.set(player.x + c.offset, 0, player.z + 1.4 + (c.gap - 1.4) * 0.55); }
    ui.levelLine.textContent = G.district ? G.district.name.toUpperCase() : '';
    ui.hudGig.textContent = G.gig ? G.gig.title : '';
    ui.crewTags.replaceChildren(...G.crew.map((k) => { const el = document.createElement('span'); el.className = 'crew-tag'; el.style.setProperty('--c', ATL.KINDS[k].color); el.textContent = ATL.KINDS[k].short; return el; }));
    document.body.classList.remove('danger');
  }

  // ---------------------------------------------------------------- the empire
  const districtById = (id) => ATL.DISTRICTS.find((d) => d.id === id);
  const gigById = (id) => ATL.GIGS.find((g) => g.id === id);
  const propById = (id) => ATL.PROPERTIES.find((p) => p.id === id);
  function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function rankIndex() {
    if (P.won) return 6;
    let r = 0;
    for (let i = 0; i < 6; i++) { const k = ATL.RANKS[i]; if (P.rep >= k.rep && P.owned.length >= k.props) r = i; }
    return r;
  }
  function trackLevel(track) { return Math.min(5, Math.floor(((P.tracks && P.tracks[track]) || 0) / 3)); }
  function payFor(gig) {
    const d = districtById(gig.d);
    return Math.round(ATL.PAY[d.tier] * gig.pay * (1 + 0.1 * trackLevel(gig.track)) / 10) * 10;
  }
  function repFor(gig) { return Math.round(ATL.REP[districtById(gig.d).tier] * gig.rep); }
  function incomeTotal() { return P.owned.reduce((a, id) => a + ((propById(id) || {}).income || 0), 0); }
  function crewFor(gig) {
    const crew = gig.crew.slice();
    if (P.heat >= 60 && !crew.includes('police')) crew.splice(1, 0, 'police');
    return crew;
  }
  function gigOpen(gig) {
    const d = districtById(gig.d);
    if (rankIndex() < d.rank) return false;
    if (gig.needs && !P.owned.includes(gig.needs)) return false;
    return true;
  }

  let room = null;
  let roomBusy = false;
  let teammate = null;
  const teammateTarget = new THREE.Vector3();

  async function roomRequest(action, data) {
    if (location.protocol === 'file:') throw new Error('Start server.mjs and open the game through the server.');
    const response = await fetch('/room/' + action, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data), signal:AbortSignal.timeout(5000)
    });
    const result = await response.json().catch(()=>null);
    if (!result) throw new Error('Multiplayer needs the ATL Escape room server.');
    if (!response.ok) throw Object.assign(new Error(result.error), {status:response.status});
    return result;
  }

  function roomStatus(message) {
    if ($('roomStatus').textContent !== message) $('roomStatus').textContent = message;
  }

  function showRoomControls() {
    $('roomCreate').disabled = $('roomJoin').disabled = !!room || roomBusy;
    $('roomLeave').hidden = !room;
    $('roomCode').readOnly = !!room;
  }

  async function changeRoom(action) {
    if (roomBusy || (action === 'leave' ? !room : !!room)) return;
    roomBusy = true;
    showRoomControls();
    try {
      if (action === 'leave') {
        const old = room;
        room = null;
        if (teammate) teammate.visible = false;
        $('roomRunStatus').textContent = '';
        $('roomResult').textContent = '';
        roomStatus('Room left.');
        await roomRequest('leave',old).catch(()=>{});
      } else {
        const code = $('roomCode').value.trim().toUpperCase();
        if (action === 'join' && !/^[A-F0-9]{8}$/.test(code)) throw new Error('Enter the eight-character room code.');
        room = await roomRequest(action,{code});
        $('roomCode').value = room.code;
        roomStatus('Room '+room.code+' · Connecting…');
      }
    } catch (error) { roomStatus(error.message); }
    finally { roomBusy = false; showRoomControls(); }
  }

  function drawTeammate(state) {
    const active = state && ['running','paused'].includes(state.mode);
    if (!active) {
      if (teammate) teammate.visible = false;
      return;
    }
    if (!teammate) {
      teammate = new THREE.Group();
      const suit = new THREE.MeshBasicMaterial({color:0x34f2d0});
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(.27,.68,4,8),suit);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.19,10,8),suit);
      body.position.y = .73;
      head.position.y = 1.53;
      teammate.add(body,head);
      scene.add(teammate);
      teammate.visible = false;
    }
    teammateTarget.set(state.x,state.y,state.z);
    if (!teammate.visible) teammate.position.copy(teammateTarget);
    teammate.visible = true;
  }

  async function syncRoom() {
    const current = room;
    if (current) {
      try {
        if (current.run && ['running','paused','caught','escaped'].includes(G.mode)) current.mode = G.mode;
        const state = current.run && current.mode ? {
          run:current.run, mode:current.mode, x:player.x,y:player.y,z:player.z,shots:combatStats.shots
        } : null;
        const result = await roomRequest('sync',{...current,state});
        if (room !== current) return;
        const {run,peer,connected} = result;
        if (run && run.id !== current.run && G.mode === 'hub' && Date.now() < run.until) {
          const gig = gigById(run.gig);
          if (!gig || !gigOpen(gig)) {
            current.run = run.id;
            current.mode = 'left';
            roomStatus('This chase is locked in your career. Ask the host to choose an unlocked gig.');
          } else if (G.ready && !G.starting) {
            current.run = run.id;
            current.mode = null;
            roomStatus('Starting '+gig.title+'…');
            startGig(gig,{...run,delay:Math.max(0,run.startAt-result.now)}).catch(()=>{
              current.mode = 'left';
              roomStatus('The chase could not load. Return to the lobby to try again.');
            });
          }
        } else if (!current.run || current.mode !== 'left') {
          const label = peer?.mode === 'escaped' ? 'Teammate escaped' :
            peer?.mode === 'caught' ? 'Teammate caught' : peer?.mode === 'left' ? 'Teammate left the chase' :
            connected ? (current.host ? 'Both players connected. Choose a gig.' : 'Connected. Waiting for host.') :
            'Waiting for your teammate.';
          roomStatus('Room '+current.code+' · '+label);
        }
        const active = current.run === run?.id && G.mode === 'running';
        drawTeammate(active ? peer : null);
        $('roomRunStatus').textContent = active ? (peer?.mode === 'running' ? 'Teammate in chase' :
          peer?.mode === 'escaped' ? 'Teammate escaped' : peer?.mode === 'caught' ? 'Teammate caught' :
          peer?.mode === 'paused' ? 'Teammate paused' : connected ? 'Teammate connecting' : 'Teammate disconnected') : '';
        $('roomResult').textContent = current.run && ['caught','escaped'].includes(current.mode) ?
          (current.mode === 'escaped' && peer?.mode === 'escaped' ? 'Both players escaped.' :
            peer?.mode === 'caught' ? 'Your teammate was caught.' :
            peer?.mode === 'escaped' ? 'Your teammate escaped.' :
            peer?.mode === 'left' || !connected ? 'Your teammate left the chase.' : 'Waiting for your teammate to finish.') : '';
      } catch (error) {
        if (room === current) {
          drawTeammate(null);
          roomStatus(error.message);
          $('roomRunStatus').textContent = 'Room connection lost';
          if (error.status === 404 || error.status === 403) {
            room = null;
            showRoomControls();
          }
        }
      } finally { setTimeout(syncRoom,160); }
    } else setTimeout(syncRoom,500);
  }

  async function startGig(gig, sharedRun) {
    if (!gig || G.starting) return;
    if (!gigOpen(gig)) return;
    if (room && !sharedRun) {
      if (!room.host) { hubToast('The host chooses the co-op gig.'); return; }
      try {
        await roomRequest('start',{...room,gig:gig.id,seconds:gig.seconds});
        roomStatus('Starting '+gig.title+'…');
      } catch (error) { hubToast(error.message); }
      return;
    }
    if (!G.ready) {
      G.pendingGig = gig;
      hubToast('The city is still loading. The gig starts the moment it is ready.');
      return;
    }
    G.starting = true;
    try {
      if (G.mode === 'running' || G.mode === 'paused') {
        try { mb?.run?.end({ seconds: +G.elapsed.toFixed(1), quit: true }); } catch (e) {}
      }
      const crew = sharedRun ? gig.crew.slice() : crewFor(gig);
      const needLoad = crew.some((k) => !kindData[k] || !kindData[k].gltf);
      if (needLoad) hubToast('Somebody is already looking for you...', 4000);
      await Promise.all([...crew.map(loadKind), new Promise(done=>setTimeout(done,sharedRun?.delay || 0))]);
      if (sharedRun && (room?.run !== sharedRun.id || G.mode !== 'hub')) {
        if (room?.run === sharedRun.id) room.mode = 'left';
        return;
      }
      G.gig = gig;
      G.crew = crew;
      G.hasPolice = crew.includes('police');
      const d = districtById(gig.d);
      P.district = d.id;
      Sound.stopMusic();
      Sound.unlock();
      Sound.startLoops();
      Sound.play('ui_start', { vol: 0.62 });
      assembleCrew(crew);
      applyDistrict(d);
      const seed = sharedRun?.seed ?? ATL.GIGS.indexOf(gig) * 131 + ((P.done[gig.id] || 0) * 17);
      buildObstacles(d.tier, seed);
      placeCash(9001 + seed, gig.seconds);
      resetRun(d.tier);
      G.started = true;
      G.mode = 'running';
      for (const id of ['startScreen', 'endScreen', 'pauseScreen', 'hubScreen', 'helpScreen']) $(id).classList.add('hidden');
      ui.hud.classList.remove('hidden');
      ui.hud.setAttribute('aria-hidden', 'false');
      document.body.classList.remove('danger');
      camera.position.set(player.x + 0.4, 2.4, 6.2);
      try { mb?.run?.start(); } catch (e) {}
      try { mb?.event('gig_started', { gig: gig.id, district: d.id, track: gig.track.toLowerCase() }); } catch (e) {}
      toast(`${d.name.toUpperCase()} \u00b7 ${gig.title.toUpperCase()}`, 2600);
    } finally {
      G.starting = false;
    }
  }
  function startRun() { startGig(G.gig || gigById(HUB.gig) || ATL.GIGS[0]); }

  function pauseRun() {
    if (G.mode !== 'running') return;
    G.mode = 'paused';
    syncCombat();
    try { mb?.run?.pause(); } catch (e) {}
    ui.pause.classList.remove('hidden');
    Sound.play('ui_start', { vol: 0.25, rate: 0.8 });
    padFocusFirst();
  }

  function resumeRun() {
    if (G.mode !== 'paused') return;
    G.mode = 'running';
    syncCombat();
    ui.pause.classList.add('hidden');
    Sound.unlock();
    try { mb?.run?.resume(); } catch (e) {}
    G.lastNow = performance.now();
  }

  function leaveToMenu() {
    if (G.mode === 'running' || G.mode === 'paused') {
      try { mb?.run?.end({ seconds: +G.elapsed.toFixed(1), quit: true }); } catch (e) {}
    }
    Sound.stopLoops();
    showHub('You walked away. Nothing gained, nothing lost.');
  }

  function restartRun() {
    if (room) { showHub('Choose the next gig from the co-op lobby.'); return; }
    ui.pause.classList.add('hidden');
    ui.end.classList.add('hidden');
    startGig(G.gig);
  }

  function endRun(kind) {
    if (G.mode !== 'running') return;
    G.mode = kind;
    G.endKind = kind;
    G.shake = 0.3;
    const gig = G.gig, d = G.district;
    const survived = kind === 'escaped' ? G.surviveSeconds : G.elapsed;
    player.speed = kind === 'escaped' ? player.speed : 0;
    Sound.stopLoops();
    if (player.mixer) {
      const run = player.actions.run || player.actions.walk;
      if (run) run.fadeOut(0.12);
      const pose = kind === 'caught' ? player.actions.hurt : player.actions.cheer;
      if (pose) {
        pose.reset();
        pose.setLoop(THREE.LoopOnce, 1);
        pose.clampWhenFinished = true;
        pose.fadeIn(0.12).play();
        player.activeClip = kind === 'caught' ? 'hurt' : 'cheer';
      }
    }
    const before = rankIndex();
    const res = { kind, by: G.caughtBy, pay: 0, picked: G.runCash, kept: 0, lost: 0, rep: 0, income: 0, heatBefore: P.heat, rankUp: null, won: false };
    if (kind === 'caught') {
      playSound('caught', { vol: 0.9 });
      playSound('hit_obstacle', { vol: 0.8 });
      const near = nearestCop();
      if (near) { near.gap = 1.1; }
      const by = G.caughtBy || G.crew[0];
      res.by = by;
      if (by === 'police') {
        const bail = Math.round(Math.min(P.cash, P.cash * 0.1 + 50 * d.tier));
        P.cash -= bail; res.lost = bail; P.heat = 0;
      } else if (by === 'dealer') {
        const loss = Math.min(P.rep, 3 * d.tier);
        P.rep -= loss; res.rep = -loss;
      } else if (by === 'boss') {
        const tax = Math.round(P.cash * 0.2);
        P.cash -= tax; res.lost = tax;
      } else if (by === 'promoter') {
        res.kept = Math.floor(G.runCash / 2);
        P.cash += res.kept;
      }
      if (by !== 'police') P.heat = clamp(P.heat + Math.round(gig.heat / 2), 0, 100);
    } else {
      playSound('escaped', { vol: 0.85 });
      res.pay = payFor(gig);
      res.rep = repFor(gig);
      res.kept = G.runCash;
      P.cash += res.pay + res.kept;
      P.rep += res.rep;
      P.tracks[gig.track] = (P.tracks[gig.track] || 0) + 1;
      P.done[gig.id] = (P.done[gig.id] || 0) + 1;
      P.escapes = (P.escapes || 0) + 1;
      P.heat = clamp(P.heat + gig.heat - (G.hasPolice ? 0 : 6), 0, 100);
      if (gig.track === 'FINAL') { P.won = true; res.won = true; }
    }
    res.income = incomeTotal();
    P.cash += res.income;
    P.gigs = (P.gigs || 0) + 1;
    const after = rankIndex();
    if (after > before) res.rankUp = ATL.RANKS[after].name;
    const worth = netWorthOf(P);
    P.best = Math.max(P.best || 0, worth);
    G.result = res;
    spawnEndFx(kind);
    try {
      mb?.run?.end({ seconds: +survived.toFixed(1), district: d.id, gig: gig.id, escaped: kind === 'escaped', cash: res.kept + res.pay });
      mb?.event(kind === 'escaped' ? 'escaped' : 'caught', { district: d.id, by: res.by || 'none' });
      mb?.event('net_worth', { value: worth });
      if (res.won) mb?.event('took_over');
      if (mb && mb.leaderboard) {
        mb.leaderboard.submit('networth', worth, { label: 'Empire net worth ($)' }).catch(() => {});
      }
    } catch (e) { /* ignore */ }
    saveProgress();
    setTimeout(() => showEnd(kind, survived), 950);
  }

  function nearestCop() {
    let best = null;
    for (const c of cops) {
      if (!c.active || c.stunnedUntil>G.elapsed) continue;
      if (!best || c.gap < best.gap) best = c;
    }
    return best;
  }

  function spawnEndFx(kind) {
    if (kind === 'caught') {
      ui.fxRed.style.opacity = '0.55';
      setTimeout(() => { ui.fxRed.style.opacity = '0'; }, 700);
    } else {
      ui.fxBlue.style.opacity = '0.25';
      setTimeout(() => { ui.fxBlue.style.opacity = '0'; }, 900);
    }
  }

  function showEnd(kind, survived) {
    if (G.mode !== kind) return;
    const res = G.result || {};
    const recap = $('endCombat');
    recap.hidden = !combatStats.shots && !combatStats.shoves;
    recap.textContent = combatStats.hits + '/' + combatStats.shots + ' shots landed · ' + combatStats.shoves + ' successful shoves';
    ui.hud.classList.add('hidden');
    ui.hud.setAttribute('aria-hidden', 'true');
    const escaped = kind === 'escaped';
    const d = G.district;
    const head = $('endHead');
    head.textContent = res.won ? 'THE A IS YOURS' : (escaped ? 'ESCAPED' : 'CAUGHT');
    head.className = 'end-head ' + (res.won ? 'won' : escaped ? 'free' : 'caught');
    const word = $('endWord');
    if (res.won) {
      word.textContent = 'TOP OF THE EMPIRE';
      word.style.color = '#F2C14E';
      ui.endLine.textContent = 'Peach City Empire runs the A. From the West End to the penthouse on Peachtree.';
    } else if (escaped) {
      word.textContent = 'GOT AWAY';
      word.style.color = '#7dff8a';
      ui.endLine.textContent = `You made it out of ${d.name}. ${G.gig.title}: done.`;
    } else {
      const c = ATL.CAUGHT[res.by] || ATL.CAUGHT.police;
      word.textContent = `${c.stamp} BY ${ATL.KINDS[res.by].short}`;
      word.style.color = ATL.KINDS[res.by].color;
      ui.endLine.textContent = c.line;
    }
    ui.endSub.textContent = `${d.name} \u00b7 ${fmt(survived)} on the run`;
    ui.statLeftK.textContent = escaped ? 'GIG PAID' : (res.lost ? 'LOST' : 'GIG PAID');
    ui.statLeftV.textContent = escaped ? money(res.pay) : (res.lost ? '-' + money(res.lost) : '$0');
    ui.statMidK.textContent = 'STREET CASH';
    ui.statMidV.textContent = res.kept === res.picked ? money(res.kept) : `${money(res.kept)} of ${money(res.picked)}`;
    ui.statRightK.textContent = 'PROPERTY PAID';
    ui.statRightV.textContent = money(res.income);
    const notes = [];
    if (res.rep) notes.push(`Rep ${res.rep > 0 ? '+' : ''}${res.rep}`);
    notes.push(`Cash ${money(P.cash)}`);
    if (res.rankUp) notes.push(`New rank: ${res.rankUp}`);
    if (P.heat >= 60) notes.push('Heat is high: police join every chase');
    ui.endCredit.textContent = notes.join(' \u00b7 ');
    ui.againBtn.textContent = 'Run it back';
    ui.againBtn.classList.toggle('hidden', !!res.won);
    ui.end.classList.remove('hidden');
    padFocusFirst();
    try { mb?.event('end_screen', { result: kind, district: d.id }); } catch (e) {}
  }

  function refreshStartMeta() {
    ui.startLevel.textContent = ATL.RANKS[rankIndex()].name.toUpperCase();
    ui.startBest.textContent = `NET WORTH ${money(netWorthOf(P))}`;
    ui.loadNote.textContent = G.ready ? '' : 'loading the city';
  }

  function showMenu() {
    G.mode = 'menu';
    G.started = false;
    for (const id of ['endScreen', 'pauseScreen', 'hubScreen', 'helpScreen']) $(id).classList.add('hidden');
    ui.start.classList.remove('hidden');
    ui.hud.classList.add('hidden');
    ui.hud.setAttribute('aria-hidden', 'true');
    Sound.stopLoops();
    refreshStartMeta();
    padFocusFirst();
  }

  function triggerVault() {
    if (G.mode !== 'running') return;
    if (player.jumping || player.stumbleT > 0.15) return;
    player.jumping = true; player.jumpT = 0;
    if (player.mixer) {
      const run = player.actions.run || player.actions.walk;
      if (run && !run.isRunning()) { run.reset().fadeIn(0.08).play(); }
      player.activeClip = 'run';
    }
    playSound('vault', { vol: 0.8 });
    pulseButton('vault');
    try { mb?.event('vault'); } catch (e) {}
  }

  function triggerSlide() {
    if (G.mode !== 'running') return;
    if (player.sliding) return;
    if (player.jumping) { player.jumping = false; player.jumpT = 0; player.y = 0; }
    player.sliding = true; player.slideT = 0;
    playSound('vault', { vol: 0.55, rate: 0.82 });
    pulseButton('slide');
    try { mb?.event('slide'); } catch (e) {}
  }

  function hitObstacle() {
    if (player.inv > 0) return;
    player.inv = 1.15;
    player.stumbleT = 0.6;
    G.shake = 0.18;
    ui.fxRed.style.opacity = '0.3';
    setTimeout(() => { ui.fxRed.style.opacity = '0'; }, 160);
    playSound('hit_obstacle', { vol: 0.9 });
    player.flinch = 0.9;
    if (player.jumping) { player.jumping = false; player.jumpT = 0; player.y = 0; }
    for (const c of cops) if (c.active) c.gap = Math.max(2.6, c.gap - 1.0);
    try { mb?.event('hit'); } catch (e) {}
  }

  function handleCollisions() {
    const px = player.x, pz = player.z;
    for (const c of colliders) {
      if (Math.abs(c.z - pz) > c.d / 2 + 0.6) continue;
      if (Math.abs(c.x - px) > c.w / 2 + 0.33) continue;
      if (c.kind === 'puddle') { player.inPuddle = true; continue; }
      if (c.slide && c.kind === 'tape') {
        if (player.sliding) continue;
        hitObstacle(); continue;
      }
      if (player.y > c.h + 0.06) continue;
      if (player.sliding && c.h > 0.7 && c.kind !== 'car' && c.kind !== 'tape') {
        hitObstacle(); continue;
      }
      hitObstacle();
    }
  }

  function syncCharacter(c, dt, speed) {
    if (!c.mixer) return;
    c.mixer.update(dt);
  }

  const _armPos = new THREE.Vector3(), _forePos = new THREE.Vector3(), _armDir = new THREE.Vector3();
  const _armQ = new THREE.Quaternion(), _parQ = new THREE.Quaternion(), _adjQ = new THREE.Quaternion(), _wantDir = new THREE.Vector3();
  function poseArm(bone, child, swing) {
    if (!bone || !child) return;
    bone.getWorldPosition(_armPos);
    child.getWorldPosition(_forePos);
    _armDir.subVectors(_forePos, _armPos);
    if (_armDir.lengthSq() < 1e-6) return;
    _armDir.normalize();
    const sideSign = _armDir.x >= 0 ? 1 : -1;
    _wantDir.set(sideSign * 0.18, -0.92, swing).normalize();
    _armQ.setFromUnitVectors(_armDir, _wantDir);
    bone.parent.getWorldQuaternion(_parQ);
    _adjQ.copy(_parQ).invert().multiply(_armQ).multiply(_parQ);
    bone.quaternion.premultiply(_adjQ);
    bone.updateMatrixWorld(true);
  }
  function poseArmsFor(root, hook, t, amount) {
    if (!root || !hook) return;
    hook.updateMatrixWorld(true);
    const swing = Math.sin(t * 9.5) * 0.2 * (amount || 1);
    poseArm(root.getObjectByName('LeftArm'), root.getObjectByName('LeftForeArm'), swing);
    poseArm(root.getObjectByName('RightArm'), root.getObjectByName('RightForeArm'), -swing);
  }
  function poseArms() {
    poseArmsFor(player.root, player.hook, player.mixer ? player.mixer.time : G.elapsed, 1);
  }

  function updatePlayer(dt) {
    const waveSpeed = 1 + (G.wave - 1) * 0.022;
    let base = (tune.run_speed || 7.6) * waveSpeed * (1 + (G.level - 1) * 0.022);
    let target = base;
    const up = (keys.up ? 1 : 0) + (joy.y < -0.25 ? -joy.y : 0) + (pad.y < -0.3 ? -pad.y : 0);
    const down = (keys.down ? 1 : 0) + (joy.y > 0.3 ? joy.y : 0) + (pad.y > 0.3 ? pad.y : 0);
    target *= 1 + clamp(up, 0, 1) * 0.12;
    target *= 1 - clamp(down, 0, 1) * 0.22;
    if (player.sliding) target += 3.0;
    if (player.stumbleT > 0) target *= 0.55;
    if (player.inPuddle) target *= 0.62;
    player.speed = damp(player.speed, target, player.stumbleT > 0 ? 8 : 4.2, dt);
    player.speed = clamp(player.speed, 1.0, 13.5);
    G.speed = player.speed;

    const steerKey = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    const steer = clamp(steerKey + joy.x + pad.x, -1, 1);
    const lateralTarget = steer * (5.0 + (player.sliding ? 1.6 : 0));
    player.lateral = damp(player.lateral, lateralTarget, steer === 0 ? 7 : 9, dt);
    player.x = clamp(player.x + player.lateral * dt, -3.3, 3.3);

    player.inPuddle = false;
    player.z -= player.speed * dt;

    if (player.jumping) {
      player.jumpT += dt;
      const d = 0.78;
      const t = player.jumpT / d;
      player.y = Math.sin(Math.PI * clamp(t, 0, 1)) * 1.5;
      if (t >= 1) {
        player.jumping = false; player.y = 0; G.dip = -0.16;
          }
    }
    if (player.sliding) {
      player.slideT += dt;
      if (player.slideT > 0.74) { player.sliding = false; player.slideT = 0; }
    }
    if (player.stumbleT > 0) player.stumbleT -= dt;
    if (player.inv > 0) player.inv -= dt;

    if (player.hook) {
      player.hook.position.set(player.x, player.y, player.z);
      const forward = new THREE.Vector3(player.lateral * 0.18, 0, -1);
      const yaw = Math.atan2(forward.x, forward.z);
      player.hook.rotation.y = yaw;
      player.hook.rotation.z = clamp(-player.lateral * 0.012, -0.06, 0.06);
    }
    if (player.flinch > 0) player.flinch = Math.max(0, player.flinch - dt);
    if (player.root) {
      const squash = player.sliding ? 0.72 : 1;
      const flinchLean = player.flinch > 0 ? Math.min(0.26, player.flinch * 0.42) : 0;
      const runLean = (!player.sliding && G.mode === 'running') ? (player.jumping ? 0.2 : 0.07) : 0;
      player.root.rotation.x = damp(player.root.rotation.x, (player.sliding ? 0.3 : runLean) + flinchLean, 12, dt);
      player.root.rotation.z = player.flinch > 0 ? Math.sin(G.elapsed * 32) * 0.045 * player.flinch : 0;
      const bs = player.root.userData.baseScale;
      if (bs) {
        player.root.scale.x = bs.x;
        player.root.scale.z = bs.z;
        player.root.scale.y = damp(player.root.scale.y, bs.y * squash, 10, dt);
      }
    }
    if (player.mixer) {
      const run = player.actions.run || player.actions.walk;
      if (run && player.activeClip === 'run') {
        run.timeScale = clamp(player.speed / (player.clipSpeed || 4.7), 0.9, 1.9);
      }
      player.mixer.update(dt);
      poseArms();
    }
    if (player.blob) {
      player.blob.position.set(player.x, 0.028, player.z);
      const ground = player.jumping ? 0.12 : 0.42;
      player.blob.material.opacity = ground;
      const spread = player.jumping ? 1.1 : 0.9;
      player.blob.scale.set(spread, spread, 1);
    }
    if (player.contact) {
      player.contact.position.set(player.x, 0.03, player.z);
      player.contact.material.opacity = player.jumping ? 0.16 : 0.5;
    }
    if (player.glint) {
      player.glint.position.set(player.x, 0.032, player.z);
      player.glint.material.opacity = player.jumping ? 0.02 : 0.06;
    }
    updateFootRipples(dt);
    handleCollisions();

    const nearest = nearestCop();
    if (nearest) {
      G.nearestGap = nearest.gap;
      if (nearest.gap < 1.5) { G.caughtBy = nearest.kind; endRun('caught'); }
    }
    if (G.elapsed >= G.surviveSeconds) endRun('escaped');
  }

  function updatePoliceCar(dt) {
    if (suv) {
      suv.group.visible = !G.hasPolice;
      if (!G.hasPolice) {
        suv.x = damp(suv.x, player.x * 0.55 + 1.2, 2.4, dt);
        suv.group.position.set(suv.x, 0, player.z + suv.gap);
        suv.under.material.opacity = 0.35 + 0.2 * Math.sin(G.elapsed * 4);
      }
    }
    if (!policeCar) return;
    policeCar.group.visible = G.hasPolice;
    if (!G.hasPolice) return;
    const tx = player.x * 0.55 + 1.2;
    policeCar.x = damp(policeCar.x, tx, 2.4, dt);
    policeCar.group.position.set(policeCar.x, 0, player.z + policeCar.gap);
    const blue = G.blue, red = G.red;
    policeCar.blueMat.color.setRGB(0.05 + 0.2 * blue, 0.12 + 0.42 * blue, 0.25 + 0.75 * blue);
    policeCar.redMat.color.setRGB(0.28 + 0.72 * red, 0.05 + 0.08 * red, 0.05 + 0.08 * red);
    policeCar.bGlow.material.opacity = 0.15 + 0.85 * blue;
    policeCar.rGlow.material.opacity = 0.15 + 0.85 * red;
  }

  function updateFlankCops(dt) {
    for (let i = 0; i < flankCops.length; i++) {
      const c = flankCops[i];
      if(c.stunnedUntil>G.elapsed)continue;
      if(c.stunnedUntil){c.stunnedUntil=0;c.active=false;}
      if (!c.active) {
        c.active = true;
        c.z = player.z - 9 - i * 5 - rand() * 3;
        c.x = c.side * (1.7 + i * 1.1);
        c.hook.visible = true;
      }
      c.z += (4.2 + (G.wave - 1) * 0.3) * dt;
      c.x = damp(c.x, c.side * (1.8 + Math.sin(G.elapsed * 0.8 + i * 2.1) * 0.7), 1.4, dt);
      c.hook.position.set(c.x, 0, c.z);
      c.hook.rotation.y = 0;
      if (c.mixer) {
        c.mixer.update(dt);
        poseArmsFor(c.root, c.hook, c.mixer.time, 1);
      }
      if (c.strobe && c.halo && c.kind !== 'police') {
        const col = ATL.KINDS[c.kind].color;
        c.strobe.material.color.set(col);
        c.strobe.material.opacity = 0.35;
        c.halo.material.color.set(col);
        c.halo.material.opacity = 0.3 + 0.1 * Math.sin(G.elapsed * 5 + i);
      } else if (c.strobe && c.halo) {
        const blue = G.blue >= G.red;
        const col = blue ? tune.police_blue : tune.police_red;
        c.strobe.material.color.set(col);
        c.strobe.material.opacity = 0.45 + 0.55 * Math.max(G.blue, G.red);
        c.halo.material.color.set(col);
        c.halo.material.opacity = 0.12 + 0.45 * Math.max(G.blue, G.red);
      }
      if (c.z > player.z + 10) {
        c.z = player.z - 9 - rand() * 6;
        c.x = c.side * (1.7 + rand() * 1.2);
      }
    }
    let near = null;
    for (const c of flankCops) {
      if (!c.active) continue;
      if (!near || Math.abs(c.z - player.z) < Math.abs(near.z - player.z)) near = c;
    }
    if (near) {
      const blue = G.blue >= G.red;
      flankLight.position.set(near.x, 1.5, near.z);
      flankLight.color.set(near.kind === 'police' ? (blue ? tune.police_blue : tune.police_red) : ATL.KINDS[near.kind].color);
      flankLight.intensity = near.kind === 'police' ? 4 + 5 * Math.max(G.blue, G.red) : 5;
    } else {
      flankLight.intensity = 0;
    }
  }

  function updateCops(dt) {
    const wave = G.wave;
    const copSpeed = (tune.run_speed || 7.6) * (0.94 + (wave - 1) * 0.055) * (tune.cop_pressure || 1) + (G.level - 1) * 0.035;
    for (const c of cops) {
      if (!c.active || c.stunnedUntil>G.elapsed) continue;
      if(c.stunnedUntil){c.stunnedUntil=0;c.gap=7.4;c.hook.visible=true;}
      const closing = copSpeed - player.speed;
      c.gap -= closing * dt;
      c.gap = clamp(c.gap, 1.2, 7.4);
      const wob = Math.sin(G.elapsed * 0.65 + c.phase) * 0.55;
      const spread = H > W ? 0.42 : 0.8;
      const tx = clamp(player.x + (c.offset + wob) * spread, -3.2, 3.2);
      c.x = damp(c.x === undefined ? tx : c.x, tx, 3.2, dt);
      c.hook.position.set(c.x, 0, player.z + 1.4 + Math.max(0, c.gap - 1.4) * 0.55);
      c.hook.rotation.y = Math.PI + clamp((player.x - c.x) * 0.04, -0.2, 0.2);
      if (c.mixer) {
        c.mixer.update(dt);
        const run = c.actions.run || c.actions.walk;
        if (run) run.timeScale = clamp(copSpeed / 5.798, 0.8, 1.6);
        poseArmsFor(c.root, c.hook, c.mixer.time, 1);
      }
      if (c.strobe) {
        if (c.kind === 'police') {
          const blue = G.blue >= G.red;
          c.strobe.material.color.set(blue ? tune.police_blue : tune.police_red);
          c.strobe.material.opacity = 0.28 + 0.72 * Math.max(G.blue, G.red);
        } else {
          c.strobe.material.opacity = 0.0;
        }
      }
    }
    let minGap = 24;
    for (const c of cops) if (c.active && !(c.stunnedUntil>G.elapsed)) minGap = Math.min(minGap, c.gap);
    G.nearestGap = minGap;
    const closeness = clamp(1 - (minGap - 1.4) / 20, 0, 1);
    const heat = 0.22 + wave * 0.19;
    G.pressure = clamp(closeness * heat, 0, 1);
    if (G.pressure > 0.45) G.pressure = clamp(G.pressure + (wave - 1) * 0.008, 0, 1);
  }

  function updateSiren(dt) {
    const wave = G.wave;
    const rate = 3.6 + wave * 1.05 + G.pressure * 3.2;
    const t = G.elapsed * rate;
    const blue = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 5);
    const red = Math.pow(Math.max(0, Math.sin((t + 0.5) * Math.PI * 2)), 5);
    let b = blue, r = red;
    if (!G.firstFlash && G.elapsed > 1.7) {
      G.firstFlash = true;
      G.wide = 1;
      b = 1.4; r = 0.3;
    }
    if (!G.hasPolice) {
      const pulse = 0.5 + 0.5 * Math.sin(G.elapsed * (2.2 + G.pressure * 3));
      G.blue = 0; G.red = 0;
      const accent = ATL.KINDS[G.crew[0]] ? ATL.KINDS[G.crew[0]].color : '#ff3344';
      blueLight.color.set(accent); redLight.color.set(accent);
      blueLight.position.set(player.x - 1.5, 2.2, player.z + 10.5);
      redLight.position.set(player.x + 1.5, 2.2, player.z + 9.5);
      blueLight.intensity = 10 + pulse * 26 * (0.4 + G.pressure);
      redLight.intensity = 6 + pulse * 18 * (0.4 + G.pressure);
      chaseSpot.position.set(player.x, 1.4, player.z + 9.5);
      chaseSpot.target.position.set(player.x, 0.8, player.z - 2.0);
      chaseSpot.intensity = (software || mobile) ? 0 : 30;
      fillLight.position.set(player.x - 9, 7, player.z + 11);
      fillLight.target.position.set(player.x, 1, player.z - 6);
      fillLight.target.updateMatrixWorld();
      walkLight.position.set(6.85, 2.8, player.z - 5);
      walkLight.intensity = 170;
      washMatL.color.set(accent); washMatR.color.set(accent);
      washMatL.opacity = washMatR.opacity = 0.08 + pulse * 0.12 * G.pressure;
      washL.position.set(-9.15, 3.6, player.z - 6);
      washR.position.set(9.15, 3.6, player.z - 6);
      ui.fxBlue.style.opacity = '0';
      ui.fxRed.style.opacity = String(G.pressure > 0.6 ? (G.pressure - 0.6) * 0.5 * pulse : 0);
      return;
    }
    blueLight.color.set(tune.police_blue); redLight.color.set(tune.police_red);
    G.blue = b; G.red = r;
    blueLight.position.set(player.x - 1.5, 2.7, player.z + 10.5);
    redLight.position.set(player.x + 1.5, 2.7, player.z + 9.5);
    chaseSpot.position.set(player.x, 2.45, player.z + 9.5);
    chaseSpot.target.position.set(player.x, 1.0, player.z - 2.0);
    fillLight.position.set(player.x - 9, 7, player.z + 11);
    fillLight.target.position.set(player.x, 1, player.z - 6);
    fillLight.target.updateMatrixWorld();
    walkLight.position.set(6.85, 2.8, player.z - 5);
    walkLight.intensity = 170;
    chaseSpot.intensity = (software || mobile) ? 0 : 38;
    blueLight.intensity = 8 + b * 72;
    redLight.intensity = 6 + r * 62;
    const c = new THREE.Color();
    if (b > r) c.set(tune.police_blue); else c.set(tune.police_red);
    washMatL.color.copy(c); washMatR.color.copy(c);
    washMatL.opacity = Math.max(b, r) * 0.42;
    washMatR.opacity = Math.max(b, r) * 0.42;
    washL.position.set(-9.15, 3.6, player.z - 6);
    washR.position.set(9.15, 3.6, player.z - 6);
    ui.fxBlue.style.opacity = String(b * 0.36);
    ui.fxRed.style.opacity = String(r * 0.34);
  }

  function updateLampLights() {
    if (!world) return;
    const lamps = world.lamps;
    if (!lamps.length) return;
    let i0 = 0;
    let best = 1e9;
    for (let i = 0; i < lamps.length; i++) {
      const d = Math.abs(lamps[i].z - player.z);
      if (d < best) { best = d; i0 = i; }
    }
    const picks = [i0];
    for (let d = 1; d < lamps.length && picks.length < 4; d++) {
      if (i0 - d >= 0) picks.push(i0 - d);
      if (picks.length < 4 && i0 + d < lamps.length) picks.push(i0 + d);
    }
    for (let k = 0; k < lampLights.length; k++) {
      const idx = picks[k];
      if (idx === undefined) { lampLights[k].intensity = 0; continue; }
      const l = lamps[idx];
      const dist = Math.abs(l.z - player.z);
      const fade = clamp(1 - dist / 44, 0, 1);
      lampLights[k].position.set(l.x, l.y, l.z);
      lampLights[k].intensity = 520 * fade * fade;
    }
  }

  function updateCamera(dt) {
    const portrait = H > W;
    const back = portrait ? 9.6 : 8.0;
    const baseY = portrait ? 5.2 : 3.9;
    const tx = player.x * 0.78 + (portrait ? 0.55 : 0.7);
    const tz = player.z + back;
    const ty = baseY + G.dip - G.shake * 0.4;
    camera.position.x = damp(camera.position.x, tx, 5.5, dt);
    camera.position.z = damp(camera.position.z, tz, 7.5, dt);
    camera.position.y = damp(camera.position.y, ty, 6, dt);
    const lookX = player.x * 0.9;
    const lookY = (portrait ? 0.9 : 1.0) + player.y * 0.45;
    const lookZ = player.z - (portrait ? 6.5 : 8.5);
    const shakeX = (Math.random() - 0.5) * G.shake;
    const shakeY = (Math.random() - 0.5) * G.shake;
    camera.lookAt(lookX + shakeX, lookY + shakeY, lookZ);
    camera.rotateZ(clamp(-player.lateral * 0.006, -0.035, 0.035));
    const baseFov = portrait ? 66 : 56;
    const targetFov = baseFov + (G.wide > 0 ? 6 * Math.min(1, G.wide) : 0) - G.pressure * 4.5;
    camera.fov = damp(camera.fov, targetFov, 4, dt);
    if (Math.abs(camera.fov - camera.userData._fov || 0) > 0.02) {
      camera.updateProjectionMatrix();
      camera.userData._fov = camera.fov;
    }
    G.dip = damp(G.dip, 0, 6, dt);
    G.shake = damp(G.shake, 0, 5, dt);
    G.wide = damp(G.wide, 0, 1.3, dt);
    if (skyline) {
      const dist = Math.min(320, camera.far - 12);
      const k = dist / 320;
      skyline.scale.set(k, k, 1);
      skyline.position.set(camera.position.x * 0.3, 56 * k, camera.position.z - dist);
    }
    dir.position.set(player.x + 20, 34, player.z + 14);
    dir.target.position.set(player.x, 0, player.z - 8);
    dir.target.updateMatrixWorld();
  }

  function updateHUD() {
    const remaining = Math.max(0, G.surviveSeconds - G.elapsed);
    ui.timerNum.textContent = fmt(remaining);
    const prog = clamp(G.elapsed / G.surviveSeconds, 0, 1);
    ui.timerArc.style.strokeDashoffset = String(ARC_LEN * prog);
    ui.timerWrap.classList.toggle('low', remaining <= 10.001);
    if (remaining <= 10) ui.timerArc.style.stroke = '#D8322E';
    else ui.timerArc.style.stroke = tune.lamp;
    ui.pips.style.clipPath = `inset(0 0 0 ${prog * 100}%)`;
    ui.pursuitFill.style.transform = `translateY(-50%) scaleX(${G.pressure})`;
    ui.pursuit.classList.toggle('tremble', G.pressure > 0.5);
    ui.pursuitFill.style.setProperty('--p', G.pressure);
    let msg = 'CLEAR';
    if (G.pressure > 0.75) msg = 'CLOSING';
    else if (G.pressure > 0.45) msg = 'IN SIGHT';
    else if (G.pressure > 0.08) msg = 'NEAR';
    ui.wanted.textContent = msg;
    document.body.classList.toggle('danger', G.pressure > 0.62 || remaining <= 8);
    ui.copHint.style.opacity = String(clamp((G.pressure - 0.25) * 1.4, 0, 0.9));
  }

  function updateWave() {
    const f = G.elapsed / G.surviveSeconds;
    const w = f < 0.22 ? 1 : f < 0.5 ? 2 : f < 0.78 ? 3 : 4;
    if (w !== G.wave) {
      G.wave = w;
      ui.waveLabel.textContent = `WAVE ${w}`;
      rebuildCopsForWave(w);
      const counts = [2, 3, 5, 7];
      const fresh = cops.slice(counts[w - 2] || 0, counts[w - 1]).map((c) => ATL.KINDS[c.kind].short);
      const who = [...new Set(fresh)].join(' + ') || 'THEY';
      toast(w === 4 ? `WAVE 4 \u00b7 EVERYBODY IS ON YOU` : `WAVE ${w} \u00b7 MORE ${who}`, 2200);
      try { mb?.event('wave', { wave: w }); } catch (e) {}
    }
  }

  function updateTutorials() {
    if (!G.tutorialCash && player.z < -4) {
      G.tutorialCash = true;
      toast('Grab the cash. You keep it if you get away', 2600);
    }
    if (!G.tutorialVault && player.z < -36) {
      G.tutorialVault = true;
      toast('Low wall ahead: keep to the open lane', 2600);
      pulseButton('vault');
    }
    if (!G.tutorialSlide && player.z < -90) {
      G.tutorialSlide = true;
      toast('Barrier ahead: keep to the open lane', 2600);
      pulseButton('slide');
    }
  }

  const JS_TOUCH = coarse;

  function updateDoor(dt) {
    if (!door.group) return;
    if (!door.target && G.elapsed > 0.75) door.target = 1;
    door.open = damp(door.open, door.target, 3.2, dt);
    door.group.rotation.y = 0.05 + door.open * 1.45;
  }

  function updateRain(dt) {
    if (!rain) return;
    rain.update(dt, camera.position);
  }

  function makeRain() {
    const count = software ? 320 : (mobile ? 520 : 1500);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 46;
      pos[i * 3 + 1] = Math.random() * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 46;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: world.T.rain, color: 0xc6d4e4, size: 0.8, sizeAttenuation: true,
      transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    rain = {
      pts, geo, count, pos,
      update(dt, cam) {
        pts.position.set(cam.x, 0, cam.z);
        for (let i = 0; i < count; i++) {
          let y = pos[i * 3 + 1] - dt * 11.5;
          if (y < 0) y += 22;
          pos[i * 3 + 1] = y;
          pos[i * 3] += dt * 0.7;
          if (pos[i * 3] > 23) pos[i * 3] -= 46;
        }
        geo.attributes.position.needsUpdate = true;
      }
    };
  }

  let lastTime = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000 || 0.016));
    lastTime = now;
    aimStick.x=aimStick.y=0;
    try { pollPad(now, dt); } catch (e) { /* controller hiccup */ }
    tick(dt, now);
    requestAnimationFrame(frame);
  }
  function tick(dt, now) {
    if (teammate?.visible) teammate.position.lerp(teammateTarget,1-Math.exp(-dt*12));
    if (G.mode === 'running') {
      G.elapsed += dt;
      if (reloadAt && G.elapsed >= reloadAt) {reloadAt=0;ammo=6;syncCombat();}
      $('crosshair').classList.toggle('confirmed-hit', G.elapsed < hitUntil);
      if (!G.perfStart && G.elapsed > 0.5) G.perfStart = now;
      if (G.perfStart) G.perfFrames++;
      if (!G.perfAdjusted && G.perfStart && now - G.perfStart > 3500) {
        G.perfAdjusted = true;
        const fps = G.perfFrames / ((now - G.perfStart) / 1000);
        if (fps < 38 && !software) {
          G.lowQuality = true;
          onResize();
        }
      }
      updateWave();
      updatePlayer(dt);
      updateCops(dt);
      updateFlankCops(dt);
      updatePoliceCar(dt);
      updateDoor(dt);
      updateLampLights();
      updateSiren(dt);
      updateCamera(dt);
      updateRain(dt);
      updateHazards(G.elapsed);
      updateCash(dt);
      updateTutorials();
      updateHUD();
    } else if (G.mode === 'paused') {
      updateCamera(0.016);
      updateSiren(0.016);
      updateRain(0.016);
    } else if (G.mode === 'caught' || G.mode === 'escaped') {
      G.shake = damp(G.shake, 0, 4, dt);
      updateCops(dt * 0.35);
      updateSiren(dt * 0.5);
      updateCamera(dt);
      updateRain(dt);
      updateCash(dt);
      if (player.mixer) player.mixer.update(dt * 0.35);
    } else if (G.mode === 'menu' && G.ready) {
      updateRain(dt);
      updateLampLights();
      updateSiren(dt);
      if (world) {
        const px = Math.sin(now * 0.00002) * 0.3;
        camera.position.set(px + 0.5, 2.4, 7.5);
        camera.lookAt(px, 1.4, -10);
      }
    }

    if (G.mode === 'running' || G.mode === 'paused' || G.mode === 'caught' || G.mode === 'escaped') {
      if (G.mode !== 'running' && !$('combatAimArea').hidden) syncCombat();
      if(view && (G.mode==='running'||G.mode==='paused')){
        aimCamera();
        const visible=player.hook.visible;
        player.hook.visible=false;
        const sinceShot = G.elapsed - shotAt;
        const recoil = Math.max(0, 1-sinceShot/.2);
        blaster.position.set(Math.min(.23, .33*combatCamera.aspect), -.18 - (reloadAt ? .18 : 0), -.56 + recoil*.1);
        blaster.rotation.x = recoil*.24;
        flash.visible = sinceShot < .065;
        blaster.visible = true;
        try {renderer.render(scene,combatCamera);} finally {
          player.hook.visible=visible;
          blaster.visible=false;
        }
      }else{renderer.render(scene,camera);drawMirror(dt);}
    }

    if (G.mode === 'running' || G.mode === 'paused') {
      if (G.frames === 0) G.firstFrameAt = now;
      G.frames++;
    }
  }

  function drawMirror(dt) {
    const slot = ui.mirrorSlot;
    if (!slot || slot.offsetParent === null) return;
    const rect = slot.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    mirrorAcc += dt;
    const every = software ? 0.34 : (mobile ? 0.3 : 0.1);
    if (mirrorAcc >= every) {
      mirrorAcc = 0;
      mirrorCam.fov = 34;
      mirrorCam.aspect = rect.width / rect.height;
      mirrorCam.updateProjectionMatrix();
      mirrorCam.position.set(player.x, 2.5, player.z + 0.3);
      const ac = activeCar();
      const carFocus = ac ? ac.group.position : null;
      if (carFocus) {
        mirrorCam.lookAt(carFocus.x, 1.35, carFocus.z);
      } else {
        const nc = nearestCop();
        if (nc) mirrorCam.lookAt(nc.hook.position.x, 1.2, nc.hook.position.z);
        else mirrorCam.lookAt(player.x, 1.15, player.z + 18);
      }
      const hidden = player.hook.visible;
      player.hook.visible = false;
      const blocked = [];
      for (const c of cops) {
        if (!c.active || !c.hook.visible) continue;
        if (c.hook.position.distanceToSquared(mirrorCam.position) < 100) {
          blocked.push(c);
          c.hook.visible = false;
        }
      }
      renderer.setRenderTarget(mirrorRT);
      renderer.render(scene, mirrorCam);
      renderer.setRenderTarget(null);
      for (const c of blocked) c.hook.visible = true;
      player.hook.visible = hidden;
    }
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    const vx = rect.left;
    const vy = Math.max(0, window.innerHeight - rect.bottom);
    renderer.setViewport(vx, vy, rect.width, rect.height);
    renderer.setScissor(vx, vy, rect.width, rect.height);
    renderer.render(mirrorScene, mirrorOrtho);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.setScissor(0, 0, W, H);
    renderer.autoClear = true;
  }

  function onResize() {
    W = window.innerWidth; H = window.innerHeight;
    const cap = software ? 0.7 : (mobile ? (G.lowQuality ? 1.05 : 1.5) : 3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }


  // ---------------------------------------------------------------- hub
  const HUB = { tab: 'streets', district: 'westend', gig: 'we_mixtape', confirmReset: false };

  function hubToast(text, ms) {
    const el = $('hubToast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(hubToast._t);
    hubToast._t = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  function showHub(msg) {
    if (room?.run && ['running','paused'].includes(G.mode)) room.mode = 'left';
    G.mode = 'hub';
    G.started = false;
    for (const id of ['startScreen', 'endScreen', 'pauseScreen']) $(id).classList.add('hidden');
    ui.hud.classList.add('hidden');
    ui.hud.setAttribute('aria-hidden', 'true');
    ui.hubScreen.classList.remove('hidden');
    Sound.stopLoops();
    Sound.unlock();
    Sound.startMusic();
    const d = districtById(HUB.district);
    if (!d || rankIndex() < d.rank) HUB.district = 'westend';
    renderHub();
    if (msg) hubToast(msg);
    if (!P.helpSeen) { showHelp(); }
    else padFocusFirst();
  }

  function showHelp() {
    ui.help.classList.remove('hidden');
    padFocusFirst();
  }
  function hideHelp() {
    ui.help.classList.add('hidden');
    if (!P.helpSeen) { P.helpSeen = true; saveProgress(); }
    padFocusFirst();
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderHub() {
    const ri = rankIndex();
    $('rankName').textContent = ATL.RANKS[ri].name;
    const ladder = $('rankLadder');
    ladder.replaceChildren(...ATL.RANKS.map((r, i) => { const s2 = el('i', i <= ri ? 'on' : ''); s2.title = r.name; return s2; }));
    $('hubCashV').textContent = money(P.cash);
    $('hubRepV').textContent = String(P.rep);
    $('hubHeatV').textContent = String(Math.round(P.heat));
    $('hubHeatBar').style.width = `${clamp(P.heat, 0, 100)}%`;
    $('hubHeatBar').classList.toggle('hot', P.heat >= 60);
    $('hubPropsV').textContent = `${P.owned.length} / ${ATL.PROPERTIES.length}`;
    let goal;
    if (P.won) goal = 'You run the A. Every gig still pays: keep stacking and climb the net worth board.';
    else if (P.owned.includes('tower')) goal = 'Endgame: take The Takeover in Buckhead and claim the top of the empire.';
    else if (ri < 5) {
      const nx = ATL.RANKS[ri + 1];
      const unlock = ATL.DISTRICTS.filter((d) => d.rank === ri + 1).map((d) => d.name).join(' and ');
      goal = `Next rank, ${nx.name}: ${nx.rep} rep${nx.props ? ` and ${nx.props} propert${nx.props > 1 ? 'ies' : 'y'}` : ''}${unlock ? `. Opens ${unlock}` : ''}. End goal: own the Empire Tower on Peachtree, then win The Takeover.`;
    } else goal = `Label Boss. Buy the Empire Tower on Peachtree (${money(propById('tower').price)}) to open The Takeover.`;
    $('hubGoal').textContent = goal;
    for (const t of document.querySelectorAll('.tab')) t.classList.toggle('on', t.dataset.tab === HUB.tab);
    $('tabStreets').classList.toggle('hidden', HUB.tab !== 'streets');
    $('tabProps').classList.toggle('hidden', HUB.tab !== 'props');
    $('tabCareer').classList.toggle('hidden', HUB.tab !== 'career');
    renderMap(); renderDistrict(); renderProps(); renderCareer();
    $('padHint').textContent = padState.connected
      ? `${padGlyph('a')} select \u00b7 ${padGlyph('b')} back \u00b7 LB / RB switch tabs \u00b7 d-pad or stick to move`
      : '';
  }

  function renderMap() {
    const ri = rankIndex();
    const nodes = $('mapNodes');
    nodes.replaceChildren(...ATL.DISTRICTS.map((d) => {
      const b = el('button', 'map-node');
      b.style.left = d.x + '%'; b.style.top = d.y + '%';
      b.style.setProperty('--c', d.theme.accent);
      const locked = ri < d.rank;
      if (locked) b.classList.add('locked');
      if (d.id === HUB.district) b.classList.add('sel');
      if (ATL.PROPERTIES.some((p) => p.d === d.id && P.owned.includes(p.id))) b.classList.add('owned');
      b.append(el('span', 'dot'), el('span', 'nm', d.name));
      if (locked) b.append(el('span', 'lk', `RANK ${d.rank}`));
      b.setAttribute('aria-label', `${d.name}${locked ? ', locked' : ''}`);
      b.addEventListener('click', () => {
        HUB.district = d.id;
        const first = ATL.GIGS.find((g) => g.d === d.id);
        if (first) HUB.gig = first.id;
        renderMap(); renderDistrict();
        Sound.play('ui_start', { vol: 0.2, rate: 1.3 });
        const btn = document.querySelector('#gigList .gig-go:not([disabled])');
        if (padState.connected && btn && matchMedia('(max-width: 760px)').matches) btn.focus();
      });
      return b;
    }));
  }

  function renderDistrict() {
    const d = districtById(HUB.district);
    const ri = rankIndex();
    const locked = ri < d.rank;
    $('dTier').textContent = `DISTRICT ${d.tier} OF 8${locked ? ` \u00b7 OPENS AT ${ATL.RANKS[d.rank].name.toUpperCase()}` : ''}`;
    $('dName').textContent = d.name;
    $('dBlurb').textContent = d.blurb;
    const list = $('gigList');
    list.replaceChildren(...ATL.GIGS.filter((g) => g.d === d.id).map((g) => {
      const card = el('div', 'gig-card' + (g.track === 'FINAL' ? ' final' : ''));
      const head = el('div', 'gig-head');
      const lvl = trackLevel(g.track);
      head.append(el('span', 'track', ATL.TRACKS[g.track].toUpperCase() + (lvl ? ` LV ${lvl}` : '')), el('span', 'secs', `${g.seconds}s run`));
      card.append(head, el('h3', '', g.title), el('p', 'gdesc', g.desc));
      const meta = el('div', 'gig-meta');
      meta.append(el('span', '', `PAY ${money(payFor(g))}`), el('span', '', `REP +${repFor(g)}`), el('span', '', `STREET CASH ${money(ATL.BUNDLE[d.tier])} a stack`));
      if (g.heat) meta.append(el('span', 'heat', `HEAT +${g.heat}`));
      card.append(meta);
      const crew = el('div', 'gig-crew');
      crew.append(el('span', '', 'CHASED BY '));
      for (const k of crewFor(g)) { const t = el('span', 'crew-tag', ATL.KINDS[k].label.toUpperCase()); t.style.setProperty('--c', ATL.KINDS[k].color); crew.append(t); }
      card.append(crew);
      const go = el('button', 'panel-btn primary gig-go');
      if (locked) { go.disabled = true; go.textContent = `Reach ${ATL.RANKS[d.rank].name}`; }
      else if (g.needs && !P.owned.includes(g.needs)) { go.disabled = true; go.textContent = `Own the ${propById(g.needs).name} first`; }
      else go.textContent = g.track === 'FINAL' ? 'Start The Takeover' : 'Take the gig';
      go.addEventListener('click', () => { HUB.gig = g.id; startGig(g); });
      go.addEventListener('focus', () => { HUB.gig = g.id; });
      card.append(go);
      if (P.done[g.id]) card.append(el('span', 'done-count', `DONE ${P.done[g.id]}x`));
      return card;
    }));
    const here = ATL.PROPERTIES.filter((p) => p.d === d.id);
    const pl = el('p', 'd-props');
    pl.textContent = 'Property here: ' + here.map((p) => `${p.name}${P.owned.includes(p.id) ? ' (yours)' : ` ${money(p.price)}`}`).join(', ');
    list.append(pl);
  }

  function renderProps() {
    const ri = rankIndex();
    const list = $('propList');
    list.replaceChildren(...ATL.PROPERTIES.map((p) => {
      const d = districtById(p.d);
      const owned = P.owned.includes(p.id);
      const card = el('div', 'prop-card' + (owned ? ' owned' : '') + (p.id === 'tower' ? ' tower' : ''));
      card.style.setProperty('--c', d.theme.accent);
      card.append(el('span', 'pk', `${p.kind.toUpperCase()} \u00b7 ${d.name.toUpperCase()}`), el('h3', '', p.name));
      const meta = el('div', 'gig-meta');
      meta.append(el('span', '', `PAYS ${money(p.income)} A GIG`), el('span', '', `REP +${p.rep}`));
      if (p.id === 'tower') meta.append(el('span', 'heat', 'OPENS THE TAKEOVER'));
      card.append(meta);
      const b = el('button', 'panel-btn ' + (owned ? 'quiet' : 'primary'));
      const needRank = Math.max(d.rank, p.rank || 0);
      if (owned) { b.disabled = true; b.textContent = 'Yours'; }
      else if (ri < needRank) { b.disabled = true; b.textContent = `${money(p.price)} \u00b7 needs ${ATL.RANKS[needRank].name}`; }
      else if (P.cash < p.price) { b.disabled = true; b.textContent = `${money(p.price)} \u00b7 need ${money(p.price - P.cash)} more`; }
      else b.textContent = `Buy for ${money(p.price)}`;
      b.addEventListener('click', () => buyProperty(p));
      card.append(b);
      return card;
    }));
  }

  function buyProperty(p) {
    if (P.owned.includes(p.id) || P.cash < p.price) return;
    const before = rankIndex();
    P.cash -= p.price;
    P.owned.push(p.id);
    P.rep += p.rep;
    Sound.play('buy_property', { vol: 0.8 });
    try { mb?.event('property_bought', { property: p.id }); } catch (e) {}
    const after = rankIndex();
    saveProgress();
    renderHub();
    hubToast(after > before ? `${p.name} is yours. New rank: ${ATL.RANKS[after].name}` : `${p.name} is yours. It pays ${money(p.income)} after every gig.`, 3200);
    padFocusFirst();
  }

  function renderCareer() {
    const box = $('careerList');
    const tracks = ['HUSTLE', 'ARTIST', 'DJ', 'PRODUCER', 'PROMOTER', 'EXEC'];
    const cards = tracks.map((t) => {
      const n = (P.tracks && P.tracks[t]) || 0;
      const lv = trackLevel(t);
      const c = el('div', 'career-card');
      c.append(el('span', 'pk', ATL.TRACKS[t].toUpperCase()), el('b', '', `Level ${lv}`), el('span', 'cs', `${n} gig${n === 1 ? '' : 's'} done \u00b7 pay +${lv * 10}%${lv < 5 ? ` \u00b7 next level in ${3 - (n % 3)}` : ''}`));
      return c;
    });
    const stats = el('div', 'career-card wide');
    stats.append(el('span', 'pk', 'THE EMPIRE'), el('b', '', `Net worth ${money(netWorthOf(P))}`),
      el('span', 'cs', `${P.gigs || 0} gigs \u00b7 ${P.escapes || 0} getaways \u00b7 property pays ${money(incomeTotal())} a gig`));
    const board = el('div', 'career-card wide board');
    board.append(el('span', 'pk', 'NET WORTH BOARD'));
    const rows = el('ol', 'board-rows');
    rows.append(el('li', 'muted', 'loading the board'));
    board.append(rows);
    const reset = el('button', 'panel-btn quiet reset-btn', HUB.confirmReset ? 'Press again to wipe your empire' : 'Start over from the West End');
    reset.addEventListener('click', () => {
      if (!HUB.confirmReset) { HUB.confirmReset = true; renderCareer(); padFocusFirst(); return; }
      HUB.confirmReset = false;
      Object.assign(P, { cash: 0, rep: 0, heat: 0, owned: [], done: {}, tracks: {}, gigs: 0, escapes: 0, won: false, district: 'westend' });
      HUB.district = 'westend'; HUB.gig = 'we_mixtape';
      saveProgress(); renderHub(); hubToast('Fresh start. Back to the West End.');
    });
    box.replaceChildren(stats, ...cards, board, reset);
    if (mb && mb.leaderboard && HUB.tab === 'career') {
      mb.leaderboard.top('networth', { limit: 10 }).then((list) => {
        rows.replaceChildren();
        if (!list || !list.length) { rows.append(el('li', 'muted', 'Nobody on the board yet. Finish a gig to be first.')); return; }
        for (const r of list) {
          const li = el('li', r.mine ? 'mine' : '');
          const who = el(r.profile_url ? 'a' : 'span', '', r.username || 'guest');
          if (r.profile_url) { who.href = r.profile_url; who.target = '_blank'; who.rel = 'noopener'; }
          li.append(el('span', 'rk', `${r.rank}.`), who, el('span', 'rv', money(r.value)));
          rows.append(li);
        }
      }).catch(() => { rows.replaceChildren(el('li', 'muted', 'The board could not load right now.')); });
    } else {
      rows.replaceChildren(el('li', 'muted', 'The board shows when the game is played on mindblown.'));
    }
  }

  // ---------------------------------------------------------------- controllers
  const pad = { x: 0, y: 0 };
  const padState = { connected: false, ps: false, prev: [], navAt: 0, navDir: null, navRepeat: 0 };
  function padGlyph(b) {
    if (padState.ps) return { a: 'Cross', b: 'Circle', start: 'Options' }[b];
    return { a: 'A', b: 'B', start: 'Menu' }[b];
  }
  function activeLayer() {
    for (const id of ['helpScreen', 'pauseScreen', 'endScreen', 'hubScreen', 'startScreen']) {
      const e = $(id);
      if (e && !e.classList.contains('hidden')) return e;
    }
    return null;
  }
  function focusables(layer) {
    if (!layer) return [];
    return [...layer.querySelectorAll('button:not([disabled]), a[href]')].filter((b) => b.offsetParent !== null && !b.closest('.hidden'));
  }
  function padFocusFirst() {
    if (!padState.connected) return;
    setTimeout(() => {
      const layer = activeLayer();
      const list = focusables(layer);
      if (!list.length) return;
      if (layer && layer.contains(document.activeElement) && list.includes(document.activeElement)) return;
      const pick = list.find((b) => b.classList.contains('primary')) || list[0];
      pick.focus({ preventScroll: false });
    }, 30);
  }
  function padMove(dir) {
    const layer = activeLayer();
    const list = focusables(layer);
    if (!list.length) return;
    const cur = list.includes(document.activeElement) ? document.activeElement : null;
    if (!cur) { padFocusFirst(); return; }
    const r0 = cur.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bestScore = 1e9;
    for (const b of list) {
      if (b === cur) continue;
      const r = b.getBoundingClientRect();
      const bx = r.left + r.width / 2, by = r.top + r.height / 2;
      const dx = bx - cx, dy = by - cy;
      let along, across;
      if (dir === 'left') { along = -dx; across = Math.abs(dy); }
      else if (dir === 'right') { along = dx; across = Math.abs(dy); }
      else if (dir === 'up') { along = -dy; across = Math.abs(dx); }
      else { along = dy; across = Math.abs(dx); }
      if (along <= 4) continue;
      const score = along + across * 2.2;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    if (best) {
      best.focus();
      best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      Sound.play('ui_start', { vol: 0.12, rate: 1.6 });
    }
  }
  function padBack() {
    if (!ui.help.classList.contains('hidden')) { hideHelp(); return; }
    if (G.mode === 'paused') { resumeRun(); return; }
    if (G.mode === 'hub') { showMenu(); return; }
    if ((G.mode === 'caught' || G.mode === 'escaped') && !ui.end.classList.contains('hidden')) { showHub(); return; }
  }
  function padTab(step) {
    if (G.mode !== 'hub' || !ui.help.classList.contains('hidden')) return;
    const tabs = ['streets', 'props', 'career'];
    HUB.tab = tabs[(tabs.indexOf(HUB.tab) + step + tabs.length) % tabs.length];
    renderHub();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    padFocusFirst();
  }
  function pollPad(now, dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) {
      if (padState.connected) { padState.connected = false; document.body.classList.remove('gamepad'); }
      pad.x = 0; pad.y = 0;
      return;
    }
    if (!padState.connected) {
      padState.connected = true;
      padState.ps = /054c|playstation|dualsense|dualshock/i.test(gp.id) || (/wireless controller/i.test(gp.id) && !/xbox|045e/i.test(gp.id));
      document.body.classList.add('gamepad');
      const note = $('padNote');
      if (note) note.textContent = `Controller ready: ${padGlyph('a')} selects, ${padGlyph('b')} goes back, ${padGlyph('start')} pauses.`;
      if (G.mode === 'hub') renderHub();
      padFocusFirst();
    }
    const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const dz = (v) => (Math.abs(v) < 0.22 ? 0 : (v - Math.sign(v) * 0.22) / 0.78);
    const ax = dz(gp.axes[0] || 0), ay = dz(gp.axes[1] || 0);
    const dl = btn(14), dr = btn(15), du = btn(12), dd = btn(13);
    pad.x = clamp(ax + (dr ? 1 : 0) - (dl ? 1 : 0), -1, 1);
    pad.y = clamp(ay + (dd ? 1 : 0) - (du ? 1 : 0), -1, 1);
    const pressed = (i) => btn(i) && !padState.prev[i];
    const playing = G.mode === 'running';
    if(playing){
      if(pressed(3))fight('view');
      aimStick.x=dz(gp.axes[2] || 0);
      aimStick.y=dz(gp.axes[3] || 0);
      if(view)adjustAim(aimStick.x*dt*1.9,aimStick.y*dt*1.55);
      if(pressed(7))fight('fire');
      if(pressed(5))fight('shove');
      if(pressed(2))fight('reload');
    }
    if (pressed(9) || (pressed(8) && playing)) {
      if (G.mode === 'running') pauseRun();
      else if (G.mode === 'paused') resumeRun();
      else if (G.mode === 'menu') showHub();
    }
    if (!playing) {
      if (pressed(0)) {
        const a = document.activeElement;
        const layer = activeLayer();
        if (a && layer && layer.contains(a) && a.tagName !== 'BODY') { Sound.unlock(); a.click(); }
        else if (G.mode === 'menu') showHub();
        else padFocusFirst();
      }
      if (pressed(1)) padBack();
      if (pressed(4)) padTab(-1);
      if (pressed(5)) padTab(1);
      let dir = null;
      if (pad.x < -0.6) dir = 'left'; else if (pad.x > 0.6) dir = 'right';
      else if (pad.y < -0.6) dir = 'up'; else if (pad.y > 0.6) dir = 'down';
      if (dir) {
        if (dir !== padState.navDir) { padState.navDir = dir; padState.navAt = now + 380; padMove(dir); }
        else if (now >= padState.navAt) { padState.navAt = now + 140; padMove(dir); }
      } else padState.navDir = null;
    }
    padState.prev = gp.buttons.map((b) => b.pressed);
  }
  window.addEventListener('gamepadconnected', () => { Sound.unlock(); });

  function attachInput() {
    const on = (id, event, fn) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener(event, (e) => { try { Sound.unlock(); } catch (err) {} fn(e); });
    };
    on('startBtn', 'click', () => showHub());
    on('helpBtn', 'click', showHelp);
    on('helpClose', 'click', hideHelp);
    on('titleBtn', 'click', showMenu);
    on('hubSoundBtn', 'click', () => { Sound.toggle(); });
    on('roomToggle','click',()=>{
      const panel = $('roomPanel');
      panel.hidden = !panel.hidden;
      $('roomToggle').setAttribute('aria-expanded',String(!panel.hidden));
    });
    for (const action of ['Create','Join','Leave']) on('room'+action,'click',()=>changeRoom(action.toLowerCase()));
    syncRoom();
    for (const t of document.querySelectorAll('.tab')) t.addEventListener('click', () => { HUB.tab = t.dataset.tab; renderHub(); });
    on('pauseBtn', 'click', pauseRun);
    on('resumeBtn', 'click', resumeRun);
    on('restartBtn', 'click', () => { restartRun(); });
    on('leaveBtn', 'click', leaveToMenu);
    on('againBtn', 'click', () => { startGig(G.gig); });
    on('menuBtn', 'click', () => showHub());
    on('soundBtn', 'click', () => { Sound.toggle(); });
    on('pauseSoundBtn', 'click', () => { Sound.toggle(); });

    const aimArea=$('combatAimArea');
    let aimPointer=null;
    aimArea.addEventListener('pointerdown',event=>{
      if(aimPointer!==null || G.mode!=='running' || event.button!==0)return;
      if (document.pointerLockElement === aimArea) { fight('fire'); return; }
      aimPointer={id:event.pointerId,x:event.clientX,y:event.clientY,travel:0};
      aimArea.setPointerCapture(event.pointerId);
    });
    aimArea.addEventListener('pointermove',event=>{
      if(aimPointer?.id!==event.pointerId)return;
      aimPointer.travel += Math.hypot(event.clientX-aimPointer.x,event.clientY-aimPointer.y);
      adjustAim((event.clientX-aimPointer.x)*.008,(event.clientY-aimPointer.y)*.008);
      aimPointer.x=event.clientX;
      aimPointer.y=event.clientY;
    });
    aimArea.addEventListener('pointerup',event=>{
      if (aimPointer?.id === event.pointerId && aimPointer.travel < 5) fight('fire');
    });
    aimArea.addEventListener('lostpointercapture',()=>{aimPointer=null;});
    document.addEventListener('mousemove',event=>{
      if (G.mode==='running' && view && document.pointerLockElement===aimArea) {
        adjustAim(event.movementX*.0025,event.movementY*.0025);
      }
    });
    for(const action of ['View','Fire','Shove','Reload']) on('fight'+action,'click',()=>fight(action.toLowerCase()));
    window.addEventListener('keydown', (e) => {
      if (document.querySelector('.atl-radio[open]')) return;
      if(G.mode==='running' && view){
        const delta={i:[0,-.1],k:[0,.1],j:[-.1,0],l:[.1,0]}[e.key.toLowerCase()];
        if(delta)adjustAim(...delta);
      }
      if(!e.repeat && G.mode==='running'){
        if (view && e.code==='KeyM' && aimArea.requestPointerLock) {
          try { aimArea.requestPointerLock()?.catch(()=>{}); } catch {}
        }
        const action={v:'view',f:'fire',q:'shove',r:'reload'}[e.key.toLowerCase()];
        if(action)fight(action);
      }
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keys.left = true;
      if (k === 'arrowright' || k === 'd') keys.right = true;
      if (k === 'arrowup' || k === 'w') keys.up = true;
      if (k === 'arrowdown' || k === 's') keys.down = true;
      if (k === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (G.mode === 'menu') { showHub(); }
        else if (G.mode === 'hub' && !ui.help.offsetParent && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { startGig(gigById(HUB.gig)); }
      }
      if (k === 'escape' || k === 'p') {
        if (G.mode === 'running') pauseRun();
        else if (G.mode === 'paused') resumeRun();
      }
      if (k === 'enter' && G.mode === 'menu' && document.activeElement === document.body) showHub();
      if (k === 'escape' && !ui.help.classList.contains('hidden')) hideHelp();
      if (k === 'r' && (G.mode === 'caught' || G.mode === 'escaped') && G.result && !G.result.won) restartRun();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keys.left = false;
      if (k === 'arrowright' || k === 'd') keys.right = false;
      if (k === 'arrowup' || k === 'w') keys.up = false;
      if (k === 'arrowdown' || k === 's') keys.down = false;
    });

    const zone = ui.joyZone;
    const thumb = ui.joyThumb;
    function moveJoy(e) {
      if (!joy.active) return;
      const r = zone.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const rad = r.width * 0.36;
      const len = Math.hypot(dx, dy) || 1;
      const nx = clamp(dx / rad, -1, 1), ny = clamp(dy / rad, -1, 1);
      joy.x = nx; joy.y = ny;
      const cl = Math.min(1, len / rad);
      const ax = (dx / len) * cl * r.width * 0.3;
      const ay = (dy / len) * cl * r.width * 0.3;
      thumb.style.transform = `translate(calc(-50% + ${ax}px), calc(-50% + ${ay}px))`;
    }
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      joy.active = true; joy.id = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      moveJoy(e);
    });
    zone.addEventListener('pointermove', (e) => { if (joy.active && e.pointerId === joy.id) moveJoy(e); });
    function endJoy(e) {
      if (e.pointerId !== joy.id) return;
      joy.active = false; joy.x = 0; joy.y = 0;
      thumb.style.transform = 'translate(-50%, -50%)';
      try { zone.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    zone.addEventListener('pointerup', endJoy);
    zone.addEventListener('pointercancel', endJoy);
    zone.addEventListener('pointerleave', (e) => { if (joy.active && e.pointerId === joy.id && e.buttons === 0) endJoy(e); });

    window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
    window.addEventListener('keydown', () => Sound.unlock(), { once: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 160));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.mode === 'running') pauseRun();
    });
  }

  function drawStartBest() { refreshStartMeta(); }

  async function boot() {
    try { attachInput(); } catch (e) { /* keep going so RUN stays usable */ }
    try { initSoundPref(); } catch (e) { /* storage may be blocked */ }
    drawStartBest();
    if (mb) {
      try {
        mb.measure([
          { name: 'gig_started', kind: 'count', label: 'Gigs started' },
          { name: 'escaped', kind: 'step', label: 'Got away from a chase' },
          { name: 'property_bought', kind: 'step', label: 'Bought a property' },
          { name: 'net_worth', kind: 'value', label: 'Net worth after a gig' },
          { name: 'took_over', kind: 'step', label: 'Reached the top of the empire' }
        ]);
      } catch (e) {}
    }
    await Promise.all([loadProgress(), loadTune()]);
    renderer.toneMappingExposure = (tune.exposure || 1.15) * 1.02;
    hemi.intensity = 0.9;
    drawStartBest();

    world = StreetWorld.build(scene, renderer);
    HUB.district = P.district || 'westend';
    applyDistrict(districtById(HUB.district) || ATL.DISTRICTS[0]);
    scene.fog = new THREE.FogExp2(0x34414d, 0.0046);
    const haze = new THREE.Sprite(new THREE.SpriteMaterial({
      map: world.T.pool, color: 0xc47a4a, transparent: true, opacity: 0.36,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    haze.scale.set(280, 110, 1);
    haze.position.set(0, 22, -1055);
    scene.add(haze);
    if (software) {
      camera.far = 150;
      camera.updateProjectionMatrix();
      if (scene.fog) scene.fog.density = 0.023;
    }
    makeRain();
    ui.startHint.textContent = coarse
      ? 'Take gigs across Atlanta. Steer with the stick, grab the cash, outrun whoever is after you. Buy property. Own the city.'
      : 'Take gigs across Atlanta. Steer with the arrow keys, grab the cash, outrun whoever is after you. Buy property. Own the city.';

    window.__state = {
      camera, scene,
      get subject() { return player.hook; },
      get movers() { return [player.hook, ...cops.filter((c) => c.active).map((c) => c.hook)]; }
    };
    window.__game = { P, HUB, G, player, cops, flankCops, get policeCar() { return policeCar; }, obstacleGroup, camera, scene, renderer, assets, colliders };

    if (mb && mb.build) {
      const credit = document.querySelector('.credit');
      if (credit) credit.textContent = `build ${String(mb.build).slice(0, 8)}`;
    }
    setTimeout(() => { for (const k of Object.keys(ATL.KINDS)) loadKind(k); }, 2500);

    await loadAssets();
    G.crew = ['police'];
    assembleCrew(G.crew);
    buildObstacles(1, 0);
    resetRun(1);
    updateCamera(0.016);
    try { renderer.render(scene, camera); } catch (e) {}
    drawStartBest();
    G.ready = true;
    if (!mobile) { try { renderer.compile(scene, camera); } catch (e) {} }
    if (G.mode === 'boot') G.mode = 'menu';
    ui.startBtn.removeAttribute('disabled');
    lastTime = performance.now();
    requestAnimationFrame(frame);
    refreshStartMeta();
    if (G.pendingGig) {
      const g = G.pendingGig; G.pendingGig = null;
      startGig(g);
    }
  }

  boot();
})();
