'use strict';
/* =====================================================================
   ATL Nightclub Mogul — the owner side: buy clubs across Atlanta,
   upgrade them, hire staff, book the night and run it live.
   ===================================================================== */
(() => {
const M = window.Mogul;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const VENUES = [
  {id: 'peach', name: 'The Peach Room', hood: 'Edgewood Ave', price: 500, cap: 80, cover: 10, drink: 9, rent: 60, rep: 12, img: 'club', world: 'club', mood: 0, c: 'rgba(255,165,80,.55)'},
  {id: 'basement', name: 'The Basement', hood: 'East Atlanta Village', price: 2500, cap: 140, cover: 12, drink: 10, rent: 180, rep: 12, img: 'club', world: 'club', mood: 3, c: 'rgba(95,211,141,.45)'},
  {id: 'warehouse', name: 'Westside Warehouse', hood: 'Westside', price: 9000, cap: 320, cover: 20, drink: 12, rent: 600, rep: 20, img: 'concert', world: 'concert', mood: 1, c: 'rgba(255,79,216,.5)'},
  {id: 'midtown', name: 'Club Turn Up', hood: 'Midtown', price: 22000, cap: 300, cover: 25, drink: 14, rent: 1100, rep: 30, img: 'tokyo', world: 'club', mood: 1, c: 'rgba(77,225,255,.5)'},
  {id: 'rooftop', name: 'BeltLine Rooftop', hood: 'Old Fourth Ward', price: 45000, cap: 260, cover: 30, drink: 15, rent: 1900, rep: 40, img: 'hero', world: 'rooftop', mood: 0, c: 'rgba(255,194,26,.5)'},
  {id: 'buckhead', name: 'Buckhead Sky Lounge', hood: 'Buckhead', price: 95000, cap: 220, cover: 60, drink: 20, rent: 4000, rep: 55, img: 'penthouse', world: 'rooftop', mood: 4, c: 'rgba(255,211,107,.55)'},
  {id: 'arena', name: 'Atlantic Station Arena Club', hood: 'Atlantic Station', price: 180000, cap: 900, cover: 40, drink: 16, rent: 7500, rep: 70, img: 'concert', world: 'concert', mood: 2, c: 'rgba(107,229,255,.5)'},
  {id: 'penthouse', name: 'The Peachtree Penthouse', hood: 'Peachtree St', price: 400000, cap: 240, cover: 150, drink: 28, rent: 12000, rep: 90, img: 'penthouse', world: 'rooftop', mood: 4, c: 'rgba(255,79,216,.5)'}
];
const UPGRADES = [
  {id: 'sound', name: 'Sound system', icon: '🔊', cost: [600, 2400, 7000], fx: 'More people stay and dance'},
  {id: 'lights', name: 'Lights & lasers', icon: '💡', cost: [500, 2000, 6000], fx: 'Better reviews and word of mouth'},
  {id: 'bar', name: 'Bigger bar', icon: '🍹', cost: [800, 3000, 9000], fx: 'More drinks sold per guest'},
  {id: 'vip', name: 'VIP tables', icon: '🛋', cost: [1000, 4000, 12000], fx: 'Bottle service income'},
  {id: 'security', name: 'Security', icon: '🛡', cost: [400, 1600, 5000], fx: 'Fewer fights and fines'}
];
const STAFF = [
  {id: 'dj', name: 'Resident DJ', icon: '🎧', wage: 250, fx: '+15% crowd', max: 1},
  {id: 'bartenders', name: 'Bartenders', icon: '🍸', wage: 160, fx: '+150 drinks a night each', max: 4},
  {id: 'bouncers', name: 'Bouncers', icon: '🚪', wage: 150, fx: '+120 guests through the door each', max: 3},
  {id: 'promoter', name: 'Promoter', icon: '📣', wage: 200, fx: '+20% crowd', max: 1},
  {id: 'bottle', name: 'Bottle service', icon: '🍾', wage: 140, fx: 'Serves 4 VIP tables each', max: 3}
];
const THEMES = [
  {id: 'trap', name: '🔥 ATL Trap Night', pull: 1.15, vibe: '#ff4d3d'},
  {id: 'rnb', name: '💜 R&B Slow Jams', pull: 1.0, vibe: '#9b7bff'},
  {id: 'afro', name: '🌍 Afrobeats & Amapiano', pull: 1.1, vibe: '#5fd38d'},
  {id: 'house', name: '🪩 House & Disco', pull: 1.0, vibe: '#4de1ff'},
  {id: 'throw', name: '📼 Throwback Hip-Hop', pull: 1.05, vibe: '#ffc21a'},
  {id: 'latin', name: '💃 Reggaeton & Latin', pull: 1.05, vibe: '#ff4fd8'}
];
const TALENT = [
  {id: 'house', name: 'House DJ', cost: 0, draw: 1, fame: 0, note: 'Free if you have a resident DJ'},
  {id: 'local', name: 'Local favorite', cost: 300, draw: 1.15, fame: 0},
  {id: 'rising', name: 'Rising artist', cost: 1200, draw: 1.35, fame: 1},
  {id: 'name', name: 'Name DJ', cost: 4000, draw: 1.65, fame: 2},
  {id: 'celeb', name: 'Celebrity host', cost: 12000, draw: 2.1, fame: 4}
];
const DANCERS = ['💃🏾', '🕺🏿', '💃🏽', '🕺🏾', '💃🏻', '🕺🏽', '💃🏿', '🕺🏻', '🧍🏾', '🙌🏽', '👯', '🕺'];

const O = window.MogulOwner = {
  VENUES, UPGRADES, STAFF, THEMES, TALENT,
  sel: null, plan: {theme: 'trap', talent: 'house', coverAdj: 0},
  venue(id){ return VENUES.find(v => v.id === id); },
  upCost(u, lv, v){ return Math.round(u.cost[lv] * clamp(v.price / 2000, .3, 6) / 10) * 10; },
  upValue(id, c){ const v = this.venue(id); let w = 0; for (const u of UPGRADES) for (let i = 0; i < ((c.up || {})[u.id] || 0); i++) w += this.upCost(u, i, v) * .5; return w; },
  sizeMul(v){ return v.price >= 90000 ? 2 : v.price >= 20000 ? 1.5 : 1; },
  wages(id){ const v = this.venue(id), c = M.s.clubs[id]; return STAFF.reduce((a, st) => a + (c.staff[st.id] || 0) * st.wage * this.sizeMul(v), 0); },
  canBuy(v){ const s = M.s; return !s.clubs[v.id] && s.cash >= v.price && s.rep >= v.rep; },

  /* --------------------------------------------------------- views */
  view(){
    const s = M.s, h = M.h.bind(M);
    if (this.sel && s.clubs[this.sel]) return this.manageView(this.sel);
    this.sel = null;
    const owned = Object.keys(s.clubs);
    const head = h('div', {class: 'emp-head'},
      h('div', {}, h('p', {class: 'kick'}, 'My Empire'), h('h2', {}, owned.length ? `${owned.length} club${owned.length > 1 ? 's' : ''} across the A` : 'Buy your first club')),
      h('div', {class: 'actions'},
        owned.length > 1 ? h('button', {class: 'btn primary', type: 'button', onclick: () => this.runAll()}, `🌙 Open every club tonight`) : null,
        h('span', {class: 'chip gold'}, `Net worth ${M.money(M.worth())}`)));
    const grid = h('div', {class: 'grid'}, VENUES.map(v => this.clubCard(v)));
    const kids = [head];
    if (!owned.length) kids.push(h('div', {class: 'coach', style: {marginBottom: '14px'}, html: `<b>Owner path:</b> earn <b>${VENUES[0].rep} rep</b> and <b>${M.money(VENUES[0].price)}</b> working shifts, then buy The Peach Room on Edgewood. You have <b>${s.rep} rep</b> and <b>${M.money(s.cash)}</b>.`}));
    kids.push(grid);
    if (s.log.length) kids.push(h('div', {class: 'panel', style: {marginTop: '16px'}}, h('h3', {}, 'Recent nights'), h('div', {class: 'feed'}, s.log.slice(0, 8).map(l => h('div', {}, l.msg)))));
    return h('div', {}, kids);
  },
  clubCard(v){
    const s = M.s, h = M.h.bind(M), c = s.clubs[v.id], owned = !!c;
    const locked = !owned && s.rep < v.rep;
    return h('article', {class: 'club' + (owned ? ' owned' : '') + (locked ? ' locked' : ''), '--c': v.c, '--bg': `url(assets/mogul/${v.img}.webp)`},
      h('div', {class: 'art', style: {backgroundImage: `url(assets/mogul/${v.img}.webp)`}}, h('div', {}, h('div', {class: 'hood'}, v.hood), h('h3', {}, v.name), owned ? h('div', {class: 'stars'}, '★'.repeat(Math.round(c.stars)) + '☆'.repeat(5 - Math.round(c.stars))) : null)),
      h('div', {class: 'body'},
        h('div', {class: 'stats'}, h('div', {}, h('span', {}, 'CAP'), h('b', {}, String(v.cap))), h('div', {}, h('span', {}, 'COVER'), h('b', {}, M.money(v.cover))), h('div', {}, h('span', {}, 'DRINK'), h('b', {}, M.money(v.drink))), h('div', {}, h('span', {}, 'RENT'), h('b', {}, M.money(v.rent)))),
        owned ? h('div', {class: 'muted', style: {fontSize: '14px'}}, c.nights ? `${c.nights} night${c.nights > 1 ? 's' : ''} · earned ${M.money(c.earned)} · last ${c.last != null ? M.money(c.last) : '—'}` : 'Ready for opening night.') :
          h('div', {class: 'muted', style: {fontSize: '14px'}}, locked ? `Needs ${v.rep} rep to get the lease.` : `Price ${M.money(v.price)}`),
        h('div', {class: 'acts'}, owned ? [
          h('button', {class: 'btn primary', type: 'button', onclick: () => { this.sel = v.id; M.renderView(); window.MogulVenue && MogulVenue.show(v.world, v.mood, v.name); }}, 'Manage & open'),
          h('button', {class: 'btn', type: 'button', onclick: () => window.MogulVenue && MogulVenue.show(v.world, v.mood, v.name, true)}, '👀 Visit')
        ] : h('button', {class: 'btn primary', type: 'button', disabled: !this.canBuy(v), onclick: () => this.buy(v)}, locked ? `🔒 ${v.rep} rep` : s.cash < v.price ? `Need ${M.money(v.price - s.cash)} more` : `Buy for ${M.money(v.price)}`))));
  },
  buy(v){
    const s = M.s; if (!this.canBuy(v)) return;
    s.cash -= v.price; s.clubs[v.id] = M.newClub(); s.home = s.home || v.id;
    s.log.unshift({t: Date.now(), msg: `Bought ${v.name} in ${v.hood} for ${M.money(v.price)}.`});
    M.save(); M.sfx('cash'); M.confetti(120); M.say(`${v.name} is yours. Hire some staff and open the doors.`, 'good');
    this.sel = v.id; M.refresh(true);
    window.MogulVenue && MogulVenue.show(v.world, v.mood, v.name);
  },
  manageView(id){
    const s = M.s, h = M.h.bind(M), v = this.venue(id), c = s.clubs[id];
    const back = h('button', {class: 'btn small', type: 'button', onclick: () => { this.sel = null; M.renderView(); }}, '← All clubs');
    const ups = h('div', {class: 'panel'}, h('h3', {}, 'Upgrades'), UPGRADES.map(u => {
      const lv = c.up[u.id] || 0, cost = lv < 3 ? this.upCost(u, lv, v) : 0;
      return h('div', {class: 'rowline'}, h('span', {class: 'ic'}, u.icon), h('div', {class: 'tx'}, h('b', {}, u.name), h('small', {}, u.fx), h('div', {class: 'pips'}, [0, 1, 2].map(i => h('i', {class: i < lv ? 'on' : ''})))),
        lv < 3 ? h('button', {class: 'btn small primary', type: 'button', disabled: s.cash < cost, onclick: () => { s.cash -= cost; c.up[u.id] = lv + 1; M.save(); M.sfx('cash'); M.say(`${u.name} upgraded to level ${lv + 1}.`, 'good'); M.refresh(true); }}, M.money(cost)) : h('span', {class: 'chip gold'}, 'MAX'));
    }));
    const staff = h('div', {class: 'panel'}, h('h3', {}, 'Staff'), h('p', {class: 'muted', style: {margin: '0 0 6px', fontSize: '13px'}}, `Paid per night. Wages here ×${this.sizeMul(v)} for the size of the room. Tonight's payroll ${M.money(this.wages(id))}.`), STAFF.map(st => {
      const n = c.staff[st.id] || 0, w = st.wage * this.sizeMul(v);
      return h('div', {class: 'rowline'}, h('span', {class: 'ic'}, st.icon), h('div', {class: 'tx'}, h('b', {}, `${st.name} ${n ? '×' + n : ''}`), h('small', {}, `${st.fx} · ${M.money(w)} a night`)),
        h('span', {class: 'stepper'}, h('button', {class: 'btn small', type: 'button', disabled: !n, 'aria-label': `Let one ${st.name} go`, onclick: () => { c.staff[st.id] = n - 1; M.save(); M.renderView(); }}, '−'), h('b', {}, String(n)),
          h('button', {class: 'btn small', type: 'button', disabled: n >= st.max, 'aria-label': `Hire ${st.name}`, onclick: () => { c.staff[st.id] = n + 1; M.save(); M.sfx('tap'); M.renderView(); }}, '+')));
    }));
    const p = this.plan;
    const cover = Math.max(5, v.cover + p.coverAdj);
    const talentCost = t => t.id === 'house' ? 0 : Math.round(t.cost * this.sizeMul(v));
    const opt = (on, b, sm, fn, dis) => h('button', {class: 'opt', type: 'button', 'aria-pressed': String(!!on), disabled: !!dis, onclick: fn}, h('b', {}, b), sm ? h('small', {}, sm) : null);
    const fatigue = (c.themes || []).filter(x => x === p.theme).length;
    const book = h('div', {class: 'panel'}, h('h3', {}, '🌙 Plan tonight'),
      h('p', {class: 'kick'}, 'Theme'), h('div', {class: 'opts'}, THEMES.map(t => { const f = (c.themes || []).filter(x => x === t.id).length; return opt(p.theme === t.id, t.name, f ? `Played ${f} of the last 4 nights` : 'Fresh for this crowd', () => { p.theme = t.id; M.renderView(); }); })),
      h('p', {class: 'kick', style: {marginTop: '12px'}}, 'Headliner'), h('div', {class: 'opts'}, TALENT.map(t => opt(p.talent === t.id, t.name, t.id === 'house' ? (c.staff.dj ? 'Your resident DJ' : 'You spin it yourself') : `${M.money(talentCost(t))} · draw ×${t.draw}`, () => { p.talent = t.id; M.renderView(); }))),
      h('p', {class: 'kick', style: {marginTop: '12px'}}, 'Cover charge'),
      h('div', {class: 'actions', style: {justifyContent: 'flex-start'}}, h('button', {class: 'btn small', type: 'button', onclick: () => { p.coverAdj = Math.max(5 - v.cover, p.coverAdj - 5); M.renderView(); }}, '−$5'), h('b', {style: {font: '700 22px var(--tum-display)'}}, M.money(cover)), h('button', {class: 'btn small', type: 'button', onclick: () => { p.coverAdj += 5; M.renderView(); }}, '+$5'), h('span', {class: 'muted', style: {fontSize: '13px'}}, `Usual for this room: ${M.money(v.cover)}`)),
      fatigue >= 2 ? h('div', {class: 'coach', style: {marginTop: '10px'}, html: '<b>Heads up:</b> you have run this theme a lot lately. The crowd is getting tired of it.'}) : null,
      h('div', {class: 'actions', style: {marginTop: '14px'}}, h('button', {class: 'btn primary big', type: 'button', onclick: () => this.openNight(id)}, `🚪 Open the doors · Night ${s.night}`)));
    return h('div', {},
      h('div', {class: 'emp-head'}, h('div', {}, back, h('p', {class: 'kick', style: {marginTop: '12px'}}, v.hood), h('h2', {}, v.name), h('div', {class: 'stars', style: {color: 'var(--tum-gold)'}}, '★'.repeat(Math.round(c.stars)) + '☆'.repeat(5 - Math.round(c.stars)), ` · ${c.nights} nights · earned ${M.money(c.earned)}`)),
        h('div', {class: 'actions'}, h('span', {class: 'chip'}, `Cap ${v.cap}`), h('span', {class: 'chip'}, `Rent ${M.money(v.rent)}`), h('span', {class: 'chip gold'}, `Payroll ${M.money(this.wages(id))}`))),
      h('div', {class: 'manage'}, book, h('div', {style: {display: 'flex', flexDirection: 'column', gap: '16px'}}, ups, staff)));
  },

  /* --------------------------------------------------------- the night engine */
  model(id, plan, auto){
    const s = M.s, v = this.venue(id), c = s.clubs[id], up = k => c.up[k] || 0, st = k => c.staff[k] || 0;
    const theme = THEMES.find(t => t.id === plan.theme) || THEMES[0], talent = TALENT.find(t => t.id === plan.talent) || TALENT[0];
    const cover = Math.max(5, v.cover + (plan.coverAdj || 0));
    const fat = (c.themes || []).filter(x => x === theme.id).length;
    const day = M.pick([.85, .95, 1.05, 1.15]);
    let demand = v.cap * .62 * day * theme.pull * Math.pow(.88, fat) * (1 + up('sound') * .07 + up('lights') * .05)
      * (st('dj') ? 1.15 : 1) * (st('promoter') ? 1.2 : 1) * talent.draw * (.75 + c.stars * .07) * (1 + Math.min(.4, s.fame * .01))
      * Math.pow(v.cover / cover, .7);
    demand = Math.round(demand * M.rnd(.9, 1.1));
    return {v, c, theme, talent, cover, demand, door: 60 + st('bouncers') * 120 + up('security') * 20, drinksCap: 70 + st('bartenders') * 150 + up('bar') * 40,
      perHead: 1.5 * (1 + up('bar') * .15) * (1 + up('sound') * .05), vipTables: up('vip') * 3, vipStaff: st('bottle') * 4 || (up('vip') ? 2 : 0),
      fightP: clamp(.35 - up('security') * .08 - st('bouncers') * .07, .03, .4), talentCost: talent.id === 'house' ? 0 : Math.round(talent.cost * this.sizeMul(v)), wages: this.wages(id), auto};
  },
  /* run a night instantly (used for "open every club") */
  quick(id){
    const p = Object.assign({}, this.plan, {theme: M.pick(THEMES).id, talent: 'house', coverAdj: 0});
    const m = this.model(id, p, true), n = {guests: 0, lost: 0, cover: 0, bar: 0, vip: 0, fines: 0, comps: 0};
    n.guests = Math.min(m.v.cap, m.demand, m.door); n.lost = Math.max(0, Math.min(m.demand, m.v.cap) - n.guests);
    n.cover = n.guests * m.cover; n.bar = Math.min(n.guests * m.perHead, m.drinksCap) * m.v.drink;
    n.vip = Math.min(m.vipTables, m.vipStaff) * Math.round(n.guests / m.v.cap * 4) / 4 * 300 * (m.v.cover / 10) ** .5;
    if (Math.random() < m.fightP) n.fines = Math.round(150 * this.sizeMul(m.v));
    return this.settle(id, m, n, true);
  },
  settle(id, m, n, quiet){
    const s = M.s, c = m.c, v = m.v;
    const income = Math.round(n.cover + n.bar + n.vip), costs = Math.round(v.rent + m.wages + m.talentCost + n.fines + n.comps);
    const profit = income - costs;
    const fill = n.guests / v.cap, starsNow = clamp(1.5 + fill * 2 + (c.up.lights || 0) * .25 + (c.up.sound || 0) * .2 - (n.fines ? .6 : 0) - (n.lost > v.cap * .15 ? .4 : 0), 1, 5);
    c.stars = Math.round((c.stars * .6 + starsNow * .4) * 10) / 10;
    c.nights++; c.last = profit; c.earned += profit;
    c.themes = [m.theme.id, ...(c.themes || [])].slice(0, 4);
    s.cash += profit; s.earned += Math.max(0, profit);
    s.fame += m.talent.fame + (fill > .95 ? 1 : 0) + (n.fameBonus || 0);
    s.rep += fill > .8 ? 2 : fill > .5 ? 1 : 0;
    s.log.unshift({t: Date.now(), msg: `Night ${s.night} · ${v.name}: ${n.guests} guests, ${profit >= 0 ? 'profit' : 'loss'} ${M.money(Math.abs(profit))}.`}); s.log.length = Math.min(s.log.length, 30);
    if (!quiet) { s.night++; }
    M.save();
    return {income, costs, profit, fill, stars: c.stars};
  },
  runAll(){
    const s = M.s, h = M.h.bind(M), rows = [];
    let tot = 0;
    for (const id of Object.keys(s.clubs)){ const r = this.quick(id); tot += r.profit; rows.push([this.venue(id).name, r]); }
    s.night++; M.save();
    const stage = h('section', {class: 'stage', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Tonight across the empire'});
    const close = () => { stage.remove(); document.body.style.overflow = ''; M.refresh(true); };
    stage.append(h('div', {class: 'stage-top'}, h('span', {class: 'ic'}, '🌙'), h('div', {}, h('h2', {}, `Night ${s.night - 1} across the empire`), h('div', {class: 'sub'}, 'Every club opened with its house DJ and a random theme')), h('div', {class: 'grow'}), h('button', {class: 'btn small', type: 'button', onclick: close}, '✕ Close')),
      h('div', {class: 'stage-body'}, h('div', {class: 'result'}, h('p', {class: 'kick'}, 'Empire total'), h('div', {class: 'grade', style: {fontSize: 'clamp(50px,10vw,96px)'}}, M.money(tot)),
        h('div', {class: 'panel ledger', style: {width: 'min(640px,100%)'}}, rows.map(([n, r]) => h('div', {class: r.profit >= 0 ? 'pos' : 'neg'}, h('span', {}, `${n} · ${Math.round(r.fill * 100)}% full · ${'★'.repeat(Math.round(r.stars))}`), h('b', {}, M.money(r.profit))))),
        h('button', {class: 'btn primary', type: 'button', onclick: close}, 'Back to the empire'))));
    document.body.append(stage); document.body.style.overflow = 'hidden';
    M.sfx('cash'); if (tot > 0) M.confetti();
  },

  /* --------------------------------------------------------- the live night */
  openNight(id){
    const s = M.s, h = M.h.bind(M), m = this.model(id, this.plan, false), v = m.v;
    M.audio(); M.sfx('tap');
    const n = {guests: 0, inside: 0, lost: 0, cover: 0, bar: 0, vip: 0, fines: 0, comps: 0, drinks: 0, vipSold: 0, fameBonus: 0, events: []};
    const HOURS = ['10 PM', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM'];
    const curve = [.18, .26, .24, .18, .1, .04];
    let hour = 0, paused = false, over = false;
    const stage = h('section', {class: 'stage', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${v.name} live`});
    const clock = h('div', {class: 'clock'}, '10 PM');
    const dancers = h('div', {class: 'dancers', 'aria-hidden': 'true'});
    const beams = [0, 1, 2, 3].map(i => h('div', {class: 'beam', style: {left: (10 + i * 22) + '%', '--b': i % 2 ? 'rgba(255,79,216,.45)' : 'rgba(77,225,255,.4)'}}));
    const eventSlot = h('div');
    const view = h('div', {class: 'clubview', '--c': m.theme.vibe + '66'}, ...beams, clock, dancers, eventSlot);
    const ledger = h('div', {class: 'ledger'});
    const meters = h('div', {class: 'meters'});
    const feed = h('div', {class: 'feed'});
    const choice = h('div');
    const skip = h('button', {class: 'btn small', type: 'button'}, '⏩ Skip to close');
    stage.append(h('div', {class: 'stage-top'}, h('span', {class: 'ic'}, '🌙'), h('div', {}, h('h2', {}, `${v.name} · Night ${s.night}`), h('div', {class: 'sub'}, `${m.theme.name} · ${m.talent.name} · cover ${M.money(m.cover)}`)), h('div', {class: 'grow'}), skip),
      h('div', {class: 'stage-body'}, h('div', {class: 'night'}, h('div', {style: {display: 'flex', flexDirection: 'column', gap: '12px'}}, view, choice), h('div', {style: {display: 'flex', flexDirection: 'column', gap: '12px'}}, h('div', {class: 'panel'}, h('h3', {}, 'Live'), meters), h('div', {class: 'panel'}, h('h3', {}, 'Tonight so far'), ledger), h('div', {class: 'panel'}, h('h3', {}, 'Feed'), feed)))));
    document.body.append(stage); document.body.style.overflow = 'hidden';
    // music for the night, if sound is on
    const ac = M.audio(); let beat = null;
    if (ac){ const g = ac.createGain(); g.gain.value = .22; g.connect(ac.destination); let t = ac.currentTime + .05; const bpm = m.theme.id === 'trap' ? 140 : m.theme.id === 'rnb' ? 96 : 120;
      beat = {g, iv: setInterval(() => { while (t < ac.currentTime + .15){ const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); og.gain.setValueAtTime(.8, t); og.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(og); og.connect(g); o.start(t); o.stop(t + .22); t += 60 / bpm; } }, 30)}; }
    const say = (t) => feed.prepend(h('div', {}, t));
    const paint = () => {
      const fill = n.inside / v.cap;
      clock.textContent = HOURS[Math.min(hour, 5)];
      const want = Math.min(48, Math.round(fill * 48));
      while (dancers.children.length < want) dancers.append(h('i', {style: {animationDelay: (Math.random() * .5) + 's', animationDuration: (60 / (m.theme.id === 'trap' ? 140 : 120) * 2) + 's'}}, M.pick(DANCERS)));
      while (dancers.children.length > want) dancers.lastChild.remove();
      beams.forEach((b, i) => { b.style.transform = `rotate(${Math.sin(Date.now() / 700 + i) * 25}deg)`; });
      meters.replaceChildren(
        h('span', {}, '👥 Crowd'), h('div', {class: 'bar'}, h('i', {style: {width: Math.min(100, fill * 100) + '%'}})), h('b', {}, `${n.inside}/${v.cap}`),
        h('span', {}, '🧍 Line'), h('div', {class: 'bar'}, h('i', {style: {width: Math.min(100, n.lost / Math.max(1, v.cap) * 300) + '%', background: 'linear-gradient(90deg,#ff4d3d,#ff4fd8)'}})), h('b', {}, `${n.lost} left`),
        h('span', {}, '🍹 Bar'), h('div', {class: 'bar'}, h('i', {style: {width: Math.min(100, n.drinks / m.drinksCap * 100) + '%'}})), h('b', {}, `${Math.round(n.drinks)}/${m.drinksCap}`));
      const run = Math.round(n.cover + n.bar + n.vip - n.fines - n.comps);
      ledger.replaceChildren(
        h('div', {class: 'pos'}, h('span', {}, 'Cover'), h('b', {}, M.money(n.cover))), h('div', {class: 'pos'}, h('span', {}, 'Bar'), h('b', {}, M.money(n.bar))), h('div', {class: 'pos'}, h('span', {}, 'VIP tables'), h('b', {}, M.money(n.vip))),
        n.fines ? h('div', {class: 'neg'}, h('span', {}, 'Fines & damage'), h('b', {}, '-' + M.money(n.fines))) : null, n.comps ? h('div', {class: 'neg'}, h('span', {}, 'Comps'), h('b', {}, '-' + M.money(n.comps))) : null,
        h('div', {class: 'tot'}, h('span', {}, 'Takings'), h('b', {}, M.money(run))));
    };
    const EVENTS = [
      {id: 'fight', p: () => m.fightP, text: '💢 A fight breaks out by the bar!', opts: [
        ['🛡 Send security', () => (m.c.staff.bouncers || m.c.up.security) ? ['Security had it handled in seconds.', 0, 0] : ['You have no security. It spilled onto the floor.', 400, -.1]],
        ['🗣 Talk it down yourself', () => Math.random() < .65 ? ['You calmed it down. The DJ shouted you out.', 0, .03] : ['It got worse before it got better.', 250, -.05]],
        ['🙈 Ignore it', () => ['Broken glass, a police call and a fine.', 900, -.2]]]},
      {id: 'celeb', p: () => .12 + Math.min(.25, s.fame * .01), text: '🌟 A celebrity just walked in and wants a free VIP table.', opts: [
        ['🍾 Comp the table', () => ['Their story went viral: +fame.', 400, .08, 2]],
        ['💳 Charge full price', () => Math.random() < .5 ? ['They paid and stayed.', -800, .02, 1] : ['They left for a club up the street.', 0, -.03]],
        ['🙅 Decline', () => ['They left. Nobody noticed.', 0, 0]]]},
      {id: 'line', p: () => n.lost > 0 ? .5 : .1, text: '🧍 The line is around the block.', opts: [
        ['💵 Raise the cover $10 for the rest of the night', () => { m.cover += 10; return ['Fewer get in, but they pay more.', 0, -.04]; }],
        ['🚪 Speed up the door', () => { m.door += 60; return ['Two more guests a minute through the door.', 0, .02]; }],
        ['🤷 Leave it', () => ['People drift away.', 0, -.03]]]},
      {id: 'spill', p: () => .14, text: '🫗 Somebody dropped a tray of drinks on the dance floor.', opts: [
        ['🧹 Mop it now', () => ['Clean floor, nobody slipped.', 0, 0]],
        ['⏳ Get to it later', () => Math.random() < .5 ? ['Someone slipped. Comp their tab.', 300, -.05] : ['You got lucky this time.', 0, 0]]]},
      {id: 'dj', p: () => .12, text: '🎧 The DJ wants to play a two-hour experimental set.', opts: [
        ['✅ Let them cook', () => Math.random() < .4 ? ['It was legendary.', 0, .1, 1] : ['Half the floor cleared out.', 0, -.12]],
        ['🎯 Keep it to the theme', () => ['The floor stayed full.', 0, .03]]]},
      {id: 'marshal', p: () => n.inside > v.cap * .9 ? .35 : 0, text: '🚒 The fire marshal is at the door checking capacity.', opts: [
        ['📋 Show the clicker count', () => ['You were under the limit. All good.', 0, 0]],
        ['🤝 Offer a free drink', () => ['Bad idea. That is a fine.', 1500, -.05]]]}
    ];
    const used = new Set();
    let mood = 0;   // event effects on demand
    const doEvent = () => {
      const pool = EVENTS.filter(e => !used.has(e.id) && Math.random() < e.p());
      if (!pool.length) return false;
      const e = M.pick(pool); used.add(e.id); paused = true;
      eventSlot.replaceChildren(h('div', {class: 'event'}, e.text));
      choice.replaceChildren(h('div', {class: 'panel'}, h('h3', {}, e.text), h('div', {class: 'actions', style: {justifyContent: 'flex-start'}}, e.opts.map(([label, fn]) => h('button', {class: 'btn', type: 'button', onclick: () => {
        const [msg, cost, dm, fame] = fn(); if (cost > 0) n.fines += cost; else if (cost < 0) n.vip += -cost;
        if (e.id === 'celeb' && cost > 0){ n.fines -= cost; n.comps += cost; }
        mood += dm || 0; n.fameBonus += fame || 0;
        say(`${HOURS[hour]} · ${msg}`); M.say(msg, (dm || 0) >= 0 ? 'good' : 'bad');
        choice.replaceChildren(); eventSlot.replaceChildren(); paused = false; paint();
      }}, label)))));
      return true;
    };
    const stepHour = () => {
      if (hour >= 6) return close();
      const arrivals = Math.round(m.demand * curve[hour] * (1 + mood));
      const room = Math.max(0, v.cap - n.inside), doorCap = Math.round(m.door * curve[hour] * 1.6);
      const inNow = Math.max(0, Math.min(arrivals, room, doorCap));
      n.lost += Math.max(0, arrivals - inNow);
      n.inside += inNow; n.guests += inNow; n.cover += inNow * m.cover;
      const drinks = Math.min(n.inside * m.perHead * (hour < 4 ? .3 : .15), Math.max(0, m.drinksCap - n.drinks));
      n.drinks += drinks; n.bar += drinks * v.drink;
      if (hour >= 1 && hour <= 3 && m.vipTables){ const t = Math.min(m.vipTables - n.vipSold, m.vipStaff - n.vipSold, Math.round(m.vipTables * (n.inside / v.cap) * .5)); if (t > 0){ n.vipSold += t; n.vip += t * Math.round(300 * Math.sqrt(v.cover / 10)); say(`${HOURS[hour]} · ${t} VIP table${t > 1 ? 's' : ''} ordered bottles.`); } }
      if (hour >= 3) n.inside = Math.round(n.inside * (hour === 3 ? .75 : .45));
      if (inNow) say(`${HOURS[hour]} · ${inNow} through the door${n.lost ? `, ${n.lost} gave up waiting so far` : ''}.`);
      hour++; paint();
      if (hour < 6 && hour >= 1 && Math.random() < .7) doEvent();
    };
    const close = () => {
      if (over) return; over = true; clearInterval(tick); if (beat){ clearInterval(beat.iv); try{ beat.g.disconnect(); }catch(e){} }
      const r = this.settle(id, m, n, false);
      const grade = r.fill >= .95 && r.profit > 0 ? 'S' : r.fill >= .8 ? 'A' : r.fill >= .6 ? 'B' : r.fill >= .4 ? 'C' : 'D';
      const body = stage.querySelector('.stage-body');
      body.replaceChildren(h('div', {class: 'result'}, h('p', {class: 'kick'}, `Night report · ${v.name}`), h('div', {class: 'grade'}, grade),
        h('h2', {}, `${r.profit >= 0 ? 'Profit' : 'Loss'} ${M.money(Math.abs(r.profit))}`),
        h('div', {class: 'actions'}, h('span', {class: 'chip'}, `👥 ${n.guests} guests (${Math.round(r.fill * 100)}% full)`), n.lost ? h('span', {class: 'chip bad'}, `🧍 ${n.lost} left the line`) : null, h('span', {class: 'chip gold'}, '★'.repeat(Math.round(r.stars)) + ` ${r.stars.toFixed(1)}`)),
        h('div', {class: 'panel ledger', style: {width: 'min(560px,100%)', textAlign: 'left'}},
          h('div', {class: 'pos'}, h('span', {}, `Cover (${n.guests} × ${M.money(m.cover)})`), h('b', {}, M.money(n.cover))),
          h('div', {class: 'pos'}, h('span', {}, `Bar (${Math.round(n.drinks)} drinks)`), h('b', {}, M.money(n.bar))),
          h('div', {class: 'pos'}, h('span', {}, `VIP (${n.vipSold} tables)`), h('b', {}, M.money(n.vip))),
          h('div', {class: 'neg'}, h('span', {}, 'Rent'), h('b', {}, '-' + M.money(v.rent))),
          h('div', {class: 'neg'}, h('span', {}, 'Staff'), h('b', {}, '-' + M.money(m.wages))),
          m.talentCost ? h('div', {class: 'neg'}, h('span', {}, m.talent.name), h('b', {}, '-' + M.money(m.talentCost))) : null,
          n.fines ? h('div', {class: 'neg'}, h('span', {}, 'Fines & damage'), h('b', {}, '-' + M.money(n.fines))) : null,
          n.comps ? h('div', {class: 'neg'}, h('span', {}, 'Comps'), h('b', {}, '-' + M.money(n.comps))) : null,
          h('div', {class: 'tot ' + (r.profit >= 0 ? 'pos' : 'neg')}, h('span', {}, 'Net'), h('b', {}, M.money(r.profit)))),
        h('div', {class: 'coach', style: {maxWidth: '560px', textAlign: 'left'}, html: this.tip(m, n, r)}),
        h('div', {class: 'actions'}, h('button', {class: 'btn primary', type: 'button', onclick: () => { stage.remove(); document.body.style.overflow = ''; M.refresh(true); }}, 'Back to the club'))));
      skip.remove();
      M.sfx(r.profit >= 0 ? 'cash' : 'bad'); if (grade === 'S' || grade === 'A') M.confetti();
    };
    skip.addEventListener('click', () => { if (paused) return M.say('Make the call first.', 'bad'); clearInterval(tick); while (hour < 6) stepHour(); close(); });
    paint(); say(`${HOURS[0]} · Doors open. ${m.theme.name}.`);
    const tick = setInterval(() => { if (!paused && !over) stepHour(); else if (!over) paint(); }, 2200);
  },
  tip(m, n, r){
    const c = m.c, out = [];
    if (n.lost > m.v.cap * .1) out.push(`<b>${n.lost} people left the line.</b> ${c.staff.bouncers ? 'Another bouncer' : 'Hire a bouncer'} to move the door faster.`);
    if (n.drinks >= m.drinksCap - 2) out.push('<b>The bar maxed out.</b> More bartenders or a bigger bar means more sales.');
    if (r.fill < .5) out.push('<b>The room was half empty.</b> Try a promoter, a resident DJ, a fresher theme or a lower cover.');
    if (!m.vipTables) out.push('<b>No VIP tables yet.</b> Bottle service is where the big money is.');
    else if (m.vipStaff < m.vipTables) out.push('<b>VIP tables sat waiting.</b> Hire bottle service staff.');
    if (n.fines) out.push('<b>Fines hurt.</b> Security upgrades and bouncers cut fights.');
    if (!out.length) out.push('<b>Smooth night.</b> Save up for the next upgrade or your next club.');
    return out.slice(0, 2).join('<br>');
  }
};
})();
