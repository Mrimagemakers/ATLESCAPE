'use strict';
/* =====================================================================
   ATL Nightclub Mogul — the jobs. Each one is a real mini-game.
   A job: {name, icon, venue, unlock, pay, blurb, glow, start(ctx), stop?(ctx), key?(ctx, e)}
   ctx (from nightlife.js): body, h, say, sfx, hud, time, later, every, loop, end, lv, training, zero
   ===================================================================== */
(() => {
const M = window.Mogul;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------ faces for the door
   Real patron portraits from the Turn Up Music avatar sheet (assets/turnup-patrons.jpg, 10 x 5).
   Cells 0-29 are women, 30-49 men. A fake ID shows a different person of the same group. */
const WOMEN = [...Array(30).keys()].filter(i => i !== 27);
const MEN = [...Array(20).keys()].map(i => i + 30).filter(i => i !== 48);
const TWINS = [[0, 7], [2, 8], [4, 9], [30, 32]];          // same model, different hair: never use as a "fake"
const twin = (a, b) => TWINS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
function newFace(){ const w = Math.random() < .55; return {p: M.pick(w ? WOMEN : MEN), w}; }
function otherFace(f){ const pool = (f.w ? WOMEN : MEN).filter(i => i !== f.p && !twin(i, f.p)); return {p: M.pick(pool), w: f.w}; }
function faceHTML(f, opt = {}){
  const x = (f.p % 10) * 100 / 9, y = Math.floor(f.p / 10) * 25;
  return `<div class="portrait" role="img" aria-label="${M.esc(opt.label || 'Face')}" style="background-position:${x}% ${y}%"></div>`;
}
M.faceHTML = faceHTML;

/* ------------------------------------------------ dates */
const fmt = d => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
const ageOn = (dob, day) => { let a = day.getFullYear() - dob.getFullYear(); const m = day.getMonth() - dob.getMonth(); if (m < 0 || (m === 0 && day.getDate() < dob.getDate())) a--; return a; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const FIRST_F = ['Avery', 'Kiara', 'Imani', 'Destiny', 'Nia', 'Aaliyah', 'Zoe', 'Priya', 'Sofia', 'Keisha', 'Brianna', 'Jasmine', 'Morgan', 'Taylor'];
const FIRST_M = ['Jordan', 'Sam', 'Jalen', 'Marcus', 'Andre', 'Tre', 'Malik', 'Devon', 'Carlos', 'Darius', 'Omar', 'Terrell', 'Avery', 'Morgan'];
const FIRST = ['Avery', 'Jordan', 'Morgan', 'Taylor', 'Sam', 'Jalen', 'Kiara', 'Marcus', 'Imani', 'Andre', 'Destiny', 'Tre', 'Nia', 'Malik', 'Aaliyah', 'Devon', 'Zoe', 'Carlos', 'Priya', 'Darius', 'Sofia', 'Keisha', 'Omar', 'Brianna'];
const LAST = ['Reed', 'Lane', 'Ellis', 'Carter', 'Brooks', 'Washington', 'Jackson', 'Okafor', 'Rivera', 'Nguyen', 'Coleman', 'Patel', 'Hayes', 'Bennett', 'Freeman', 'Gordon', 'Walker', 'Diaz', 'Mitchell', 'Ross'];
const OUTFITS = ['black tee and jeans', 'button-up and slacks', 'silk dress', 'leather jacket', 'blazer and loafers', 'two-piece set', 'polo and chinos', 'denim jacket', 'cocktail dress', 'graphic tee and cargos'];
const BANNED = [['sports jersey', '🏀'], ['flip-flops', '🩴'], ['gym shorts', '🩳'], ['ski mask', '🥷']];

/* ======================================================== 🚪 BOUNCER */
M.JOBS.door = {
  name: 'Bouncer', icon: '🚪', venue: 'Peach Room · Edgewood', unlock: 0, pay: [70, 260], glow: 'rgba(255,79,216,.35)',
  blurb: 'Run the door: check birthdays and expiry dates, match faces to IDs, enforce the dress code, the guest list and capacity. Calm fights down the right way.',
  start(ctx){
    const {h, lv, training} = ctx, today = new Date();
    const banned = M.pick(BANNED);
    const cap = training ? 50 : 60 + lv * 10;
    const st = this.st = {i: 0, right: 0, notes: [], count: training ? 30 : cap - 9 - Math.floor(Math.random() * 4), cap, banned, today, list: [], line: []};
    const N = training ? 5 : 8 + Math.min(4, lv);
    // the line tonight
    const mk = (kind) => {
      const face = newFace(), name = `${M.pick(face.w ? FIRST_F : FIRST_M)} ${M.pick(LAST)}`;
      let age = Math.floor(M.rnd(22, 46)), dob, exp = addDays(today, Math.floor(M.rnd(120, 1800))), match = true, outfit = M.pick(OUTFITS), wear = null, list = false;
      if (kind === 'minor'){ dob = addDays(new Date(today.getFullYear() - 21, today.getMonth(), today.getDate()), Math.floor(M.rnd(3, 300))); }
      else if (kind === 'birthday'){ dob = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate()); }
      else dob = addDays(new Date(today.getFullYear() - age, today.getMonth(), today.getDate()), -Math.floor(M.rnd(0, 360)));
      if (kind === 'expired') exp = addDays(today, -Math.floor(M.rnd(3, 400)));
      if (kind === 'fake') match = false;
      if (kind === 'dress') wear = banned;
      if (kind === 'list') list = true;
      return {kind, name, face, idFace: match ? face : otherFace(face), dob, exp, match, outfit, wear, list, num: 'GA' + Math.floor(M.rnd(1e7, 9e7))};
    };
    let kinds = training ? ['ok', 'minor', 'expired', 'fake', 'dress'] :
      M.shuffle(['ok', 'ok', 'minor', 'expired', 'fake', 'dress', 'list', 'birthday', 'ok', 'list', 'minor', 'fake'].slice(0, N));
    if (!training && lv >= 2) kinds.splice(Math.floor(N / 2), 0, 'fight');
    st.line = kinds.map(k => k === 'fight' ? {kind: 'fight'} : mk(k));
    // VIPs on the list (some will show up)
    st.list = M.shuffle([...st.line.filter(g => g.list).map(g => g.name), ...Array.from({length: 5}, () => `${M.pick(FIRST)} ${M.pick(LAST)}`)]);
    st.total = st.line.length;
    st.per = training ? 9999 : Math.max(7, 15 - lv * .7);
    this.layout(ctx);
    this.next(ctx);
  },
  layout(ctx){
    const {h} = ctx, st = this.st;
    st.guestBox = h('div', {class: 'guest'});
    st.idBox = h('div', {});
    st.rulesBox = h('div', {class: 'panel rules'});
    st.acts = h('div', {class: 'actions'});
    st.coach = h('div', {class: 'coach'});
    ctx.body.replaceChildren(
      ctx.training ? st.coach : null,
      h('div', {class: 'door'}, st.guestBox, h('div', {style: {display: 'flex', flexDirection: 'column', gap: '14px'}}, st.idBox, st.rulesBox)),
      st.acts);
  },
  rules(ctx){
    const {h} = ctx, st = this.st, full = st.count >= st.cap;
    st.rulesBox.replaceChildren(
      h('h3', {}, "Tonight's door rules"),
      h('ul', {style: {margin: 0, padding: 0}},
        h('li', {}, `21 and over. Tonight is `, h('b', {}, fmt(st.today)), '.'),
        h('li', {}, 'A current (unexpired) ID with a photo that matches the face.'),
        h('li', {}, `Dress code: no ${st.banned[0]} ${st.banned[1]}`),
        h('li', {}, `Capacity ${st.count} / ${st.cap}`, full ? h('b', {class: 'gold'}, ' · FULL: guest list only') : '')),
      h('p', {class: 'kick', style: {margin: '6px 0 0'}}, 'Guest list'),
      h('div', {class: 'list-names'}, st.list.map(n => h('span', {class: 'chip'}, n))));
  },
  correct(g, st){
    if (ageOn(g.dob, st.today) < 21) return [false, `${g.name} is ${ageOn(g.dob, st.today)}. The door is 21+.`];
    if (g.exp < st.today) return [false, `${g.name}'s ID expired ${fmt(g.exp)}.`];
    if (!g.match) return [false, `The photo on ${g.name}'s ID is a different person.`];
    if (g.wear) return [false, `${g.name} is wearing ${g.wear[0]}, against tonight's dress code.`];
    if (st.count >= st.cap && !st.list.includes(g.name)) return [false, `The club was at capacity and ${g.name} wasn't on the list.`];
    return [true, `${g.name} checked out: 21+, current ID, photo matches${st.list.includes(g.name) ? ', on the guest list' : ''}.`];
  },
  next(ctx){
    const {h} = ctx, st = this.st;
    if (st.i >= st.line.length) return ctx.end({score: st.right / st.total, notes: st.notes});
    const g = st.cur = st.line[st.i];
    ctx.hud(h('span', {class: 'chip'}, `Guest ${st.i + 1} / ${st.total}`), h('span', {class: 'chip ok'}, `✓ ${st.right}`), h('span', {class: 'chip'}, `👥 ${st.count}/${st.cap}`));
    this.rules(ctx);
    if (g.kind === 'fight') return this.fight(ctx);
    const age = ageOn(g.dob, st.today);
    st.guestBox.innerHTML = '';
    st.guestBox.append(
      h('span', {class: 'chip line-left'}, `🧍 ${st.line.length - st.i - 1} in line`),
      h('div', {class: 'at-rope', html: faceHTML(g.face, {label: `${g.name} at the velvet rope`})}),
      g.wear ? h('div', {class: 'fit'}, `${g.wear[1]} Wearing ${g.wear[0]}`) : null,
      h('div', {class: 'muted'}, `"${M.pick(['Hey, how you doing?', "I'm with the birthday party.", "What's the cover tonight?", "It's my first time here!", 'I know the DJ.', "Y'all busy tonight?"])}"`));
    st.idBox.replaceChildren(h('div', {class: 'idcard', 'aria-label': 'ID card'},
      h('div', {class: 'state'}, h('span', {}, 'GEORGIA · DRIVER LICENSE'), h('span', {}, g.num)),
      h('div', {class: 'photo', html: faceHTML(g.idFace, {label: 'ID photo'})}),
      h('dl', {}, h('dt', {}, 'NAME'), h('dd', {}, g.name), h('dt', {}, 'DOB'), h('dd', {}, fmt(g.dob)), h('dt', {}, 'EXPIRES'), h('dd', {}, fmt(g.exp)), h('dt', {}, 'CLASS'), h('dd', {}, 'C')),
      h('div', {class: 'holo', 'aria-hidden': 'true'})));
    st.acts.replaceChildren(
      h('button', {class: 'btn primary big', type: 'button', onclick: () => this.decide(ctx, true)}, '✅ Let in (A)'),
      h('button', {class: 'btn danger big', type: 'button', onclick: () => this.decide(ctx, false)}, '⛔ Turn away (D)'));
    if (ctx.training){
      const tips = {
        ok: '<b>Check three things:</b> the birthday (21 or older tonight?), the expiry date, and that the ID photo is the same face. Everything checks out here, so let them in.',
        minor: `<b>Do the math on the birthday.</b> Born ${fmt(g.dob)} means ${age} tonight. Under 21: turn them away.`,
        expired: `<b>Look at EXPIRES.</b> ${fmt(g.exp)} is in the past, so this ID isn't valid tonight.`,
        fake: '<b>Compare the faces.</b> Face shape, eyes, skin tone, hairline. This ID belongs to somebody else.',
        dress: `<b>Dress code.</b> Tonight there are no ${st.banned[0]}. Politely turn them away.`
      };
      st.coach.innerHTML = tips[g.kind] || '';
    }
    st.t0 = performance.now();
    clearInterval(st.tick);
    st.tick = ctx.every(() => {
      const left = 1 - (performance.now() - st.t0) / 1000 / st.per;
      ctx.time(left);
      if (left <= 0){ clearInterval(st.tick); st.notes.push([false, `${g.name} waited too long and the line got loud.`]); ctx.say('Too slow: the line is getting restless.', 'bad'); st.i++; this.next(ctx); }
    }, 100);
    if (ctx.training) ctx.time(1);
  },
  decide(ctx, admit){
    const st = this.st, g = st.cur; if (!g || g.kind === 'fight') return;
    clearInterval(st.tick);
    const [should, why] = this.correct(g, st), ok = admit === should;
    if (ok){ st.right++; ctx.say((admit ? 'Welcome in. ' : 'Good call. ') + why, 'good'); } else ctx.say((admit ? 'Should have turned them away. ' : 'They were good to go. ') + why, 'bad');
    st.notes.push([ok, why]);
    if (admit) st.count++;
    if (!ctx.training && Math.random() < .35 && st.count > 0) st.count--;    // somebody left
    st.cur = null; st.i++;
    ctx.later(() => this.next(ctx), 450);
  },
  fight(ctx){
    const {h} = ctx, st = this.st;
    clearInterval(st.tick); ctx.time(1);
    st.guestBox.innerHTML = '';
    st.guestBox.append(h('div', {style: {fontSize: '80px'}}, '😤 💢 😠'), h('h3', {}, 'Two guys in line start shoving'), h('p', {class: 'muted'}, 'One says the other cut the line. It is getting loud.'));
    st.idBox.replaceChildren(h('div', {class: 'panel'}, h('h3', {}, 'What do you do?'), h('p', {class: 'muted', style: {margin: 0}}, 'Nine nights out of ten, talking calms things down.')));
    const pick = (ok, msg) => { st.notes.push([ok, msg]); if (ok) st.right++; ctx.say(msg, ok ? 'good' : 'bad'); st.i++; ctx.later(() => this.next(ctx), 700); };
    st.acts.replaceChildren(
      h('button', {class: 'btn big', type: 'button', onclick: () => pick(true, 'You stepped between them, kept your voice calm and separated them. Crisis over.')}, '🗣 Step in and talk it down'),
      h('button', {class: 'btn big', type: 'button', onclick: () => pick(false, 'Shoving back made it a brawl. Never escalate.')}, '💪 Shove them apart'),
      h('button', {class: 'btn big', type: 'button', onclick: () => pick(false, 'Ignoring it let the fight spill into the line.')}, '🙈 Ignore it'));
  },
  key(ctx, e){ const k = e.key.toLowerCase(); if (k === 'a') this.decide(ctx, true); if (k === 'd') this.decide(ctx, false); },
  stop(){ clearInterval(this.st && this.st.tick); }
};

/* ======================================================== 🍸 BARTENDER */
const ING = {
  vodka: ['Vodka', '#e8f0ff', 1], tequila: ['Tequila', '#f2e6b0', 1], rum: ['White rum', '#f4f0e0', 1], gin: ['Gin', '#e6f6ff', 1], bourbon: ['Bourbon', '#b8681e', 1], triple: ['Triple sec', '#ffb347', 1],
  lime: ['Lime juice', '#c6e86a', 0], lemon: ['Lemon juice', '#f6e86a', 0], simple: ['Simple syrup', '#f6efd0', 0], peach: ['Peach purée', '#ffa86b', 0], tea: ['Sweet tea', '#8a4a14', 0],
  lemonade: ['Lemonade', '#fff4a8', 0], cran: ['Cranberry', '#c8102e', 0], oj: ['Orange juice', '#ffa51f', 0], grenadine: ['Grenadine', '#b0102a', 0],
  soda: ['Soda water', '#e8f6ff', 0], tonic: ['Tonic', '#eaf4ff', 0], cola: ['Cola', '#3a1a0a', 0], ginger: ['Ginger beer', '#e8c870', 0]
};
const GLASS = {rocks: '🥃 Rocks', highball: '🥤 Highball', coupe: '🍸 Coupe', mug: '🫖 Copper mug'};
const GARNISH = {lime: '🍋‍🟩 Lime', lemon: '🍋 Lemon', mint: '🌿 Mint', orange: '🍊 Orange peel', cherry: '🍒 Cherry', peach: '🍑 Peach slice'};
const METHOD = {shake: '🔁 Shake', stir: '🥄 Stir', build: '🧱 Build', muddle: '🌿 Muddle'};
const RECIPES = [
  {n: 'Margarita', glass: 'rocks', ice: true, method: 'shake', g: 'lime', items: {tequila: 2, lime: 1, triple: 1}},
  {n: 'Mojito', glass: 'highball', ice: true, method: 'muddle', g: 'mint', items: {rum: 2, lime: 1, simple: .75, soda: 2}},
  {n: 'Old Fashioned', glass: 'rocks', ice: true, method: 'stir', g: 'orange', items: {bourbon: 2, simple: .25}},
  {n: 'Cosmopolitan', glass: 'coupe', ice: false, method: 'shake', g: 'lime', items: {vodka: 1.5, triple: .5, cran: 1, lime: .5}},
  {n: 'Moscow Mule', glass: 'mug', ice: true, method: 'build', g: 'lime', items: {vodka: 2, lime: .5, ginger: 4}},
  {n: 'Gin & Tonic', glass: 'highball', ice: true, method: 'build', g: 'lime', items: {gin: 2, tonic: 4}},
  {n: 'Peachtree Smash', glass: 'rocks', ice: true, method: 'shake', g: 'peach', items: {bourbon: 2, peach: 1, lemon: .75}},
  {n: 'Tequila Sunrise', glass: 'highball', ice: true, method: 'build', g: 'orange', items: {tequila: 2, oj: 4, grenadine: .5}},
  {n: 'Virgin Mojito', glass: 'highball', ice: true, method: 'muddle', g: 'mint', items: {lime: 1, simple: .75, soda: 4}, na: true},
  {n: 'Shirley Temple', glass: 'highball', ice: true, method: 'build', g: 'cherry', items: {ginger: 5, grenadine: .5}, na: true},
  {n: 'Peach Fizz', glass: 'highball', ice: true, method: 'shake', g: 'peach', items: {peach: 1.5, lemon: .75, soda: 3}, na: true},
  {n: 'Arnold Palmer', glass: 'highball', ice: true, method: 'build', g: 'lemon', items: {tea: 3, lemonade: 3}, na: true},
  {n: 'Sweet Auburn Cooler', glass: 'rocks', ice: true, method: 'stir', g: 'lemon', items: {tea: 3, peach: .5, lemon: .5}, na: true},
  {n: 'Ginger Spritz', glass: 'mug', ice: true, method: 'build', g: 'lime', items: {lime: .5, ginger: 4, soda: 1}, na: true}
];
M.JOBS.bar = {
  name: 'Bartender', icon: '🍸', venue: 'Club Turn Up · Midtown', unlock: 2, pay: [110, 340], glow: 'rgba(255,194,26,.4)',
  blurb: 'Make drinks to order: the right glass, ice, measured pours (hold to pour), shake or stir, garnish. Check IDs and cut off anyone who has had too much.',
  start(ctx){
    const menu = RECIPES.filter(r => ctx.zero ? r.na : true);
    const pool = ctx.zero ? menu : menu.slice(0, Math.min(menu.length, 5 + ctx.lv));
    const st = this.st = {orders: [], sel: 0, done: 0, scores: [], notes: [], glass: null, pouring: null, menu: pool};
    if (ctx.training){
      const first = ctx.zero ? RECIPES.find(r => r.n === 'Peach Fizz') : RECIPES[0];
      st.orders = [{rec: first}, {rec: ctx.zero ? RECIPES.find(r => r.n === 'Shirley Temple') : RECIPES[4], young: true, age: 19}, {rec: ctx.zero ? RECIPES.find(r => r.n === 'Arnold Palmer') : RECIPES[5], drunk: true}];
    } else {
      const n = 4 + Math.min(3, Math.floor(ctx.lv / 2));
      for (let i = 0; i < n; i++){
        const rec = M.pick(pool), young = !rec.na && Math.random() < .22, drunk = !young && !rec.na && Math.random() < .12;
        st.orders.push({rec, young, drunk, age: young ? (Math.random() < .5 ? 18 + Math.floor(Math.random() * 3) : 21 + Math.floor(Math.random() * 5)) : 30});
      }
    }
    st.total = st.orders.length;
    st.time = ctx.training ? 0 : 55 * st.total * Math.max(.6, 1 - ctx.lv * .04);
    st.t0 = performance.now();
    this.layout(ctx);
    if (!ctx.training) ctx.every(() => { const left = 1 - (performance.now() - st.t0) / 1000 / st.time; ctx.time(left); if (left <= 0) this.finish(ctx, true); }, 200);
  },
  layout(ctx){
    const {h} = ctx, st = this.st;
    st.left = h('div', {style: {display: 'flex', flexDirection: 'column', gap: '12px'}});
    st.right = h('div', {style: {display: 'flex', flexDirection: 'column', gap: '12px'}});
    ctx.body.replaceChildren(h('div', {class: 'bar-wrap'}, st.left, st.right));
    this.newGlass(null); this.draw(ctx);
  },
  newGlass(type){ this.st.glass = type ? {type, ice: false, items: {}, method: null, garnish: null} : null; },
  open(){ return this.st.orders.filter(o => !o.done); },
  draw(ctx){
    const {h} = ctx, st = this.st, open = this.open();
    if (!open.length) return this.finish(ctx);
    if (!open.includes(st.orders[st.sel])) st.sel = st.orders.indexOf(open[0]);
    const o = st.orders[st.sel], r = o.rec;
    ctx.hud(h('span', {class: 'chip'}, `🧾 ${st.done}/${st.total} served`), h('span', {class: 'chip gold'}, `💵 tips ${M.money(Math.round(st.scores.reduce((a, b) => a + b, 0) * 30))}`));
    // left: orders, the ticket, the guest
    const tabs = h('div', {class: 'orders'}, st.orders.map((x, i) => x.done ? null : h('button', {class: 'btn' + (i === st.sel ? ' on' : ''), type: 'button', onclick: () => { st.sel = i; this.draw(ctx); }},
      h('span', {}, (x.drunk ? '🥴 ' : x.young ? '🧑 ' : '🙂 ') + x.rec.n), h('small', {}, x.checked ? `ID: ${x.age}` : 'Guest ' + (i + 1)))));
    const guest = o.drunk ? 'Slurring, swaying, asking for "one more, a strong one".' : o.young ? (o.checked ? `ID checked: ${o.age} years old.` : 'Looks young. Very young.') : 'Regular guest, ready to order.';
    const peek = ctx.training || o.peek;
    const ticket = h('div', {class: 'ticket'},
      h('div', {class: 'tk'}, `ORDER · GUEST ${st.sel + 1}`), h('h4', {}, r.n), h('div', {}, guest),
      peek ? h('ul', {},
        h('li', {}, `${GLASS[r.glass]} glass${r.ice ? ', ice' : ', no ice'}`),
        Object.entries(r.items).map(([k, v]) => h('li', {}, `${v} oz ${ING[k][0]}`)),
        h('li', {}, `${METHOD[r.method]}, garnish ${GARNISH[r.g]}`)) :
        h('button', {class: 'btn small', type: 'button', style: {marginTop: '8px', color: '#2a1405', borderColor: '#a05a10'}, onclick: () => { o.peek = true; this.draw(ctx); }}, '📖 Peek at the recipe (−10%)'));
    const service = h('div', {class: 'actions', style: {justifyContent: 'flex-start'}},
      h('button', {class: 'btn small', type: 'button', disabled: o.checked, onclick: () => { o.checked = true; ctx.say(`ID says ${o.age}.`, o.age < 21 ? 'bad' : 'good'); this.draw(ctx); }}, '🪪 Check ID'),
      h('button', {class: 'btn small danger', type: 'button', onclick: () => this.refuse(ctx, 'refuse')}, '⛔ Refuse service'),
      h('button', {class: 'btn small danger', type: 'button', onclick: () => this.refuse(ctx, 'cut')}, '🚫 Cut off, offer water'));
    st.left.replaceChildren(tabs, ticket, service, ctx.training ? this.coach(ctx, o) : null);
    // right: the glass and the bar
    const g = st.glass;
    const vol = g ? Object.values(g.items).reduce((a, b) => a + b, 0) : 0, cap = g ? {rocks: 8, highball: 12, coupe: 6, mug: 14}[g.type] : 1;
    const layers = g ? Object.entries(g.items).map(([k, v]) => h('i', {style: {height: (v / cap * 100) + '%', background: ING[k][1]}})) : [];
    const view = h('div', {class: 'glassview'}, g ? h('div', {class: 'vessel ' + g.type},
      h('div', {class: 'liq', style: {height: Math.min(100, vol / cap * 100) + '%'}}, layers),
      g.ice ? h('div', {class: 'ice'}, Array.from({length: 6}, () => h('b'))) : null,
      g.garnish ? h('div', {class: 'garn'}, GARNISH[g.garnish].split(' ')[0]) : null) : h('div', {class: 'muted'}, 'Pick a glass to start.'));
    st.ozEl = h('div', {class: 'oz'}, st.pouring ? `${ING[st.pouring][0]} ${(g.items[st.pouring] || 0).toFixed(2)} oz` : g ? `${vol.toFixed(2)} oz in the glass` : '');
    const row = (lab, ...kids) => h('div', {class: 'steprow'}, h('span', {class: 'lab'}, lab), ...kids);
    const bottles = h('div', {class: 'bottles'}, Object.entries(ING).filter(([k, v]) => !(ctx.zero && v[2])).map(([k, [n, c]]) => {
      const b = h('button', {class: 'bottle', type: 'button', '--c': c, disabled: !g, 'aria-label': `Hold to pour ${n}`}, h('i'), n, g && g.items[k] ? h('small', {}, g.items[k].toFixed(2) + ' oz') : null);
      const startPour = e => { e.preventDefault(); if (!st.glass) return; try{ b.setPointerCapture(e.pointerId); }catch(err){} st.pouring = k; b.classList.add('pouring');
        clearInterval(st.pourT); st.pourT = setInterval(() => { st.glass.items[k] = Math.round(((st.glass.items[k] || 0) + .05) * 100) / 100; ctx.sfx('pour'); this.updateOz(ctx); }, 50); };
      const endPour = () => { if (st.pouring !== k) return; clearInterval(st.pourT); st.pouring = null; b.classList.remove('pouring'); this.draw(ctx); };
      b.addEventListener('pointerdown', startPour); b.addEventListener('pointerup', endPour); b.addEventListener('pointercancel', endPour); b.addEventListener('lostpointercapture', endPour);
      return b; }));
    st.right.replaceChildren(
      h('div', {class: 'panel'}, view, st.ozEl),
      h('div', {class: 'panel', style: {display: 'flex', flexDirection: 'column', gap: '10px'}},
        row('Glass', Object.entries(GLASS).map(([k, n]) => h('button', {class: 'btn small' + (g && g.type === k ? ' on' : ''), type: 'button', onclick: () => { this.newGlass(k); ctx.sfx('tap'); this.draw(ctx); }}, n))),
        row('Ice', h('button', {class: 'btn small' + (g && g.ice ? ' on' : ''), type: 'button', disabled: !g, onclick: () => { g.ice = !g.ice; ctx.sfx('tap'); this.draw(ctx); }}, '🧊 Ice')),
        h('div', {class: 'lab muted', style: {font: '700 11px var(--tum-display)', letterSpacing: '.16em'}}, 'HOLD A BOTTLE TO POUR · ABOUT 1 OZ A SECOND'),
        bottles,
        row('Method', Object.entries(METHOD).map(([k, n]) => h('button', {class: 'btn small' + (g && g.method === k ? ' on' : ''), type: 'button', disabled: !g, onclick: () => { g.method = k; ctx.sfx('tap'); this.draw(ctx); }}, n))),
        row('Garnish', Object.entries(GARNISH).map(([k, n]) => h('button', {class: 'btn small' + (g && g.garnish === k ? ' on' : ''), type: 'button', disabled: !g, onclick: () => { g.garnish = k; ctx.sfx('tap'); this.draw(ctx); }}, n))),
        h('div', {class: 'actions', style: {justifyContent: 'flex-start'}},
          h('button', {class: 'btn primary big', type: 'button', disabled: !g, onclick: () => this.serve(ctx)}, '✅ Serve'),
          h('button', {class: 'btn', type: 'button', disabled: !g, onclick: () => { this.newGlass(null); this.draw(ctx); }}, '🗑 Dump it'))));
  },
  updateOz(ctx){ const st = this.st, g = st.glass; if (st.ozEl && g && st.pouring) st.ozEl.textContent = `${ING[st.pouring][0]} ${(g.items[st.pouring] || 0).toFixed(2)} oz`; },
  coach(ctx, o){
    const st = this.st, g = st.glass, r = o.rec, h = ctx.h;
    let msg;
    if (o.young && !o.checked) msg = '<b>This guest looks young.</b> Tap 🪪 Check ID before you make anything.';
    else if (o.young && o.age < 21 && !r.na) msg = `<b>They're ${o.age}.</b> Under 21 can't be served alcohol. Tap ⛔ Refuse service (you can offer them a mocktail another time).`;
    else if (o.drunk) msg = "<b>This guest has had too much.</b> Serving them more is dangerous and against the law. Tap 🚫 Cut off and offer water.";
    else if (!g) msg = `<b>Step 1:</b> pick the ${GLASS[r.glass]} glass.`;
    else if (g.type !== r.glass) msg = `Wrong glass. Pick ${GLASS[r.glass]}.`;
    else if (r.ice && !g.ice) msg = '<b>Step 2:</b> add 🧊 ice.';
    else { const need = Object.entries(r.items).find(([k, v]) => Math.abs((g.items[k] || 0) - v) > .25);
      if (need) msg = `<b>Pour:</b> hold <b>${ING[need[0]][0]}</b> until it reads <b>${need[1]} oz</b> (within ¼ oz).`;
      else if (g.method !== r.method) msg = `<b>Method:</b> tap ${METHOD[r.method]}.`;
      else if (g.garnish !== r.g) msg = `<b>Garnish:</b> tap ${GARNISH[r.g]}.`;
      else msg = '<b>Looks perfect.</b> Tap ✅ Serve.'; }
    return h('div', {class: 'coach', html: msg});
  },
  grade(o, g){
    const r = o.rec, notes = [];
    let s = 1;
    if (g.type !== r.glass){ s -= .2; notes.push(`wrong glass (${GLASS[r.glass]})`); }
    if (!!g.ice !== r.ice){ s -= .1; notes.push(r.ice ? 'needed ice' : 'no ice in this one'); }
    for (const [k, v] of Object.entries(r.items)){ const d = Math.abs((g.items[k] || 0) - v); if (!g.items[k]){ s -= .2; notes.push(`missing ${ING[k][0]}`); } else if (d > .25){ s -= .15; notes.push(`${ING[k][0]} ${g.items[k].toFixed(2)} oz (needed ${v})`); } }
    for (const k of Object.keys(g.items)) if (!(k in r.items)){ s -= .15; notes.push(`${ING[k][0]} doesn't belong`); }
    if (g.method !== r.method){ s -= .15; notes.push(`should be ${METHOD[r.method]}`); }
    if (g.garnish !== r.g){ s -= .1; notes.push(`garnish is ${GARNISH[r.g]}`); }
    if (o.peek) s -= .1;
    return [clamp(s, 0, 1), notes];
  },
  serve(ctx){
    const st = this.st, o = st.orders[st.sel], g = st.glass; if (!g) return;
    if (o.drunk){ this.done(ctx, o, 0, false, `Served ${o.rec.n} to a guest who was already drunk. Always cut them off.`); return; }
    if (o.young && o.age < 21 && !o.rec.na){ this.done(ctx, o, 0, false, `Served alcohol to a ${o.age}-year-old. Check IDs on anyone who looks young.`); return; }
    let [s, notes] = this.grade(o, g);
    if (o.young && !o.checked && !o.rec.na){ s = Math.max(0, s - .4); notes.push('never checked the ID'); }
    this.done(ctx, o, s, s >= .7, notes.length ? `${o.rec.n}: ${notes.join(', ')}.` : `${o.rec.n}: perfect pour.`);
  },
  refuse(ctx, how){
    const st = this.st, o = st.orders[st.sel];
    if (how === 'cut'){ if (o.drunk) this.done(ctx, o, 1, true, 'Cut off the drunk guest and got them water. Exactly right.'); else this.done(ctx, o, 0, false, `Cut off a sober guest who just wanted a ${o.rec.n}.`); return; }
    if (o.young && o.age < 21 && !o.rec.na) this.done(ctx, o, o.checked ? 1 : .7, true, `Refused a ${o.age}-year-old${o.checked ? ' after checking ID' : ''}. Right call.`);
    else if (o.drunk) this.done(ctx, o, .6, true, 'Refused the drunk guest. Cutting off with water is even better.');
    else this.done(ctx, o, 0, false, `Refused a guest who was ${o.checked ? o.age : 'of age'} and fine to serve.`);
  },
  done(ctx, o, s, ok, note){
    const st = this.st;
    o.done = true; st.done++; st.scores.push(s); st.notes.push([ok, note]);
    ctx.say(note, ok ? 'good' : 'bad'); if (ok) ctx.sfx('cash');
    this.newGlass(null); this.draw(ctx);
  },
  finish(ctx, timeout){
    const st = this.st; if (st.over) return; st.over = true;
    const missing = st.total - st.scores.length;
    if (timeout && missing) st.notes.push([false, `${missing} order${missing > 1 ? 's' : ''} never got made before close.`]);
    ctx.end({score: st.scores.reduce((a, b) => a + b, 0) / st.total, notes: st.notes, bonus: Math.round(st.scores.reduce((a, b) => a + b, 0) * 30)});
  },
  stop(){ clearInterval(this.st && this.st.pourT); }
};

/* ======================================================== 🎧 DJ */
const GENRES = ['ATL trap', 'R&B', 'Afrobeats', 'House', 'Snap & crunk', 'Throwback hip-hop', 'Amapiano', 'Reggaeton'];
const TITLE_A = ['Peachtree', 'Midnight', 'Velvet', 'Southside', 'Neon', 'Ponce', 'Gold', 'Westside', 'Skyline', 'Bankhead'];
const TITLE_B = ['Bounce', 'Fever', 'Ride', 'Glow', 'Anthem', 'Motion', 'Shuffle', 'Heat', 'Drip', 'Groove'];
M.JOBS.dj = {
  name: 'DJ', icon: '🎧', venue: 'Westside Warehouse', unlock: 6, pay: [140, 400], glow: 'rgba(77,225,255,.35)',
  blurb: 'Read the room, pick the record the crowd asks for, beatmatch it by ear and eye, drop it on the one and crossfade. Keep the floor full.',
  start(ctx){
    const st = this.st = {rounds: ctx.training ? 1 : 3, r: 0, scores: [], notes: [], energy: .5};
    st.ac = ctx.audio();
    st.master = st.ac ? st.ac.createGain() : null; if (st.master){ st.master.gain.value = .5; st.master.connect(st.ac.destination); }
    st.clock0 = performance.now() / 1000;
    const bpm = Math.round(M.rnd(118, 126) * 2) / 2;
    st.A = {bpm, t0: this.now() + .1, gain: 1, col: '#ffc21a', title: `${M.pick(TITLE_A)} ${M.pick(TITLE_B)}`, genre: M.pick(GENRES), next: 0, root: 55};
    st.A.next = st.A.t0;
    st.B = null; st.xf = 0;
    this.layout(ctx);
    st.sched = setInterval(() => this.schedule(), 25);
    ctx.loop((dt) => this.frame(ctx, dt));
    this.round(ctx);
  },
  now(){ const st = this.st; return st.ac ? st.ac.currentTime : performance.now() / 1000 - st.clock0; },
  /* a tiny drum machine: kick on every beat, hat on the off-beat, bass on the "and" — one per deck */
  voice(deck, t, i){
    const st = this.st, ac = st.ac; if (!ac) return;
    const g = deck === st.A ? 1 - st.xf * (st.B ? 1 : 0) : st.xf;
    const vol = g * (deck.cue ? .35 : 1); if (vol < .02 && !deck.cue) return;
    const k = ac.createOscillator(), kg = ac.createGain(); k.frequency.setValueAtTime(150, t); k.frequency.exponentialRampToValueAtTime(45, t + .12);
    kg.gain.setValueAtTime(.9 * vol, t); kg.gain.exponentialRampToValueAtTime(.001, t + .22); k.connect(kg); kg.connect(st.master); k.start(t); k.stop(t + .24);
    const ib = 60 / deck.bpm, ht = t + ib / 2;
    const n = ac.createBufferSource(); if (!this.noise){ const b = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate), d = b.getChannelData(0); for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1; this.noise = b; }
    n.buffer = this.noise; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000; const ng = ac.createGain(); ng.gain.setValueAtTime(.18 * vol, ht); ng.gain.exponentialRampToValueAtTime(.001, ht + .05);
    n.connect(hp); hp.connect(ng); ng.connect(st.master); n.start(ht); n.stop(ht + .06);
    const b = ac.createOscillator(), bg = ac.createGain(); b.type = 'sawtooth'; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    b.frequency.value = deck.root * (i % 8 >= 4 ? 1.335 : 1); bg.gain.setValueAtTime(.0001, ht); bg.gain.linearRampToValueAtTime(.16 * vol, ht + .01); bg.gain.exponentialRampToValueAtTime(.001, ht + ib * .45);
    b.connect(lp); lp.connect(bg); bg.connect(st.master); b.start(ht); b.stop(ht + ib * .5);
  },
  schedule(){
    const st = this.st; if (!st || !st.ac) return;
    const horizon = this.now() + .12;
    for (const d of [st.A, st.B]){ if (!d || !d.playing && d !== st.A) continue;
      const ib = 60 / d.bpm;
      while (d.next < horizon){ const i = Math.round((d.next - d.t0) / ib); this.voice(d, d.next, i); d.next += ib; } }
  },
  beatOf(d){ const ib = 60 / d.bpm; return (this.now() - d.t0) / ib; },
  layout(ctx){
    const {h} = ctx, st = this.st;
    const deck = (id, label) => {
      const el = {};
      el.root = h('div', {class: 'deck'}, h('h4', {}, label),
        el.title = h('b', {style: {font: '700 15px var(--tum-display)', textAlign: 'center'}}),
        el.plat = h('div', {class: 'platter'}, el.mark = h('i', {class: 'mark'})),
        h('div', {style: {display: 'flex', alignItems: 'center', gap: '10px'}}, el.lamp = h('span', {class: 'lamp'}), el.bpm = h('div', {class: 'bpm'})),
        el.beats = h('div', {class: 'beats', 'aria-hidden': 'true'}, Array.from({length: 16}, (_, i) => h('i', {class: i === 0 ? 'one' : ''}))));
      return el;
    };
    st.dA = deck('A', 'DECK A · ON AIR'); st.dB = deck('B', 'DECK B · CUE');
    st.pitch = h('input', {type: 'range', min: -8, max: 8, step: .1, value: 0, class: 'pitch', 'aria-label': 'Deck B tempo (pitch fader)'});
    st.pitch.addEventListener('input', () => { if (st.B && !st.B.locked){ const ph = this.beatOf(st.B); st.B.bpm = st.B.base * (1 + st.pitch.value / 100); st.B.t0 = this.now() - ph * 60 / st.B.bpm; st.B.next = this.now() + .02; this.paintB(); } });
    st.xfader = h('input', {type: 'range', min: 0, max: 1, step: .01, value: 0, 'aria-label': 'Crossfader'});
    st.xfader.addEventListener('input', () => { if (st.phase === 'fade'){ st.xf = +st.xfader.value; } else st.xfader.value = st.xf; });
    st.drop = h('button', {class: 'btn primary big', type: 'button', onclick: () => this.dropIt(ctx)}, '⚡ DROP (space)');
    st.crowd = h('div', {class: 'crowd', 'aria-hidden': 'true'}, Array.from({length: 18}, () => h('i')));
    st.diff = h('div', {class: 'chip'});
    const mixer = h('div', {class: 'mixer'}, h('span', {class: 'kick'}, 'Pitch B'), st.pitch, st.diff, h('span', {class: 'kick'}, 'Crowd'), st.crowd);
    st.coach = h('div', {class: 'coach'});
    st.panel = h('div', {class: 'panel'});
    ctx.body.replaceChildren(st.coach, h('div', {class: 'decks'}, st.dA.root, mixer, st.dB.root),
      h('div', {class: 'panel', style: {display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center'}}, h('span', {class: 'kick', style: {margin: 0}}, 'Crossfader A ⟷ B'), h('div', {style: {flex: '1 1 200px'}}, st.xfader), st.drop), st.panel);
    this.paintA();
  },
  paintA(){ const st = this.st; st.dA.title.textContent = `${st.A.title} · ${st.A.genre}`; st.dA.bpm.innerHTML = `${st.A.bpm.toFixed(1)}<small>BPM</small>`; st.dA.root.style.setProperty('--c', st.A.col); },
  paintB(){ const st = this.st; if (!st.B){ st.dB.title.textContent = 'Load a record'; st.dB.bpm.innerHTML = '—'; st.diff.textContent = ''; return; }
    st.dB.title.textContent = `${st.B.title} · ${st.B.genre}`; st.dB.bpm.innerHTML = `${st.B.bpm.toFixed(1)}<small>BPM</small>`; st.dB.root.style.setProperty('--c', st.B.col);
    const d = st.B.bpm - st.A.bpm; st.diff.textContent = Math.abs(d) < .25 ? '🔒 Tempo locked' : `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} off`; st.diff.className = 'chip ' + (Math.abs(d) < .25 ? 'ok' : Math.abs(d) < 1 ? 'gold' : 'bad'); },
  round(ctx){
    const {h} = ctx, st = this.st;
    if (st.r >= st.rounds) return this.done(ctx);
    st.phase = 'pick'; st.xf = 0; st.xfader.value = 0; st.drop.disabled = true;
    st.req = M.pick(GENRES.filter(g => g !== st.A.genre));
    const crate = M.shuffle([st.req, ...M.shuffle(GENRES.filter(g => g !== st.req)).slice(0, 3)]).map(genre => {
      const base = Math.round(st.A.bpm * (1 + M.rnd(.025, .06) * (Math.random() < .5 ? -1 : 1)) * 2) / 2;
      return {genre, base, title: `${M.pick(TITLE_A)} ${M.pick(TITLE_B)}`};
    });
    ctx.hud(h('span', {class: 'chip'}, `Mix ${st.r + 1} / ${st.rounds}`), h('span', {class: 'chip gold'}, `Energy ${Math.round(st.energy * 100)}%`));
    st.coach.innerHTML = ctx.training ? '<b>1 · Read the crowd.</b> A guest just asked for something. Load the record that matches their request into Deck B.' : `<b>Request:</b> "${M.pick(['Play some', 'Can you run', 'We want', 'Give us some'])} ${st.req}!"`;
    st.panel.replaceChildren(h('p', {class: 'kick'}, `🙋 Crowd request: ${st.req}`), h('div', {class: 'crate'}, crate.map(t => h('button', {class: 'track', type: 'button', onclick: () => this.load(ctx, t)},
      h('b', {}, t.title), h('small', {}, `${t.genre} · ${t.base.toFixed(1)} BPM`)))));
    this.paintB();
  },
  load(ctx, t){
    const st = this.st;
    st.pickOk = t.genre === st.req;
    st.B = {bpm: t.base, base: t.base, title: t.title, genre: t.genre, col: M.pick(['#4de1ff', '#ff4fd8', '#5fd38d']), t0: this.now() + Math.random() * .3, cue: true, playing: true, root: M.pick([49, 52, 58, 62])};
    st.B.next = st.B.t0; st.pitch.value = 0;
    st.phase = 'match'; st.drop.disabled = false;
    ctx.say(st.pickOk ? `Loaded ${t.genre}. The crowd asked for it.` : `Loaded ${t.genre}, but they asked for ${st.req}.`, st.pickOk ? 'good' : 'bad');
    st.coach.innerHTML = ctx.training ? '<b>2 · Beatmatch.</b> Move the <b>Pitch B</b> fader until Deck B\'s BPM matches Deck A (watch the two lamps flash together and listen to the kicks). Then <b>3 · press DROP right on the "1"</b>, the first beat of a new 16-beat phrase on Deck A (the outlined square).' :
      '<b>Match the tempo</b>, then <b>DROP on the one</b> of the next phrase.';
    st.panel.replaceChildren(ctx.h('p', {class: 'muted', style: {margin: 0}}, 'Deck B is in your headphones (quiet in the mix). Match it, then drop it.'));
    this.paintB();
  },
  dropIt(ctx){
    const st = this.st; if (st.phase !== 'match' || !st.B) return;
    const ib = 60 / st.A.bpm, beat = this.beatOf(st.A), toOne = Math.round(beat / 16) * 16, errMs = Math.abs(beat - toOne) * ib * 1000;
    const tempoErr = Math.abs(st.B.bpm - st.A.bpm);
    // deck B starts its own phrase right now
    st.B.t0 = this.now(); st.B.next = st.B.t0; st.B.cue = false; st.B.locked = true;
    st.dropScore = {errMs, tempoErr};
    st.phase = 'fade'; st.fadeStart = this.now(); st.drop.disabled = true;
    const good = errMs < 140;
    ctx.say(good ? `On the one! (${Math.round(errMs)} ms)` : errMs < 300 ? `Close: ${Math.round(errMs)} ms off the one.` : 'Train wreck: that wasn\'t on the one.', good ? 'good' : 'bad');
    st.coach.innerHTML = '<b>4 · Crossfade.</b> Slide the crossfader all the way to <b>B</b> within the next 16 beats.';
  },
  frame(ctx, dt){
    const st = this.st; if (!st || !st.A) return;
    const ib = 60 / st.A.bpm, ba = this.beatOf(st.A), ia = Math.floor(ba);
    const lampA = (ba % 1) < .18, pa = ((ia % 16) + 16) % 16;
    st.dA.lamp.classList.toggle('on', lampA);
    [...st.dA.beats.children].forEach((e, i) => e.classList.toggle('on', i === pa));
    st.dA.mark.style.transform = `translateX(-50%) rotate(${(ba % 4) * 90}deg)`;
    if (st.B){ const bb = this.beatOf(st.B), ib2 = Math.floor(bb); st.dB.lamp.classList.toggle('on', (bb % 1) < .18); const pb = ((ib2 % 16) + 16) % 16;
      [...st.dB.beats.children].forEach((e, i) => e.classList.toggle('on', i === pb)); st.dB.mark.style.transform = `translateX(-50%) rotate(${(bb % 4) * 90}deg)`; }
    if (!st.ac && st.A){ /* silent mode still advances via the clock */ }
    // crowd
    const target = st.energy * (st.phase === 'fade' ? .9 + st.xf * .2 : 1);
    [...st.crowd.children].forEach((e, i) => { e.style.height = (12 + target * 46 * (.6 + .4 * Math.abs(Math.sin(ba * Math.PI + i)))) + 'px'; });
    if (st.phase === 'fade'){
      const beats = (this.now() - st.fadeStart) / ib;
      if (st.xf >= .95 || beats > 16) this.endMix(ctx, st.xf >= .95 && beats <= 16);
    }
  },
  endMix(ctx, faded){
    const st = this.st; st.phase = 'done';
    const {errMs, tempoErr} = st.dropScore;
    const sPick = st.pickOk ? .3 : 0, sTempo = .3 * clamp(1 - tempoErr / 2, 0, 1), sDrop = .25 * clamp(1 - errMs / 300, 0, 1), sFade = faded ? .15 : 0;
    const s = sPick + sTempo + sDrop + sFade;
    st.scores.push(s);
    st.notes.push([st.pickOk, st.pickOk ? `Played the ${st.req} they asked for.` : `They asked for ${st.req}; you played ${st.B.genre}.`]);
    st.notes.push([tempoErr < .5, `Tempo ${tempoErr < .25 ? 'locked' : tempoErr.toFixed(1) + ' BPM off'}.`]);
    st.notes.push([errMs < 140, `Drop landed ${Math.round(errMs)} ms from the one.`]);
    if (!faded) st.notes.push([false, 'The crossfade wasn\'t finished in 16 beats.']);
    st.energy = clamp(st.energy + (s - .55), .1, 1);
    // B becomes A
    st.A.playing = false;
    st.A = Object.assign(st.B, {cue: false, locked: false}); st.B = null; st.xf = 0; st.xfader.value = 0;
    this.paintA();
    st.r++;
    ctx.later(() => this.round(ctx), 900);
  },
  done(ctx){ const st = this.st; ctx.end({score: st.scores.reduce((a, b) => a + b, 0) / st.rounds, notes: st.notes, bonus: Math.round(st.energy * 60)}); },
  key(ctx, e){ if (e.code === 'Space'){ e.preventDefault(); this.dropIt(ctx); } },
  stop(){ const st = this.st; if (!st) return; clearInterval(st.sched); try{ st.master && st.master.disconnect(); }catch(e){} }
};

/* ======================================================== 🍾 BOTTLE SERVICE */
const BOTTLES = [['🍾', 'Champagne', 350], ['🥂', 'Rosé', 280], ['🌵', 'Premium tequila', 300], ['🧊', 'Vodka', 260]];
const BOTTLES_ZERO = [['🍾', 'Sparkling cider', 90], ['🥂', 'Zero-proof rosé', 110], ['🍑', 'Peach sparkler', 80], ['🫧', 'Craft soda tower', 70]];
M.JOBS.vip = {
  name: 'Bottle Service', icon: '🍾', venue: 'Skyline Rooftop · O4W', unlock: 4, pay: [130, 420], glow: 'rgba(255,79,216,.35)',
  blurb: 'Run the VIP section: build each table\'s order (bottle, sparkler, glasses), deliver it to the right table before they get impatient, and close the check right.',
  start(ctx){
    const menu = ctx.zero ? BOTTLES_ZERO : BOTTLES;
    const st = this.st = {menu, tables: Array.from({length: 6}, (_, i) => ({n: i + 1, tab: 0, ticket: null, name: M.pick(['Birthday crew', 'Label folks', 'Bachelorette', 'Ballers', 'Influencers', 'Promoter table', 'Tech money', 'Old friends'])})),
      tray: {b: null, sparkler: false, glasses: 2}, pts: 0, max: 0, notes: [], spawned: 0, total: ctx.training ? 3 : 7 + Math.min(4, ctx.lv)};
    st.len = ctx.training ? 0 : 80 + st.total * 3;
    st.t0 = performance.now();
    this.layout(ctx);
    if (ctx.training){ this.spawn(ctx, {table: 2, b: 0, sparkler: true, glasses: 4, why: 'birthday'}); }
    else { this.spawn(ctx); ctx.every(() => this.tick(ctx), 250); }
  },
  spawn(ctx, spec){
    const st = this.st;
    const free = st.tables.filter(t => !t.ticket); if (!free.length || st.spawned >= st.total) return;
    let t, tk;
    const checkable = st.tables.filter(x => !x.ticket && x.tab > 0);
    if (!spec && checkable.length && Math.random() < .3){ t = M.pick(checkable); tk = {kind: 'check'}; }
    else { t = spec ? st.tables[spec.table - 1] : M.pick(free); const b = spec ? spec.b : Math.floor(Math.random() * st.menu.length);
      const why = spec ? spec.why : Math.random() < .3 ? 'birthday' : null;
      tk = {kind: 'order', b, sparkler: why === 'birthday' || Math.random() < .25, glasses: spec ? spec.glasses : 2 + Math.floor(Math.random() * 7), why}; }
    tk.born = performance.now(); tk.pat = ctx.training ? 1e9 : Math.max(16, 32 - ctx.lv * 1.4) * 1000;
    t.ticket = tk; st.spawned++; st.max += 1;
    ctx.sfx('tap'); this.draw(ctx);
  },
  tick(ctx){
    const st = this.st, now = performance.now();
    const left = 1 - (now - st.t0) / 1000 / st.len; ctx.time(left);
    for (const t of st.tables) if (t.ticket && now - t.ticket.born > t.ticket.pat){ st.notes.push([false, `Table ${t.n} waited too long and walked their order back.`]); t.ticket = null; ctx.say(`Table ${t.n} gave up on their order.`, 'bad'); this.draw(ctx); }
    const active = st.tables.filter(t => t.ticket).length;
    if (st.spawned < st.total && (active === 0 || (Math.random() < .07 && active < 3))) this.spawn(ctx);
    if (left <= 0 || (st.spawned >= st.total && !active)) this.finish(ctx);
    else this.paintPat();
  },
  paintPat(){ const st = this.st, now = performance.now(); for (const t of st.tables) if (t.ticket && t.patEl) t.patEl.style.width = Math.max(0, 100 - (now - t.ticket.born) / t.ticket.pat * 100) + '%'; },
  layout(ctx){
    const {h} = ctx, st = this.st;
    st.coach = h('div', {class: 'coach'});
    st.tk = h('div', {class: 'tickets'});
    st.floor = h('div', {class: 'floor'});
    st.trayBox = h('div', {class: 'panel'});
    ctx.body.replaceChildren(ctx.training ? st.coach : null, h('div', {class: 'split'}, h('div', {style: {display: 'flex', flexDirection: 'column', gap: '12px'}}, h('h3', {}, 'Tickets'), st.tk, st.trayBox), h('div', {}, h('h3', {style: {marginBottom: '10px'}}, 'VIP floor · tap a table to deliver'), st.floor)));
    this.draw(ctx);
  },
  desc(tk){ const b = this.st.menu[tk.b]; return `${b[0]} ${b[1]}${tk.sparkler ? ' + ✨ sparkler' : ''} · ${tk.glasses} glasses${tk.why === 'birthday' ? ' · 🎂 birthday' : ''}`; },
  draw(ctx){
    const {h} = ctx, st = this.st, tr = st.tray;
    ctx.hud(h('span', {class: 'chip'}, `🛎 ${st.spawned}/${st.total}`), h('span', {class: 'chip gold'}, `💵 ${M.money(st.tables.reduce((a, t) => a + t.tab, 0))} sold`));
    st.tk.replaceChildren(...st.tables.filter(t => t.ticket).map(t => h('div', {class: 'tk-card'}, h('b', {}, `T${t.n}`), t.ticket.kind === 'check' ? '🧾 Wants the check' : this.desc(t.ticket),
      h('div', {class: 'pat'}, h('div', {class: 'bar'}, t.patEl = h('i', {style: {width: '100%'}}))))));
    if (!st.tk.children.length) st.tk.append(h('p', {class: 'muted'}, 'No open tickets. Watch the floor.'));
    st.floor.replaceChildren(...st.tables.map(t => h('button', {class: 'table' + (t.ticket ? ' wait' : ''), type: 'button', onclick: () => this.deliver(ctx, t)},
      h('b', {}, `VIP ${t.n}`), h('small', {}, t.name), h('small', {}, t.tab ? `Tab ${M.money(t.tab)}` : 'No tab yet'))));
    st.trayBox.replaceChildren(h('h3', {}, '🛒 Your tray'),
      h('div', {class: 'tray'}, st.menu.map((b, i) => h('button', {class: 'btn small' + (tr.b === i ? ' on' : ''), type: 'button', onclick: () => { tr.b = i; ctx.sfx('tap'); this.draw(ctx); }}, `${b[0]} ${b[1]} · ${M.money(b[2])}`))),
      h('div', {class: 'tray', style: {marginTop: '10px'}},
        h('button', {class: 'btn small' + (tr.sparkler ? ' on' : ''), type: 'button', onclick: () => { tr.sparkler = !tr.sparkler; this.draw(ctx); }}, '✨ Sparkler'),
        h('span', {class: 'stepper'}, '🥂 Glasses', h('button', {class: 'btn small', type: 'button', onclick: () => { tr.glasses = Math.max(1, tr.glasses - 1); this.draw(ctx); }}, '−'), h('b', {}, String(tr.glasses)), h('button', {class: 'btn small', type: 'button', onclick: () => { tr.glasses = Math.min(12, tr.glasses + 1); this.draw(ctx); }}, '+'))));
    if (ctx.training){
      const open = st.tables.find(t => t.ticket);
      st.coach.innerHTML = !open ? '' : open.ticket.kind === 'check' ? `<b>Close the tab.</b> Tap table ${open.n}, then pick the right total.` :
        `<b>Build the order on your tray:</b> ${this.desc(open.ticket)}. Then <b>tap VIP ${open.n}</b> on the floor to carry it over.`;
    }
    this.paintPat();
  },
  deliver(ctx, t){
    const st = this.st, tk = t.ticket;
    if (!tk){ ctx.say(`VIP ${t.n} didn't order anything.`, 'bad'); st.pts -= .25; return; }
    if (tk.kind === 'check') return this.check(ctx, t);
    const tr = st.tray, ok = tr.b === tk.b, okS = tr.sparkler === tk.sparkler, okG = tr.glasses === tk.glasses;
    const fresh = 1 - (performance.now() - tk.born) / tk.pat;
    let s = (ok ? .6 : 0) + (okS ? .2 : 0) + (okG ? .2 : 0);
    if (!ctx.training) s *= .75 + .25 * clamp(fresh, 0, 1);
    st.pts += s;
    const b = st.menu[tk.b];
    if (ok) t.tab += b[2];
    const miss = [!ok && 'wrong bottle', !okS && (tk.sparkler ? 'forgot the sparkler' : 'sparkler not wanted'), !okG && `${tk.glasses} glasses, not ${tr.glasses}`].filter(Boolean);
    st.notes.push([s >= .8, `VIP ${t.n}: ${miss.length ? miss.join(', ') : 'perfect delivery'}.`]);
    ctx.say(miss.length ? `VIP ${t.n}: ${miss.join(', ')}.` : `VIP ${t.n} is lit. Perfect delivery.`, miss.length ? 'bad' : 'good');
    t.ticket = null; st.tray = {b: null, sparkler: false, glasses: 2};
    if (ctx.training && st.spawned === 1){ ctx.later(() => this.spawn(ctx, {table: 5, b: 1, glasses: 3}), 600); }
    else if (ctx.training && st.spawned === 2){ ctx.later(() => { const tt = st.tables[1]; tt.ticket = {kind: 'check', born: performance.now(), pat: 1e9}; st.spawned++; st.max++; this.draw(ctx); }, 600); }
    if (ctx.training && st.spawned >= st.total && !st.tables.some(x => x.ticket)) ctx.later(() => this.finish(ctx), 800);
    this.draw(ctx);
  },
  check(ctx, t){
    const {h} = ctx, st = this.st, total = t.tab, tip = Math.round(total * .2);
    const right = total + tip, opts = M.shuffle([right, right + 50, Math.round(total * 1.1)]);
    st.trayBox.replaceChildren(h('h3', {}, `🧾 VIP ${t.n}'s check`), h('p', {class: 'muted'}, `Bottles ${M.money(total)} plus the 20% service charge.`),
      h('div', {class: 'tray'}, opts.map(v => h('button', {class: 'btn', type: 'button', onclick: () => {
        const ok = v === right; st.pts += ok ? 1 : 0; st.notes.push([ok, `VIP ${t.n}'s check: ${ok ? 'closed right at ' + M.money(right) : `${M.money(v)} was wrong (${M.money(right)})`}.`]);
        ctx.say(ok ? `Closed at ${M.money(right)}. They tipped extra.` : `Wrong total. It was ${M.money(right)}.`, ok ? 'good' : 'bad');
        t.ticket = null; t.tab = 0; if (ctx.training) ctx.later(() => this.finish(ctx), 700); this.draw(ctx); }}, M.money(v)))));
  },
  finish(ctx){ const st = this.st; if (st.over) return; st.over = true; ctx.end({score: clamp(st.pts / Math.max(1, st.max), 0, 1), notes: st.notes, bonus: Math.round(st.tables.reduce((a, t) => a + t.tab, 0) * .03)}); }
};

/* ======================================================== 📣 PROMOTER */
const CROWDS = [
  {id: 'college', label: 'College crowd, 18–24, lives on TikTok', likes: ['trap', 'snap'], ch: {tiktok: 1.45, ig: 1.3, flyers: 1.15, email: .9, radio: 1.05, influencer: 1.35}, price: 1.3},
  {id: 'pros', label: 'Young professionals, 25–34, after-work crowd', likes: ['rnb', 'house'], ch: {tiktok: 1.0, ig: 1.25, flyers: .95, email: 1.3, radio: 1.15, influencer: 1.2}, price: .8},
  {id: 'afro', label: 'Afrobeats and amapiano heads', likes: ['afro'], ch: {tiktok: 1.25, ig: 1.35, flyers: 1.05, email: 1.1, radio: 1.0, influencer: 1.3}, price: 1},
  {id: 'grown', label: 'Grown and sexy, 35+, throwback lovers', likes: ['throwback', 'rnb'], ch: {tiktok: .85, ig: 1.05, flyers: 1.1, email: 1.35, radio: 1.4, influencer: .95}, price: .7},
  {id: 'latin', label: 'Latin night regulars', likes: ['latin'], ch: {tiktok: 1.2, ig: 1.3, flyers: 1.1, email: 1.15, radio: 1.25, influencer: 1.15}, price: 1}
];
const THEMES = {trap: '🔥 ATL Trap Night', rnb: '💜 R&B Slow Jams', afro: '🌍 Afrobeats & Amapiano', house: '🪩 House & Disco', throwback: '📼 Throwback Hip-Hop', latin: '💃 Reggaeton & Latin', snap: '👟 Snap & Crunk Revival'};
const TALENT = [['Local DJ', 150, 1.0], ['Rising artist', 600, 1.3], ['Name DJ', 1500, 1.7]];
const CHANNELS = {tiktok: ['📱 TikTok', 60], ig: ['📸 Instagram reels', 80], flyers: ['📄 BeltLine flyers', 40], email: ['✉️ Email list', 20], radio: ['📻 Radio spot', 400], influencer: ['🤳 Influencer post', 300]};
M.JOBS.promo = {
  name: 'Promoter', icon: '📣', venue: 'BeltLine Loft · O4W', unlock: 9, pay: [100, 460], glow: 'rgba(95,211,141,.35)',
  blurb: 'Plan the night for the right crowd: the theme, the talent, the channels and the ticket price, all inside the budget. Pack the house without blowing the money.',
  start(ctx){
    const st = this.st = {r: 0, rounds: ctx.training ? 1 : 3, scores: [], notes: []};
    this.brief(ctx);
  },
  brief(ctx){
    const {h} = ctx, st = this.st;
    if (st.r >= st.rounds) return ctx.end({score: st.scores.reduce((a, b) => a + b, 0) / st.rounds, notes: st.notes});
    const crowd = ctx.training ? CROWDS[2] : M.pick(CROWDS), day = M.pick(['Thursday', 'Friday', 'Saturday']);
    const cap = M.pick([120, 200, 300, 450]), budget = Math.round((cap * (1.4 + Math.random() * 1.6)) / 50) * 50 + 200;
    const plan = st.plan = {crowd, day, cap, budget, theme: null, talent: 0, ch: new Set(), price: 20};
    ctx.hud(h('span', {class: 'chip'}, `Event ${st.r + 1} / ${st.rounds}`));
    this.draw(ctx);
  },
  cost(p){ return TALENT[p.talent][1] + [...p.ch].reduce((a, k) => a + CHANNELS[k][1], 0); },
  draw(ctx){
    const {h} = ctx, st = this.st, p = st.plan, cost = this.cost(p), over = cost > p.budget;
    const opt = (pressed, b, s, fn, dis) => h('button', {class: 'opt', type: 'button', 'aria-pressed': String(!!pressed), disabled: !!dis, onclick: fn}, h('b', {}, b), s ? h('small', {}, s) : null);
    ctx.body.replaceChildren(
      ctx.training ? h('div', {class: 'coach', html: '<b>Match everything to the crowd in the brief.</b> Pick the theme they love, channels where they actually hang out, talent you can afford and a ticket price they will pay. Stay inside the budget.'}) : null,
      h('div', {class: 'panel'}, h('p', {class: 'kick'}, `The brief · ${p.day} night`), h('h3', {}, p.crowd.label),
        h('div', {class: 'actions', style: {justifyContent: 'flex-start'}}, h('span', {class: 'chip'}, `🏢 ${p.cap} capacity`), h('span', {class: 'chip gold'}, `💰 Budget ${M.money(p.budget)}`), h('span', {class: 'chip ' + (over ? 'bad' : 'ok')}, `Spent ${M.money(cost)}`))),
      h('div', {class: 'panel'}, h('h3', {}, 'Theme'), h('div', {class: 'opts'}, Object.entries(THEMES).map(([k, n]) => opt(p.theme === k, n, null, () => { p.theme = k; this.draw(ctx); })))),
      h('div', {class: 'split'},
        h('div', {class: 'panel'}, h('h3', {}, 'Talent'), h('div', {class: 'opts'}, TALENT.map(([n, c, d], i) => opt(p.talent === i, `${n} · ${M.money(c)}`, `Draw ×${d}`, () => { p.talent = i; this.draw(ctx); })))),
        h('div', {class: 'panel'}, h('h3', {}, 'Ticket price'), h('div', {class: 'opts'}, [10, 20, 35, 50].map(v => opt(p.price === v, M.money(v), v >= 35 ? 'Premium' : v <= 10 ? 'Easy yes' : 'Standard', () => { p.price = v; this.draw(ctx); }))))),
      h('div', {class: 'panel'}, h('h3', {}, 'Promotion channels (pick any)'), h('div', {class: 'opts'}, Object.entries(CHANNELS).map(([k, [n, c]]) => opt(p.ch.has(k), n, M.money(c), () => { p.ch.has(k) ? p.ch.delete(k) : p.ch.add(k); this.draw(ctx); })))),
      h('div', {class: 'actions'}, h('button', {class: 'btn primary big', type: 'button', disabled: !p.theme || over || !p.ch.size, onclick: () => this.run(ctx)}, over ? 'Over budget' : !p.theme ? 'Pick a theme' : !p.ch.size ? 'Pick a channel' : '🚀 Launch the event')));
  },
  run(ctx){
    const {h} = ctx, st = this.st, p = st.plan, c = p.crowd;
    const base = {Thursday: .45, Friday: .65, Saturday: .8}[p.day] * p.cap;
    const themeFit = c.likes.includes(p.theme) ? 1.35 : .75;
    const reach = 1 + [...p.ch].reduce((a, k) => a + (c.ch[k] - 1), 0) * .9 + Math.min(.25, p.ch.size * .05);
    const priceF = Math.pow(20 / p.price, .55 * c.price);
    const demand = Math.round(base * themeFit * TALENT[p.talent][2] * reach * priceF);
    const att = Math.min(p.cap, demand), cost = this.cost(p), rev = att * p.price, profit = rev - cost;
    const fill = att / p.cap, s = clamp(fill * .6 + clamp(profit / (p.cap * 20 * .6), 0, 1) * .4, 0, 1);
    st.scores.push(s);
    const best = [...p.ch].sort((a, b) => c.ch[b] - c.ch[a])[0], worst = [...p.ch].sort((a, b) => c.ch[a] - c.ch[b])[0];
    st.notes.push([themeFit > 1, themeFit > 1 ? `${THEMES[p.theme]} was exactly what this crowd wanted.` : `This crowd wasn't feeling ${THEMES[p.theme]}.`]);
    st.notes.push([c.ch[best] > 1.2, `${CHANNELS[best][0]} ${c.ch[best] > 1.2 ? 'reached them where they are' : 'only reached a few of them'}${worst !== best && c.ch[worst] < 1 ? `; ${CHANNELS[worst][0]} was wasted money` : ''}.`]);
    st.notes.push([profit > 0, `${att} / ${p.cap} through the door, ${profit >= 0 ? 'profit' : 'loss'} ${M.money(Math.abs(profit))}${demand > p.cap ? ` (${demand - p.cap} more wanted in: you could charge more)` : ''}.`]);
    const counter = h('div', {class: 'grade', style: {fontSize: 'clamp(60px,12vw,110px)'}}, '0');
    ctx.body.replaceChildren(h('div', {class: 'result'}, h('p', {class: 'kick'}, `${p.day} · ${THEMES[p.theme]}`), counter, h('h3', {}, `of ${p.cap} through the door`), h('div', {class: 'list'}, st.notes.slice(-3).map(([ok, t]) => h('div', {}, ok ? '✅ ' : '❌ ', t)))));
    let n = 0; const step = Math.max(1, Math.round(att / 40));
    const iv = ctx.every(() => { n = Math.min(att, n + step); counter.textContent = n; if (n >= att){ clearInterval(iv); ctx.sfx(profit > 0 ? 'cash' : 'bad'); } }, 35);
    st.r++;
    ctx.later(() => { ctx.body.querySelector('.result').append(h('button', {class: 'btn primary', type: 'button', onclick: () => this.brief(ctx)}, st.r >= st.rounds ? 'Finish shift' : 'Next event')); }, 1600);
  }
};
})();
