'use strict';
// ATL Nightclub Mogul: the page around the game. Your career at a glance, every job, your empire, live events,
// and quick starts for the brawl, the dance-off and Trivia Live. The game itself is atl-mogul.js.

const career = document.querySelector('#career'), roles = document.querySelector('#roles'), extras = document.querySelector('#mogulExtras');
const money = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
function add(parent, tag, text, className){ const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; parent.append(node); return node; }

// a career from before the move to the full Mogul carries over: its cash, and its shifts
(function migrate(){
  try{
    if (store.get('migrated', false)) return;
    const old = JSON.parse(localStorage.getItem('atl-nightlife-career-v1') || 'null');
    const d = Mogul.d();
    if (old && Number.isSafeInteger(old.cash) && old.cash > 0){ d.cash += old.cash; d.shifts += Number.isSafeInteger(old.shifts) ? old.shifts : 0; d.fame = (d.fame || 0) + (Number.isSafeInteger(old.rep) ? old.rep : 0); }
    Mogul.put(d); store.set('migrated', true);
  }catch(e){}
})();

/* open the Mogul panel straight into a job, the empire, or the menu */
function openMogul(view, role){
  if (!Age.ok('ATL Nightclub Mogul')) return;
  Mogul.open();
  const go = () => {
    if (!Mogul.on || !Mogul.x) return false;
    if (view === 'empire') Mogul.empire();
    else if (view === 'role' && role){ Mogul.role = role; Mogul.view = 'role'; Mogul.draw(); }
    return true;
  };
  if (!go()){ const t = setInterval(() => { if (go()) clearInterval(t); }, 250); setTimeout(() => clearInterval(t), 30000); }
}
window.openMogul = openMogul;

function refreshCareer(){
  const d = Mogul.d(), clubs = Object.keys(d.clubs).length;
  career.replaceChildren();
  for (const [icon, label, value] of [['cash', 'Club cash', money(d.cash)], ['rank', 'Title', Mogul.title(d)], ['venues', 'Clubs owned', clubs + ' · worth ' + money(Mogul.worth(d))], ['shifts', 'Shifts worked', d.shifts || 0]]){
    const tile = add(career, 'div', '', 'career-tile'); tile.append(window.mogulIcon(icon));
    const text = add(tile, 'div', ''); add(text, 'small', label); add(text, 'strong', value);
  }
  roles.replaceChildren();
  for (const r of Mogul.ROLES){
    const b = add(roles, 'button', '', 'job'); b.type = 'button';
    const icon = add(b, 'span', r.icon, 'job-emoji'); icon.setAttribute('aria-hidden', 'true');
    add(b, 'strong', r.id === 'owner' ? 'My Empire' : r.name);
    add(b, 'small', r.id === 'owner' ? `${clubs} club${clubs === 1 ? '' : 's'} · ${money(Mogul.worth(d))}` : `Level ${Mogul.level(r.id, d)}${d.tut[r.id] ? ' · trained ✓' : ' · train first'}${r.pay && r.pay[1] ? ' · ' + money(r.pay[0]) + '–' + money(r.pay[1]) : ''}`);
    b.onclick = () => r.id === 'owner' ? openMogul('empire') : openMogul('role', r.id);
  }
}
window.refreshCareer = refreshCareer;

// quick starts, like the party bar in Turn Up Music
for (const [label, fn] of [
  ['🍾 Open Nightclub Mogul', () => openMogul('menu')], ['👑 My empire', () => openMogul('empire')], ['📅 Live events', () => Events.open()],
  ['🥊 Brawl mode', () => { if (!window.ATLVenue?.current) Lounge.chooseWorld('club'); setTimeout(() => Mogul.brawlHere(), window.ATLVenue?.current ? 0 : 2500); }],
  ['🕺 Dance-off', () => { if (!window.ATLVenue?.current) Lounge.chooseWorld('club'); setTimeout(() => Mogul.danceHere(), window.ATLVenue?.current ? 0 : 2500); }],
  ['🎯 Trivia Live', () => TriviaLive.open()],
  ['📣 Share my empire', () => { const d = Mogul.d(); shareText(`I'm a ${Mogul.title(d)} in ATL Nightclub Mogul: ${money(Mogul.worth(d))} and ${Object.keys(d.clubs).length} club${Object.keys(d.clubs).length === 1 ? '' : 's'}. 🍾`); }]
]){ const b = add(extras, 'button', label); b.type = 'button'; b.onclick = fn; }

// keep the dashboard in step with the game
{ const put0 = Mogul.put.bind(Mogul); Mogul.put = d => { put0(d); refreshCareer(); }; }
refreshCareer();
Events.init();
document.querySelector('#heroEvents')?.addEventListener('click', e => { e.preventDefault(); Events.open(); });

// while the Mogul is open, the venue fills the screen like the stage in Turn Up Music; closing the panel brings the page back
{
  const stage = on => {
    document.body.classList.toggle('mogul-stage', on);
    if (on) document.querySelector('#venueScene')?.focus({preventScroll: true});
  };
  const open0 = Mogul.open.bind(Mogul), close0 = Mogul.close.bind(Mogul);
  Mogul.open = function(){ open0(); if (this.on) stage(true); };
  Mogul.close = function(){ close0(); stage(false); refreshCareer(); };
  for (const k of ['brawlHere', 'danceHere']){ const f = Mogul[k].bind(Mogul); Mogul[k] = function(){ f(); setTimeout(() => { if (this.on) stage(true); }, 50); }; }
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('mogul-stage') && !document.querySelector('dialog[open]')) Mogul.close(); });
}
// a job with its own on-screen pad (the brawl, the dance-off) takes the walk arrows' corner
setInterval(() => document.body.classList.toggle('mogul-pad', !!(Mogul.on && Mogul.game && Mogul.game.padEl && Mogul.view === 'game')), 300);
