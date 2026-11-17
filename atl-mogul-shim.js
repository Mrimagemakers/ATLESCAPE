// ATL Nightclub Mogul: the small helpers the Mogul code (ported from Turn Up Music) expects to find around it.
// Saves, toasts, the 18+ check, sharing, drawing helpers for the canvas panel, and a few prop and texture makers.
'use strict';

/* saves on this device, under their own names */
const store = {
  get(k, d){ try{ const v = localStorage.getItem('atl-mogul:' + k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('atl-mogul:' + k, JSON.stringify(v)); }catch(e){} }
};
// the stage is the 3D venue on this page; the panel itself lives on the page
const STAGE_PROXY = {get hidden(){ return !(window.ATLVenue && ATLVenue.current); }, appendChild(el){ return document.body.appendChild(el); }};
const $ = s => s === '#stage' ? STAGE_PROXY : document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const rnd = (a, b) => a + Math.random()*(b - a);
function XRV(){ try{ return !!(ATLVenue.renderer && ATLVenue.renderer.xr.isPresenting); }catch(e){ return false; } }
let toastT;
function toast(msg, ms = 2600){
  let t = document.getElementById('mogulToast');
  if (!t){ t = document.createElement('div'); t.id = 'mogulToast'; t.className = 'mogul-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}
// the radio isn't part of this page: the DJ job brings its own beat
const S = {playing: false, loading: false, current: null, track: {title: '', artist: '', art: ''}};
function togglePlay(){}
const NET = {appId: 'atl-nightclub-mogul-v1', relays: ['wss://nos.lol', 'wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nostr.mom', 'wss://relay.nostr.band', 'wss://relay.snort.social'], hostKeys: []};

/* bars and clubs are for grown-ups: one quick check, kept on this device */
const Age = {
  adult(){ return store.get('age', null) === true; },
  ok(what){
    if (this.adult()) return true;
    if (store.get('age', null) === false){ toast(`Sorry, ${what || 'this part of the game'} is for adults 18 and older.`, 5000); return false; }
    this.ask(what); return false;
  },
  ask(what){
    let d = document.getElementById('mogulAge');
    if (!d){
      d = document.createElement('dialog'); d.id = 'mogulAge'; d.className = 'mogul-dialog';
      d.innerHTML = '<form method="dialog"><h2>Are you 18 or older?</h2><p>ATL Nightclub Mogul is set in bars and clubs. Please confirm your age to play.</p><div class="mogul-dialog-actions"><button value="yes" class="primary">Yes, I\'m 18+</button><button value="no">No</button></div></form>';
      document.body.appendChild(d);
      d.addEventListener('close', () => { const yes = d.returnValue === 'yes'; store.set('age', yes); if (yes){ toast('Thanks! Opening ' + (d.dataset.what || 'the game') + '…'); setTimeout(() => Mogul.open(), 300); } });
    }
    d.dataset.what = what || ''; if (!d.open) d.showModal();
  }
};
const Profile = {
  get(){ const p = Object.assign({name: '', avatar: ''}, store.get('profile', {})); if (!p.name){ p.name = 'Guest ' + (1000 + Math.floor(Math.random()*9000)); store.set('profile', p); } return p; },
  save(p){ store.set('profile', p); }
};
// a share sheet where the device has one, the clipboard where it doesn't
function shareText(text, url = location.href.split('#')[0]){
  if (navigator.share) return navigator.share({title: 'ATL Nightclub Mogul', text, url}).catch(() => {});
  try{ navigator.clipboard.writeText(text + ' ' + url); toast('Copied to share. Paste it anywhere. ✓'); }catch(e){ toast(text); }
}
const Social = {
  compose(){
    let t = document.getElementById('postText');
    if (!t){ t = document.createElement('textarea'); t.id = 'postText'; t.hidden = true; document.body.appendChild(t); }
    t.value = ''; setTimeout(() => { if (t.value) shareText(t.value); }, 50);
  }
};
const Safety = {blocked(){ return false; }};
const Cam = {gripFor(){ return null; }};
const Home = {refresh(){}, inviteCheck(){}};
// friends in your room show up through the room code on this page; the party chat effects are local here
const Party = {
  peers: new Map(), room: null,
  act(){}, setEmote(){}, sysMsg(m){ toast(m); }, stationFrom(){ return null; }, join(){},
  floatEmoji(e, pos){
    try{
      const T = THREE, [c, x] = Tex.canvas(128, 128); x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 70);
      const s = new T.Sprite(new T.SpriteMaterial({map: Tex.make(c), transparent: true, depthWrite: false}));
      const p = pos ? pos.clone() : Lounge.headPos().add(new T.Vector3(0, .3, -1).applyAxisAngle(new T.Vector3(0, 1, 0), Lounge.headYaw()));
      s.position.copy(p); s.scale.set(.4, .4, 1); s.userData = {v: new T.Vector3(0, .5, 0), age: 0, life: 2.2, spin: 0}; Lounge.scene.add(s); Lounge.notes.push(s);
    }catch(err){}
  }
};

/* canvas textures and simple props */
const Tex = {
  canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; },
  make(c, {repeat, srgb = true} = {}){
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.anisotropy = 8; return t;
  }
};
const Props = {
  lathe(pts, seg = 40){ const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); g.computeVertexNormals(); return g; },
  tumbler(fill = 'whiskey', ice = 3){
    const T = THREE, g = new T.Group();
    const glass = new T.MeshPhysicalMaterial({color: 0xffffff, roughness: .05, transparent: true, opacity: .3, side: T.DoubleSide});
    g.add(new T.Mesh(this.lathe([[.04, .016], [.04, 0], [.0415, 0], [.0435, .09]]), glass));
    if (fill){ const f = new T.Mesh(new T.CylinderGeometry(.0395, .039, .04, 32), new T.MeshStandardMaterial({color: fill === 'whiskey' ? 0xb8681e : 0xd8e8f0, roughness: .1, transparent: true, opacity: .85})); f.position.y = .036; g.add(f); }
    for (let i = 0; i < ice; i++){ const c = new T.Mesh(new T.BoxGeometry(.026, .026, .026), new T.MeshPhysicalMaterial({color: 0xeaf6ff, roughness: .1, transparent: true, opacity: .55})); c.position.set(Math.cos(i*2.1)*.014, .05 + (i % 2)*.012, Math.sin(i*2.1)*.014); c.rotation.set(i*.7, i*1.3, i*.4); g.add(c); }
    g.userData.kind = 'glass'; return g;
  }
};

