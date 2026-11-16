'use strict';
/* =====================================================================
   ATL Nightclub Mogul — core
   One wallet for every job. Work shifts (each one is a real mini-game),
   train first, level up, then buy clubs across Atlanta and run the night.
   Jobs live in nightlife-jobs.js, the owner side in nightlife-owner.js,
   the 3D venues in nightlife-venues.js / nightlife-worlds.js.
   ===================================================================== */
const Mogul = window.Mogul = {
  KEY: 'atl-nightlife-career-v2',
  OLD_KEY: 'atl-nightlife-career-v1',
  JOBS: {},          // filled by nightlife-jobs.js
  TITLES: [[0, 'Rookie'], [1000, 'Hustler'], [10000, 'Manager'], [50000, 'Club Owner'], [250000, 'Mogul'], [1000000, 'Nightlife Tycoon']],
  s: null,
  tab: 'jobs',

  /* ---------------------------------------------------------- save */
  fresh(){ return {v: 2, cash: 300, rep: 0, fame: 0, night: 1, shifts: 0, earned: 0, xp: {}, best: {}, trained: {}, clubs: {}, home: null, zeroProof: false, sound: true, log: []}; },
  load(){
    let s = this.fresh();
    try{
      const raw = JSON.parse(localStorage.getItem(this.KEY));
      if (raw && raw.v === 2) s = Object.assign(s, raw);
      else {
        // carry the first version's career forward
        const old = JSON.parse(localStorage.getItem(this.OLD_KEY));
        if (old){
          s.cash += Number.isSafeInteger(old.cash) ? old.cash : 0;
          s.rep = Number.isSafeInteger(old.rep) ? old.rep : 0;
          s.shifts = Number.isSafeInteger(old.shifts) ? old.shifts : 0;
          if (old.owns === true){ s.clubs.peach = this.newClub(); s.home = 'peach'; }
        }
      }
    }catch(e){}
    for (const k of ['xp', 'best', 'trained', 'clubs']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (!Array.isArray(s.log)) s.log = [];
    this.s = s;
  },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.s)); }catch(e){ this.say('Progress could not be saved on this device.', 'bad'); } },
  newClub(){ return {up: {}, staff: {}, nights: 0, stars: 3, last: null, earned: 0}; },

  /* ---------------------------------------------------------- numbers */
  money(n){ return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US'); },
  level(id){ const xp = this.s.xp[id] || 0; return Math.min(10, 1 + Math.floor(Math.sqrt(xp / 60))); },
  levelFrac(id){ const xp = this.s.xp[id] || 0, lv = this.level(id); if (lv >= 10) return 1; const a = Math.pow(lv - 1, 2) * 60, b = Math.pow(lv, 2) * 60; return (xp - a) / (b - a); },
  worth(){ let w = this.s.cash; for (const [id, c] of Object.entries(this.s.clubs)){ const v = window.MogulOwner && MogulOwner.venue(id); if (v) w += v.price * .8 + MogulOwner.upValue(id, c); } return Math.round(w); },
  title(){ const w = this.worth(); let t = this.TITLES[0][1], i = 0; this.TITLES.forEach(([n, l], k) => { if (w >= n){ t = l; i = k; } }); return {t, i, next: this.TITLES[i + 1]}; },
  rnd(a, b){ return a + Math.random() * (b - a); },
  pick(a){ return a[Math.floor(Math.random() * a.length)]; },
  shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  esc(t){ return String(t).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); },

  /* ---------------------------------------------------------- dom */
  $(q, r = document){ return r.querySelector(q); },
  h(tag, attrs = {}, ...kids){
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})){
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('--')) e.style.setProperty(k, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  },
  say(msg, kind){
    const el = this.$('#say'); if (!el) return;
    el.textContent = msg; el.className = 'say show' + (kind ? ' ' + kind : '');
    clearTimeout(this._sayT); this._sayT = setTimeout(() => el.classList.remove('show'), kind === 'bad' ? 2600 : 2200);
  },
  confetti(n = 80){
    const box = this.h('div', {class: 'confetti', 'aria-hidden': 'true'});
    const cols = ['#ffc21a', '#f08a0c', '#ff4fd8', '#4de1ff', '#fff'];
    for (let i = 0; i < n; i++) box.append(this.h('i', {style: {left: Math.random() * 100 + '%', background: this.pick(cols), animationDuration: this.rnd(1.6, 3.2) + 's', animationDelay: this.rnd(0, .6) + 's'}}));
    document.body.append(box); setTimeout(() => box.remove(), 4200);
  },

  /* ---------------------------------------------------------- sound: small synth, no files */
  ac: null,
  audio(){ if (!this.s.sound) return null; try{ this.ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (this.ac.state === 'suspended') this.ac.resume(); }catch(e){ return null; } return this.ac; },
  sfx(kind){
    const ac = this.audio(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination);
    const set = (type, f1, f2, dur, vol = .12) => { o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur + .02); };
    if (kind === 'good') set('triangle', 660, 1320, .18);
    else if (kind === 'bad') set('sawtooth', 220, 110, .25, .08);
    else if (kind === 'cash'){ set('square', 988, 1976, .12, .06); setTimeout(() => { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'square'; o2.frequency.value = 1319; g2.gain.setValueAtTime(.06, ac.currentTime); g2.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .25); o2.connect(g2); g2.connect(ac.destination); o2.start(); o2.stop(ac.currentTime + .26); }, 90); }
    else if (kind === 'pour') set('sine', 300, 340, .08, .03);
    else set('triangle', 520, 780, .08, .07);
  },

  /* ---------------------------------------------------------- top bar + career */
  renderWallet(bump){
    const s = this.s, t = this.title(), w = this.$('#wallet');
    w.replaceChildren(
      this.h('span', {class: 'chip cash' + (bump ? ' bump' : '')}, '💵 ', this.h('b', {}, this.money(s.cash))),
      this.h('span', {class: 'chip'}, '⭐ ', this.h('b', {}, String(s.rep)), ' rep'),
      this.h('span', {class: 'chip'}, '🔥 ', this.h('b', {}, String(s.fame)), ' fame'),
      this.h('span', {class: 'chip gold'}, '👑 ', t.t),
      this.h('span', {class: 'chip'}, '🌙 Night ', this.h('b', {}, String(s.night))));
  },
  renderCareer(){
    const s = this.s, t = this.title(), w = this.worth();
    const next = t.next ? `${this.money(t.next[0] - w)} more net worth to become ${t.next[1]}` : 'Top of the A. Every club in the city knows your name.';
    const frac = t.next ? (w - this.TITLES[t.i][0]) / (t.next[0] - this.TITLES[t.i][0]) : 1;
    const clubs = Object.keys(s.clubs).length;
    this.$('#career').replaceChildren(
      this.h('div', {}, this.h('p', {class: 'kick'}, 'Your title'), this.h('div', {class: 'title'}, t.t),
        this.h('div', {class: 'ladder', 'aria-hidden': 'true'}, this.TITLES.map((_, i) => this.h('i', {class: i <= t.i ? 'on' : ''})))),
      this.h('div', {}, this.h('div', {class: 'next'}, `Net worth ${this.money(w)} · ${clubs} club${clubs === 1 ? '' : 's'} · ${s.shifts} shift${s.shifts === 1 ? '' : 's'} worked · ${next}`),
        this.h('div', {class: 'bar'}, this.h('i', {style: {width: Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%'}}))));
  },
  refresh(bump){ this.renderWallet(bump); this.renderCareer(); this.renderView(); },

  /* ---------------------------------------------------------- tabs */
  setTab(tab){
    this.tab = tab;
    for (const b of document.querySelectorAll('.tabs [role=tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    this.renderView();
  },
  renderView(){
    const v = this.$('#view');
    if (this.tab === 'jobs') v.replaceChildren(this.jobsView());
    else if (this.tab === 'empire') v.replaceChildren(window.MogulOwner ? MogulOwner.view() : this.h('p', {}, 'Loading…'));
    else v.replaceChildren(this.guideView());
  },
  unlocked(job){ return this.s.rep >= (job.unlock || 0); },
  jobsView(){
    const s = this.s, grid = this.h('div', {class: 'grid'});
    for (const [id, j] of Object.entries(this.JOBS)){
      const lv = this.level(id), ok = this.unlocked(j), trained = !!s.trained[id];
      grid.append(this.h('article', {class: 'job' + (ok ? '' : ' locked'), '--c': j.glow},
        this.h('div', {class: 'ic', 'aria-hidden': 'true'}, j.icon),
        this.h('h3', {}, j.name),
        this.h('p', {}, j.blurb),
        this.h('div', {class: 'meta'},
          this.h('span', {class: 'chip gold'}, `${this.money(j.pay[0])}–${this.money(j.pay[1])}`),
          this.h('span', {class: 'chip'}, j.venue),
          s.best[id] ? this.h('span', {class: 'chip ok'}, `Best ${s.best[id]}%`) : null),
        this.h('div', {class: 'lvl'}, `Lv ${lv}`, this.h('div', {class: 'bar'}, this.h('i', {style: {width: Math.round(this.levelFrac(id) * 100) + '%'}})), trained ? '✓ trained' : 'untrained'),
        this.h('div', {class: 'acts'},
          ok ? [
            this.h('button', {class: 'btn' + (trained ? '' : ' primary'), type: 'button', onclick: () => this.startJob(id, true)}, trained ? 'Practice' : 'Train first'),
            this.h('button', {class: 'btn' + (trained ? ' primary' : ''), type: 'button', disabled: !trained, title: trained ? '' : 'Finish training to unlock paid shifts', onclick: () => this.startJob(id, false)}, 'Work a shift')
          ] : this.h('button', {class: 'btn', type: 'button', disabled: true}, `🔒 Unlocks at ${j.unlock} rep`))));
    }
    const wrap = this.h('div', {});
    wrap.append(this.h('div', {class: 'emp-head'}, this.h('div', {}, this.h('p', {class: 'kick'}, 'Pick a job'), this.h('h2', {}, 'Every shift is a game. Train, then get paid.')),
      this.h('div', {class: 'actions'}, this.h('label', {class: 'chip'}, this.h('input', {type: 'checkbox', checked: s.zeroProof, onchange: e => { s.zeroProof = e.target.checked; this.save(); this.say(s.zeroProof ? 'Zero-proof menu: the bar and VIP serve alcohol-free drinks only.' : 'Full bar menu is back.'); }}), ' Zero-proof menu'))));
    wrap.append(grid);
    return wrap;
  },
  guideView(){
    const items = [
      ['🎟 Shifts', 'Every job is its own game: the door, the bar, the decks, VIP tables and promotion. Train once with a coach, then work paid shifts. Accuracy and speed set your tips.'],
      ['⭐ Rep, 🔥 fame and levels', 'Good shifts earn rep, which unlocks harder jobs. Each job levels up to 10; higher levels pay more and bring tougher nights.'],
      ['🏢 Buy a club', 'At 12 rep you can buy the Peach Room on Edgewood. More clubs open across Atlanta as your net worth grows, up to a penthouse on Peachtree.'],
      ['🔊 Upgrades and staff', 'Sound, lights, a bigger bar, VIP tables and security each have three levels. Hire a resident DJ, bartenders, bouncers, a promoter and bottle service.'],
      ['🌙 Run the night', 'Pick a theme and a headliner, open the doors and watch the night play out hour by hour: crowd, bar, VIP, surprises. The report shows exactly where the money went.'],
      ['👑 Titles', 'Rookie → Hustler → Manager → Club Owner → Mogul → Nightlife Tycoon, based on your net worth (cash plus what your clubs are worth).'],
      ['🍹 Responsible service', 'The bar and VIP check IDs, refuse anyone under 21 and cut off guests who have had too much. Turn on the zero-proof menu for an alcohol-free bar.']
    ];
    return this.h('div', {class: 'grid'}, items.map(([t, p]) => this.h('div', {class: 'panel'}, this.h('h3', {}, t), this.h('p', {class: 'muted', style: {margin: 0}}, p))));
  },

  /* ---------------------------------------------------------- the stage: every shift runs here */
  startJob(id, training){
    const job = this.JOBS[id]; if (!job || !this.unlocked(job)) return;
    if (!training && !this.s.trained[id]) return this.startJob(id, true);
    this.audio(); this.sfx('tap');
    const lv = this.level(id);
    const stage = this.h('section', {class: 'stage', role: 'dialog', 'aria-modal': 'true', 'aria-label': job.name});
    const timer = this.h('div', {class: 'timer'}, this.h('i'));
    const hud = this.h('div', {class: 'hudline'});
    const body = this.h('div', {class: 'stage-body'});
    const quit = this.h('button', {class: 'btn small', type: 'button'}, '✕ Leave');
    stage.append(this.h('div', {class: 'stage-top'},
      this.h('span', {class: 'ic', 'aria-hidden': 'true'}, job.icon),
      this.h('div', {}, this.h('h2', {}, job.name + (training ? ' · Training' : '')), this.h('div', {class: 'sub'}, `${job.venue} · Level ${lv}`)),
      this.h('div', {class: 'grow'}), hud, quit), timer, body);
    document.body.append(stage); document.body.style.overflow = 'hidden';
    const run = {id, job, training, lv, stage, body, over: false, timers: [], raf: 0};
    const ctx = this.ctx = {
      run, body, lv, training,
      zero: this.s.zeroProof,
      h: this.h.bind(this), money: this.money.bind(this), pick: this.pick.bind(this), shuffle: this.shuffle.bind(this), rnd: this.rnd.bind(this),
      say: (m, k) => { this.say(m, k); if (k === 'good') this.sfx('good'); else if (k === 'bad') this.sfx('bad'); },
      sfx: k => this.sfx(k), audio: () => this.audio(),
      hud: (...chips) => hud.replaceChildren(...chips.map(c => typeof c === 'string' ? this.h('span', {class: 'chip'}, c) : c)),
      time: (frac) => { timer.firstChild.style.transform = `scaleX(${Math.max(0, Math.min(1, frac))})`; timer.classList.toggle('low', frac < .25); },
      later: (fn, ms) => { const t = setTimeout(() => { if (!run.over) fn(); }, ms); run.timers.push(t); return t; },
      every: (fn, ms) => { const t = setInterval(() => { if (!run.over) fn(); }, ms); run.timers.push(t); return t; },
      loop: (fn) => { let last = performance.now(); const tick = now => { if (run.over) return; const dt = Math.min(.1, (now - last) / 1000); last = now; fn(dt, now / 1000); run.raf = requestAnimationFrame(tick); }; run.raf = requestAnimationFrame(tick); },
      end: (res) => this.finish(run, res)
    };
    const close = () => { if (run.over) return; this.cleanup(run); };
    quit.addEventListener('click', close);
    run.onKey = e => { if (e.key === 'Escape') close(); else if (job.key) job.key(ctx, e); };
    addEventListener('keydown', run.onKey);
    try{ job.start(ctx); }catch(err){ console.error(err); body.replaceChildren(this.h('p', {}, 'This shift could not start. Leave and try again.')); }
  },
  cleanup(run){
    run.over = true; run.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); cancelAnimationFrame(run.raf);
    try{ run.job.stop && run.job.stop(this.ctx); }catch(e){}
    removeEventListener('keydown', run.onKey);
    run.stage.remove(); document.body.style.overflow = ''; this.ctx = null;
  },
  /* res: {score 0..1, notes: [[ok, text]], bonus?} */
  finish(run, res){
    if (run.over) return;
    run.over = true; run.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); cancelAnimationFrame(run.raf);
    try{ run.job.stop && run.job.stop(this.ctx); }catch(e){}
    const s = this.s, j = run.job, sc = Math.max(0, Math.min(1, res.score || 0)), pct = Math.round(sc * 100);
    const lvMul = 1 + (run.lv - 1) * .08;
    let pay = Math.round((j.pay[0] + (j.pay[1] - j.pay[0]) * sc) * lvMul + (res.bonus || 0));
    if (run.training) pay = Math.round(pay * .35);
    const rep = run.training ? (sc >= .5 ? 1 : 0) : Math.round(sc * 4 + (sc >= .9 ? 2 : 0));
    const fame = !run.training && sc >= .85 ? 1 : 0;
    const before = this.title().i;
    s.cash += pay; s.earned += pay; s.rep += rep; s.fame += fame; s.shifts++;
    s.xp[run.id] = (s.xp[run.id] || 0) + Math.round(20 + sc * 60);
    if (run.training && sc >= .5) s.trained[run.id] = true;
    if (!run.training && pct > (s.best[run.id] || 0)) s.best[run.id] = pct;
    s.log.unshift({t: Date.now(), msg: `${j.name}: ${pct}% · ${this.money(pay)}`}); s.log.length = Math.min(s.log.length, 30);
    this.save();
    const grade = pct >= 95 ? 'S' : pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'D';
    const body = run.body;
    body.replaceChildren(this.h('div', {class: 'result'},
      this.h('p', {class: 'kick'}, run.training ? 'Training complete' : 'Shift complete'),
      this.h('div', {class: 'grade'}, grade),
      this.h('h2', {}, `${pct}% · ${this.money(pay)} earned`),
      this.h('div', {class: 'actions'},
        this.h('span', {class: 'chip gold'}, `+${rep} rep`), fame ? this.h('span', {class: 'chip gold'}, '+1 fame') : null,
        this.h('span', {class: 'chip'}, `Level ${this.level(run.id)}`),
        run.training ? this.h('span', {class: 'chip ' + (sc >= .5 ? 'ok' : 'bad')}, sc >= .5 ? '✓ Paid shifts unlocked' : 'Score 50% to pass training') : null),
      res.notes && res.notes.length ? this.h('div', {class: 'list'}, res.notes.slice(0, 10).map(([ok, t]) => this.h('div', {}, ok ? '✅' : '❌', ' ', t))) : null,
      this.h('div', {class: 'actions'},
        this.h('button', {class: 'btn primary', type: 'button', onclick: () => { this.cleanup(run); this.startJob(run.id, run.training && sc < .5); }}, run.training && sc < .5 ? 'Train again' : 'Next shift'),
        this.h('button', {class: 'btn', type: 'button', onclick: () => { this.cleanup(run); this.setTab('empire'); }}, '👑 My Empire'),
        this.h('button', {class: 'btn', type: 'button', onclick: () => this.cleanup(run)}, 'Back to jobs'))));
    body.scrollTop = 0;
    this.sfx('cash'); if (sc >= .85) this.confetti();
    if (this.title().i > before) setTimeout(() => this.say(`New title: ${this.title().t}!`, 'good'), 600);
    this.refresh(true);
  },

  /* ---------------------------------------------------------- boot */
  init(){
    this.load();
    for (const b of document.querySelectorAll('.tabs [role=tab]')) b.addEventListener('click', () => this.setTab(b.dataset.tab));
    this.$('#heroPlay').addEventListener('click', () => { this.setTab('jobs'); this.$('#view').scrollIntoView({behavior: 'smooth', block: 'start'}); });
    this.$('#heroEmpire').addEventListener('click', () => { this.setTab('empire'); this.$('#view').scrollIntoView({behavior: 'smooth', block: 'start'}); });
    const st = this.$('#soundToggle');
    const paint = () => { st.textContent = this.s.sound ? '🔊 Sound' : '🔇 Muted'; st.setAttribute('aria-pressed', String(this.s.sound)); };
    st.addEventListener('click', () => { this.s.sound = !this.s.sound; this.save(); paint(); });
    paint();
    let armed = false;
    this.$('#resetBtn').addEventListener('click', e => {
      if (!armed){ armed = true; e.target.textContent = 'Tap again to wipe your career'; setTimeout(() => { armed = false; e.target.textContent = 'Start over'; }, 3000); return; }
      this.s = this.fresh(); this.save(); armed = false; e.target.textContent = 'Start over'; this.refresh(); this.say('Fresh start. Back to the door.');
    });
    const h = location.hash.slice(1);
    if (h === 'empire') this.tab = 'empire';
    this.setTab(this.tab);
    this.renderWallet(); this.renderCareer();
    if (this.JOBS[h]) setTimeout(() => this.startJob(h, !this.s.trained[h]), 300);
  }
};
document.addEventListener('DOMContentLoaded', () => Mogul.init());

/* ---------------------------------------------------------- bridge for the 3D venues
   nightlife-venues.js talks to the nightclub through these names (games, profile, active,
   startShift, shift). Map its staff jobs onto the Mogul shifts. */
(() => {
  const JOB = {door: 'door', service: 'vip', promo: 'promo', bar: 'bar', dj: 'dj'};
  const job = id => Mogul.JOBS[JOB[id] || id];
  window.games = new Proxy({}, {get: (o, id) => { const j = job(id); return j ? {title: j.name, unlock: j.unlock || 0} : {title: 'This shift', unlock: 0}; }});
  Object.defineProperty(window, 'profile', {get: () => Mogul.s || {rep: 0}});
  Object.defineProperty(window, 'active', {get: () => !!Mogul.ctx});
  Object.defineProperty(window, 'shift', {get: () => document.querySelector('#view')});
  window.startShift = id => { const k = JOB[id] || id; if (Mogul.JOBS[k]) Mogul.startJob(k, !Mogul.s.trained[k]); };
  // the venue's "Work this shift" button picks up the Turn Up look
  new MutationObserver(() => { for (const b of document.querySelectorAll('.venue-talk button:not(.btn)')) b.className = 'btn small primary'; })
    .observe(document.querySelector('.venue-talk') || document.body, {childList: true, subtree: true});
  // tell the page when you are inside a club so the empty-state art steps aside
  const canvas = document.querySelector('#venueScene'), stage = document.querySelector('.venue-stage');
  if (canvas && stage) new MutationObserver(() => stage.classList.toggle('inside', !canvas.hidden)).observe(canvas, {attributes: true, attributeFilter: ['hidden']});
})();
