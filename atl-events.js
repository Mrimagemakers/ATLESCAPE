// ATL Nightclub Mogul: live events, a shared calendar everyone playing can see.
// Ported from Turn Up Music's Live events: weekly featured nights, host your own, RSVP, add it to your calendar,
// share a link that opens straight to the event, make a flyer, and a LIVE banner when a night starts.
// Events travel on public Nostr relays (calendar events, kind 31923; RSVPs, kind 31925), tagged for this game.
'use strict';

const Events = {
  KIND: 31923, RSVP: 31925, TAG: 'atlnightclubmogul',
  list: [], rsvps: {}, going: new Set(store.get('going', [])), hiddenEv: new Set(store.get('hiddenEvents', [])), loaded: 0,
  // every venue on the page, by its display name
  atlNames(){ const out = {}; for (const [id, v] of Object.entries(window.atlVenueExpansion || {})) out[id] = v.name + (v.district ? ' · ' + v.district : ''); return Object.assign(out, window.ATLVenueNames || {}); },
  VENUES(){ return Object.entries(this.atlNames()).map(([id, name]) => ({id: Lounge.tumId(id), name})); },
  myKey(){
    if (!window.TUNet) return '';
    let sk = store.get('hostSecret', '');
    if (!/^[0-9a-f]{64}$/.test(sk)){ const b = TUNet.generateSecretKey(); sk = [...b].map(x => x.toString(16).padStart(2, '0')).join(''); store.set('hostSecret', sk); }
    if (!this.pk) this.pk = TUNet.getPublicKey(this.sk());
    return this.pk;
  },
  sk(){ if (!/^[0-9a-f]{64}$/.test(store.get('hostSecret', ''))) this.myKey(); const h = store.get('hostSecret', ''); return Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16))); },
  pool(){ return this._pool || (this._pool = new TUNet.SimplePool()); },
  worldName(id){ return this.atlNames()[Lounge.atlId(id)] || 'Club Mogul · Downtown'; },
  // the weekly nights that are always on the calendar (Atlanta time)
  featured(){
    const defs = [
      {id: 'mogul-sat', day: 6, h: 22, len: 4, world: 'club', title: 'Saturday Night at Club Mogul', desc: 'The flagship night. Work a shift behind the bar or on the door, or just dance till close.'},
      {id: 'atlantic-fri', day: 5, h: 22, len: 4, world: 'atlantic', title: 'Southside Fridays at The Atlantic', desc: 'Trap, bass and Atlanta classics under the moving heads.'},
      {id: 'pinnacle-thu', day: 4, h: 20, len: 3, world: 'rooftop', title: 'Rooftop Thursdays at The Pinnacle', desc: 'Sunset to skyline: R&B and house above Midtown.'},
      {id: 'volt-sat', day: 6, h: 19, len: 3, world: 'concert', title: 'Hip-Hop Live at The Volt', desc: 'Front-row energy: lights, lasers and the whole crowd on the hook.'},
      {id: 'jazz-sun', day: 0, h: 19, len: 2, world: 'jazz', title: 'Sunday Jazz on Auburn Avenue', desc: 'A listening room night on Sweet Auburn. Dress up.'},
      {id: 'aquarium-wed', day: 3, h: 20, len: 3, world: 'aquarium', title: 'Aquarium Night', desc: 'Cocktails with the whale sharks. Midweek and blue.'},
      {id: 'escape-tue', day: 2, h: 20, len: 2, world: 'escape', title: 'Escape Room Race Night', desc: 'Crack the Sweet Auburn vault faster than everyone else.'}
    ];
    const out = [], now = Date.now();
    for (const d of defs) for (let wk = 0; wk < 3; wk++){
      const start = this.etTime(d.day, d.h, wk), end = start + d.len*3600e3;
      if (end < now || start > now + 15*864e5) continue;
      out.push({id: 'f-' + d.id + '-' + new Date(start).toISOString().slice(0, 10), title: d.title, desc: d.desc, start, end, world: d.world, host: 'ATL Nightclub Mogul', featured: true});
    }
    return out;
  },
  // the next weekday/hour in Atlanta (Eastern) time, `weeks` ahead
  etTime(day, hour, weeks){
    const now = new Date(), et = new Date(now.toLocaleString('en-US', {timeZone: 'America/New_York'})), off = now.getTime() - et.getTime();
    const t = new Date(et); t.setHours(hour, 0, 0, 0); t.setDate(t.getDate() + (day - et.getDay() + 7) % 7 + weeks*7);
    if (weeks === 0 && t.getTime() + 4*3600e3 < et.getTime()) t.setDate(t.getDate() + 7);
    return t.getTime() + off;
  },
  all(){ const now = Date.now(); return [...this.featured(), ...this.list].filter(e => e.end > now && !this.hiddenEv.has(e.id)).sort((a, b) => a.start - b.start); },
  byId(id){ return this.all().find(e => e.id === id) || this.list.find(e => e.id === id); },
  isLive(e, now = Date.now()){ return now >= e.start - 10*60e3 && now < e.end; },
  parse(ev){
    try{
      const tag = n => (ev.tags.find(t => t[0] === n) || [])[1];
      const start = +tag('start')*1000, end = +tag('end')*1000, now = Date.now();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 12*3600e3 || start > now + 120*864e5 || end < now) return null;
      if (Safety.blocked(ev.pubkey)) return null;
      const world = tag('world'), known = this.VENUES().some(v => v.id === world);
      return {id: 'n-' + ev.pubkey.slice(0, 16) + '-' + String(tag('d') || '').slice(0, 40), d: tag('d'), title: String(tag('title') || 'Untitled event').slice(0, 70), desc: String(ev.content || '').slice(0, 400),
        start, end, world: known ? world : 'club', host: String(tag('host') || 'A guest').slice(0, 24), pk: ev.pubkey, featured: NET.hostKeys.includes(ev.pubkey)};
    }catch(e){ return null; }
  },
  async refresh(force){
    if (!window.TUNet || (!force && Date.now() - this.loaded < 60e3)) return;
    this.loaded = Date.now(); this.status('Checking the calendar…');
    try{
      const evs = await this.pool().querySync(NET.relays, {kinds: [this.KIND], '#t': [this.TAG], limit: 300}, {maxWait: 5000});
      const byId = {};
      for (const ev of evs){ const e = this.parse(ev); if (e && (!byId[e.id] || byId[e.id].created < ev.created_at)){ e.created = ev.created_at; byId[e.id] = e; } }
      const mine = this.list.filter(e => e.pk === this.myKey() && !byId[e.id]);
      this.list = [...Object.values(byId), ...mine];
      const coords = this.list.map(e => `${this.KIND}:${e.pk}:${e.d}`);
      if (coords.length){
        const rs = await this.pool().querySync(NET.relays, {kinds: [this.RSVP], '#a': coords.slice(0, 100), limit: 1000}, {maxWait: 4000});
        const cnt = {};
        for (const r of rs){ const a = (r.tags.find(t => t[0] === 'a') || [])[1], st = (r.tags.find(t => t[0] === 'status') || [])[1]; if (a && st === 'accepted') (cnt[a] || (cnt[a] = new Set())).add(r.pubkey); }
        this.rsvps = Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, v.size]));
      }
      this.status('');
    }catch(e){ this.status('Couldn\'t reach the calendar right now. Showing the weekly nights.'); }
    this.render(); this.banner();
  },
  async publish(e){
    const ev = TUNet.finalizeEvent({kind: this.KIND, created_at: Math.floor(Date.now()/1000), content: e.desc, tags: [
      ['d', e.d], ['title', e.title], ['start', String(Math.floor(e.start/1000))], ['end', String(Math.floor(e.end/1000))], ['start_tzid', Intl.DateTimeFormat().resolvedOptions().timeZone],
      ['location', 'ATL Nightclub Mogul · ' + this.worldName(e.world)], ['t', this.TAG], ['world', e.world], ['host', e.host]]}, this.sk());
    await Promise.any(this.pool().publish(NET.relays, ev));
    return ev;
  },
  async rsvp(e){
    if (this.going.has(e.id)){ this.going.delete(e.id); store.set('going', [...this.going]); this.render(); return; }
    this.going.add(e.id); store.set('going', [...this.going]); this.render();
    if (e.pk && window.TUNet){
      try{ const ev = TUNet.finalizeEvent({kind: this.RSVP, created_at: Math.floor(Date.now()/1000), content: '', tags: [['a', `${this.KIND}:${e.pk}:${e.d}`], ['d', 'rsvp-' + e.d], ['status', 'accepted'], ['p', e.pk]]}, this.sk());
        await Promise.any(this.pool().publish(NET.relays, ev)); }catch(err){}
    }
    toast('You\'re going! A LIVE banner shows up here when it starts.');
  },
  link(e){ return location.href.split('#')[0] + '#event=' + encodeURIComponent(e.id); },
  share(e){ shareText(`${e.title} · ${this.worldName(e.world)} · ${this.fmt(e)}. Come through!`, this.link(e)); },
  ics(e){
    const f = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ATL Nightclub Mogul//Events//EN', 'BEGIN:VEVENT', 'UID:' + e.id + '@atlnightclubmogul', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(e.start), 'DTEND:' + f(e.end),
      'SUMMARY:' + e.title.replace(/[,;\n]/g, ' '), 'LOCATION:ATL Nightclub Mogul - ' + this.worldName(e.world), 'DESCRIPTION:' + (e.desc + '\\n\\nJoin: ' + this.link(e)).replace(/[,;]/g, ' ').replace(/\n/g, '\\n'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], {type: 'text/calendar'})); a.download = e.title.replace(/[^\w]+/g, '-').slice(0, 40) + '.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  join(e){
    if (!Age.ok('Live events')) return;
    this.dlg().open && this.dlg().close();
    Lounge.chooseWorld(e.world);
    toast(`Welcome to ${e.title}!`);
  },
  fmt(e){
    const d = new Date(e.start), now = new Date();
    if (this.isLive(e)) return '● Live now · until ' + new Date(e.end).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    const day = d.toDateString() === now.toDateString() ? 'Today' : d.toDateString() === new Date(now.getTime() + 864e5).toDateString() ? 'Tomorrow' : d.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
    return day + ' · ' + d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  },

  /* a flyer: a poster image for the event, ready to post or text to friends */
  flyer(e){
    const W = 1080, H = 1350, [c, x] = Tex.canvas(W, H);
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a0610'); g.addColorStop(.55, '#3a0b1c'); g.addColorStop(1, '#0d0508'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++){ x.strokeStyle = `rgba(${i % 2 ? '255,194,26' : '255,79,216'},${.05 + i*.006})`; x.lineWidth = 3; x.beginPath(); x.arc(W/2, H*.42, 120 + i*42, 0, Math.PI*2); x.stroke(); }
    x.fillStyle = '#ffc21a'; x.font = '800 54px "Chakra Petch", Arial'; x.textAlign = 'center'; x.fillText('ATL NIGHTCLUB MOGUL', W/2, 120);
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '600 36px "Hanken Grotesk", Arial'; x.fillText(e.featured ? 'FEATURED NIGHT' : 'YOU\'RE INVITED', W/2, 180);
    x.fillStyle = '#fff'; x.font = '800 88px "Chakra Petch", Arial';
    const words = e.title.toUpperCase().split(' '), lines = []; let line = '';
    for (const w of words){ const t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - 140 && line){ lines.push(line); line = w; } else line = t; } if (line) lines.push(line);
    lines.slice(0, 4).forEach((l, i) => x.fillText(l, W/2, 470 + i*100 - (lines.length - 1)*50));
    x.fillStyle = '#ff4fd8'; x.font = '700 50px "Hanken Grotesk", Arial'; x.fillText(this.worldName(e.world), W/2, 860);
    x.fillStyle = '#fff'; x.font = '700 48px "Hanken Grotesk", Arial'; x.fillText(new Date(e.start).toLocaleString([], {weekday: 'long', month: 'long', day: 'numeric'}), W/2, 950);
    x.fillText(new Date(e.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) + ' – ' + new Date(e.end).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}), W/2, 1015);
    if (e.desc){ x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '500 34px "Hanken Grotesk", Arial'; x.fillText(e.desc.slice(0, 70) + (e.desc.length > 70 ? '…' : ''), W/2, 1100, W - 120); }
    x.fillStyle = 'rgba(255,194,26,.9)'; x.font = '600 30px "Hanken Grotesk", Arial'; x.fillText(e.featured ? 'Join from ATL Nightclub Mogul' : 'Hosted by ' + e.host + ' · Join from ATL Nightclub Mogul', W/2, 1260, W - 100);
    c.toBlob(async blob => {
      const file = new File([blob], e.title.replace(/[^\w]+/g, '-').slice(0, 40) + '-flyer.png', {type: 'image/png'});
      if (navigator.canShare && navigator.canShare({files: [file]})){ try{ await navigator.share({files: [file], title: e.title, text: `${e.title} · ${this.link(e)}`}); return; }catch(err){} }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Flyer saved. Post it or send it to your friends. ✓');
    }, 'image/png');
  },

  /* the calendar window */
  dlg(){
    let d = document.getElementById('eventsDlg'); if (d) return d;
    d = document.createElement('dialog'); d.id = 'eventsDlg'; d.className = 'mogul-dialog events-dialog'; d.setAttribute('aria-labelledby', 'evHead');
    d.innerHTML = `<div class="ev-head"><h2 id="evHead">📅 Live events</h2><button type="button" id="evClose" aria-label="Close">✕</button></div>
      <div id="evTabs" class="ev-tabs" role="group" aria-label="Events"><button type="button" data-t="list" aria-pressed="true">What's on</button><button type="button" data-t="host" aria-pressed="false">Host an event</button></div>
      <p id="evStatus" class="ev-status" role="status"></p>
      <div id="evList" class="ev-list"></div>
      <form id="evForm" class="ev-form" hidden>
        <label>Event name <input id="evTitle" maxlength="70" required placeholder="Friday Night Turn Up"></label>
        <label>Venue <select id="evWorld"></select></label>
        <div class="ev-row"><label>Date <input id="evDate" type="date" required></label><label>Starts <input id="evTime" type="time" value="21:00" required></label>
        <label>Length <select id="evLen"><option value="1">1 hour</option><option value="2">2 hours</option><option value="3" selected>3 hours</option><option value="4">4 hours</option><option value="6">6 hours</option></select></label></div>
        <label>What's happening <textarea id="evDesc" maxlength="400" rows="3" placeholder="DJ, dress code, what to expect…"></textarea></label>
        <p class="ev-note">Hosted by <strong id="evHostName"></strong>. Everyone playing ATL Nightclub Mogul can see your event and RSVP.</p>
        <div class="ev-actions"><button type="submit" id="evPublish" class="primary">Publish event</button><button type="button" id="evFlyer">Preview flyer</button></div>
      </form>`;
    document.body.appendChild(d);
    d.querySelector('#evClose').onclick = () => d.close();
    d.querySelector('#evTabs').onclick = e => { const b = e.target.closest('button'); if (b) this.tab(b.dataset.t); };
    d.querySelector('#evForm').onsubmit = e => { e.preventDefault(); this.submit(); };
    d.querySelector('#evFlyer').onclick = () => { const f = this.formEvent(); this.flyer(Object.assign(f, {title: f.title || 'My ATL Night'})); };
    d.querySelector('#evList').onclick = e => {
      const b = e.target.closest('button[data-act]'), card = e.target.closest('[data-ev]'); if (!b || !card) return;
      const ev = this.byId(card.dataset.ev); if (!ev) return;
      const act = b.dataset.act;
      if (act === 'join') this.join(ev); else if (act === 'rsvp') this.rsvp(ev); else if (act === 'ics') this.ics(ev);
      else if (act === 'share') this.share(ev); else if (act === 'flyer') this.flyer(ev);
      else if (act === 'hide'){ this.hiddenEv.add(ev.id); store.set('hiddenEvents', [...this.hiddenEv].slice(-300)); this.render(); }
    };
    return d;
  },
  status(m){ const s = document.getElementById('evStatus'); if (s) s.textContent = m; },
  render(){
    const d = document.getElementById('eventsDlg'), box = d && d.querySelector('#evList'); if (!box || !d.open) return;
    const evs = this.all();
    if (!evs.length){ box.innerHTML = '<p class="ev-empty">Nothing on the calendar yet. Host one!</p>'; return; }
    box.innerHTML = evs.map(e => {
      const live = this.isLive(e), n = this.rsvps[`${this.KIND}:${e.pk}:${e.d}`] || 0, mine = e.pk && e.pk === this.myKey();
      return `<article class="ev-card${live ? ' live' : ''}${this.hl === e.id ? ' hl' : ''}" data-ev="${esc(e.id)}">
        <div class="ev-when">${esc(this.fmt(e))}</div><h3>${esc(e.title)}</h3>
        <div class="ev-tags">${e.featured ? '<span class="feat">Featured</span>' : ''}<span>${esc(this.worldName(e.world))}</span><span>Host: ${esc(e.host)}${mine ? ' (you)' : ''}</span>${n ? `<span>${n} going</span>` : ''}</div>
        ${e.desc ? `<p>${esc(e.desc)}</p>` : ''}
        <div class="ev-actions">${live ? '<button class="primary" data-act="join" type="button">Join now</button>' : `<button data-act="rsvp" type="button">${this.going.has(e.id) ? '✓ Going' : 'I\'m going'}</button>`}<button data-act="share" type="button">Share</button><button data-act="flyer" type="button">Flyer</button><button data-act="ics" type="button">Add to calendar</button>${live ? '' : '<button data-act="join" type="button">Visit venue</button>'}${e.featured || mine ? '' : '<button data-act="hide" type="button" aria-label="Hide this event">Hide</button>'}</div>
      </article>`; }).join('');
  },
  banner(){
    let b = document.getElementById('liveBanner');
    if (!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'liveBanner'; b.className = 'live-banner'; b.hidden = true; document.body.appendChild(b); b.onclick = () => { const ev = this.byId(b.dataset.ev); if (ev) this.join(ev); }; }
    if (!Age.adult()){ b.hidden = true; return; }
    const live = this.all().filter(e => this.isLive(e)).sort((a, c) => (this.going.has(c.id) - this.going.has(a.id)) || (c.featured - a.featured))[0];
    b.hidden = !live || (window.ATLVenue && Lounge.worldId === live.world);
    if (live){ b.textContent = `🔴 LIVE NOW: ${live.title} · ${this.worldName(live.world)}. Tap to join`; b.dataset.ev = live.id; }
  },
  open(){
    if (!Age.ok('Live events')) return;
    const d = this.dlg(); if (!d.open) d.showModal(); this.tab('list'); this.render(); this.refresh();
  },
  tab(t){
    const d = this.dlg();
    d.querySelectorAll('#evTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    d.querySelector('#evList').hidden = t !== 'list'; d.querySelector('#evForm').hidden = t !== 'host';
    if (t === 'host'){
      d.querySelector('#evHostName').textContent = Profile.get().name;
      d.querySelector('#evWorld').innerHTML = this.VENUES().map(v => `<option value="${v.id}"${v.id === (Lounge.worldId || 'club') ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
      const dt = d.querySelector('#evDate'); if (!dt.value){ const n = new Date(); n.setDate(n.getDate() + (n.getHours() >= 20 ? 1 : 0)); dt.value = n.toISOString().slice(0, 10); }
    }
  },
  formEvent(){
    const d = this.dlg(), date = d.querySelector('#evDate').value, time = d.querySelector('#evTime').value;
    const start = new Date((date || new Date().toISOString().slice(0, 10)) + 'T' + (time || '21:00')).getTime();
    return {d: 'atl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: d.querySelector('#evTitle').value.trim(), desc: d.querySelector('#evDesc').value.trim(),
      start, end: start + (+d.querySelector('#evLen').value)*3600e3, world: d.querySelector('#evWorld').value || 'club', host: Profile.get().name};
  },
  async submit(){
    if (!window.TUNet){ toast('Events need an internet connection.'); return; }
    const e = this.formEvent();
    if (!e.title){ toast('Give your event a name.'); return; }
    if (!Number.isFinite(e.start) || e.end < Date.now()){ toast('Pick a time that hasn\'t passed yet.'); return; }
    const btn = this.dlg().querySelector('#evPublish'); btn.disabled = true; btn.textContent = 'Publishing…';
    try{
      await this.publish(e);
      const pk = this.myKey(), id = 'n-' + pk.slice(0, 16) + '-' + e.d;
      this.list.push(Object.assign({}, e, {id, pk, featured: NET.hostKeys.includes(pk)}));
      this.going.add(id); store.set('going', [...this.going]);
      this.dlg().querySelector('#evForm').reset(); this.tab('list'); this.hl = id; this.render();
      toast('Your event is on the calendar! Share it so people come.', 5000);
      const made = this.byId(id); if (made) setTimeout(() => this.share(made), 500);
    }catch(err){ toast('Couldn\'t publish right now. Check your connection and try again.', 5000); }
    btn.disabled = false; btn.textContent = 'Publish event';
  },
  // a shared link (#event=…) opens the calendar on that event
  async openLink(id){
    if (!Age.adult()){ Age.ok('Live events'); return; }
    this.open(); this.hl = id; let e = this.byId(id);
    if (!e){ this.loaded = 0; try{ await this.refresh(true); }catch(err){} e = this.byId(id); }
    this.render();
    if (!e){ toast('That event has ended or couldn\'t be found. Here\'s what\'s on.', 5000); return; }
    document.querySelector(`#evList [data-ev="${CSS.escape(id)}"]`)?.scrollIntoView({block: 'center'});
    if (this.isLive(e)) toast(`${e.title} is live now. Tap Join now.`, 5000);
  },
  init(){
    const m = /[#&]event=([^&]+)/.exec(location.hash); if (m) setTimeout(() => this.openLink(decodeURIComponent(m[1])), 1200);
    setTimeout(() => this.banner(), 3000);
    setInterval(() => { this.banner(); if (this.dlg().open) this.render(); }, 30000);
    if (Age.adult()) setTimeout(() => this.refresh(), 6000);
  }
};