/* the panel's buttons and text, drawn on a canvas (the same look on a screen and floating in VR) */
const VRMenu = {
  rr(x, X, Y, W, H, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); },
  btn(id, X, Y, W, H, label, fn, o = {}){
    const x = this.x, hov = this.hover === id;
    this.rr(x, X, Y, W, H, o.r ?? 18);
    x.fillStyle = o.on ? '#ffc21a' : o.primary ? (hov ? '#ffd75a' : '#ffc21a') : hov ? 'rgba(255,194,26,.28)' : 'rgba(255,255,255,.08)'; x.fill();
    x.lineWidth = hov ? 4 : 2; x.strokeStyle = hov || o.on ? '#ffc21a' : 'rgba(255,255,255,.16)'; x.stroke();
    x.fillStyle = o.on || o.primary ? '#241404' : '#fff'; x.font = `${o.bold === false ? 500 : 700} ${o.size || 30}px "Hanken Grotesk", sans-serif`;
    x.textAlign = o.left ? 'left' : 'center'; x.textBaseline = 'middle';
    x.fillText(label, o.left ? X + 22 : X + W/2, o.sub ? Y + H*.37 : Y + H/2 + 1, W - 30);
    if (o.sub){ x.font = '500 21px "Hanken Grotesk", sans-serif'; x.fillStyle = o.on ? '#3a2408' : 'rgba(255,255,255,.6)'; x.fillText(o.sub, o.left ? X + 22 : X + W/2, Y + H - 16, W - 30); }
    this.regions.push({id, X, Y, W, H, fn});
  },
  text(t, X, Y, size, col = '#fff', w = 600, align = 'left', max){ const x = this.x; x.font = `${w} ${size}px "Hanken Grotesk", sans-serif`; x.fillStyle = col; x.textAlign = align; x.textBaseline = 'middle'; x.fillText(t, X, Y, max); },
  say(m){ toast(m); }
};
// "open the lounge": here that means the 3D venue on this page, scrolled into view
function openStage(){
  const id = Lounge.atlId(store.get('world', 'club'));
  document.querySelector('#venues')?.scrollIntoView({block: 'start', behavior: 'smooth'});
  if (window.ATLVenue && ATLVenue.current !== id) ATLVenue.open(id);
}
