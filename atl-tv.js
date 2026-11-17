// ATL Nightclub Mogul on a smart TV: everything works from the remote's arrows, OK and Back.
// A TV home screen with big tiles replaces the long page. In a venue the arrows walk and turn, OK uses what's in
// the middle of the screen (or opens a menu), and Back steps back out. The Mogul panel, the dialogs and the
// Escape Room panel are all reachable with the arrows.
'use strict';

const TV = {
  on: false, mode: 'home', walk: {f: 0, t: 0}, held: null, menuFor: null,
  // TV browsers name themselves; ?tv=1 or the TV mode button turn it on anywhere
  isTV(){ return /SMART-?TV|SmartTV|Tizen|Web0S|webOS|NetCast|BRAVIA|HbbTV|AFT[A-Z]|Android TV|GoogleTV|Google TV|CrKey|Roku|VIDAA|Viera|TV Safari|PhilipsTV|Hisense|Xbox/i.test(navigator.userAgent); },
  init(){
    const want = new URLSearchParams(location.search).get('tv');
    const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'tvToggle'; btn.className = 'tv-toggle'; btn.textContent = '📺 TV mode';
    btn.onclick = () => { if (document.querySelector('#venueChoices button[data-venue]')) this.enable(!this.on); }; document.querySelector('main nav')?.append(btn); this.toggleBtn = btn;
    document.addEventListener('keydown', e => this.key(e, true), true);
    document.addEventListener('keyup', e => this.key(e, false), true);
    const go = () => { if (window.ATLVenue){ ATLVenue.frameHooks.push(dt => this.frame(dt)); ATLVenue.enterHooks.push(id => this.entered(id)); } else setTimeout(go, 200); }; go();
    // wait for the venue list before building the home screen from it
    if (want === '1' || (want !== '0' && (store.get('tv', null) ?? this.isTV()))){ const on = () => document.querySelector('#venueChoices button[data-venue]') ? this.enable(true) : setTimeout(on, 200); on(); }
  },
  enable(on){
    this.on = on; store.set('tv', on); document.body.classList.toggle('tv', on);
    this.toggleBtn.textContent = on ? '🖥 Leave TV mode' : '📺 TV mode';
    if (on){
      // TVs have modest graphics chips: balanced quality keeps the venues smooth
      const q = document.querySelector('#venueQuality'); if (q && q.value !== 'balanced'){ q.value = 'balanced'; q.dispatchEvent(new Event('change')); }
      this.build(); this.home();
    } else { this.homeEl && (this.homeEl.hidden = true); this.leaveVenue(false); document.body.classList.remove('tv-venue'); }
  },

  /* ---------- the TV home screen ---------- */
  build(){
    if (this.homeEl){ this.refresh(); return; }
    const h = this.homeEl = document.createElement('div'); h.id = 'tvHome'; h.className = 'tv-home'; h.hidden = true;
    h.innerHTML = `<header class="tv-head"><img src="assets/elements/title_atl_mogul.webp" alt="ATL Nightclub Mogul"><div><p class="tv-wallet" id="tvWallet"></p>
      <p class="tv-help">Use the arrows to move, <b>OK</b> to choose and <b>Back</b> to go back.</p></div></header>
      <section><h2>Play</h2><div class="tv-row" id="tvPlay"></div></section>
      <section><h2>Venues</h2><div class="tv-grid" id="tvVenues"></div></section>
      <section class="tv-foot"><button type="button" data-tv="full">⛶ Full screen</button><button type="button" data-tv="exit">🖥 Leave TV mode</button></section>`;
    document.body.appendChild(h);
    const play = h.querySelector('#tvPlay');
    for (const [icon, label, sub, fn] of [
      ['🍾', 'Work a job', 'Bartender, bouncer, DJ and more', () => { this.toVenue(); openMogul('menu'); }],
      ['👑', 'My empire', 'Buy clubs, hire staff, open tonight', () => { this.toVenue(); openMogul('empire'); }],
      ['📅', 'Live events', 'Weekly nights and your own events', () => Events.open()],
      ['🕺', 'Dance-off', 'Arrows and OK to dance', () => { this.toVenue('mogul'); setTimeout(() => Mogul.danceHere(), ATLVenue.current === 'mogul' ? 0 : 3000); }],
      ['🥊', 'Bar brawl', '←→ dodge · ↑ punch · ↓ block · OK kick', () => { this.toVenue('mogul'); setTimeout(() => Mogul.brawlHere(), ATLVenue.current === 'mogul' ? 0 : 3000); }],
      ['🎯', 'Trivia Live', 'Music trivia with the room', () => TriviaLive.open()]
    ]){ const b = document.createElement('button'); b.type = 'button'; b.className = 'tv-tile'; b.innerHTML = `<span class="tv-ic">${icon}</span><strong>${label}</strong><small>${sub}</small>`; b.onclick = fn; play.append(b); }
    const grid = h.querySelector('#tvVenues');
    for (const src of document.querySelectorAll('#venueChoices button[data-venue]')){
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tv-venue'; b.dataset.venue = src.dataset.venue;
      const icon = src.querySelector('svg'); if (icon) b.append(icon.cloneNode(true));
      const s = document.createElement('span'); s.textContent = src.textContent.trim(); b.append(s);
      b.onclick = () => this.toVenue(src.dataset.venue); grid.append(b);
    }
    h.querySelector('[data-tv="full"]').onclick = () => { try{ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }catch(e){} };
    h.querySelector('[data-tv="exit"]').onclick = () => this.enable(false);
    // the in-venue bits: a centre dot to aim with, a hint line, and the OK menu
    const dot = this.dot = document.createElement('div'); dot.className = 'tv-dot'; dot.setAttribute('aria-hidden', 'true'); document.body.appendChild(dot);
    const hint = this.hint = document.createElement('div'); hint.className = 'tv-hint'; hint.setAttribute('role', 'status'); document.body.appendChild(hint);
    const menu = this.menu = document.createElement('div'); menu.className = 'tv-menu'; menu.hidden = true; menu.setAttribute('role', 'menu'); document.body.appendChild(menu);
    this.refresh();
  },
  refresh(){ const w = document.getElementById('tvWallet'); if (w){ const d = Mogul.d(); w.textContent = `${Mogul.money(d.cash)} · ${Mogul.title(d)} · ${Object.keys(d.clubs).length} club${Object.keys(d.clubs).length === 1 ? '' : 's'}`; } },
  home(){
    this.mode = 'home'; this.leaveVenue(true); this.refresh();
    this.homeEl.hidden = false; this.homeEl.scrollTop = 0;
    (this.homeEl.querySelector(`.tv-venue[data-venue="${ATLVenue?.current}"]`) || this.homeEl.querySelector('.tv-tile'))?.focus();
  },
  toVenue(id){
    this.homeEl.hidden = true; this.mode = 'walk'; document.body.classList.add('tv-venue');
    if (id && ATLVenue.current !== id) ATLVenue.open(id);
    else if (!ATLVenue.current) ATLVenue.open('mogul');
    document.activeElement?.blur?.(); this.say();
  },
  leaveVenue(keep){
    if (window.Mogul && Mogul.on) Mogul.close();
    this.menu && (this.menu.hidden = true); this.walk.f = this.walk.t = 0;
    if (!keep) document.body.classList.remove('tv-venue');
    else document.body.classList.remove('tv-venue');
  },
  entered(id){ if (this.on && this.mode !== 'home'){ document.body.classList.add('tv-venue'); this.say(); } },
  say(){
    if (!this.hint) return;
    if (this.mode === 'dom'){ this.hint.textContent = '↑↓←→ move · OK choose · Back: back to the room'; return; }
    const panel = this.panelUp(), esc = ATLVenue.current === 'escape';
    this.hint.textContent = panel ? `↑↓←→ choose · OK press${Mogul.game && Mogul.view === 'game' ? ' (hold OK to pour) · Back: look around' : ' · Back: close'}`
      : `↑↓ walk · ←→ turn · OK: use what's in the middle${esc ? ' or open the vault panel' : ' or open the menu'} · Back: ${window.Mogul && Mogul.on ? 'game panel' : 'TV home'}`;
  },

  /* ---------- the menu OK opens in a venue ---------- */
  openMenu(){
    const m = this.menu; m.replaceChildren();
    const items = [
      ['🍾 Nightclub Mogul', () => { openMogul('menu'); }],
      ['👑 My empire', () => openMogul('empire')],
      ...(ATLVenue.current === 'escape' ? [['🔐 Escape Room panel', () => this.focusIn(document.querySelector('#escapeVault'))]] : []),
      ...(!document.querySelector('#venueTalk')?.hidden ? [[document.querySelector('#venueTalk').textContent, () => { document.querySelector('#venueTalk').click(); this.toast(document.querySelector('#venueStatus')?.textContent); }]] : []),
      ['📅 Live events', () => Events.open()],
      ['📺 Screens', () => document.querySelector('#venueScreens')?.click()],
      ['↺ Back to the entrance', () => document.querySelector('#venueReset')?.click()],
      ['🏠 TV home', () => this.home()]
    ];
    for (const [label, fn] of items){ const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = label; b.onclick = () => { m.hidden = true; this.mode = 'walk'; fn(); this.say(); }; m.append(b); }
    m.hidden = false; this.mode = 'menu'; m.querySelector('button').focus();
  },
  focusIn(el){ if (!el || el.hidden) return; this.mode = 'dom'; this.domRoot = el; const f = this.focusables(el)[0]; f?.focus(); f?.scrollIntoView({block: 'nearest'}); this.hint.textContent = '↑↓←→ move · OK choose · Back: back to the room'; },
  toast(m){ if (m) toast(m, 5000); },

  /* ---------- moving focus with the arrows ---------- */
  focusables(root){
    return [...root.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden');
  },
  // the nearest thing in the direction pressed: mostly straight ahead, a little to the side
  pick(list, from, dir){
    const c = r => [r.left + r.width/2, r.top + r.height/2], [fx, fy] = c(from), h = dir === 'left' || dir === 'right';
    let best = null, bestS = Infinity;
    for (const el of list){
      const r = el.getBoundingClientRect(), [x, y] = c(r), dx = x - fx, dy = y - fy;
      const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy, side = h ? Math.abs(dy) : Math.abs(dx);
      if (along <= 4) continue;
      // same row (or column) first; otherwise only within a 45° cone
      const overlap = h ? Math.min(r.bottom, from.top + from.height) - Math.max(r.top, from.top) : Math.min(r.right, from.left + from.width) - Math.max(r.left, from.left);
      if (overlap <= 0 && side > along) continue;
      const s = (overlap > 0 ? 0 : 10000) + along + side*2.2; if (s < bestS){ bestS = s; best = el; }
    }
    return best;
  },
  moveFocus(root, dir){
    const list = this.focusables(root); if (!list.length) return;
    const cur = document.activeElement && root.contains(document.activeElement) ? document.activeElement : null;
    if (!cur){ list[0].focus(); return; }
    const next = this.pick(list.filter(el => el !== cur), cur.getBoundingClientRect(), dir);
    if (next){ next.focus(); next.scrollIntoView({block: 'nearest', inline: 'nearest'}); }
  },
  // the Mogul panel is a drawing, not a page: the arrows move its highlight from button to button
  panelUp(){ return !!(window.Mogul && Mogul.on && Mogul.box && !Mogul.box.hidden && !Mogul.box.classList.contains('small')); },
  panelMove(dir){
    const R = Mogul.regions; if (!R.length) return;
    let cur = R.find(r => r.id === this.panelId);
    if (!cur){ cur = R.find(r => r.id !== 'mx' && r.id !== 'mback' && r.id !== 'hemp') || R[0]; this.setPanel(cur.id); return; }
    const box = r => ({left: r.X, top: r.Y, width: r.W, height: r.H, right: r.X + r.W, bottom: r.Y + r.H}), list = R.filter(r => r !== cur).map(r => Object.assign({getBoundingClientRect: () => box(r)}, {r}));
    const next = this.pick(list, box(cur), dir); if (next) this.setPanel(next.r.id);
  },
  setPanel(id){ this.panelId = id; Mogul.hover = id; Mogul.draw(); },
  panelPress(down){
    const r = Mogul.regions.find(x => x.id === this.panelId);
    if (!r){ if (down) this.panelMove('down'); return; }
    if (r.hold){ if (down && !this.held){ this.held = r; try{ r.hold(true); }catch(e){} } else if (!down && this.held){ try{ this.held.hold(false); }catch(e){} this.held = null; } Mogul.draw(); return; }
    if (down){ try{ r.fn({px: r.X + r.W/2, py: r.Y + r.H/2}); }catch(e){ console.warn(e); } Mogul.draw(); if (!Mogul.regions.some(x => x.id === this.panelId)) this.panelId = null; this.say(); }
  },
  // OK in the room: tap whatever sits in the middle of the screen
  tapCenter(){
    const cam = ATLVenue.camera; if (!cam) return false;
    const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), cam);
    return ATLVenue.tapHooks.some(h => { try{ return h(rc); }catch(e){ return false; } }) || !!ATLVenue.world?.onTap?.(rc);
  },

  /* ---------- the remote ---------- */
  name(e){
    const k = e.key, c = e.keyCode;
    if (k === 'ArrowUp' || c === 38) return 'up'; if (k === 'ArrowDown' || c === 40) return 'down';
    if (k === 'ArrowLeft' || c === 37) return 'left'; if (k === 'ArrowRight' || c === 39) return 'right';
    if (k === 'Enter' || c === 13 || k === 'Select' || c === 23) return 'ok';
    if (k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || k === 'XF86Back' || c === 10009 || c === 461 || c === 27) return 'back';
    if ((k === 'Backspace' || c === 8) && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return 'back';
    return null;
  },
  key(e, down){
    if (!this.on) return;
    const k = this.name(e); if (!k) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    // 1. a dialog is open: move inside it, Back closes it
    const dlg = [...document.querySelectorAll('dialog[open]')].pop();
    if (dlg){
      if (!down) return;
      if (k === 'back'){ stop(); dlg.close(); return; }
      if (typing && (k === 'left' || k === 'right' || (k === 'ok' && document.activeElement.tagName !== 'SELECT'))) return;
      if (typing && document.activeElement.tagName === 'SELECT' && (k === 'up' || k === 'down')) return;
      if (k !== 'ok'){ stop(); this.moveFocus(dlg, k); }
      return;
    }
    // 2. the home screen
    if (this.mode === 'home' && !this.homeEl.hidden){
      if (!down) return;
      if (k === 'back'){ stop(); return; }
      if (k !== 'ok'){ stop(); this.moveFocus(this.homeEl, k); }
      return;
    }
    // 3. the OK menu, or a panel on the page (the Escape Room vault)
    if (this.mode === 'menu' || this.mode === 'dom'){
      if (!down) return;
      const root = this.mode === 'menu' ? this.menu : this.domRoot;
      if (k === 'back'){ stop(); this.menu.hidden = true; this.mode = 'walk'; document.activeElement?.blur?.(); this.say(); return; }
      if (typing && (k === 'left' || k === 'right' || k === 'ok')) return;
      if (k !== 'ok'){ stop(); this.moveFocus(root, k); }
      return;
    }
    // 4. a Mogul game with its own pad
    const G = window.Mogul && Mogul.on && Mogul.view === 'game' && Mogul.game;
    if (G && G.padEl){
      if (k === 'back'){ if (down){ stop(); Mogul.quitGame(); Mogul.close(); this.mode = 'walk'; this.say(); } return; }
      // the dance-off already dances to the arrows and OK
      if (G.KEYS) return;
      // the brawl: ←→ dodge, ↑ punch, ↓ block (hold), OK kick
      const map = {left: 'a', right: 'd', up: 'j', down: ' ', ok: 'k'}[k];
      if (map){ stop(); if (down || map === ' ') try{ G.key(map, down); }catch(err){} }
      return;
    }
    // 5. the Mogul panel: arrows move its highlight, OK presses (hold OK to pour), Back shrinks it so you can look around
    if (this.panelUp() && this.mode !== 'look'){
      stop();
      if (k === 'ok') this.panelPress(down);
      else if (down && k === 'back'){
        if (Mogul.view === 'game' && Mogul.game){ Mogul.box.classList.add('small'); this.mode = 'look'; this.say(); }
        else if (Mogul.view !== 'menu') Mogul.toMenu();
        else { Mogul.close(); this.mode = 'walk'; this.say(); }
      }
      else if (down) this.panelMove(k);
      if (down) this.say();
      return;
    }
    // 6. walking the room
    if (!ATLVenue.current) return;
    stop();
    if (k === 'up' || k === 'down') this.walk.f = down ? (k === 'up' ? 1 : -1) : (this.walk.f === (k === 'up' ? 1 : -1) ? 0 : this.walk.f);
    else if (k === 'left' || k === 'right') this.walk.t = down ? (k === 'left' ? 1 : -1) : (this.walk.t === (k === 'left' ? 1 : -1) ? 0 : this.walk.t);
    else if (down && k === 'ok'){
      if (this.tapCenter()) return;
      if (window.Mogul && Mogul.on && Mogul.box){ Mogul.box.classList.remove('small'); this.mode = 'walk'; this.say(); return; }
      this.openMenu();
    }
    else if (down && k === 'back'){
      if (window.Mogul && Mogul.on && Mogul.box){ Mogul.box.classList.remove('small'); this.mode = 'walk'; this.say(); return; }
      this.home();
    }
  },
  frame(dt){
    if (!this.on || this.mode === 'home') return;
    const cam = ATLVenue.camera; if (!cam) return;
    if (this.walk.t) cam.rotation.y += this.walk.t*dt*1.7;
    if (this.walk.f){
      const step = this.walk.f*dt*2.4, x = cam.position.x - Math.sin(cam.rotation.y)*step, z = cam.position.z - Math.cos(cam.rotation.y)*step;
      const ok = (nx, nz) => ATLVenue.walkable(nx, nz) && Math.abs(ATLVenue.floorAt(nx, nz) - ATLVenue.floorAt(cam.position.x, cam.position.z)) < .31;
      if (ok(x, cam.position.z)) cam.position.x = x; if (ok(cam.position.x, z)) cam.position.z = z;
      cam.position.y += (ATLVenue.floorAt(cam.position.x, cam.position.z) + 1.7 - cam.position.y)*Math.min(1, dt*11);
    }
    // keep looking level-ish so the room stays readable on a big screen
    if (!this.walk.f && !this.walk.t && Math.abs(cam.rotation.x) > .35) cam.rotation.x *= .96;
    const panel = this.panelUp(); document.body.classList.toggle('tv-panel', panel);
    if (panel !== this._panel){ this._panel = panel; this.say(); if (!panel) this.panelId = null; }
  }
};
TV.init();
window.TV = TV;
