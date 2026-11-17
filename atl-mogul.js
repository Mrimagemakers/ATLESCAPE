// ATL Nightclub Mogul: the jobs, the empire, the brawl, the dance-off and Trivia Live.
// Ported from Turn Up Music's Nightclub Mogul (Mrimagemakers/Turnupmusic, app/index.html), which it mirrors feature for feature.
// It runs on the ATL venue engine through the Lounge bridge in atl-lounge.js, and the shared helpers in atl-mogul-shim.js.
'use strict';
/* ================= NIGHTCLUB MOGUL =================
   A game inside the Nightclub: work the jobs (bartender, bouncer, DJ, barback, bottle service, promoter,
   celebrity, birthday guest), learn each one in a training run, earn cash, then buy clubs as the owner and build
   an empire across the worlds. One canvas panel runs everything: tapped on a screen, pointed at in VR.
   In VR the hands-on parts are real: pour from bottles, drop garnishes, throw and block punches. */
const Mogul = {
  W: 1024, H: 700, on: false, view: "menu", regions: [], hover: null, held: null,
  ROLES: [
    {id: "bartender", icon: "🍸", name: "Bartender", pay: [110, 320], blurb: "Mix real cocktails to order: the right glass, ice, measured pours, shake or stir, garnish. Check IDs. Fast and accurate means big tips."},
    {id: "bouncer", icon: "🚪", name: "Bouncer", pay: [120, 300], blurb: "Run the door: check IDs (spot fakes and minors), the dress code, the guest list and capacity. Break up fights the right way."},
    {id: "dj", icon: "🎧", name: "DJ", pay: [140, 380], blurb: "Beatmatch two decks, drop the next track on the phrase, fade it in and play what the crowd asks for. Keep the dance floor full."},
    {id: "barback", icon: "🧺", name: "Barback / Busser", pay: [90, 240], blurb: "Keep the club running: clear empty glasses, bring ice, change kegs, mop spills before someone slips."},
    {id: "bottle", icon: "🍾", name: "Bottle Girl / Bottle Service", pay: [130, 420], blurb: "Take VIP orders, upsell, carry the bottle with a sparkler through the crowd without spilling, pour, and close the tab right."},
    {id: "promoter", icon: "📣", name: "Promoter", pay: [100, 450], blurb: "Plan the night: the theme, the DJ, the right channels and offers for the right crowd. Pack the club and work the VIP list."},
    {id: "celebrity", icon: "🌟", name: "Celebrity", pay: [200, 900], blurb: "Make an appearance: hit your marks for the cameras, handle the press, sign for fans and hype the crowd. Avoid scandals."},
    {id: "birthday", icon: "🎂", name: "Birthday Boy / Girl", pay: [60, 260], blurb: "Throw the best birthday night ever on a budget: friends, cake, the song, the dance-off. Keep the fun meter high."},
    {id: "owner", icon: "👑", name: "Club Owner", pay: [0, 0], blurb: "Buy clubs, hire staff, buy upgrades and open every night. Grow from one dive bar to a nightlife empire."},
    {id: "brawl", icon: "🥊", name: "Bar Brawl", pay: [80, 260], blurb: "Arcade mode: rowdy troublemakers come at you. Block, dodge and knock them out. In VR, throw real punches."}
  ],
  VENUES: [
    {id: "popup", world: "vinyl", name: "Needle & Groove · Little Five Points", price: 500, cap: 60, cover: 8, drink: 7, rent: 50},
    {id: "basement", world: "speakeasy", name: "Peters Street Social · Castleberry Hill", price: 2000, cap: 120, cover: 10, drink: 9, rent: 180},
    {id: "turnup", world: "club", name: "Club Mogul · Downtown", price: 8000, cap: 300, cover: 20, drink: 12, rent: 600},
    {id: "loft", world: "loft", name: "BeltLine Loft · Old Fourth Ward", price: 12000, cap: 200, cover: 22, drink: 12, rent: 800},
    {id: "skyline", world: "rooftop", name: "The Pinnacle · Rooftop", price: 20000, cap: 260, cover: 30, drink: 15, rent: 1100},
    {id: "jazz", world: "jazz", name: "Auburn Listening Room · Sweet Auburn", price: 30000, cap: 140, cover: 35, drink: 16, rent: 1400},
    {id: "sandbar", world: "terrace", name: "Peachtree Terrace · Midtown", price: 45000, cap: 500, cover: 35, drink: 14, rent: 2000},
    {id: "atlantic", world: "atlantic", name: "The Atlantic · Southside", price: 60000, cap: 700, cover: 30, drink: 14, rent: 2600},
    {id: "neon", world: "warehouse", name: "Westside Soundstage · West Midtown", price: 90000, cap: 650, cover: 40, drink: 16, rent: 3600},
    {id: "yacht", world: "aquarium", name: "Aquarium Night · Centennial Park", price: 180000, cap: 420, cover: 120, drink: 22, rent: 5200},
    {id: "skyloft", world: "penthouse", name: "Penthouse Loft · Midtown", price: 320000, cap: 260, cover: 180, drink: 26, rent: 9000},
    {id: "orbit", world: "concert", name: "The Volt · Downtown", price: 500000, cap: 1200, cover: 250, drink: 30, rent: 14000}
  ],
  UPGRADES: [
    {id: "sound", name: "Sound system", icon: "🔊", cost: [600, 2400, 7000], fx: "More people stay and dance"},
    {id: "lights", name: "Lights & lasers", icon: "💡", cost: [500, 2000, 6000], fx: "Better reviews, more word of mouth"},
    {id: "bar", name: "Bigger bar", icon: "🍹", cost: [800, 3000, 9000], fx: "More drinks sold per guest"},
    {id: "vip", name: "VIP tables", icon: "🛋", cost: [1000, 4000, 12000], fx: "Bottle service income"},
    {id: "security", name: "Security", icon: "🛡", cost: [400, 1600, 5000], fx: "Fewer fights and fines"}
  ],
  STAFF: [
    {id: "dj", name: "Resident DJ", icon: "🎧", wage: 250, fx: "+15% crowd"},
    {id: "bartenders", name: "Bartenders", icon: "🍸", wage: 160, fx: "+12% drinks each", max: 4},
    {id: "bouncers", name: "Bouncers", icon: "🚪", wage: 150, fx: "Safer nights", max: 3},
    {id: "promoter", name: "Promoter", icon: "📣", wage: 200, fx: "+20% crowd"},
    {id: "bottle", name: "Bottle service", icon: "🍾", wage: 140, fx: "VIP sales", max: 3}
  ],
  TITLES: [[0, "Rookie"], [1000, "Hustler"], [10000, "Manager"], [50000, "Club Owner"], [250000, "Mogul"], [1000000, "Nightlife Tycoon"]],

  /* ---------- the save: one wallet for every job ---------- */
  d(){ const d = Object.assign({cash: 300, xp: {}, tut: {}, best: {}, clubs: {}, day: 1, ran: {}, shifts: 0, fame: 0, earned: 0}, store.get("mogul", {})); for (const k of ["xp", "tut", "best", "clubs", "ran"]) d[k] = d[k] || {}; return d; },
  put(d){ store.set("mogul", d); },
  level(role, d = this.d()){ const xp = d.xp[role] || 0; return Math.min(10, 1 + Math.floor(Math.sqrt(xp/60))); },
  worth(d = this.d()){ let w = d.cash; for (const [id, c] of Object.entries(d.clubs)){ const v = this.VENUES.find(x => x.id === id); if (!v) continue; w += v.price*.8; for (const u of this.UPGRADES) for (let i = 0; i < (c.up && c.up[u.id] || 0); i++) w += this.upCost(u, i, v)*.5; } return Math.round(w); },
  upCost(u, lv, v){ return Math.round(u.cost[lv]*Math.max(.3, Math.min(1, (v && v.price || 2000)/2000))/10)*10; },
  title(d){ const w = this.worth(d); let t = this.TITLES[0][1]; for (const [n, l] of this.TITLES) if (w >= n) t = l; return t; },
  money(n){ return (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString(); },

  /* ---------- the panel: one canvas, shown on screen or floating in VR ---------- */
  ensure(){
    if (this.c) return;
    const c = this.c = document.createElement("canvas"); c.width = this.W; c.height = this.H; this.x = c.getContext("2d");
    const box = this.box = document.createElement("div"); box.className = "mogul"; box.hidden = true; box.appendChild(c);
    const mini = this.miniBtn = document.createElement("button"); mini.type = "button"; mini.className = "mogul-mini"; mini.textContent = "▾"; mini.title = "Shrink the panel"; box.appendChild(mini);
    mini.addEventListener("click", () => { box.classList.toggle("small"); mini.textContent = box.classList.contains("small") ? "▴" : "▾"; });
    // ⛶ expand: the panel fills the whole screen (and turns the phone sideways when it can), so phone players can read and tap everything
    const xp = this.xpBtn = document.createElement("button"); xp.type = "button"; xp.className = "mogul-xp"; xp.textContent = "⛶"; xp.title = "Expand to full screen"; xp.setAttribute("aria-label", "Expand to full screen"); box.appendChild(xp);
    xp.addEventListener("click", () => this.expand(!box.classList.contains("xpand")));
    ($("#stage") || document.body).appendChild(box);
    const at = e => { const r = c.getBoundingClientRect(); return {px: (e.clientX - r.left)/r.width*this.W, py: (e.clientY - r.top)/r.height*this.H}; };
    const hit = p => this.regions.find(r => p.px >= r.X && p.px <= r.X + r.W && p.py >= r.Y && p.py <= r.Y + r.H);
    c.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const p = at(e), r = hit(p); if (!r) return; try{ c.setPointerCapture(e.pointerId); }catch(err){}
      if (r.hold){ this.held = r; r.hold(true); } else { try{ r.fn(p); }catch(err){ console.warn(err); } } this.draw(); });
    const up = e => { if (this.held){ const r = this.held; this.held = null; try{ r.hold(false); }catch(err){} this.draw(); } };
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    c.addEventListener("pointermove", e => { const r = hit(at(e)); const h = r ? r.id : null; if (h !== this.hover){ this.hover = h; this.draw(); } });
    addEventListener("keydown", e => { if (this.on && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "e" && this.view !== "empire" && !(this.view === "game" && this.game) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")){ this.empire(); e.preventDefault(); return; }
      if (!this.on || !this.game || !this.game.key || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) return; if (this.game.key(e.key.toLowerCase(), true)) e.preventDefault(); });
    addEventListener("keyup", e => { if (this.on && this.game && this.game.key) this.game.key(e.key.toLowerCase(), false); });
  },
  vrPanel(){
    const T = THREE, L = Lounge;
    if (!this.mesh){ this.tex = new T.CanvasTexture(this.c); this.tex.colorSpace = "srgb"; this.tex.anisotropy = 8;
      this.mesh = new T.Mesh(new T.PlaneGeometry(.95, .95*this.H/this.W), new T.MeshBasicMaterial({map: this.tex, transparent: true, toneMapped: false, depthTest: true}));
      this.mesh.renderOrder = 11; L.scene.add(this.mesh); this.rc = new T.Raycaster(); }
    return this.mesh;
  },
  placePanel(side = .55){
    if (!this.mesh) return; if (typeof Cardboard !== "undefined" && Cardboard.on) side = 0;   // phone VR: right in front of you
    const L = Lounge, head = L.headPos(), yaw = L.headYaw() + side, d = .85;
    this.mesh.position.set(head.x - Math.sin(yaw)*d, head.y - .22, head.z - Math.cos(yaw)*d);
    this.mesh.rotation.set(-.12, yaw, 0, "YXZ");
  },
  pressRay(origin, dir, ctl){
    if (!this.on || !this.mesh || !this.mesh.visible) return false;
    this.rc.set(origin, dir); this.rc.far = 5;
    const h = this.rc.intersectObject(this.mesh, false)[0]; if (!h || !h.uv) return false;
    const p = {px: h.uv.x*this.W, py: (1 - h.uv.y)*this.H}, r = this.regions.find(r => p.px >= r.X && p.px <= r.X + r.W && p.py >= r.Y && p.py <= r.Y + r.H);
    if (r){ try{ if (r.hold){ r.toggled = !r.toggled; r.hold(r.toggled); } else r.fn(p); }catch(e){ console.warn(e); } if (ctl) Lounge.haptic(ctl, .5, 30); this.draw(); }
    return true;
  },
  rr(x, X, Y, W, H, r){ return VRMenu.rr.call(this, x, X, Y, W, H, r); },
  btn(id, X, Y, W, H, label, fn, o = {}){ VRMenu.btn.call(this, id, X, Y, W, H, label, fn, o); if (o.hold) this.regions[this.regions.length - 1].hold = o.hold; },
  text(t, X, Y, size, col = "#fff", w = 600, align = "left", max){ VRMenu.text.call(this, t, X, Y, size, col, w, align, max); },
  wrap(t, X, Y, size, maxW, col = "rgba(255,255,255,.85)", lh = 1.3, w = 500){
    const x = this.x; x.font = `${w} ${size}px "Hanken Grotesk", sans-serif`; let line = "", y = Y;
    for (const word of String(t).split(/\s+/)){ const test = line ? line + " " + word : word; if (x.measureText(test).width > maxW && line){ this.text(line, X, y, size, col, w); line = word; y += size*lh; } else line = test; }
    if (line) this.text(line, X, y, size, col, w); return y + size*lh;
  },
  bar(X, Y, W, H, v, col = "#ffc21a", bg = "rgba(255,255,255,.1)"){ const x = this.x; this.rr(x, X, Y, W, H, H/2); x.fillStyle = bg; x.fill(); if (v > 0){ this.rr(x, X, Y, Math.max(H, W*Math.min(1, v)), H, H/2); x.fillStyle = col; x.fill(); } },
  avImg(){ if (!this._av){ this._av = new Image(); this._av.onload = () => this.draw(); this._av.src = AV_SHEET; } return this._av.complete && this._av.naturalWidth ? this._av : null; },
  face(name, X, Y, w){ const img = this.avImg(), i = Math.max(0, AV_NAMES.indexOf(name)); const h = w*1.5; if (!img){ this.x.fillStyle = "#3a2a20"; this.x.fillRect(X, Y, w, h); return; } const cw = img.naturalWidth/10, ch = cw*1.5, sw = cw*.72; this.x.drawImage(img, (i % 10)*cw + (cw - sw)/2, Math.floor(i/10)*ch, sw, sw*1.5, X, Y, w, h); },
  draw(){
    if (!this.x) return;
    const x = this.x, W = this.W, H = this.H; this.regions = [];
    x.clearRect(0, 0, W, H);
    this.rr(x, 4, 4, W - 8, H - 8, 30); x.fillStyle = "rgba(16,10,8,.95)"; x.fill(); x.lineWidth = 3; x.strokeStyle = "rgba(255,194,26,.55)"; x.stroke();
    const d = this.d();
    // header: wallet, title, the close button
    this.text("ATL NIGHTCLUB MOGUL", 172, 40, 20, "#ffc21a", 800);
    this.text(`${this.money(d.cash)}  ·  ${this.title(d)}  ·  Night ${d.day}`, 420, 40, 18, "rgba(255,255,255,.8)", 600, "left", 190);
    this.btn("mx", W - 84, 14, 62, 52, "✕", () => this.close(), {size: 28});
    if (this.view !== "menu") this.btn("mback", W - 236, 14, 140, 52, "◀ Menu", () => this.toMenu(), {size: 22});
    if (this.view !== "empire" && !(this.view === "game" && this.game)) this.btn("hemp", W - 236 - 168, 14, 160, 52, "👑 Empire", () => this.empire(), {size: 22, primary: true});
    try{
      if (this.view === "menu") this.drawMenu();
      else if (this.view === "role") this.drawRole();
      else if (this.view === "game" && this.game) this.game.draw(this);
      else if (this.view === "result") this.drawResult();
      else if (this.view === "empire") this.drawEmpire();
    }catch(e){ console.warn(e); this.text("Something went wrong. Tap Menu.", 40, 200, 26, "#ff8a7a"); }
    if (this.flash && performance.now() - this.flash.t < 2200){ this.rr(x, 24, H - 66, W - 48, 46, 16); x.fillStyle = this.flash.bad ? "rgba(255,77,61,.25)" : "rgba(58,208,122,.22)"; x.fill(); this.text(this.flash.msg, W/2, H - 42, 24, this.flash.bad ? "#ffb0a6" : "#b8ffd4", 700, "center", W - 70); }
    if (this.tex) this.tex.needsUpdate = true;
  },
  say(msg, bad){ this.flash = {msg, bad, t: performance.now()}; this.draw(); if (bad) try{ Lounge.xrCtls && Lounge.xrCtls.forEach(c => Lounge.haptic(c, .6, 80)); }catch(e){} },

  /* ---------- opening and closing ---------- */
  open(){
    if (!Age.ok("Nightclub Mogul")) return;
    this.ensure(); this.on = true; this.view = this.view === "game" && this.game ? "game" : "menu";
    const go = () => {
      if (Lounge.worldId !== "club" && !(this.game && this.game.anyWorld)) Lounge.chooseWorld("club");
      this.box.hidden = XRV();
      if (XRV()){ this.vrPanel().visible = true; this.placePanel(); }
      this.draw();
    };
    if ($("#stage").hidden || !Lounge.built){ store.set("world", "club"); openStage("lounge"); const w = setInterval(() => { if (Lounge.built){ clearInterval(w); go(); } }, 300); setTimeout(() => clearInterval(w), 60000); }
    else go();
  },
  /* 👑 straight to your empire, from anywhere: the party bar, the VR menu, the panel header, or the E key */
  empire(){
    if (!Age.ok("Nightclub Mogul")) return;
    if (!this.on || !this.c){ this.open(); }
    if (this.game && this.view === "game") this.quitGame(true);
    this.view = "empire"; this.role = "owner"; if (this.x) this.draw();
    const w = setInterval(() => { if (this.on && this.x){ clearInterval(w); this.view = "empire"; this.role = "owner"; this.draw(); } }, 250); setTimeout(() => clearInterval(w), 8000);
  },
  /* 🥊 Brawl mode: a fight starts right where you're standing, in whatever world you're in */
  brawlHere(){
    if (!Age.ok("Brawl mode")) return;
    const go = () => { this.ensure(); this.on = true; const xr = XRV(); this.box.hidden = xr; if (xr){ this.vrPanel().visible = true; } if (this.game && this.view === "game") this.quitGame(true); this.startGame("brawl", false); };
    if ($("#stage").hidden || !Lounge.built){ openStage("lounge"); const w = setInterval(() => { if (Lounge.built && Lounge.worlds[Lounge.worldId]){ clearInterval(w); setTimeout(go, 800); } }, 300); setTimeout(() => clearInterval(w), 60000); }
    else go();
  },
  expand(on){ const box = this.box; if (!box) return; box.classList.toggle("xpand", on); document.body.classList.toggle("mg-xp", !!on); box.classList.remove("small"); if (this.miniBtn) this.miniBtn.textContent = "▾"; if (this.xpBtn){ this.xpBtn.textContent = on ? "🗗" : "⛶"; this.xpBtn.title = on ? "Back to the small panel" : "Expand to full screen"; }
    try{ if (on){ const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen && matchMedia("(pointer: coarse)").matches) el.requestFullscreen().then(() => { try{ screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); }catch(e){} }).catch(() => {}); }
      else if (document.fullscreenElement && this._fsByUs !== false) document.exitFullscreen().catch(() => {}); }catch(e){}
    store.set("mogulXp", !!on); this.draw(); },
  phone(){ return Math.min(innerWidth, innerHeight) < 560 || innerWidth < 760; },
  close(){ if (this.game && this.view === "game") this.quitGame(true); this.on = false; if (this.box && this.box.classList.contains("xpand")) this.expand(false); if (this.box) this.box.hidden = true; if (this.mesh) this.mesh.visible = false; },
  toMenu(){ if (this.game && this.view === "game") this.quitGame(true); this.view = "menu"; this.draw(); },
  /* ---------- the menu: pick a job ---------- */
  drawMenu(){
    const d = this.d(), W = this.W;
    this.text("Pick a job. Train first, then work real shifts to earn cash and build your empire.", 28, 96, 22, "rgba(255,255,255,.75)", 500, "left", W - 56);
    const cols = 2, bw = (W - 56 - 12)/cols, bh = 68, jobs = this.ROLES.filter(r => !r.well), well = this.ROLES.filter(r => r.well);
    jobs.forEach((r, i) => { const X = 28 + (i % cols)*(bw + 12), Y = 118 + Math.floor(i/cols)*(bh + 8), lv = this.level(r.id, d);
      this.btn("r" + r.id, X, Y, bw, bh, r.id === "owner" ? "👑  My Empire" : `${r.icon}  ${r.name}`, () => { this.role = r.id; this.view = r.id === "owner" ? "empire" : "role"; this.draw(); },
        {left: true, size: 24, primary: r.id === "owner", sub: r.id === "owner" ? `${Object.keys(d.clubs).length} club${Object.keys(d.clubs).length === 1 ? "" : "s"} · worth ${this.money(this.worth(d))}` : `Level ${lv}${d.tut[r.id] ? " · trained ✓" : " · start with training"}${d.best[r.id] ? " · best " + d.best[r.id] + "%" : ""}`}); });
    { const wy = 118 + Math.ceil(jobs.length/cols)*(bh + 8) + 6, ww = (W - 56 - 10*(well.length - 1))/Math.max(4, well.length); this.text("WELLNESS & PLAY · no strikes, no pressure", 28, wy + 14, 18, "#9fe8ff", 800);
      well.forEach((r, i) => this.btn("r" + r.id, 28 + i*(ww + 10), wy + 26, ww, 78, well.length > 4 ? r.icon + " " + r.name.replace("Music ", "").replace(" Room", "").replace(" Class", "") : `${r.icon} ${r.name}`, () => { this.role = r.id; this.view = "role"; this.draw(); }, {size: 21, sub: `Level ${this.level(r.id, d)}${d.best[r.id] ? " · best " + d.best[r.id] + "%" : ""}`})); }
    this.btn("share", 28, this.H - 74, 300, 54, "📣 Share my empire", () => { try{ this.close(); Social.compose(); $("#postText").value = `I'm a ${this.title(d)} in ATL Nightclub Mogul: ${this.money(this.worth(d))} and ${Object.keys(d.clubs).length} club${Object.keys(d.clubs).length === 1 ? "" : "s"}. 🍾`; }catch(e){} }, {size: 21});
  },
  drawRole(){
    const r = this.ROLES.find(x => x.id === this.role), d = this.d(), lv = this.level(r.id, d);
    this.text(`${r.icon} ${r.name}`, 28, 112, 40, "#fff", 800);
    this.text(`Level ${lv}  ·  pays about ${this.money(r.pay[0]*(1 + (lv - 1)*.15))}–${this.money(r.pay[1]*(1 + (lv - 1)*.15))} a shift`, 28, 156, 22, "#ffd87a", 600);
    let y = this.wrap(r.blurb, 28, 200, 24, this.W - 56);
    const G = this.GAMES[r.id], tips = G && G.howTo || [];
    this.text("HOW IT WORKS", 28, y + 18, 18, "#ffc21a", 800); y += 50;
    tips.slice(0, 5).forEach(t => { y = this.wrap("• " + t, 40, y, 21, this.W - 80, "rgba(255,255,255,.8)"); });
    if (XRV() && G && G.vrTip) y = this.wrap("🥽 In VR: " + G.vrTip, 40, y + 4, 21, this.W - 80, "#9fe8ff");
    const by = this.H - 90;
    if (r.well){ this.btn("shift", 28, by, 360, 66, "▶ Start", () => this.startGame(r.id, false), {primary: true, size: 28}); return; }
    this.btn("train", 28, by, 300, 66, d.tut[r.id] ? "🎓 Train again" : "🎓 Start training", () => this.startGame(r.id, true), {primary: !d.tut[r.id], size: 26});
    this.btn("shift", 344, by, 300, 66, "▶ Work a shift", () => { if (!d.tut[r.id]) this.say("Do the training first. It's quick, and you get $50 for finishing it.", true); else this.startGame(r.id, false); }, {primary: !!d.tut[r.id], size: 26});
  },
  /* ---------- running a game ---------- */
  startGame(role, train){
    if (this.phone() && this.box && !this.box.classList.contains("xpand") && !store.get("xpTip", false)){ store.set("xpTip", true); setTimeout(() => toast("📱 Tip: tap ⛶ at the top of the game panel to play full screen."), 1200); }
    const G = this.GAMES[role]; if (!G) return;
    // wellness activities happen in their own room: go there first
    if (G.world && Lounge.worldId !== G.world){ Lounge.chooseWorld(G.world); this.say("Heading there…"); const t = setInterval(() => { if (Lounge.worldId === G.world && Lounge.worlds[G.world]){ clearInterval(t); setTimeout(() => this.startGame(role, train), 900); } }, 300); setTimeout(() => clearInterval(t), 60000); return; }
    // most jobs happen in the club; take you there first and start once it's ready
    if (!G.anyWorld && Lounge.worldId !== "club"){ Lounge.chooseWorld("club"); this.say("Heading to the club…"); const t = setInterval(() => { if (Lounge.worldId === "club" && Lounge.worlds.club){ clearInterval(t); setTimeout(() => this.startGame(role, train), 700); } }, 300); setTimeout(() => clearInterval(t), 30000); return; }
    const d = this.d(), lv = this.level(role, d);
    this.shift = {role, train, lv, t: 0, earn: 0, tips: 0, strikes: 0, maxStrikes: train || G.well ? 99 : 3, scores: [], log: [], over: false};
    this.game = Object.create(G); this.game.m = this; this.view = "game";
    try{ this.game.start(this.shift); }catch(e){ console.warn(e); }
    if (XRV()){ this.vrPanel().visible = true; setTimeout(() => this.placePanel(this.game.panelSide ?? .55), 120); }
    this.draw();
  },
  strike(msg){ const s = this.shift; if (!s) return; if (!s.train) s.strikes++; this.say((s.train ? "Practice tip: " : `Strike ${s.strikes}/${s.maxStrikes}: `) + msg, true); if (!s.train && s.strikes >= s.maxStrikes) setTimeout(() => this.endGame("Three strikes. The manager sent you home early."), 900); },
  score(v, money, msg){ const s = this.shift; s.scores.push(Math.max(0, Math.min(100, +v || 0))); if (money) s.earn += money; if (msg) this.say(msg, v < 50); },
  endGame(why){
    const s = this.shift, g = this.game; if (!s || s.over) return; s.over = true; { this.peeking = false; const pb = $("#mgPeek"); if (pb && !pb.hidden){ pb.hidden = true; if (this.on) this.box.hidden = false; } }
    try{ g.end && g.end(); }catch(e){}
    const d = this.d(), avg = s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0)/s.scores.length) : 0;
    let pay = 0;
    if (!s.train){ const R = this.ROLES.find(r => r.id === s.role); const base = (R.pay[0] + (R.pay[1] - R.pay[0])*Math.max(0, (avg - 40)/60))*(1 + (s.lv - 1)*.15); pay = Math.round((s.strikes >= s.maxStrikes ? base*.4 : base) + s.earn); }
    else if (!d.tut[s.role] && avg >= 40){ d.tut[s.role] = true; pay = 50; }
    else if (!d.tut[s.role]) why = (why ? why + " " : "") + "Score at least 40% to finish training.";
    d.cash += pay; d.earned += Math.max(0, pay); d.xp[s.role] = (d.xp[s.role] || 0) + Math.round(avg*(s.train ? .3 : 1)); if (!s.train){ d.shifts++; d.day++; d.best[s.role] = Math.max(d.best[s.role] || 0, avg); }
    if (s.fame) d.fame = (d.fame || 0) + s.fame;
    this.put(d); try{ if ((!s.train && this.ROLES.find(r => r.id === s.role).well)) Wellness.fed(s.role, avg); }catch(e){}
    this.result = {role: s.role, train: s.train, avg, pay, why, log: s.log.slice(-5), lv: this.level(s.role, d), lvBefore: s.lv};
    this.game = null; this.view = "result"; this.flash = null; this.draw();
    if (!s.train){ this.loadBoard(s.role); this.postScore(s.role, pay, avg); }
  },
  /* 🏆 daily leaderboard per job: who earned the most today (resets every day, UTC) */
  today(){ return new Date().toISOString().slice(0, 10); },
  boardTag(role){ return `atl-mogul:${this.today()}:${role}`; },
  async postScore(role, pay, avg){
    try{ if (!window.TUNet || !Age.adult() || pay <= 0) return; const d = this.d(), day = this.today(); if (!d.todayBest || d.todayBest.day !== day) d.todayBest = {day};
      if ((d.todayBest[role] || 0) >= pay) return; d.todayBest[role] = pay; this.put(d); Events.myKey();
      const name = (Profile.get().name || "").slice(0, 40) || "Guest";
      const ev = TUNet.finalizeEvent({kind: 30078, created_at: Math.floor(Date.now()/1000), content: JSON.stringify({pay, avg, n: name, lv: this.level(role, d)}), tags: [["d", this.boardTag(role)], ["t", "atlnightclubmogul"], ["t", "atl-mogul"]]}, Events.sk());
      await Promise.any(Events.pool().publish(NET.relays, ev)); this.loadBoard(role, true);
    }catch(e){ console.warn("mogul score", e); } },
  async loadBoard(role, force){
    this.boards = this.boards || {}; const B = this.boards[role]; if (!force && B && Date.now() - B.at < 60000) return;
    this.boards[role] = Object.assign(B || {rows: []}, {at: Date.now(), loading: true});
    try{ const evs = await Events.pool().querySync(NET.relays, {kinds: [30078], "#d": [this.boardTag(role)], limit: 300}, {maxWait: 4000}); const best = {};
      for (const e of evs){ try{ if (typeof Safety !== "undefined" && Safety.blocked(e.pubkey)) continue; const c = JSON.parse(e.content); const pay = Math.max(0, Math.min(1e6, +c.pay || 0)); if (!best[e.pubkey] || best[e.pubkey].pay < pay) best[e.pubkey] = {pk: e.pubkey, pay, avg: +c.avg || 0, n: String(c.n || "Guest").slice(0, 40)}; }catch(err){} }
      this.boards[role].rows = Object.values(best).sort((a, b) => b.pay - a.pay).slice(0, 5); }catch(e){}
    try{ const d = this.d(), mine = d.todayBest && d.todayBest.day === this.today() && d.todayBest[role], me = Events.myKey(); const rows = this.boards[role].rows;
      if (mine && !rows.some(x => x.pk === me)){ rows.push({pk: me, pay: mine, n: (Profile.get().name || "You").slice(0, 40)}); rows.sort((a, b) => b.pay - a.pay); this.boards[role].rows = rows.slice(0, 5); } }catch(e){}
    this.boards[role].loading = false; if (this.on) this.draw(); },
  drawBoard(role, X, Y, w){ const B = this.boards && this.boards[role], R = this.ROLES.find(r => r.id === role), me = (() => { try{ return Events.myKey(); }catch(e){ return ""; } })();
    this.text(`🏆 Today's top ${R ? R.name : ""}`, X, Y, 22, "#ffd87a", 800, "left", w); Y += 32;
    if (!B || (B.loading && !B.rows.length)){ this.text("Loading the rankings…", X, Y, 19, "rgba(255,255,255,.6)", 500, "left", w); return; }
    if (!B.rows.length){ this.text("Nobody's on the board yet today. Be first!", X, Y, 19, "rgba(255,255,255,.6)", 500, "left", w); return; }
    B.rows.forEach((row, i) => { this.text(`${["🥇", "🥈", "🥉", "4.", "5."][i]} ${row.n}${row.pk === me ? " (you)" : ""}`, X, Y + i*30, 19, row.pk === me ? "#9fe8ff" : "#fff", 600, "left", w - 110); this.text(this.money(row.pay), X + w, Y + i*30, 19, "#3ad07a", 700, "right"); });
    this.text("Resets every day. Earn the most to take the top spot.", X, Y + B.rows.length*30 + 6, 16, "rgba(255,255,255,.45)", 500, "left", w); },
  quitGame(silent){ const s = this.shift; if (s && !s.over){ s.over = true; try{ this.game && this.game.end && this.game.end(); }catch(e){} } this.game = null; if (!silent) this.toMenu(); },
  drawResult(){
    const r = this.result, R = this.ROLES.find(x => x.id === r.role), W = this.W; if (!r) return;
    this.text(`${R.icon} ${r.train ? "Training done" : "Shift over"}`, W/2, 140, 44, "#fff", 800, "center");
    this.text(`${r.avg}%`, W/2, 230, 90, r.avg >= 75 ? "#3ad07a" : r.avg >= 50 ? "#ffc21a" : "#ff7a6a", 800, "center");
    this.text(r.avg >= 90 ? "Flawless. The manager wants you every night." : r.avg >= 75 ? "Great work!" : r.avg >= 50 ? "Not bad. Keep practicing." : "Rough night. Train again and try once more.", W/2, 290, 26, "rgba(255,255,255,.85)", 600, "center", W - 80);
    if (r.pay) this.text(`You earned ${this.money(r.pay)}${r.train ? " for finishing your training" : ""}`, W/2, 340, 30, "#ffd87a", 700, "center");
    if (r.lv > r.lvBefore) this.text(`⬆ Level ${r.lv} ${R.name}! Harder shifts, better pay.`, W/2, 384, 26, "#9fe8ff", 700, "center");
    if (r.why) this.wrap(r.why, 60, 420, 22, W - 120, "#ffb0a6");
    const board = !r.train && this.boards && this.boards[r.role]; let y = 470; for (const l of r.log) { this.text("• " + l, 60, y, 20, "rgba(255,255,255,.7)", 500, "left", board ? W/2 - 90 : W - 120); y += 30; }
    if (board) this.drawBoard(r.role, W/2 + 10, 440, W/2 - 60);
    const by = this.H - 92;
    this.btn("again", 28, by, 300, 64, r.train ? "▶ Work a real shift" : "▶ Another shift", () => this.startGame(r.role, false), {primary: true, size: 24});
    this.btn("menu2", 344, by, 260, 64, "Pick another job", () => this.toMenu(), {size: 24});
    this.btn("emp", 620, by, 300, 64, "👑 My empire", () => { this.view = "empire"; this.role = "owner"; this.draw(); }, {size: 24});
  },
  /* every frame from the lounge */
  update(dt){
    if (!this.on) return;
    const vr = XRV();
    if (this.box) this.box.hidden = vr || !!this.peeking || !!(this.game && this.game.padEl && this.view === "game");
    if (this.mesh) this.mesh.visible = vr;
    if (vr && this.mesh && !this.mesh.userData.placed){ this.mesh.userData.placed = true; this.placePanel(); }
    if (!vr && this.mesh) this.mesh.userData.placed = false;
    if (this.view === "game" && this.game && this.shift && !this.shift.over){
      this.shift.t += dt;
      try{ this.game.update(dt); }catch(e){ console.warn(e); }
      this._dt = (this._dt || 0) + dt; if (this._dt > .1){ this._dt = 0; this.draw(); }
    }
  },
  /* the lounge's people: bring someone in for a job, send them off after */
  spawn(x, z, ry, behavior, opts = {}){
    const L = Lounge, w = L.worlds[L.worldId]; if (!w) return null;
    const prev = L.buildingWorld; L.buildingWorld = L.worldId;
    let p; try{ p = L.person(w.group, x, 0, z, ry, behavior, opts); }finally{ L.buildingWorld = prev; }
    const slot = p.userData.slot; slot.mogul = true; if (slot.real) try{ L.unstickSlot(slot); }catch(e){}
    return slot;
  },
  despawn(slot){
    if (!slot) return; const L = Lounge;
    try{ slot.mixer && slot.mixer.stopAllAction(); }catch(e){}
    if (slot.real) slot.real.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) m && m.dispose && m.dispose(); if (o.isSkinnedMesh && o.skeleton) try{ o.skeleton.dispose(); }catch(e){} });
    if (slot.p.parent) slot.p.parent.remove(slot.p);
    L.slots = (L.slots || []).filter(s => s !== slot);
  },
  slotPos(slot){ return slot.p.getWorldPosition(new THREE.Vector3()); },
  headOf(slot){ const B = slot.real && Lounge.npcBones(slot); return B ? B.head.getWorldPosition(new THREE.Vector3()) : this.slotPos(slot).add(new THREE.Vector3(0, 1.7, 0)); },
  emoji(e, pos){ try{ Party.floatEmoji(e, pos); }catch(err){} },
  // a speech/order bubble that floats over someone's head
  bubble(slot, text, color = "#ffc21a"){
    const T = THREE; if (slot.bub){ slot.p.remove(slot.bub); slot.bub.material.map.dispose(); slot.bub.material.dispose(); slot.bub = null; } if (!text) return;
    const [c, x] = Tex.canvas(512, 128); x.fillStyle = "rgba(16,10,8,.9)"; this.rr(x, 4, 4, 504, 100, 30); x.fill(); x.lineWidth = 5; x.strokeStyle = color; x.stroke();
    x.fillStyle = "#fff"; x.font = '700 44px "Hanken Grotesk", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 56, 480);
    const s = new T.Sprite(new T.SpriteMaterial({map: Tex.make(c), transparent: true, depthWrite: false, depthTest: false})); s.scale.set(1.1, .275, 1); s.position.y = 2.15; s.renderOrder = 9; slot.p.add(s); slot.bub = s;
  },
  moveMe(x, z, yaw){ const L = Lounge; L.moveTo(x, z, {instant: true, force: true}); if (yaw && typeof yaw === "object") yaw = Math.atan2(-(yaw.x - x), -(yaw.z - z)); if (!L.renderer.xr.isPresenting && yaw !== undefined){ L.yaw = yaw; L.pitch = -.12; L.userLooked = true; } },
  vr(){ return XRV(); },
  GAMES: {}
};
/* ---------- shared helpers for the games ---------- */
Object.assign(Mogul, {
  // a training step banner: what to do now (and how in VR)
  tutDraw(g, Y = 86){
    const s = this.shift; if (!s || !s.train || !g.steps) return Y;
    const st = g.steps[g.ti || 0]; if (!st) return Y;
    const x = this.x; this.rr(x, 24, Y, this.W - 48, 70, 16); x.fillStyle = "rgba(77,225,255,.14)"; x.fill(); x.strokeStyle = "rgba(77,225,255,.6)"; x.lineWidth = 2; x.stroke();
    this.text(`STEP ${(g.ti || 0) + 1}/${g.steps.length}`, 40, Y + 26, 16, "#9fe8ff", 800);
    this.text(this.vr() && st.vr ? st.vr : st.say, 40, Y + 52, 21, "#fff", 600, "left", this.W - (st.ack ? 230 : 80));
    if (st.ack) this.btn("tack", this.W - 190, Y + 12, 150, 46, "Got it ✓", () => { g.acked = (g.acked || 0) + 1; }, {primary: true, size: 20});
    return Y + 80;
  },
  tutTick(g){
    const s = this.shift; if (!s || !s.train || !g.steps) return;
    const st = g.steps[g.ti || 0]; if (!st) return;
    let ok = false; try{ ok = st.ack ? (g.acked || 0) > (g._ackSeen || 0) : !!st.done(g); }catch(e){}
    if (ok){ g._ackSeen = g.acked || 0; g.ti = (g.ti || 0) + 1; this.say("✓ " + (st.ok || "Nice!")); if (g.ti >= g.steps.length) setTimeout(() => { if (this.game === g) { this.score(100, 0); this.endGame("You know the basics. Now work a real shift."); } }, 1400); }
  },
  near(pos, r = 2.4){ const h = Lounge.headPos(); return Math.hypot(h.x - pos.x, h.z - pos.z) < r; },
  clickable(mesh, fn, reach = 2.6){ Lounge.addClickable(mesh, () => { if (!this.on || !this.game) return; const wp = mesh.getWorldPosition(new THREE.Vector3()); if (!this.near(wp, reach)){ this.say("Walk closer first.", true); return; } fn(); }); return mesh; },
  dropProps(list){ const L = Lounge; for (const o of list || []){ if (o.parent) o.parent.remove(o); L.clickables = (L.clickables || []).filter(c => c !== o && !(function inside(q){ for (; q; q = q.parent) if (q === o) return true; return false; })(c)); L.grabbables = (L.grabbables || []).filter(g => g !== o); o.traverse && o.traverse(m => { if (m.geometry) m.geometry.dispose(); }); } },
  hurtFlash(){
    if (this.vr()){ const T = THREE, L = Lounge; if (!this.hurt){ this.hurt = new T.Mesh(new T.SphereGeometry(.3, 16, 12), new T.MeshBasicMaterial({color: 0xff2020, side: T.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false})); this.hurt.renderOrder = 9997; L.camera.add(this.hurt); } this.hurt.material.opacity = .55; this.hurtT = .5; try{ L.xrCtls.forEach(c => L.haptic(c, 1, 160)); }catch(e){} }
    else if (this.game && this.game.padEl){ const pe = this.game.padEl; pe.classList.remove("hurt"); void pe.offsetWidth; pe.classList.add("hurt"); }
    else if (this.box){ this.box.classList.remove("hurt"); void this.box.offsetWidth; this.box.classList.add("hurt"); }
  }
});
{ const u0 = Mogul.update.bind(Mogul); Mogul.update = function(dt){ u0(dt); if (this.hurt && this.hurtT > 0){ this.hurtT -= dt; this.hurt.material.opacity = Math.max(0, this.hurtT); } }; }

/* ================= 🍸 Bartender: real recipes, measured pours, VR mixology ================= */
Mogul.ING = {vodka: ["Vodka", "#e8f0ff", 1], tequila: ["Tequila", "#f2e6b0", 1], rum: ["White rum", "#f4f0e0", 1], gin: ["Gin", "#e6f6ff", 1], bourbon: ["Bourbon", "#b8681e", 1], triple: ["Triple sec", "#ffb347", 1],
  lime: ["Lime juice", "#c6e86a", 0], cran: ["Cranberry", "#c8102e", 0], oj: ["Orange juice", "#ffa51f", 0], simple: ["Simple syrup", "#f6efd0", 0], grenadine: ["Grenadine", "#b0102a", 0],
  soda: ["Soda water", "#e8f6ff", 0], tonic: ["Tonic", "#eaf4ff", 0], cola: ["Cola", "#3a1a0a", 0], ginger: ["Ginger beer", "#e8c870", 0]};
Mogul.GLASS = {rocks: ["Rocks", 8], highball: ["Highball", 12], coupe: ["Coupe", 6], mug: ["Copper mug", 14]};
Mogul.GARNISH = {lime: "🍋‍🟩 Lime", mint: "🌿 Mint", orange: "🍊 Orange peel", cherry: "🍒 Cherry"};
Mogul.RECIPES = [
  {n: "Margarita", glass: "rocks", ice: true, method: "shake", g: "lime", items: {tequila: 2, lime: 1, triple: 1}},
  {n: "Mojito", glass: "highball", ice: true, method: "muddle", g: "mint", items: {rum: 2, lime: 1, simple: .75, soda: 2}},
  {n: "Old Fashioned", glass: "rocks", ice: true, method: "stir", g: "orange", items: {bourbon: 2, simple: .25}},
  {n: "Cosmopolitan", glass: "coupe", ice: false, method: "shake", g: "lime", items: {vodka: 1.5, triple: .5, cran: 1, lime: .5}},
  {n: "Moscow Mule", glass: "mug", ice: true, method: "build", g: "lime", items: {vodka: 2, lime: .5, ginger: 4}},
  {n: "Rum & Coke", glass: "highball", ice: true, method: "build", g: "lime", items: {rum: 2, cola: 4}},
  {n: "Gin & Tonic", glass: "highball", ice: true, method: "build", g: "lime", items: {gin: 2, tonic: 4}},
  {n: "Tequila Sunrise", glass: "highball", ice: true, method: "build", g: "orange", items: {tequila: 2, oj: 4, grenadine: .5}},
  {n: "Virgin Mojito", glass: "highball", ice: true, method: "muddle", g: "mint", items: {lime: 1, simple: .75, soda: 4}, na: true},
  {n: "Shirley Temple", glass: "highball", ice: true, method: "build", g: "cherry", items: {ginger: 5, grenadine: .5}, na: true}
];
Mogul.GAMES.bartender = {
  panelSide: .9,
  howTo: ["Tap an order to work on it. The recipe card shows the glass, ice, pours, method and garnish.", "Hold a bottle button to pour (about 1 oz a second). Watch the amount: being off by more than ¼ oz costs points.", "Shake, stir or muddle when the recipe says so, add the garnish, then Serve.", "Guests who look young: tap 🪪 Check ID before serving alcohol. Under 21? Refuse.", "Someone slurring and stumbling? Cut them off and offer water."],
  vrTip: "Grab a bottle (grip), tip it over the glass on the mat to pour, and drop a garnish into the glass. Use the panel for glass, ice, shake and serve.",
  start(s){
    const m = this.m, T = THREE, L = Lounge;
    this.props = []; this.glass = null; this.orders = []; this.sel = 0; this.spawnT = 2; this.served = 0; this.refused = 0; this.cut = 0;
    m.moveMe(-9.6, -6, -Math.PI/2);
    const g = L.worlds.club && L.worlds.club.group; this.root = new T.Group(); g.add(this.root); this.props.push(this.root);
    // the build mat and the glass on it
    const mat = new T.Mesh(new T.BoxGeometry(.34, .01, .34), new T.MeshStandardMaterial({color: 0x1a1a1a, roughness: .9})); mat.position.set(-8.78, 1.165, -6); this.root.add(mat);
    this.glassG = new T.Group(); this.glassG.position.set(-8.78, 1.17, -6); this.root.add(this.glassG);
    // bottles on the bar: spirits on one side, juices and mixers on the other
    this.bottles = [];
    const ids = Object.keys(m.ING), spirits = ids.filter(k => m.ING[k][2]), mixers = ids.filter(k => !m.ING[k][2]);
    const bottle = (id, x, z) => { const [n, col] = m.ING[id], b = new T.Group(); b.position.set(x, 1.165, z);
      const glassM = new T.MeshPhysicalMaterial({color: new T.Color(col).lerp(new T.Color(0x224422), m.ING[id][2] ? .1 : .4), roughness: .1, metalness: 0, transparent: true, opacity: .8, clearcoat: 1});
      const body = new T.Mesh(Props.lathe([[0, 0], [.04, 0], [.042, .01], [.042, .19], [.03, .23], [.013, .26], [.013, .31], [0, .31]], 16), glassM); b.add(body);
      const [lc, lx] = Tex.canvas(128, 96); lx.fillStyle = "#f6efe0"; lx.fillRect(0, 0, 128, 96); lx.fillStyle = col === "#e8f0ff" || col === "#f4f0e0" || col === "#e6f6ff" || col === "#e8f6ff" || col === "#eaf4ff" ? "#2a3a6a" : col; lx.fillRect(0, 0, 128, 18); lx.fillRect(0, 78, 128, 18);
      lx.fillStyle = "#1a1208"; lx.font = '800 22px "Hanken Grotesk", sans-serif'; lx.textAlign = "center"; lx.textBaseline = "middle"; lx.fillText(n.toUpperCase(), 64, 48, 120);
      const lab = new T.Mesh(new T.CylinderGeometry(.0425, .0425, .08, 16, 1, true, -Math.PI*.6, Math.PI*1.2), new T.MeshStandardMaterial({map: Tex.make(lc), roughness: .7})); lab.position.y = .11; lab.rotation.y = Math.PI/2; b.add(lab);
      b.userData.ing = id; this.root.add(b); L.grabbable(b); this.bottles.push(b); return b; };
    spirits.forEach((id, i) => bottle(id, -9.02, -8.1 + i*.26));
    mixers.forEach((id, i) => bottle(id, i % 2 ? -8.82 : -9.06, -5.45 + Math.floor(i/2)*.26));
    // garnish tray: grab one and drop it in the glass
    this.garn = [];
    const gm = {lime: [0x6ac43a, () => new T.CylinderGeometry(.03, .03, .012, 12, 1, false, 0, Math.PI)], mint: [0x2e9a3a, () => new T.SphereGeometry(.022, 8, 6)], orange: [0xff8a1a, () => new T.TorusGeometry(.02, .006, 6, 12, 4)], cherry: [0xc8102e, () => new T.SphereGeometry(.016, 10, 8)]};
    Object.entries(gm).forEach(([id, [c, geo]], i) => { const o = new T.Mesh(geo(), new T.MeshStandardMaterial({color: c, roughness: .5})); o.position.set(-8.62, 1.19, -6.55 + i*.1); o.userData.garnish = id; this.root.add(o); L.grabbable(o); this.garn.push(o); });
    this.stream = new T.Mesh(new T.CylinderGeometry(.004, .004, 1, 6), new T.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: .8})); this.stream.visible = false; this.root.add(this.stream);
    // the guests at the bar take the orders
    this.guests = (L.slots || []).filter(sl => sl.world === "club" && sl.real && !sl.mogul && sl.p.position.x > -8.3 && sl.p.position.x < -6.4 && sl.p.position.z < -3 && sl.p.position.z > -9.5);
    if (s.train){
      this.steps = [
        {say: "A guest ordered a Margarita. Its recipe card is on the right: rocks glass, ice, 2 oz tequila, 1 oz lime, 1 oz triple sec, shaken, lime garnish.", ack: true},
        {say: "Pick the glass: tap 🥃 Rocks.", done: g => g.glass && g.glass.type === "rocks"},
        {say: "Add ice: tap 🧊 Ice.", done: g => g.glass && g.glass.ice},
        {say: "Pour 2 oz tequila: hold the Tequila button until it reads 2.0 oz.", vr: "Pour 2 oz tequila: grab the Tequila bottle and tip it over the glass (or hold its button).", done: g => g.glass && Math.abs((g.glass.items.tequila || 0) - 2) <= .25},
        {say: "Now 1 oz lime juice and 1 oz triple sec.", done: g => g.glass && Math.abs((g.glass.items.lime || 0) - 1) <= .25 && Math.abs((g.glass.items.triple || 0) - 1) <= .25},
        {say: "A Margarita is shaken: tap 🔁 Shake.", done: g => g.glass && g.glass.method.shake},
        {say: "Garnish: tap 🍋‍🟩 Lime.", vr: "Garnish: grab the green lime wedge from the tray and drop it into the glass.", done: g => g.glass && g.glass.garnish === "lime"},
        {say: "Serve it: tap ✅ Serve.", done: g => g.served >= 1},
        {say: "This guest looks young and wants a Moscow Mule. Tap 🪪 Check ID first.", done: g => g.orders[g.sel] && g.orders[g.sel].checked},
        {say: "They're only 19. Tap ⛔ Refuse (and offer a Shirley Temple).", done: g => g.refused >= 1},
        {say: "This guest is slurring and stumbling and wants another shot. Tap 🚫 Cut off.", done: g => g.cut >= 1}
      ];
      this.queue = [{r: 0}, {r: 4, young: true, age: 19}, {r: 5, drunk: true}];
    }
    this.newGlass(null);
  },
  newOrder(spec){
    const m = this.m, s = m.shift, lv = s.lv, recipes = m.RECIPES;
    spec = spec || (() => { const r = Math.floor(Math.random()*Math.min(recipes.length, 4 + lv)); const young = !recipes[r].na && Math.random() < .22, drunk = !young && Math.random() < .1; return {r, young, age: young ? (Math.random() < .5 ? 18 + Math.floor(Math.random()*3) : 21 + Math.floor(Math.random()*4)) : 30, drunk}; })();
    const guest = this.guests.filter(gs => !this.orders.some(o => o.guest === gs))[0] || null;
    const o = Object.assign({rec: recipes[spec.r], patience: Math.max(35, 80 - lv*4), t: 0, guest, checked: false}, spec);
    this.orders.push(o); if (guest){ m.bubble(guest, (o.drunk ? "🥴 " : o.young ? "🧑 " : "🍸 ") + o.rec.n); Lounge.npcReact(guest, Lounge.headPos(), null); }
  },
  newGlass(type){ this.glass = type ? {type, ice: false, items: {}, method: {}, garnish: null} : null; this.redrawGlass(); },
  redrawGlass(){
    const T = THREE, G = this.glassG; if (!G) return; while (G.children.length) G.remove(G.children[0]);
    const gl = this.glass; if (!gl) return;
    const prof = {rocks: [[0, 0], [.045, 0], [.045, .005], [.046, .09], [.044, .09]], highball: [[0, 0], [.034, 0], [.034, .004], [.036, .15], [.034, .15]], coupe: [[0, 0], [.03, 0], [.006, .01], [.005, .09], [.045, .1], [.06, .135], [.058, .135]], mug: [[0, 0], [.042, 0], [.046, .1], [.044, .1]]}[gl.type];
    const gm = gl.type === "mug" ? new T.MeshStandardMaterial({color: 0xc87a3a, roughness: .3, metalness: .9, side: T.DoubleSide}) : new T.MeshPhysicalMaterial({color: 0xffffff, roughness: .05, transparent: true, opacity: .32, side: T.DoubleSide, clearcoat: 1});
    G.add(new T.Mesh(Props.lathe(prof, 20), gm));
    const vol = Object.values(gl.items).reduce((a, b) => a + b, 0), cap = this.m.GLASS[gl.type][1];
    if (vol > 0){ const col = new T.Color(0, 0, 0); let tot = 0; for (const [k, v] of Object.entries(gl.items)){ col.add(new T.Color(this.m.ING[k][1]).multiplyScalar(v)); tot += v; } col.multiplyScalar(1/tot);
      const f = Math.min(1, vol/cap), coupe = gl.type === "coupe", h = coupe ? .035*f : (prof[3][1] - .01)*f, r = coupe ? .03 + .025*f : prof[1][0]*.94;
      const liq = new T.Mesh(coupe ? new T.CylinderGeometry(r, .012, h, 16) : new T.CylinderGeometry(r, r, h, 16), new T.MeshStandardMaterial({color: col, roughness: .1, transparent: true, opacity: .78})); liq.position.y = (coupe ? .1 : .006) + h/2; G.add(liq); }
    if (gl.ice) for (let i = 0; i < (gl.type === "highball" ? 5 : 3); i++){ const c = new T.Mesh(new T.BoxGeometry(.022, .022, .022), new T.MeshPhysicalMaterial({color: 0xeaf6ff, roughness: .1, transparent: true, opacity: .55})); c.position.set(Math.sin(i*2.1)*.014, .02 + i*.022, Math.cos(i*2.1)*.014); c.rotation.set(i, i*.7, 0); G.add(c); }
    if (gl.garnish){ const g = new T.Mesh(new T.SphereGeometry(.014, 8, 6), new T.MeshStandardMaterial({color: {lime: 0x6ac43a, mint: 0x2e9a3a, orange: 0xff8a1a, cherry: 0xc8102e}[gl.garnish]})); g.position.set(.03, (prof[prof.length - 1][1]) + .005, 0); G.add(g); }
  },
  pourSync(){ if (!this.pourT) return; const want = Math.min(12, (performance.now() - this.pourT)/1000), add = want - (this.poured || 0); if (add > 0){ this.poured = want; this.pour(this.pouring, add); } },
  pour(id, oz){ const gl = this.glass; if (!gl){ if (!this._ng){ this._ng = 1; this.m.say("Pick a glass first.", true); setTimeout(() => this._ng = 0, 1500); } return; } gl.items[id] = Math.min(12, (gl.items[id] || 0) + oz); this._dirty = true; },
  // flair: flip a bottle for the crowd. One flip per order, for tips. Drop it and it smashes.
  startFlair(){ const m = this.m, o = this.orders[this.sel]; if (!o){ m.say("Flair is for an audience: wait for a guest to order.", true); return; } if (o.flaired){ m.say("You already showed off for this guest.", true); return; } this.flair = {t: 0, pos: 0, zc: .25 + Math.random()*.5, sp: .7 + Math.random()*.5}; o.flaired = true; },
  catchFlair(){ const F = this.flair; if (!F) return; this.flair = null; const ok = Math.abs(F.pos - F.zc) < .09; this.flairHit(ok); },
  flairHit(ok){ const m = this.m; if (ok){ this.flairCombo = (this.flairCombo || 0) + 1; const tip = 2 + Math.min(6, this.flairCombo*2); m.shift.earn += tip; m.say(`🤹 Flair! The bar goes wild. +${m.money(tip)}`); m.emoji("🤩", new THREE.Vector3(-7.4, 2.2, -6)); }
    else { this.flairCombo = 0; m.shift.earn = Math.max(0, m.shift.earn - 6); m.say("💥 Smashed a bottle! -$6 from your tips.", true); m.shift.log.push("Broke a bottle doing flair"); try{ Lounge.burst(new THREE.Vector3(-8.9, .1, -6), 10, "foam"); }catch(e){} } },
  serve(){
    const m = this.m, o = this.orders[this.sel], gl = this.glass;
    if (!o){ m.say("No order selected.", true); return; } if (!gl){ m.say("Make the drink first.", true); return; }
    if (o.drunk && !o.rec.na){ m.strike("You served someone who was already drunk. Cut them off next time."); this.finish(o, 10); return; }
    if (o.young && !o.rec.na && (!o.checked || o.age < 21)){ m.strike(o.checked ? "That guest is under 21. Never serve them alcohol." : "You didn't check the ID of a guest who looked young."); m.shift.log.push("Served alcohol without a proper ID check"); this.finish(o, 0); return; }
    const r = o.rec; let sc = 100, notes = [];
    if (gl.type !== r.glass){ sc -= 25; notes.push("wrong glass"); }
    if (!!gl.ice !== !!r.ice){ sc -= 10; notes.push(r.ice ? "no ice" : "it shouldn't have ice"); }
    for (const [k, v] of Object.entries(r.items)){ const d = Math.abs((gl.items[k] || 0) - v); if (d > .26){ sc -= Math.min(30, d*25); notes.push(`${m.ING[k][0]} ${d > v*.5 && !(gl.items[k] > 0) ? "missing" : "off by " + d.toFixed(1) + " oz"}`); } }
    for (const k of Object.keys(gl.items)) if (!(k in r.items) && gl.items[k] > .1){ sc -= 20; notes.push(`no ${m.ING[k][0]} in this one`); }
    if (r.method !== "build" && !gl.method[r.method]){ sc -= 15; notes.push(`it should be ${r.method === "shake" ? "shaken" : r.method === "stir" ? "stirred" : "muddled"}`); }
    if (gl.garnish !== r.g){ sc -= 10; notes.push(gl.garnish ? "wrong garnish" : "no garnish"); }
    sc = Math.max(0, Math.round(sc)); const speed = Math.max(0, 1 - o.t/o.patience); let tip = Math.round((2 + 6*(sc/100))*(.5 + speed)*(1 + (m.shift.lv - 1)*.1));
    this.streak = sc >= 85 ? (this.streak || 0) + 1 : 0; const mult = 1 + Math.min(4, Math.max(0, this.streak - 1))*.25; tip = Math.round(tip*mult); this.bestStreak = Math.max(this.bestStreak || 0, this.streak);
    if (mult > 1) m.shift.log.push(`🔥 ${this.streak} perfect drinks in a row: tips ×${mult}`);
    m.score(sc, sc >= 40 ? tip : 0, sc >= 90 ? `Perfect ${r.n}! +${m.money(tip)} tip${mult > 1 ? ` (🔥 ×${mult} streak)` : ""}` : sc >= 40 ? `${r.n} served (${sc}%): ${notes.slice(0, 2).join(", ")}. +${m.money(tip)}` : `Sent back: ${notes.slice(0, 3).join(", ")}`);
    if (sc < 40) m.strike("The guest sent the drink back.");
    m.shift.log.push(`${r.n}: ${sc}%${notes.length ? " (" + notes.slice(0, 2).join(", ") + ")" : ""}`);
    this.served++; this.finish(o, sc);
  },
  finish(o, sc){ const m = this.m; if (o.guest){ m.bubble(o.guest, null); m.emoji(sc >= 75 ? "😄" : sc >= 40 ? "🙂" : "😠", m.headOf(o.guest).add(new THREE.Vector3(0, .35, 0))); }
    this.orders = this.orders.filter(x => x !== o); this.sel = 0; this.newGlass(null); },
  refuse(){ const m = this.m, o = this.orders[this.sel]; if (!o) return;
    if (o.young && o.checked && o.age < 21 && !o.rec.na){ this.refused++; m.score(100, 4, "Good call. Under 21: no alcohol. You offered a mocktail instead."); }
    else if (o.drunk){ this.cut++; m.score(100, 3, "Good call. You cut them off and offered water."); }
    else { m.strike("You refused a guest who was fine to serve."); m.score(20, 0); }
    this.finish(o, 80); },
  update(dt){
    const m = this.m, s = m.shift, L = Lounge, T = THREE;
    if (!s.train){ if (s.t > 150 + s.lv*10) return m.endGame("Last call! Your shift is over."); this.spawnT -= dt; if (this.spawnT <= 0 && this.orders.length < Math.min(3, 1 + Math.floor(s.lv/3))){ this.newOrder(); this.spawnT = Math.max(8, 18 - s.lv); } }
    else if (this.queue && this.queue.length && !this.orders.length && (this.ti || 0) >= [0, 8, 10][3 - this.queue.length]) this.newOrder(this.queue.shift());
    for (const o of this.orders){ o.t += dt; if (!s.train && o.t > o.patience){ m.strike(`${o.rec.n}: the guest got tired of waiting and left.`); this.finish(o, 0); break; } }
    if (this.pouring) this.pourSync(); else this.pourT = 0;
    if (this.flair){ const F = this.flair; F.t += dt; F.pos = (Math.sin(F.t*Math.PI*2*F.sp - Math.PI/2) + 1)/2; if (F.t > 4){ this.flair = null; this.flairHit(false); } }
    // VR flair and breakage: toss a bottle up and catch it again for tips; let one hit the floor and it smashes
    for (const b of this.bottles){ const gd = b.userData.grab, u = b.userData; if (!gd || !b.visible) continue;
      if (gd.held){ if (u.toss && performance.now() - u.toss < 2500 && !u.tossLanded){ const o = this.orders[this.sel]; if (o && !o.flaired){ o.flaired = true; this.flairHit(true); } else m.say("🤹 Nice catch!"); } u.toss = 0; u.tossLanded = false; u.wasHeldB = true; continue; }
      if (u.wasHeldB){ u.wasHeldB = false; if (gd.vel.y > 1.3) u.toss = performance.now(); }
      if (gd.resting) u.tossLanded = true;
      if (!gd.resting && b.getWorldPosition(new T.Vector3()).y < .35){ b.visible = false; m.shift.earn = Math.max(0, m.shift.earn - 6); m.say("💥 Bottle smashed on the floor! -$6", true); try{ L.burst(b.getWorldPosition(new T.Vector3()), 10, "foam"); }catch(e){}
        setTimeout(() => { try{ gd.vel.set(0, 0, 0); gd.spin.set(0, 0, 0); b.position.copy(gd.home); b.quaternion.copy(gd.homeQ); gd.resting = true; b.visible = true; }catch(e){} }, 3000); } }
    // VR: tip a held bottle over the glass to pour; drop a garnish into the glass
    this.stream.visible = false;
    for (const b of this.bottles){ const gd = b.userData.grab; if (!gd || !gd.held || !this.glass) continue;
      b.updateMatrixWorld(true); const up = new T.Vector3(0, 1, 0).transformDirection(b.matrixWorld);
      if (up.y < -.25){ const mouth = new T.Vector3(0, .31, 0).applyMatrix4(b.matrixWorld), gp = this.glassG.getWorldPosition(new T.Vector3());
        if (Math.hypot(mouth.x - gp.x, mouth.z - gp.z) < .09 && mouth.y > gp.y && mouth.y - gp.y < .6){ const rate = Math.min(1.4, (-up.y + .25)*1.2); this.pour(b.userData.ing, dt*rate);
          this.stream.visible = true; this.stream.material.color.set(m.ING[b.userData.ing][1]); const len = mouth.y - gp.y - .05; this.stream.scale.y = Math.max(.01, len); this.stream.position.set(gp.x + (mouth.x - gp.x)*.5, gp.y + .05 + len/2, gp.z + (mouth.z - gp.z)*.5); this.root.worldToLocal(this.stream.position);
          if (gd.held) L.haptic(gd.held, .12, 20); } } }
    for (const o of this.garn){ const gd = o.userData.grab; if (!gd) continue;
      if (gd.held){ o.userData.wasHeld = true; continue; }
      if (o.userData.wasHeld){ o.userData.wasHeld = false; const gp = this.glassG.getWorldPosition(new T.Vector3()), op = o.getWorldPosition(new T.Vector3());
        if (this.glass && Math.hypot(op.x - gp.x, op.z - gp.z) < .12 && op.y < gp.y + .3){ this.glass.garnish = o.userData.garnish; this._dirty = true; m.say("Garnish in ✓"); }
        setTimeout(() => { try{ L.release(o); o.position.copy(gd.home); o.quaternion.copy(gd.homeQ); gd.vel.set(0, 0, 0); gd.resting = true; }catch(e){} }, 600); } }
    if (this._dirty){ this._dirty = false; this.redrawGlass(); }
    m.tutTick(this);
  },
  key(k, down){ return false; },
  draw(m){
    const x = m.x, W = m.W, s = m.shift; let Y = m.tutDraw(this, 82);
    if (!s.train) m.text(`⏱ ${Math.max(0, Math.ceil(150 + s.lv*10 - s.t))}s   💵 tips ${m.money(s.earn)}   ❌ ${s.strikes}/${s.maxStrikes}`, 28, Y + 20, 22, "#ffd87a", 700), Y += 36;
    // order tickets
    this.orders.forEach((o, i) => { const bw = 230; m.btn("o" + i, 28 + i*(bw + 10), Y, bw, 64, `${o.drunk ? "🥴" : o.young ? "🧑" : "🍸"} ${o.rec.n}`, () => { this.sel = i; }, {on: i === this.sel, size: 21, left: true, sub: s.train ? "" : `waiting ${Math.round(o.t)}s`}); });
    if (!this.orders.length) m.text("Waiting for an order…", 28, Y + 38, 22, "rgba(255,255,255,.6)");
    Y += 76;
    const o = this.orders[this.sel], gl = this.glass, colR = 650;
    // recipe card
    if (o){ const r = o.rec; m.rr(x, colR, Y, W - colR - 24, 300, 16); x.fillStyle = "rgba(255,255,255,.05)"; x.fill();
      m.text(r.n, colR + 16, Y + 32, 26, "#fff", 800, "left", W - colR - 50);
      let yy = Y + 64; const line = t => { m.text(t, colR + 16, yy, 19, "rgba(255,255,255,.8)", 500, "left", W - colR - 50); yy += 27; };
      line(`🥃 ${m.GLASS[r.glass][0]} glass${r.ice ? ", ice" : ", no ice"}`); for (const [k, v] of Object.entries(r.items)) line(`• ${v} oz ${m.ING[k][0]}`); line(`↻ ${r.method === "build" ? "Build (pour in the glass)" : r.method === "shake" ? "Shake" : r.method === "stir" ? "Stir" : "Muddle the mint first"}`); line(`✿ ${m.GARNISH[r.g]}`);
      if (o.young && !r.na) m.btn("id", colR + 14, Y + 238, 150, 50, o.checked ? `🪪 Age ${o.age}` : "🪪 Check ID", () => { o.checked = true; m.say(o.age < 21 ? `ID says ${o.age}. Under 21!` : `ID says ${o.age}. Good to serve.`, o.age < 21); }, {size: 19, on: o.checked});
      m.btn("ref", colR + 172, Y + 238, W - colR - 210, 50, o.drunk ? "🚫 Cut off" : "⛔ Refuse", () => this.refuse(), {size: 19}); }
    // glass, ice, method, garnish
    const gx = 28; m.text("GLASS", gx, Y + 18, 15, "#ffc21a", 800);
    Object.entries(m.GLASS).forEach(([k, [n]], i) => m.btn("g" + k, gx + i*150, Y + 28, 142, 46, (k === "coupe" ? "🍸 " : k === "mug" ? "🟫 " : "🥃 ") + n, () => this.newGlass(k), {size: 18, on: gl && gl.type === k}));
    const acts = [["ice", "🧊 Ice", () => { if (gl){ gl.ice = !gl.ice; this._dirty = true; } else m.say("Pick a glass first.", true); }, gl && gl.ice], ["shake", "🔁 Shake", () => { if (gl){ gl.method.shake = true; m.say("Shaken ✓"); } }, gl && gl.method.shake], ["stir", "🥄 Stir", () => { if (gl){ gl.method.stir = true; m.say("Stirred ✓"); } }, gl && gl.method.stir], ["muddle", "🌿 Muddle", () => { if (gl){ gl.method.muddle = true; m.say("Muddled ✓"); } }, gl && gl.method.muddle]];
    acts.forEach(([id, l, fn, on], i) => m.btn("a" + id, gx + i*150, Y + 82, 142, 46, l, fn, {size: 18, on}));
    Object.entries(m.GARNISH).forEach(([k, l], i) => m.btn("gr" + k, gx + i*150, Y + 136, 142, 46, l, () => { if (gl){ gl.garnish = k; this._dirty = true; } else m.say("Pick a glass first.", true); }, {size: 17, on: gl && gl.garnish === k}));
    // bottles: hold to pour
    m.text("HOLD TO POUR", gx, Y + 206, 15, "#ffc21a", 800);
    Object.entries(m.ING).forEach(([k, [n]], i) => { const bx = gx + (i % 5)*120, by = Y + 216 + Math.floor(i/5)*52, amt = gl && gl.items[k];
      m.btn("p" + k, bx, by, 114, 46, amt ? `${n.split(" ")[0]} ${amt.toFixed(1)}` : n.split(" ")[0], () => {}, {size: 16, on: this.pouring === k, hold: on => { if (!on && this.pouring === k) this.pourSync(); this.pouring = on ? k : null; this.pourT = on ? performance.now() : 0; this.poured = 0; }}); });
    m.btn("dump", gx, Y + 380, 140, 50, "🗑 Dump", () => { if (gl) this.newGlass(gl.type); }, {size: 19});
    m.btn("serve", gx + 150, Y + 380, 200, 50, "✅ Serve", () => this.serve(), {primary: true, size: 22});
    if (!m.shift.train) m.btn("flair", gx + 360, Y + 380, 230, 50, this.flair ? "🤚 CATCH!" : "🤹 Flair flip", () => this.flair ? this.catchFlair() : this.startFlair(), {size: 20, primary: !!this.flair});
    if (gl){ const tot = Object.values(gl.items).reduce((a, b) => a + b, 0); m.text(`In the glass: ${tot.toFixed(1)} oz${gl.ice ? " · ice" : ""}${gl.garnish ? " · " + gl.garnish : ""}${this.streak > 1 ? `   🔥 ${this.streak} streak` : ""}`, gx, Y + 452, 18, "rgba(255,255,255,.7)", 500, "left", 600); }
    if (this.flair){ const F = this.flair, bx = gx, bw = 590, by = Y + 330; m.rr(x, bx - 8, by - 40, bw + 16, 84, 14); x.fillStyle = "rgba(20,12,6,.94)"; x.fill(); m.text("🤹 Bottle's in the air! Tap CATCH when it's over the green.", bx + 6, by - 22, 17, "#ffd87a", 700, "left", bw); m.bar(bx, by, bw, 28, 0); m.rr(x, bx + bw*(F.zc - .09), by, bw*.18, 28, 8); x.fillStyle = "rgba(58,208,122,.65)"; x.fill();
      x.save(); x.translate(bx + bw*F.pos, by + 14); x.rotate(F.t*9); x.font = "34px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🍾", 0, 0); x.restore(); }
  },
  end(){ const m = this.m; for (const o of this.orders) if (o.guest) m.bubble(o.guest, null); this.pouring = null; m.dropProps(this.bottles.concat(this.garn)); m.dropProps(this.props); }
};

/* ================= 🎧 DJ: beatmatch, drop on the phrase, crossfade, read the crowd ================= */
Mogul.TRACKS = {house: ["Midnight Groove", "Velvet Rope", "Afterglow", "Saturday Feeling"], techno: ["Warehouse 9", "Steel Pulse", "Night Shift"], afrobeats: ["Lagos Nights", "Gbese Wave", "Owambe"], amapiano: ["Log Drum Love", "Pretoria Sun", "Yanos"], reggaeton: ["Dembow Dreams", "Perreo Lento", "Calle 8"], hiphop: ["Block Party", "Boom Bap Royalty", "Downtown Cypher"]};
Mogul.BPM = {house: 124, techno: 128, afrobeats: 108, amapiano: 113, reggaeton: 96, hiphop: 92};
Mogul.GAMES.dj = {
  panelSide: .65,
  howTo: ["Deck A is playing. Load the next song on Deck B from the crate. Pick what the crowd asks for.", "Match the tempo: nudge Deck B's pitch until both BPMs read the same.", "Wait for the phrase counter to come round to 1, then press ▶ Play B.", "If the kicks sound doubled, nudge B ◀ ▶ until the phase light goes green.", "Slide the crossfader over to B before Deck A runs out. Silence on the dance floor is a strike.", "Pro moves score extra: kill Deck B's LOW before you bring it in (a bass swap), and sweep the LPF / HPF filter during the blend. Muddy double bass costs points.", "🔗 Sync locks tempo and beats for you, but mixing by ear pays more. 🤚 Hold Scratch to cut on the beat and hype the crowd."],
  vrTip: "You're at the booth on stage. Point at the panel and pull the trigger to work the decks.",
  start(s){
    const m = this.m;
    try{ Lounge.goToBooth(); }catch(e){ m.moveMe(0, -12.35, Math.PI); }
    this.wasPlaying = S.playing || S.loading; if (this.wasPlaying) togglePlay();
    const ac = this.ac = (Lounge.listener && Lounge.listener.context) || new (window.AudioContext || window.webkitAudioContext)(); try{ ac.resume(); }catch(e){}
    this.master = ac.createGain(); this.master.gain.value = .8; this.master.connect(ac.destination);
    const nb = ac.createBuffer(1, ac.sampleRate*.5, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; this.noise = nb;
    this.decks = [this.deck("house", 124, true), this.deck(null, 0, false)];
    this.xf = 0; this.energy = .6; this.transitions = 0; this.goal = s.train ? 1 : 3 + Math.floor(s.lv/3);
    this.request = null; this.crate = []; this.newCrate();
    this.decks[0].start = ac.currentTime + .1; this.decks[0].playing = true; this.decks[0].next = this.decks[0].start; this.decks[0].step = 0; this.decks[0].left = 90 + (s.train ? 60 : 0);
    this.timer = setInterval(() => this.schedule(), 25);
    if (s.train) this.steps = [
      {say: "Deck A is playing a house song. The crowd wants Afrobeats next: tap the Afrobeats track in the crate to load Deck B.", done: g => g.decks[1].genre},
      {say: "Match the tempo: tap Pitch − / + on Deck B until its BPM matches Deck A (within 0.2).", done: g => Math.abs(g.eff(1) - g.eff(0)) < .21},
      {say: "Watch the phrase counter. When it shows 1, tap ▶ Play B.", done: g => g.decks[1].playing},
      {say: "Phase: if the light is red, tap Nudge ◀ or ▶ until it turns green.", done: g => g.decks[1].playing && Math.abs(g.phaseMs()) < 30},
      {say: "Bass swap: tap LOW on Deck B to kill its bass, so two kick drums don't fight and turn to mud.", done: g => g.decks[1].kill.lo},
      {say: "Slide the crossfader to B, a step at a time (tap B ▶ a few times).", done: g => g.transitions >= 1 || g.xf >= .99},
      {say: "Your new track is on Deck A now with its bass still off. Tap LOW on Deck A to slam the bass back in!", done: g => g.transitions >= 1 && !g.decks[0].kill.lo},
      {say: "Filter sweep: hold ◀ LPF on Deck A for a second, then tap FILTER to snap it open again.", done: g => g.didSweep && g.decks[0].color === 0}
    ];
  },
  deck(genre, bpm, isA){ const ac = this.ac, g = ac.createGain(); g.gain.value = isA ? 1 : 0; g.connect(this.master);
    // input -> low / mid / high EQ -> colour filter -> channel fader
    const inp = ac.createGain(), lo = ac.createBiquadFilter(), mid = ac.createBiquadFilter(), hi = ac.createBiquadFilter(), col = ac.createBiquadFilter();
    lo.type = "lowshelf"; lo.frequency.value = 220; mid.type = "peaking"; mid.frequency.value = 1100; mid.Q.value = .8; hi.type = "highshelf"; hi.frequency.value = 4200; col.type = "lowpass"; col.frequency.value = 20000; col.Q.value = 1.2;
    inp.connect(lo); lo.connect(mid); mid.connect(hi); hi.connect(col); col.connect(g);
    return {genre, base: bpm, pitch: 0, gain: g, inp, eqN: {lo, mid, hi, col}, kill: {lo: false, mid: false, hi: false}, color: 0, playing: false, start: 0, next: 0, step: 0, left: 75, name: genre ? this.m.TRACKS[genre][0] : ""}; },
  setKill(d, band, on){ d.kill[band] = on; d.eqN[band].gain.setTargetAtTime(on ? -40 : 0, this.ac.currentTime, .015); if (band === "lo" && on && this.decks[1] === d && !this.decks[0].kill.lo) this.usedSwap = true; },
  setColor(d, v){ d.color = Math.max(-1, Math.min(1, v)); if (Math.abs(d.color) < .04) d.color = 0; const f = d.eqN.col, t = this.ac.currentTime;
    if (d.color < 0){ f.type = "lowpass"; f.frequency.setTargetAtTime(20000*Math.pow(.008, -d.color), t, .02); } else if (d.color > 0){ f.type = "highpass"; f.frequency.setTargetAtTime(20*Math.pow(120, d.color), t, .02); } else { f.type = "lowpass"; f.frequency.setTargetAtTime(20000, t, .02); }
    if (Math.abs(d.color) > .35){ this.didSweep = true; if (this.decks[1].playing) this.usedFilter = true; } },
  resetEQ(d){ for (const b of ["lo", "mid", "hi"]) this.setKill(d, b, false); this.setColor(d, 0); },
  sync(){ const A = this.decks[0], B = this.decks[1], m = this.m; if (!B.genre){ m.say("Load a track on Deck B first.", true); return; }
    B.pitch = Math.round((this.eff(0)/B.base - 1)*1000)/10; if (B.playing){ const ms = this.phaseMs(); this.nudge(ms); } this.synced = true; m.say("🔗 Synced. Tempo and beats locked (matching by ear pays more).", false); },
  scratchHit(time, d){ const ac = this.ac, src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = this.noise; bp.type = "bandpass"; bp.Q.value = 6;
    const up = (this.scrN = (this.scrN || 0) + 1) % 2; bp.frequency.setValueAtTime(up ? 400 : 2400, time); bp.frequency.exponentialRampToValueAtTime(up ? 2400 : 400, time + .09);
    g.gain.setValueAtTime(.0001, time); g.gain.exponentialRampToValueAtTime(.55, time + .015); g.gain.exponentialRampToValueAtTime(.001, time + .11); src.connect(bp); bp.connect(g); g.connect(d.inp); src.start(time); src.stop(time + .13); },
  eff(i){ const d = this.decks[i]; return d.base*(1 + d.pitch/100); },
  newCrate(){ const m = this.m, cur = this.decks[0].genre, near = Object.keys(m.BPM).filter(k => k !== cur && Math.abs(m.BPM[k] - this.eff(0))/this.eff(0) < .2);
    this.request = (this.m.shift.train ? "afrobeats" : near[Math.floor(Math.random()*near.length)]) || "house";
    const pick = [this.request, ...near.filter(k => k !== this.request).sort(() => Math.random() - .5).slice(0, 2)];
    this.crate = pick.sort(() => Math.random() - .5).map(k => ({genre: k, bpm: Math.round(m.BPM[k] + (Math.random()*6 - 3)), name: m.TRACKS[k][Math.floor(Math.random()*m.TRACKS[k].length)]})); },
  load(t){ const d = this.decks[1]; if (d.playing){ this.m.say("Deck B is already playing.", true); return; } Object.assign(d, {genre: t.genre, base: t.bpm, pitch: 0, name: t.name, left: 80}); this.picked = t.genre === this.request; },
  // the beat engine: drums and bass for each deck, scheduled a little ahead
  hit(time, kind, gainNode, f = 1){
    const ac = this.ac;
    if (kind === "kick"){ const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150*f, time); o.frequency.exponentialRampToValueAtTime(42, time + .12); g.gain.setValueAtTime(1, time); g.gain.exponentialRampToValueAtTime(.001, time + .32); o.connect(g); g.connect(gainNode); o.start(time); o.stop(time + .35); }
    else if (kind === "bass" || kind === "log"){ const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter(); o.type = kind === "log" ? "sine" : "sawtooth"; o.frequency.setValueAtTime(f, time); if (kind === "log") o.frequency.exponentialRampToValueAtTime(f*.7, time + .2); lp.frequency.value = 380; g.gain.setValueAtTime(.32, time); g.gain.exponentialRampToValueAtTime(.001, time + (kind === "log" ? .35 : .18)); o.connect(lp); lp.connect(g); g.connect(gainNode); o.start(time); o.stop(time + .4); }
    else { const src = ac.createBufferSource(), g = ac.createGain(), flt = ac.createBiquadFilter(); src.buffer = this.noise; flt.type = kind === "hat" ? "highpass" : "bandpass"; flt.frequency.value = kind === "hat" ? 7000 : 1800; const len = kind === "hat" ? .04 : kind === "shaker" ? .03 : .15;
      g.gain.setValueAtTime(kind === "hat" ? .18 : kind === "shaker" ? .1 : .4, time); g.gain.exponentialRampToValueAtTime(.001, time + len); src.connect(flt); flt.connect(g); g.connect(gainNode); src.start(time); src.stop(time + len + .02); }
  },
  PAT: {house: {kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], bass: [2, 6, 10, 14]}, techno: {kick: [0, 4, 8, 12], clap: [4, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], bass: [1, 3, 5, 7, 9, 11, 13, 15]},
    afrobeats: {kick: [0, 3, 8, 11], clap: [4, 12], shaker: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], bass: [0, 7, 10]}, amapiano: {kick: [0, 8], clap: [4, 12], shaker: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], log: [0, 3, 6, 10]},
    reggaeton: {kick: [0, 4, 8, 12], clap: [3, 6, 11, 14], hat: [2, 10], bass: [0, 8]}, hiphop: {kick: [0, 7, 10], clap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [0, 10]}},
  schedule(){
    const ac = this.ac; if (!ac) return; const ahead = ac.currentTime + .12;
    this.decks.forEach((d, i) => { if (!d.playing || !d.genre) return; const P = this.PAT[d.genre], sixteenth = 60/this.eff(i)/4, root = {house: 55, techno: 49, afrobeats: 61.7, amapiano: 46, reggaeton: 58, hiphop: 52}[d.genre];
      while (d.next < ahead){ const st = d.step % 16; for (const [k, arr] of Object.entries(P)) if (arr.includes(st)) this.hit(d.next, k === "clap" ? "clap" : k, d.inp, k === "bass" || k === "log" ? root*(st > 8 ? 1.5 : 1) : 1); if (this.scratch === d && st % 2 === 0) this.scratchHit(d.next, d); d.step++; d.next += sixteenth; } });
  },
  beatPos(i){ const d = this.decks[i]; if (!d.playing) return 0; return (this.ac.currentTime - d.start)/(60/this.eff(i)); },
  phaseMs(){ if (!this.decks[1].playing) return 999; const a = this.beatPos(0), b = this.beatPos(1), diff = ((b - a) % 1 + 1.5) % 1 - .5; return diff*60000/this.eff(0); },
  playB(){ const d = this.decks[1], m = this.m; if (!d.genre){ m.say("Load a track on Deck B from the crate first.", true); return; } if (d.playing) return;
    const now = this.ac.currentTime + .02; d.start = now; d.next = now; d.step = 0; d.playing = true;
    const a = this.beatPos(0) + .02*this.eff(0)/60, phrase = a % 16; this.dropScore = phrase < .5 || phrase > 15.5 ? 100 : phrase < 1.5 || phrase > 14.5 ? 70 : Math.abs((a % 4) - 0) < .3 || (a % 4) > 3.7 ? 45 : 20;
    m.say(this.dropScore >= 70 ? "Dropped right on the phrase!" : this.dropScore >= 45 ? "On the bar, but not the phrase. Close!" : "Off the bar. Wait for the counter to hit 1.", this.dropScore < 45); },
  nudge(ms){ const d = this.decks[1]; if (!d.playing) return; d.start += ms/1000; d.next += ms/1000; },
  setXF(v){ this.xf = Math.max(0, Math.min(1, v)); this.decks[0].gain.gain.setTargetAtTime(Math.cos(this.xf*Math.PI/2), this.ac.currentTime, .03); this.decks[1].gain.gain.setTargetAtTime(Math.sin(this.xf*Math.PI/2), this.ac.currentTime, .03);
    if (this.xf >= .99 && this.decks[1].playing) this.completeMix(); },
  completeMix(){
    const m = this.m, tempo = Math.max(0, 100 - Math.abs(this.eff(1) - this.eff(0))*40), phase = Math.max(0, 100 - Math.max(0, Math.abs(this.phaseMs()) - 15)*1.2), genre = this.picked ? 100 : 40;
    let sc = Math.round(tempo*.3 + phase*.3 + (this.dropScore || 20)*.2 + genre*.2); const fx = [];
    if (this.usedFilter){ sc += 6; fx.push("filter sweep +6"); } if (this.usedSwap && (this.mud || 0) < 2){ sc += 8; fx.push("clean bass swap +8"); } else if ((this.mud || 0) > 5){ sc -= 10; fx.push("muddy bass -10"); } if (this.synced){ sc -= 10; fx.push("used Sync -10"); } sc = Math.max(0, Math.min(100, sc));
    this.energy = Math.max(.1, Math.min(1, this.energy + (sc - 55)/120));
    m.score(sc, Math.round(sc/8), sc >= 85 ? "🔥 Seamless mix! The floor is going crazy." : sc >= 60 ? "Smooth transition." : "Rough mix. The crowd noticed.");
    m.shift.log.push(`Mix ${this.transitions + 1}: ${sc}% (tempo ${Math.round(tempo)}, phase ${Math.round(phase)}, ${this.picked ? "right genre" : "not what they asked for"}${fx.length ? ", " + fx.join(", ") : ""})`); this.usedFilter = false; this.usedSwap = false; this.mud = 0; this.synced = false;
    if (sc >= 85) try{ Lounge.burst(new THREE.Vector3(0, 2.5, -8), 20); }catch(e){}
    const A = this.decks[0]; A.playing = false; A.gain.gain.value = 0; this.resetEQ(A); if (this.scratch === A) this.scratch = null;
    this.decks = [this.decks[1], A]; Object.assign(A, {genre: null, name: "", pitch: 0, base: 0}); this.xf = 0; this.decks[0].gain.gain.setTargetAtTime(1, this.ac.currentTime, .02);
    this.transitions++; this.decks[0].left = 70 + Math.random()*20;
    if (this.transitions >= this.goal && !(this.m.shift.train && (this.ti || 0) < this.steps.length)) setTimeout(() => { if (this.m.game === this) this.m.endGame("Your set is done. Great night!"); }, 1500); else this.newCrate();
  },
  update(dt){
    const m = this.m, A = this.decks[0];
    if (A.playing){ A.left -= dt; if (A.left <= 0 && !m.shift.train){ if (this.xf < .5){ m.strike("Dead air! Deck A ran out before you mixed."); this.energy = Math.max(.1, this.energy - .3); } A.left = 30; } }
    this.energy = Math.max(.05, this.energy - dt*.004);
    if (this.sweep){ const d = this.sweep.d; this.setColor(d, d.color + this.sweep.dir*dt*.7); }
    const B = this.decks[1]; if (A.playing && B.playing && this.xf > .2 && this.xf < .8 && !A.kill.lo && !B.kill.lo) this.mud = (this.mud || 0) + dt;
    if (this.scratch && this.scratch.playing){ this.scrT = (this.scrT || 0) + dt; if (this.scrT > 1.5){ this.scrT = 0; this.energy = Math.min(1, this.energy + .03); m.emoji("🤚", new THREE.Vector3((Math.random() - .5)*4, 2.4, -7)); } }
    if (Math.random() < dt*.3*this.energy) m.emoji(["🔥", "🙌", "💃", "🎶"][Math.floor(Math.random()*4)], new THREE.Vector3((Math.random() - .5)*8, 2.4, -6 + (Math.random() - .5)*5));
    try{ if (Lounge.dj) Lounge.dj.visible = false; }catch(e){}
    m.tutTick(this);
  },
  draw(m){
    const x = m.x, W = m.W, s = m.shift; let Y = m.tutDraw(this, 82);
    m.text(`🎚 Mix ${Math.min(this.transitions + 1, this.goal)}/${this.goal}   🙌 crowd`, 28, Y + 20, 22, "#ffd87a", 700); m.bar(330, Y + 8, 220, 18, this.energy, this.energy > .6 ? "#3ad07a" : this.energy > .3 ? "#ffc21a" : "#ff6a5a");
    if (!s.train) m.text(`❌ ${s.strikes}/${s.maxStrikes}`, 580, Y + 20, 22, "#ffd87a", 700);
    m.text(`📣 The crowd wants: ${this.request ? this.request.toUpperCase() : "—"}`, 690, Y + 20, 22, "#9fe8ff", 700, "left", 310); Y += 40;
    const deckBox = (i, X) => { const d = this.decks[i], on = d.playing && Math.floor(this.beatPos(i) % 1*4) === 0;
      m.rr(x, X, Y, 470, 262, 16); x.fillStyle = "rgba(255,255,255,.05)"; x.fill();
      m.text(`DECK ${i ? "B" : "A"}${d.playing ? " ▶" : ""}`, X + 16, Y + 30, 20, i ? "#ff8ad8" : "#7ad8ff", 800);
      x.beginPath(); x.arc(X + 440, Y + 24, 10, 0, 7); x.fillStyle = on ? (i ? "#ff8ad8" : "#7ad8ff") : "rgba(255,255,255,.15)"; x.fill();
      m.text(d.genre ? `${d.name} · ${d.genre}` : "Empty: load a track below", X + 16, Y + 62, 20, "#fff", 600, "left", 440);
      m.text(d.genre ? `${this.eff(i).toFixed(1)} BPM` : "", X + 16, Y + 100, 34, "#fff", 800);
      if (i === 0) m.text(d.playing ? `⏳ ${Math.max(0, Math.ceil(d.left))}s left` : "", X + 260, Y + 100, 22, d.left < 15 ? "#ff8a7a" : "rgba(255,255,255,.7)", 700);
      if (i === 1 && d.genre){ m.btn("pm", X + 16, Y + 122, 84, 52, "Pitch −", () => { d.pitch = Math.round((d.pitch - .2)*10)/10; }, {size: 17}); m.btn("pp", X + 108, Y + 122, 84, 52, "Pitch +", () => { d.pitch = Math.round((d.pitch + .2)*10)/10; }, {size: 17});
        m.btn("pm2", X + 200, Y + 122, 60, 52, "−−", () => { d.pitch = Math.round((d.pitch - 1)*10)/10; }, {size: 17}); m.btn("pp2", X + 268, Y + 122, 60, 52, "++", () => { d.pitch = Math.round((d.pitch + 1)*10)/10; }, {size: 17});
        m.btn("play", X + 340, Y + 122, 114, 52, d.playing ? "Playing" : "▶ Play B", () => this.playB(), {primary: !d.playing, size: 19});
        if (!s.train || (this.ti || 0) >= this.steps.length) m.btn("sync", X + 340, Y + 74, 114, 40, this.synced ? "🔗 Synced" : "🔗 Sync", () => this.sync(), {size: 17, on: this.synced}); }
      if (i === 0 && d.playing){ m.btn("scrA", X + 300, Y + 122, 154, 52, "🤚 Scratch", () => {}, {size: 18, on: this.scratch === d, hold: on => { this.scratch = on ? d : null; this.scrT = 0; }}); }
      // scrolling waveform: kick red, bass orange, snare/clap green, hats blue (a frequency colour map)
      if (d.genre){ const wx = X + 16, ww = 438, wy = Y + 184, wh = 26, P = this.PAT[d.genre], cur = d.playing ? this.beatPos(i)*4 : 0, per = ww/48;
        x.save(); m.rr(x, wx, wy, ww, wh, 6); x.fillStyle = "rgba(0,0,0,.35)"; x.fill(); x.clip();
        for (let k = Math.floor(cur) - 16; k < cur + 32; k++){ if (k < 0) continue; const st = ((k % 16) + 16) % 16, px = wx + ww/3 + (k - cur)*per;
          if (k % 64 === 0){ x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(px - 1, wy, 2, wh); } else if (k % 4 === 0){ x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(px, wy, 1, wh); }
          const bars = [[P.kick, "#ff4a4a", 1, "lo"], [P.bass || P.log, "#ff9a2a", .72, "lo"], [P.clap, "#3ad07a", .55, "mid"], [P.hat || P.shaker, "#5ab4ff", .3, "hi"]];
          for (const [arr, c, hgt, band] of bars){ if (!arr || !arr.includes(st)) continue; x.globalAlpha = d.kill[band] ? .15 : (k < cur ? .45 : .95); x.fillStyle = c; const h = wh*hgt*(band === "lo" && d.color > .3 ? 1 - d.color*.8 : band === "hi" && d.color < -.3 ? 1 + d.color*.8 : 1); x.fillRect(px, wy + (wh - h)/2, Math.max(2, per - 2), h); }
          x.globalAlpha = 1; }
        x.fillStyle = "#fff"; x.fillRect(wx + ww/3 - 1, wy - 2, 3, wh + 4); x.restore(); }
      // mixer strip: kill switches for low / mid / high, the colour filter, and its readout
      [["lo", "LOW"], ["mid", "MID"], ["hi", "HI"]].forEach(([b, l], j) => m.btn(`k${i}${b}`, X + 16 + j*70, Y + 218, 64, 38, d.kill[b] ? "✕ " + l : l, () => this.setKill(d, b, !d.kill[b]), {size: 15, on: d.kill[b], r: 10}));
      m.btn(`fl${i}`, X + 230, Y + 218, 70, 38, "◀ LPF", () => {}, {size: 15, r: 10, on: d.color < 0, hold: on => { this.sweep = on ? {d, dir: -1} : null; }});
      m.btn(`fh${i}`, X + 384, Y + 218, 70, 38, "HPF ▶", () => {}, {size: 15, r: 10, on: d.color > 0, hold: on => { this.sweep = on ? {d, dir: 1} : null; }});
      m.btn(`fc${i}`, X + 306, Y + 218, 72, 38, d.color === 0 ? "FILTER" : `${d.color < 0 ? "LP" : "HP"} ${Math.round(Math.abs(d.color)*100)}`, () => this.setColor(d, 0), {size: 14, r: 10}); };
    deckBox(0, 28); deckBox(1, 526); Y += 276;
    // phrase counter and phase meter
    const beat = this.beatPos(0), ph = Math.floor(beat % 16) + 1;
    m.text(`PHRASE ${ph}/16`, 28, Y + 24, 22, ph === 1 ? "#3ad07a" : "#fff", 800);
    for (let i = 0; i < 16; i++){ x.fillStyle = i < ph ? (i === 0 ? "#3ad07a" : "#ffc21a") : "rgba(255,255,255,.12)"; x.fillRect(220 + i*18, Y + 10, 14, 18); }
    const pm = this.phaseMs();
    if (this.decks[1].playing){ m.text(`PHASE ${pm > 0 ? "+" : ""}${Math.round(pm)} ms`, 540, Y + 24, 22, Math.abs(pm) < 30 ? "#3ad07a" : "#ff8a7a", 800);
      m.btn("nl", 760, Y, 110, 44, "◀ Nudge", () => this.nudge(-12), {size: 17}); m.btn("nr", 880, Y, 110, 44, "Nudge ▶", () => this.nudge(12), {size: 17}); }
    Y += 58;
    if (this.decks[1].playing){ // crossfader
    m.text("CROSSFADER", 28, Y + 26, 18, "#ffc21a", 800);
    m.btn("xa", 190, Y, 90, 50, "◀ A", () => this.setXF(this.xf - .2), {size: 19}); m.bar(296, Y + 16, 420, 18, this.xf, "#ff8ad8", "rgba(122,216,255,.35)"); m.btn("xb", 732, Y, 90, 50, "B ▶", () => this.setXF(this.xf + .2), {size: 19}); Y += 66; }
    else { // crate
    m.text("CRATE: load the next track onto Deck B", 28, Y + 20, 18, "#ffc21a", 800); Y += 32;
    this.crate.forEach((t, i) => m.btn("c" + i, 28 + i*328, Y, 318, 68, `${t.genre === this.request ? "📣 " : ""}${t.name}`, () => this.load(t), {left: true, size: 20, sub: `${t.genre} · ${t.bpm} BPM`, on: this.decks[1].name === t.name})); }
  },
  end(){ clearInterval(this.timer); try{ this.master.disconnect(); }catch(e){} if (this.wasPlaying && !S.playing) togglePlay(); try{ if (Lounge.dj) Lounge.dj.visible = true; }catch(e){} }
};
/* ---------- mini-game kit: choices, timing, balance, hold-to-pour, quick match, rhythm, camera flashes ---------- */
Object.assign(Mogul, {
  kit(g, k){ g.kit = Object.assign({t: 0, r: 0, sc: [], pos: 0, n: 0, v: 0}, k); const K = g.kit;
    if (K.type === "timing") K.zc = .2 + Math.random()*.6;
    if (K.type === "rhythm"){ K.notes = []; const beat = 60/(K.bpm || 100); for (let i = 0; i < (K.count || 12); i++) K.notes.push({t: 2 + i*beat*(K.every || 1), lane: Math.floor(Math.random()*4), hit: null}); }
    if (K.type === "dir") this.kitDir(K);
    this.draw(); },
  kitDir(K){ K.dir = ["L", "C", "R"][Math.floor(Math.random()*3)]; K.dt = 0; K.base = Lounge.headYaw();
    if (this.vr()){ const T = THREE, a = K.base + {L: .9, C: 0, R: -.9}[K.dir], h = Lounge.headPos(); if (!this.flashS){ this.flashS = new T.Sprite(new T.SpriteMaterial({map: Lounge.glowT, color: 0xffffff, transparent: true, depthWrite: false, blending: T.AdditiveBlending})); this.flashS.scale.setScalar(1.6); Lounge.scene.add(this.flashS); }
      this.flashS.position.set(h.x - Math.sin(a)*3, h.y + .2, h.z - Math.cos(a)*3); this.flashS.visible = true; this.flashS.material.opacity = 1; } },
  kitEnd(g, score){ const K = g.kit; g.kit = null; if (this.flashS) this.flashS.visible = false; try{ K.done && K.done(score); }catch(e){ console.warn(e); } this.draw(); },
  kitRound(g, s){ const K = g.kit; K.sc.push(Math.max(0, Math.min(100, s))); K.r++; const n = K.rounds && K.rounds.length || K.count || 3;
    if (K.r >= n){ const avg = K.sc.reduce((a, b) => a + b, 0)/K.sc.length; setTimeout(() => { if (g.kit === K) this.kitEnd(g, avg); }, K.type === "choice" ? 0 : 450); }
    else { if (K.type === "timing") K.zc = .2 + Math.random()*.6; if (K.type === "hold") K.v = 0; if (K.type === "dir") this.kitDir(K); K.rt = 0; } },
  kitUpdate(g, dt){
    const K = g.kit; if (!K) return; K.t += dt; K.rt = (K.rt || 0) + dt;
    if (K.type === "timing"){ K.pos = (Math.sin(K.t*Math.PI*2*(K.speed || .6)) + 1)/2; if (K.rt > 6) this.kitRound(g, 0); }
    else if (K.type === "balance"){ if (Math.random() < dt*(K.bumps || 1.2)) K.v += (Math.random() - .5)*(K.force || 2.2); K.v += (K.push || 0)*dt*3.2 + K.n*dt*.6; K.v *= Math.pow(.25, dt); K.n += K.v*dt;
      if (Math.abs(K.n) < .35) K.inT = (K.inT || 0) + dt; if (Math.abs(K.n) >= 1){ K.spills = (K.spills || 0) + 1; K.n = 0; K.v = 0; this.say(K.spillMsg || "Whoa! You spilled.", true); }
      if (K.t >= (K.dur || 10)) this.kitEnd(g, Math.max(0, (K.inT || 0)/(K.dur || 10)*100 - (K.spills || 0)*20)); }
    else if (K.type === "hold"){ if (K.holding){ const R = K.rounds[K.r]; K.v = Math.min(R.max || R.target*2, K.v + dt*(R.rate || 1)); } }
    else if (K.type === "match"){ if (K.rt > (K.time || 6)) this.kitRound(g, 0); }
    else if (K.type === "rhythm"){ for (const nt of K.notes) if (nt.hit === null && K.t > nt.t + .25){ nt.hit = false; } if (K.t > K.notes[K.notes.length - 1].t + .6){ const h = K.notes.filter(n => n.hit).length; this.kitEnd(g, h/K.notes.length*100); } }
    else if (K.type === "dir"){ K.dt += dt; if (this.flashS && this.flashS.visible) this.flashS.material.opacity = Math.max(0, 1 - K.dt);
      if (this.vr()){ let d = Lounge.headYaw() - K.base; d = Math.atan2(Math.sin(d), Math.cos(d)); const want = {L: .9, C: 0, R: -.9}[K.dir]; if (Math.abs(d - want) < .35 && K.dt > .15) this.kitRound(g, 100 - K.dt*40); }
      if (K.dt > (K.window || 1.4)) this.kitRound(g, 0); }
    else if (K.type === "choice" && K.time && K.picked === undefined && K.t > K.time){ K.picked = -1; this.say("Too slow!", true); setTimeout(() => { if (g.kit === K) this.kitEnd(g, 0); }, 900); }
  },
  kitDraw(g, Y){
    const K = g.kit; if (!K) return Y; const x = this.x, W = this.W;
    if (K.title) this.text(K.title, 28, Y + 34, 30, "#fff", 800, "left", W - 56);
    let y = K.text ? this.wrap(K.text, 28, Y + 74, 22, W - 56) : Y + 60;
    if (K.face) { this.face(K.face, W - 130, Y + 10, 90); }
    if (K.type === "info"){ this.btn("knext", 28, Math.max(y + 10, this.H - 160), 260, 62, K.btn || "Next ▶", () => this.kitEnd(g, null), {primary: true, size: 24}); }
    else if (K.type === "choice"){ K.options.forEach((o, i) => { const by = y + 10 + i*74; const picked = K.picked === i;
        this.btn("k" + i, 28, by, W - 56, 64, o.t, () => { if (K.picked !== undefined) return; K.picked = i; this.say(o.fb || (o.s >= 70 ? "Good call." : "Hmm, not the best move."), o.s < 50); setTimeout(() => { if (g.kit === K) this.kitEnd(g, o.s); }, 1500); }, {left: true, size: 21, on: picked}); });
      if (K.time && K.picked === undefined) this.bar(28, this.H - 110, W - 56, 14, 1 - K.t/K.time, "#ff8a7a"); }
    else if (K.type === "timing"){ const bx = 60, bw = W - 120, by = y + 30; this.bar(bx, by, bw, 34, 0); const zx = bx + bw*(K.zc - (K.zw || .16)/2);
      this.rr(x, zx, by, bw*(K.zw || .16), 34, 10); x.fillStyle = "rgba(58,208,122,.6)"; x.fill(); x.fillStyle = "#fff"; x.fillRect(bx + bw*K.pos - 4, by - 10, 8, 54);
      this.text(`${K.r + 1}/${K.count || 3}`, W/2, by + 90, 22, "rgba(255,255,255,.6)", 600, "center");
      this.btn("know", W/2 - 160, by + 110, 320, 80, K.label || "NOW!", () => { const d = Math.abs(K.pos - K.zc), half = (K.zw || .16)/2; this.kitRound(g, d < half ? 100 - d/half*40 : Math.max(0, 50 - (d - half)*300)); this.say(d < half ? "Nice timing!" : "Missed the zone.", d >= half); }, {primary: true, size: 32}); }
    else if (K.type === "balance"){ const bx = 60, bw = W - 120, by = y + 30; this.bar(bx, by, bw, 34, 0); this.rr(x, bx + bw*.325, by, bw*.35, 34, 10); x.fillStyle = "rgba(58,208,122,.35)"; x.fill();
      x.fillStyle = Math.abs(K.n) < .35 ? "#3ad07a" : Math.abs(K.n) < .7 ? "#ffc21a" : "#ff5a4a"; x.beginPath(); x.arc(bx + bw*(.5 + K.n/2), by + 17, 22, 0, 7); x.fill();
      this.text(`⏱ ${Math.max(0, Math.ceil((K.dur || 10) - K.t))}s   ${K.spills ? "💦 spills: " + K.spills : ""}`, W/2, by + 84, 22, "rgba(255,255,255,.75)", 600, "center");
      this.btn("kl", 60, by + 110, 300, 80, "◀ Lean left", () => {}, {size: 26, hold: on => { K.push = on ? -1 : 0; }}); this.btn("kr", W - 360, by + 110, 300, 80, "Lean right ▶", () => {}, {size: 26, hold: on => { K.push = on ? 1 : 0; }}); }
    else if (K.type === "hold"){ const R = K.rounds[K.r] || K.rounds[K.rounds.length - 1], bx = 60, bw = W - 120, by = y + 30, max = R.max || R.target*2;
      this.text(R.label, 60, by - 6, 22, "#ffd87a", 700); this.bar(bx, by + 10, bw, 34, K.v/max, "#ffc21a"); x.fillStyle = "#3ad07a"; x.fillRect(bx + bw*(R.target/max) - 3, by, 6, 54);
      this.text(`${K.v.toFixed(1)} ${R.unit || ""}  (target ${R.target} ${R.unit || ""})`, W/2, by + 90, 24, "#fff", 700, "center");
      this.btn("khold", W/2 - 200, by + 110, 400, 80, this.vr() ? (K.holding ? "Tap to stop" : "Tap to start") : (K.holding ? "Pouring…" : "Hold to pour"), () => {}, {primary: true, size: 28, hold: on => { K.holding = on; if (!on && K.v > 0){ const sc = Math.max(0, 100 - Math.abs(K.v - R.target)/R.target*220); this.say(sc > 80 ? "Perfect pour." : sc > 50 ? "Close enough." : "Way off.", sc < 50); this.kitRound(g, sc); } }}); }
    else if (K.type === "match"){ const R = K.rounds[K.r] || K.rounds[0]; this.text(R.q, 28, y + 20, 28, "#9fe8ff", 800, "left", W - 56);
      R.options.forEach((o, i) => this.btn("km" + i, 28 + (i % 2)*((W - 66)/2 + 10), y + 50 + Math.floor(i/2)*78, (W - 66)/2, 66, o, () => { const ok = o === R.correct; this.say(ok ? "✓ Right" : "✗ Wrong one", !ok); this.kitRound(g, ok ? Math.max(20, 100 - (K.rt || 0)*(K.decay ?? 10)) : 0); }, {size: 22}));
      this.bar(28, this.H - 100, W - 56, 12, 1 - K.rt/(K.time || 6), "#ff8a7a"); }
    else if (K.type === "rhythm"){ const lanes = ["◀", "▲", "▼", "▶"], lx = i => W/2 - 300 + i*200, hitY = y + 250;
      for (let i = 0; i < 4; i++){ x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(lx(i) - 60, y + 10, 120, 260); }
      x.fillStyle = "rgba(255,194,26,.6)"; x.fillRect(W/2 - 380, hitY - 3, 760, 6);
      for (const nt of K.notes){ const dy = (nt.t - K.t)*260; if (dy < -40 || dy > 260 || nt.hit) continue; x.fillStyle = nt.hit === false ? "#ff5a4a" : "#ff8ad8"; x.beginPath(); x.arc(lx(nt.lane), hitY - dy, 26, 0, 7); x.fill(); }
      lanes.forEach((l, i) => this.btn("kp" + i, lx(i) - 60, hitY + 20, 120, 70, l, () => { const nt = K.notes.find(n => n.hit === null && n.lane === i && Math.abs(n.t - K.t) < .22); if (nt){ nt.hit = true; } else this.say("Off beat", true); }, {size: 34, primary: true})); }
    else if (K.type === "dir"){ const arrow = {L: "⬅", C: "⬆", R: "➡"}[K.dir];
      this.text(`📸 FLASH ${arrow}`, W/2, y + 60, 60, "#fff", 800, "center"); this.text(this.vr() ? "Turn and look at the camera!" : "Strike a pose toward the camera!", W/2, y + 110, 24, "rgba(255,255,255,.75)", 600, "center");
      [["L", "⬅ Left"], ["C", "⬆ Front"], ["R", "Right ➡"]].forEach(([d, l], i) => this.btn("kd" + d, 60 + i*310, y + 150, 290, 80, l, () => { const ok = d === K.dir; this.say(ok ? "📸 Great shot!" : "Wrong way!", !ok); this.kitRound(g, ok ? 100 - K.dt*40 : 0); }, {size: 28})); }
    return Y + 300;
  },
  // a game that's just a sequence of kit stages (bottle service, promoter, celebrity, birthday)
  /* hide the panel for a moment to look at the room (the escape room's clues are in the world) */
  peekRoom(look){ if (!this.box) return; this.box.hidden = true; this.peeking = true;
    if (look && !this.vr()) try{ const [ax, ay, az] = look.at, [fx, fz] = look.from; this.moveMe(fx, fz, {x: ax, z: az}); const L = Lounge; setTimeout(() => { try{ const hp = L.headPos(); L.pitch = Math.max(-1, Math.min(1, Math.atan2(ay - hp.y, Math.hypot(ax - hp.x, az - hp.z)))); L.userLooked = true; }catch(e){} }, 60); }catch(e){ console.warn(e); }
    let b = $("#mgPeek"); if (!b){ b = document.createElement("button"); b.id = "mgPeek"; b.type = "button"; b.className = "primary"; b.textContent = "🧩 Back to the puzzle"; b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:90px;z-index:60;padding:12px 20px;border-radius:999px;font:800 16px var(--f-display,system-ui)"; document.body.appendChild(b); b.addEventListener("click", () => { b.hidden = true; this.peeking = false; if (this.on) this.box.hidden = false; this.draw(); }); } b.hidden = false; },
  scripted(def){ return Object.assign({
    start(s){ this.stages = this.make(s); this.si = 0; try{ this.setup && this.setup(s); }catch(e){ console.warn(e); } this.next(); },
    next(){ const m = this.m; if (this.si >= this.stages.length){ return m.endGame(this.outro ? this.outro() : ""); }
      const st = this.stages[this.si++]; if (st.before) try{ st.before(); }catch(e){}
      if (st.type === "custom") return st.run(this);
      m.kit(this, Object.assign({}, st, {done: sc => { if (sc !== null && sc !== undefined){ m.score(sc, st.cash ? Math.round(st.cash*sc/100) : 0); if (st.log) m.shift.log.push(`${st.log}: ${Math.round(sc)}%`); if (sc < 30 && st.strike) m.strike(st.strike); } try{ st.after && st.after(sc); }catch(e){} setTimeout(() => this.next(), 200); }})); },
    update(dt){ this.m.kitUpdate(this, dt); this.tick && this.tick(dt); },
    draw(m){ let Y = 82; if (this.peek && !m.vr()){ const cur = this.stages && this.stages[this.si - 1], lk = cur && cur.look; m.btn("peek", m.W - 300, 70, 272, 44, lk ? "🔍 Show me the clue" : "👀 Look around", () => m.peekRoom(lk), {size: 19, primary: !!lk}); } if (!m.shift.train) { m.text(`Stage ${Math.min(this.si, this.stages.length)}/${this.stages.length}   💵 ${m.money(m.shift.earn)}${this.well ? "" : `   ❌ ${m.shift.strikes}/${m.shift.maxStrikes}`}`, 28, Y + 20, 22, "#ffd87a", 700); Y += 30; }
      else { m.text(`🎓 Training · stage ${Math.min(this.si, this.stages.length)}/${this.stages.length}`, 28, Y + 20, 22, "#9fe8ff", 700); Y += 30; }
      if (this.kit) m.kitDraw(this, Y); else if (this.drawExtra) this.drawExtra(m, Y); },
    key(){ return false; }
  }, def); }
});

/* ================= 🚪 Bouncer: IDs, dress code, guest list, capacity, and breaking up fights ================= */
Mogul.NAMES = [["Keisha", "Marcus", "Jasmine", "Andre", "Maria", "Carlos", "Aaliyah", "Jamal", "Sofia", "DeShawn", "Priya", "Luis", "Imani", "Tyrone", "Mei", "Diego", "Nia", "Malik", "Gabriela", "Kenji", "Tasha", "Rico"], ["Johnson", "Williams", "Brown", "Davis", "Garcia", "Rodriguez", "Lee", "Patel", "Jackson", "Thomas", "Martinez", "Robinson", "Walker", "Lewis", "Young", "Harris"]];
Mogul.FIRST = {f: ["Keisha", "Jasmine", "Maria", "Aaliyah", "Sofia", "Priya", "Imani", "Mei", "Nia", "Gabriela", "Tasha"], m: ["Marcus", "Andre", "Carlos", "Jamal", "DeShawn", "Luis", "Tyrone", "Diego", "Malik", "Kenji", "Rico"]};
Mogul.GAMES.bouncer = {
  panelSide: .7, anyWorld: false,
  howTo: ["Tonight's rules are on the left: 21 and over, the dress code, capacity and the VIP list.", "Read each ID: is the birthday 21+? Is it expired? Does the photo match the person in front of you?", "Look at them: banned clothes? Slurring and stumbling? Big bag? Check the bag before letting them in.", "When the club is full, only people on the VIP list get in. Check the list when someone says they're on it.", "A fight inside? Talk them down first. Then walk the troublemaker out (in VR, grab them by the arm and walk them to the door)."],
  vrTip: "Compare the face on the ID with the guest standing in front of you. In a fight, hold the grip on the troublemaker and walk them to the green door marker.",
  start(s){
    const m = this.m;
    m.moveMe(7.6, .1, Math.PI);
    this.rules = {dress: ["sports jerseys", "flip-flops", "baseball caps"][Math.floor(Math.random()*3)], cap: 80, inside: s.train ? 79 : 62 + s.lv*2};
    this.loaded = (Lounge.peopleSet && Lounge.peopleSet.list || []).map(a => a.name).filter(n => AV_NAMES.includes(n));
    if (!this.loaded.length) this.loaded = AV_NAMES.slice(0, 10);
    this.vipList = Array.from({length: 6}, () => this.name());
    this.count = 0; this.goal = s.train ? 6 : 10 + s.lv; this.guest = null; this.fight = null;
    this.script = s.train ? ["ok", "minor", "expired", "fake", "listfull", "dress", "fight"] : null;
    this.door = new THREE.Mesh(new THREE.RingGeometry(.45, .6, 40).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({color: 0x3ad07a, transparent: true, opacity: .7, toneMapped: false})); this.door.position.set(7.6, .02, 1.6); Lounge.worlds.club.group.add(this.door);
    if (s.train) this.steps = [
      {say: "Read tonight's rules on the left: 21+, the dress code, capacity, and the VIP list.", ack: true},
      {say: "Guest 1: the ID is valid, they're over 21 and dressed fine. Tap ✅ Let in.", done: g => g.count >= 1},
      {say: "Guest 2: check the birthday. Under 21 means no entry. Tap ⛔ Deny.", done: g => g.count >= 2},
      {say: "Guest 3: look at the expiry date. An expired ID isn't valid. Deny.", done: g => g.count >= 3},
      {say: "Guest 4: compare the ID photo with the person in front of you. Not the same person? Deny: it's a borrowed ID.", done: g => g.count >= 4},
      {say: "The club is full (80/80). Guest 5 says they're on the list. Tap 📋 Check list, then let them in if they're on it.", done: g => g.count >= 5},
      {say: "Guest 6 is wearing something tonight's dress code doesn't allow. Deny, politely.", done: g => g.count >= 6},
      {say: "A fight is starting inside! First, talk them down.", done: g => g.fightDone}
    ];
    this.nextGuest();
  },
  name(g){ const N = this.m.NAMES, F = this.m.FIRST[g] || N[0]; return F[Math.floor(Math.random()*F.length)] + " " + N[1][Math.floor(Math.random()*N[1].length)]; },
  genderOf(nm){ const f = nm.split(" ")[0]; return this.m.FIRST.m.includes(f) ? "m" : "f"; },
  makeGuest(kind){
    const now = new Date(), age = kind === "minor" ? 18 + Math.floor(Math.random()*3) : 21 + Math.floor(Math.random()*18);
    const dob = new Date(now.getFullYear() - age, Math.floor(Math.random()*12), 1 + Math.floor(Math.random()*27)); if (kind === "minor" && Math.random() < .4) dob.setFullYear(now.getFullYear() - 21, now.getMonth(), now.getDate() + 3 + Math.floor(Math.random()*20));
    const want = kind === "listfull" ? this.vipList[Math.floor(Math.random()*this.vipList.length)] : null, wantG = kind === "listfull" ? this.genderOf(want) : kind === "listfake" ? this.genderOf(this.vipList[0]) : null;
    const pool = wantG ? this.loaded.filter(n => (Lounge.AVATARS[n] || "f") === wantG) : this.loaded, av = (pool.length ? pool : this.loaded)[Math.floor(Math.random()*(pool.length || this.loaded.length))], g = (Lounge.AVATARS[av] || "f");
    const other = this.loaded.filter(n => n !== av && (Lounge.AVATARS[n] || "f") === g); const idAv = kind === "fake" && other.length ? other[Math.floor(Math.random()*other.length)] : av;
    const exp = new Date(now); exp.setFullYear(now.getFullYear() + 1 + Math.floor(Math.random()*4)); if (kind === "expired") exp.setFullYear(now.getFullYear() - 1, Math.floor(Math.random()*12));
    const nm = kind === "listfull" ? want : kind === "listfake" ? this.vipList[0].split(" ")[0] + " " + this.m.NAMES[1][Math.floor(Math.random()*16)] : this.name(g);
    const wear = kind === "dress" ? {"sports jerseys": "a basketball jersey and shorts", "flip-flops": "jeans, a nice shirt and flip-flops", "baseball caps": "a blazer and a baseball cap"}[this.rules.dress] : ["a sharp going-out outfit", "nice club clothes", "a smart night-out look"][Math.floor(Math.random()*3)];
    const bag = kind === "weapon" ? "a large backpack" : Math.random() < .2 ? "a large tote bag" : "a small clutch";
    return {kind, name: nm, av, idAv, age, dob, exp, wear, bag, bagChecked: false, listChecked: false, drunk: kind === "drunk", weapon: kind === "weapon", claims: kind === "listfull" || kind === "listfake"};
  },
  nextGuest(){
    const m = this.m;
    if (this.guest && this.guest.slot) this.leave(this.guest.slot, this.lastIn);
    if (this.count >= this.goal && !(this.script && this.script.length)) return m.endGame("Doors closed. Shift over!");
    let kind; if (this.script) kind = this.script.shift(); else { const r = Math.random(); kind = r < .45 ? "ok" : r < .57 ? "minor" : r < .65 ? "expired" : r < .73 ? "fake" : r < .82 ? "dress" : r < .88 ? "drunk" : r < .93 ? "weapon" : r < .97 ? "listfull" : "listfake"; if (!this.fightDone && this.count === 5 && Math.random() < .7) kind = "fight"; }
    if (kind === "fight") return this.startFight();
    if (kind === "listfull" || kind === "listfake") this.rules.inside = this.rules.cap;
    const gst = this.guest = this.makeGuest(kind);
    gst.slot = m.spawn(7.6, 1.9, Math.PI, "idle", {avatar: gst.av, gender: Lounge.AVATARS[gst.av] || "f"});
    if (gst.slot && gst.drunk) m.bubble(gst.slot, "🥴 heyyy… lemme in…", "#ff8a7a"); else if (gst.slot && gst.claims) m.bubble(gst.slot, "I'm on the list!", "#9fe8ff");
  },
  walk(slot, x, z, after){ if (!slot) return; slot.walkTo = {x, z, after}; if (slot.clips && slot.clips.walk && slot.mixer){ const a = slot.mixer.clipAction(slot.clips.walk); a.reset().play(); if (slot.action) slot.action.crossFadeTo(a, .3, false); slot.action = a; } },
  leave(slot, inside){ this.walk(slot, inside ? 5 : 10.2, inside ? -2 : 2.5, () => this.m.despawn(slot)); },
  decide(admit){
    const m = this.m, g = this.guest; if (!g || this.fight) return;
    const full = this.rules.inside >= this.rules.cap, onList = this.vipList.includes(g.name);
    let wrong = null;
    const bad = g.age < 21 ? "they're under 21" : g.exp < new Date() ? "the ID is expired" : g.idAv !== g.av ? "the ID photo isn't them" : g.kind === "dress" ? `tonight's dress code says no ${this.rules.dress}` : g.drunk ? "they're too drunk" : g.weapon ? "they had a knife in the bag" : full && !onList ? "the club was at capacity" : null;
    if (admit && bad) wrong = `You let someone in, but ${bad}.`;
    if (admit && g.weapon && !g.bagChecked) wrong = "You let in someone with a big bag without checking it. There was a knife inside.";
    if (!admit && !bad) wrong = onList && full ? "They were on the VIP list. Check the list next time." : "That guest was fine. You turned away a paying customer.";
    if (wrong){ m.strike(wrong); m.score(0); m.shift.log.push(wrong); }
    else { m.score(100, 6, admit ? "✓ Right call. Welcome in!" : `✓ Right call: ${bad}.`); if (admit) this.rules.inside = Math.min(this.rules.cap, this.rules.inside + 1); }
    if (g.slot){ m.bubble(g.slot, admit ? "🙌" : "😤"); }
    this.lastIn = admit; this.count++;
    setTimeout(() => { if (this.m.game === this) this.nextGuest(); }, 700);
  },
  startFight(){
    const m = this.m; this.guest = null;
    const a = this.fight = {a: m.spawn(2.8, -4.4, -1.2, "cheer", {gender: "m"}), b: m.spawn(1.9, -4.9, 1.9, "cheer", {gender: "m"}), stage: "talk", t: 0};
    if (a.a) m.bubble(a.a, "😡 You spilled my drink!", "#ff5a4a"); if (a.b) m.bubble(a.b, "😠 Back up!", "#ff5a4a");
    m.moveMe(2.2, -2.6, Math.PI - .1); m.say("FIGHT on the dance floor! Get over there!", true);
    const f = this.fight; f.heat = .12; f.scores = [];
    const Q = [
      {title: "Read them first. What's the warning sign?", text: "Real fights give notice before the first punch. Two guys are chest to chest and you have a second to read them.", o: [
        {t: "He goes quiet, tucks his chin and puts one foot back.", s: 100, fb: "Right. Going quiet, a tucked chin and a bladed stance mean he's about to swing. Loud guys are usually just posturing."},
        {t: "He's the loudest, so he's the one who'll throw first.", s: 35, fb: "Loud is usually show. The quiet, focused one is the danger."},
        {t: "They're both smiling and pointing, so it's a joke.", s: 10, fb: "Pointing and smirking at close range can be a stall before a swing. Never assume it's a joke."}],
        say: ["😡 You spilled my drink!", "😠 Back up!"]},
      {title: "How do you walk in?", text: "Distance and angle decide whether you become the target. Remember: never turn your back on either of them.", o: [
        {t: "Come in from the side at an angle, hands open and visible, and stop about two arm's lengths away.", s: 100, fb: "Textbook. An open-handed, angled approach looks calm and keeps you out of a straight-line swing."},
        {t: "Rush in and step right between their faces.", s: 25, fb: "That closes the distance, and now you're the one they hit."},
        {t: "Grab the nearest one from behind by the collar.", s: 5, fb: "Grabbing first starts a physical fight with you in it."}],
        say: ["😤 Stay out of it!", "👀 …"]},
      {title: "His friends are filming and egging them on.", text: "“Do it! Hit him!” A crowd is fuel. Most real fights escalate because someone is watching.", o: [
        {t: "Have a staff member move the crowd back while you keep your eyes on the two guys.", s: 100, fb: "Yes. Take the audience away and a lot of the pressure goes with it."},
        {t: "Yell at the friends to shut up.", s: 30, fb: "Now you're arguing with a crowd and the two guys are still squared up."},
        {t: "Ignore the crowd and just talk to the two guys.", s: 55, fb: "Fair, but the cheering keeps lighting them up."}],
        say: ["😠 Do it, man!", "😡 Say that again!"]},
      {title: "What do you say?", text: "Stay calm and get between them, a little to one side. The goal is to end it without anyone getting hurt.", o: [
        {t: "“HEY! Knock it off or you're both getting dropped!”", s: 15, fb: "Yelling and threats make it worse. They're getting angrier."},
        {t: "“Hey, hey, I got you. Let's step away and sort this out. Drinks are on me at the bar.”", s: 100, fb: "Calm voice, a way out, no one loses face. They start to cool down."},
        {t: "Shove the bigger one away from the other.", s: 5, fb: "Putting hands on someone first escalates it, and it's on you now."}],
        say: ["😮‍💨 …", "😠 Whatever."]},
      {title: "He drops his hands: “Alright, alright.”", text: "His weight is still leaning forward. A sudden fake surrender is a classic setup for a cheap shot.", o: [
        {t: "Stay at distance with your hands at chest height, and don't relax until he steps back.", s: 100, fb: "Smart. Thank him, but wait for his feet to move away before you relax."},
        {t: "Relax and turn to check on the other guy.", s: 10, fb: "That's the moment he swings. Never turn your back until they're apart."},
        {t: "Pat him on the shoulder to show there's no hard feelings.", s: 30, fb: "Touching him takes your hands out of guard, and some people take that as a challenge."}],
        say: ["🙄 Alright, alright.", "😠 …"]},
      {title: "Time to separate them.", text: "Real fights restart outside, in the parking lot. How do you split them up?", o: [
        {t: "Walk the instigator out the front. Keep the other inside a few minutes, then use a different door.", s: 100, fb: "That's it. Different exits and a gap in time stop a rematch in the lot."},
        {t: "Walk both of them out the same door together.", s: 20, fb: "They'll finish it on the sidewalk, and now there's no one inside to watch."},
        {t: "Let them both stay but on opposite sides of the bar.", s: 55, fb: "It could hold, but the grudge is still in the room."}],
        say: ["😮‍💨 fine…", "😠 …"]}
    ];
    const ask = i => {
      if (!this.fight || this.fight !== f || m.game !== this) return; const q = Q[i], opts = q.o.slice().sort(() => Math.random() - .5);
      if (i === 0){ if (f.a) m.bubble(f.a, q.say[0], "#ff5a4a"); if (f.b) m.bubble(f.b, q.say[1], "#ff5a4a"); }
      m.kit(this, {type: "choice", title: `(${i + 1}/${Q.length}) ${q.title}`, text: q.text, time: 15, options: opts, done: sc => {
        if (this.fight !== f) return; f.scores.push(sc);
        f.heat = Math.max(.05, Math.min(1, f.heat + (55 - sc)/100*.4)); if (f.duel) f.duel.heat = f.heat;
        const good = sc >= 70, say = good ? ["😮‍💨 …", "🤨 Hmm."] : ["😡 Don't tell me what to do!", "👊 Get out of my face!"];
        if (f.a) m.bubble(f.a, say[0], good ? "#ffd87a" : "#ff5a4a"); if (f.b) m.bubble(f.b, say[1], good ? "#ffd87a" : "#ff5a4a");
        if (i + 1 < Q.length) setTimeout(() => ask(i + 1), 700);
        else { const avg = f.scores.reduce((x, y) => x + y, 0)/f.scores.length; m.score(avg, avg > 70 ? 10 : 0); m.shift.log.push(`De-escalation: ${Math.round(avg)}%`); this.restrain(avg); }
      }});
    };
    ask(0);
  },
  restrain(sc){
    const m = this.m, f = this.fight;
    if (sc >= 70 && Math.random() < .5){ if (f.b) m.bubble(f.b, "😮‍💨 fine…"); this.finishFight(true, "You talked them down. Now walk the instigator out."); return; }
    try{ if (f.duel) Fight.stopDuel(f.duel); f.duel = null; if (f.a) Fight.off(f.a); if (f.b) Fight.off(f.b); }catch(e){}
    if (m.vr()){ f.stage = "walk"; f.t = 0; m.say("Hold the grip on the guy who started it and walk him to the green door marker.", false); return; }
    m.kit(this, {type: "timing", title: "Hold him back", text: "He's pushing past you. Tap when the marker is in the green zone to keep control (3 times).", count: 3, speed: .7, zw: .2, done: s2 => { m.score(s2, s2 > 60 ? 8 : 0); this.finishFight(s2 > 50, s2 > 50 ? "You walked him out safely." : "He got loose and threw a punch before your team grabbed him."); }});
  },
  finishFight(ok, msg){ const m = this.m, f = this.fight; if (!f) return; try{ if (f.duel) Fight.stopDuel(f.duel); f.duel = null; if (f.a) Fight.off(f.a); if (f.b) Fight.off(f.b); }catch(e){} if (!ok) m.strike(msg); else m.say("✓ " + msg); m.shift.log.push("Fight: " + msg);
    if (f.a){ m.bubble(f.a, null); this.leave(f.a, false); } if (f.b){ m.bubble(f.b, null); this.walk(f.b, 4, -1, () => m.despawn(f.b)); }
    this.fight = null; this.fightDone = true; m.moveMe(7.6, .1, Math.PI); setTimeout(() => { if (this.m.game === this) this.nextGuest(); }, 900); },
  update(dt){
    const m = this.m;
    for (const sl of (Lounge.slots || [])){ const w = sl.walkTo; if (!w || !sl.p.parent) continue; const p = sl.p.position, dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz);
      if (d < .15){ sl.walkTo = null; w.after && w.after(); continue; } const sp = Math.min(d, dt*1.3); p.x += dx/d*sp; p.z += dz/d*sp; sl.p.rotation.y = Math.atan2(dx, dz); }
    const f = this.fight;
    if (f && !f.duel && f.stage === "talk" && f.a && f.b && f.a.real && f.b.real) try{ f.duel = Fight.duel(f.a, f.b, {calm: 1.15, heat: f.heat}); }catch(e){ console.warn(e); }
    if (f && f.stage === "walk"){ f.t += dt; const s = f.a; if (s && s.p.parent){ const wp = s.p.getWorldPosition(new THREE.Vector3()); if (Math.hypot(wp.x - 7.6, wp.z - 1.6) < 1.1){ m.score(100, 12); f.stage = "done"; this.finishFight(true, "You walked him out the door. Textbook."); } }
      if (f && f.t > 35){ f.stage = "done"; this.finishFight(false, "It took too long. The fight started again."); } }
    if (this.door) this.door.material.opacity = .4 + Math.sin(performance.now()/300)*.3;
    m.kitUpdate(this, dt); m.tutTick(this);
  },
  draw(m){
    const x = m.x, W = m.W, s = m.shift; let Y = m.tutDraw(this, 82);
    if (!s.train){ m.text(`Guest ${Math.min(this.count + 1, this.goal)}/${this.goal}   💵 ${m.money(s.earn)}   ❌ ${s.strikes}/${s.maxStrikes}`, 28, Y + 20, 22, "#ffd87a", 700); Y += 34; }
    if (this.kit){ m.kitDraw(this, Y); return; }
    if (this.fight && this.fight.stage === "walk"){ m.text("🫱 Grab him (hold grip) and walk him to the green marker by the door.", 28, Y + 40, 24, "#fff", 700, "left", W - 56); m.text(`⏱ ${Math.max(0, Math.ceil(35 - this.fight.t))}s`, 28, Y + 80, 22, "#ffd87a", 700); return; }
    const g = this.guest, tap = (id, X, Y2, W2, H2) => m.regions.push({id, X, Y: Y2, W: W2, H: H2, fn: () => { this.zoom = this.zoom === id ? null : id; }});
    const decide = (by = Y + 346) => { m.btn("adm", 24, by, 230, 70, "✅ Let in", () => { this.zoom = null; this.decide(true); }, {primary: true, size: 26}); m.btn("den", 266, by, 230, 70, "⛔ Deny", () => { this.zoom = null; this.decide(false); }, {size: 26});
      if (g){ m.btn("bag", 508, by, 230, 70, "🎒 Check bag", () => { g.bagChecked = true; }, {size: 22, on: g.bagChecked}); m.btn("lst", 750, by, 250, 70, "📋 Check list", () => { g.listChecked = true; }, {size: 22, on: g.listChecked}); } };
    // zoomed in: one card fills the panel (easy to read on a phone)
    if (this.zoom && g){ const z = this.zoom;
      m.btn("zid", 24, Y, 200, 50, "🪪 ID", () => { this.zoom = "id"; }, {on: z === "id", size: 22}); m.btn("zsee", 236, Y, 200, 50, "👀 Guest", () => { this.zoom = "see"; }, {on: z === "see", size: 22}); m.btn("zrul", 448, Y, 200, 50, "📜 Rules", () => { this.zoom = "rules"; }, {on: z === "rules", size: 22}); m.btn("zx", m.W - 224, Y, 200, 50, "✕ Zoom out", () => { this.zoom = null; }, {size: 22});
      const Y2 = Y + 66, bz = m.H - 84, kk = Math.min(2.3, (bz - Y2 - 44)/230), kw = Math.min(kk, (m.W - 60)/380);
      if (z === "id") this.idCard(m, g, (m.W - 380*kw)/2, Y2, kw);
      else if (z === "see") this.seeCard(m, g, 40, Y2, Math.min(1.9, (bz - Y2 - 10)/250));
      else this.rulesCard(m, 40, Y2, Math.min(1.45, (bz - Y2 - 10)/330));
      decide(bz); return; }
    this.rulesCard(m, 24, Y, 1); tap("rules", 24, Y, 300, 330);
    if (!g){ m.text("Next guest coming up…", 350, Y + 40, 22, "rgba(255,255,255,.6)"); return; }
    this.idCard(m, g, 344, Y, 1); tap("id", 344, Y, 380, 230);
    this.seeCard(m, g, 744, Y, 1); tap("see", 744, Y, m.W - 744, 330);
    m.text("🔍 Tap the ID, the guest or the rules to zoom in", 344, Y + 262, 18, "#9fe8ff", 700, "left", 400);
    decide();
  },
  rulesCard(m, X, Y, k){ const x = m.x; m.rr(x, X, Y, 300*k, 330*k, 16); x.fillStyle = "rgba(255,255,255,.05)"; x.fill();
    m.text("TONIGHT'S RULES", X + 16*k, Y + 28*k, 16*k, "#ffc21a", 800);
    let ry = Y + 58*k; for (const l of ["🔞 21 and over only", `👕 No ${this.rules.dress}`, `👥 Capacity: ${this.rules.inside}/${this.rules.cap}`, "⭐ VIP list:"]) { m.text(l, X + 16*k, ry, 19*k, this.rules.inside >= this.rules.cap && l.startsWith("👥") ? "#ff8a7a" : "#fff", 600, "left", 270*k); ry += 30*k; }
    for (const n of this.vipList) { m.text("   " + n, X + 16*k, ry, 17*k, "rgba(255,255,255,.75)", 500, "left", 270*k); ry += 24*k; } },
  idCard(m, g, cx, cy, k){ const x = m.x, cw = 380*k, ch = 230*k; m.rr(x, cx, cy, cw, ch, 18*k); const grd = x.createLinearGradient(cx, cy, cx + cw, cy + ch); grd.addColorStop(0, "#d8e8f0"); grd.addColorStop(1, "#a8c8d8"); x.fillStyle = grd; x.fill();
    x.fillStyle = "#1a3a5a"; x.fillRect(cx, cy + 10*k, cw, 34*k); m.text("GEORGIA · DRIVER LICENSE", cx + cw/2, cy + 33*k, 17*k, "#fff", 800, "center");
    m.face(g.idAv, cx + 16*k, cy + 56*k, 100*k);
    const f = d => d.toLocaleDateString("en-US", {month: "2-digit", day: "2-digit", year: "numeric"});
    [["NAME", g.name], ["DOB", f(g.dob)], ["EXPIRES", f(g.exp)], ["ID", "GA" + (1e7 + Math.floor(g.dob.getTime()/1e5) % 9e7)]].forEach(([kk, v], i) => { m.text(kk, cx + 136*k, cy + (74 + i*40)*k, 13*k, "#3a5a7a", 800); m.text(v, cx + 136*k, cy + (94 + i*40)*k, 20*k, "#0a1a2a", 700, "left", cw - 150*k); });
    if (k > 1.2){ const now = new Date(), age = now.getFullYear() - g.dob.getFullYear() - (now < new Date(now.getFullYear(), g.dob.getMonth(), g.dob.getDate()) ? 1 : 0); m.text(`Today is ${f(now)}`, cx, cy + ch + 26, 22, "#ffd87a", 700, "left", cw); } },
  seeCard(m, g, ix, Y, k){ m.text("YOU SEE", ix, Y + 24*k, 16*k, "#ffc21a", 800); m.face(g.av, ix, Y + 36*k, 80*k);
    let gy = Y + 40*k; for (const l of [`Wearing ${g.wear}`, g.drunk ? "Slurring, can barely stand" : "Steady, polite", `Carrying ${g.bag}`, g.claims ? "Says: “I'm on the list!”" : ""]) { if (!l) continue; gy = m.wrap(l, ix + 92*k, gy + 4*k, 17*k, k > 1 ? m.W - ix - 92*k - 40 : m.W - ix - 116, "rgba(255,255,255,.85)"); }
    const ly = Math.max(gy + 10*k, Y + 200*k);
    if (g.bagChecked) m.text(g.weapon ? "🔪 Bag: a pocket knife!" : "🎒 Bag: phone, keys, lip gloss", ix, ly, 18*k, g.weapon ? "#ff8a7a" : "#b8ffd4", 700, "left", m.W - ix - 30);
    if (g.listChecked) m.text(this.vipList.includes(g.name) ? "📋 On the list ✓" : "📋 Not on the list", ix, ly + 26*k, 18*k, this.vipList.includes(g.name) ? "#b8ffd4" : "#ff8a7a", 700, "left", m.W - ix - 30); },
  end(){ const m = this.m; try{ if (this.fight && this.fight.duel) Fight.stopDuel(this.fight.duel); }catch(e){} for (const sl of (Lounge.slots || []).filter(x => x.mogul)) m.despawn(sl); if (this.door && this.door.parent) this.door.parent.remove(this.door); }
};

/* ================= 🥊 Fight: real punches, kicks, slams, blocks and hit reactions =================
   Fighters keep their recorded idle/walk underneath. Every frame this bends the hips, torso, head, arms and legs
   into a fight pose on top of it: guard up, a wind-up, the strike, the recovery, and the reaction when one lands.
   Moves are described by a "cock" pose and an "extended" pose for the striking limb; timing does the rest. */
const Fight = {
  slow: 1, shake: 0, fxs: [], duels: [],
  E(u, a, b){ const k = Math.max(0, Math.min(1, (u - a)/(b - a))); return k*k*(3 - 2*k); },
  MIX(a, b, k){ return [a[0] + (b[0] - a[0])*k, a[1] + (b[1] - a[1])*k, a[2] + (b[2] - a[2])*k]; },
  // arm directions in the fighter's own frame: [outward from the body, up, forward]
  G: {lead: {ua: [.3, -.62, .45], fa: [-.05, .82, .5]}, rear: {ua: [.2, -.8, .25], fa: [-.25, .85, .4]}},
  BLK: {ua: [.12, -.45, .72], fa: [-.22, .95, .18]},
  LOW: {ua: [.2, -.95, .1], fa: [.02, -.55, .8]},
  FLAIL: {ua: [.8, -.1, -.1], fa: [.55, .1, .1]},
  MOVES: {
    jab:   {arm: "lead", dur: .5,  hitU: .42, cock: {ua: [.3, -.55, .45], fa: [-.05, .7, .3]}, ext: {ua: [.05, .12, 1], fa: [-.02, .1, 1]}, tw: [-.12, .28], lunge: [0, .1], word: "POW!", pow: .7, snd: 1},
    cross: {arm: "rear", dur: .58, hitU: .45, cock: {ua: [.15, -.7, .2], fa: [-.1, .6, .05]}, ext: {ua: [-.08, .08, 1], fa: [-.2, .1, 1]}, tw: [-.15, .55], lunge: [0, .2], word: "WHAM!", pow: 1},
    hook:  {arm: "lead", dur: .66, hitU: .48, cock: {ua: [.95, .05, -.1], fa: [.5, .25, -.65]}, ext: {ua: [.95, .12, .4], fa: [-.7, .1, .7]}, tw: [-.25, .7], lunge: [0, .14], word: "SMACK!", pow: 1.2},
    upper: {arm: "rear", dur: .7,  hitU: .5,  cock: {ua: [.15, -.92, .1], fa: [0, -.7, .6]}, ext: {ua: [.1, -.3, .78], fa: [-.1, .95, .4]}, tw: [-.2, .3], crouch: [.14, -.05], lunge: [0, .14], word: "BAM!", pow: 1.4},
    kick:  {arm: "leg", dur: .85, hitU: .5, lean: [.05, -.32], lunge: [0, .08], word: "THWACK!", pow: 1.5,
            cock: {th: [-.1, .6, .85], ca: [0, -.92, .3]}, ext: {th: [-.3, .45, .88], ca: [-.45, .15, .9]}, tw: [-.1, .3]},
    slam:  {arm: "both", dur: 2.0, hitU: .72, word: "SLAM!", pow: 2.2}
  },
  // how a body reacts when something lands: head, bow (+ forward, - back), twist, roll, hop, crouch, flail, length, push
  REACT: {
    jab:   {hp: -.5,  hy: 0,  bw: -.2,  tw: 0,  rl: 0,  hop: 0,   cr: 0,   fl: .5, dur: .5,  kb: .3},
    cross: {hp: -.65, hy: .25, bw: -.3, tw: .2, rl: 0,  hop: 0,   cr: 0,   fl: .7, dur: .6,  kb: .55},
    hook:  {hp: -.25, hy: .9, bw: -.1,  tw: .5, rl: .3, hop: 0,   cr: 0,   fl: .8, dur: .65, kb: .45},
    upper: {hp: -1,   hy: 0,  bw: -.5,  tw: 0,  rl: 0,  hop: .22, cr: 0,   fl: 1,  dur: .8,  kb: .4},
    kick:  {hp: -.3,  hy: 0,  bw: .75,  tw: 0,  rl: 0,  hop: 0,   cr: .12, fl: .6, dur: .85, kb: 1.1},
    throw: {hp: -.55, hy: .5, bw: -.25, tw: .2, rl: 0,  hop: 0,   cr: 0,   fl: .8, dur: .6,  kb: .45},
    stool: {hp: -.7,  hy: .3, bw: .35,  tw: .3, rl: .2, hop: 0,   cr: .08, fl: 1,  dur: .8,  kb: .8},
    block: {hp: .1,   hy: 0,  bw: -.08, tw: 0,  rl: 0,  hop: 0,   cr: .02, fl: 0,  dur: .3,  kb: .12},
    ko:    {hp: -.9,  hy: .4, bw: -.5,  tw: .4, rl: 0,  hop: .1,  cr: 0,   fl: 1,  dur: 1.2, kb: 0}
  },
  /* ---------- turning a person into a fighter ---------- */
  on(s){
    if (!s || !s.real) return null; const T = THREE;
    if (!s.fx) s.fx = {t: 0, clock: Math.random()*9, mv: null, rk: null, rt: 0, rdur: 1, blk: 0, exposed: 0, lefty: false, kb: new T.Vector3(), dodge: null, base: s.real.position.clone(), on: false};
    s.fx.on = true; return s.fx;
  },
  off(s){ if (!s || !s.fx) return; s.fx.on = false; s.fx.mv = null; s.fx.rk = null; s.fx.slam = null; try{ if (s.real) s.real.position.copy(s.fx.base); }catch(e){} },
  busy(s){ return !!(s && s.fx && (s.fx.mv || s.fx.slam)); },
  clip(s, name, fade = .25){
    const C = s && s.clips; if (!s || !s.mixer || !C) return; const c = C[name] || C.idle; if (!c || (s.action && s.action.getClip() === c)) return;
    const a = s.mixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.play(); if (s.action) s.action.crossFadeTo(a, fade, false); s.action = a;
  },
  /* ---------- starting a move ---------- */
  move(s, kind, o = {}){
    const fx = s && (s.fx || this.on(s)); const M = this.MOVES[kind]; if (!fx || !M) return false;
    if (fx.mv && !o.force) return false;
    fx.mv = kind; fx.t = 0; fx.dur = o.dur || M.dur; fx.hitU = o.hitU || M.hitU; fx.hitFired = false; fx.onHit = o.onHit || null; fx.done = o.done || null; fx.tell = !!o.tell;
    if (M.snd !== 0 && !o.quiet) try{ this.snd("whoosh", fx.hitU*fx.dur - .12); }catch(e){}
    return true;
  },
  cancel(s){ if (s && s.fx){ s.fx.mv = null; s.fx.slam = null; s.fx.onHit = null; s.fx.done = null; } },
  react(s, kind, o = {}){
    const fx = s && (s.fx || this.on(s)); const R = this.REACT[kind] || this.REACT.jab; if (!fx) return;
    fx.rk = kind; fx.rt = 0; fx.rdur = R.dur; fx.rside = o.side || (Math.random() < .5 ? 1 : -1);
    if (kind !== "block" && fx.mv && !fx.mv.startsWith("slam")){ fx.mv = null; fx.onHit = null; }   // being hit interrupts your own swing
    if (o.push && s.p){ const wp = s.p.getWorldPosition(new THREE.Vector3()).add(o.push); const lp = s.p.parent ? s.p.parent.worldToLocal(wp).sub(s.p.position) : o.push.clone(); lp.y = 0; fx.kb.add(lp.multiplyScalar(R.kb)); }
  },
  dodge(s, dir){ if (s && (s.fx || this.on(s))) s.fx.dodge = {dir: dir || 1, t: 0}; },
  /* ---------- the per-frame pose, called right after the recorded animation has played ---------- */
  apply(s, dt){
    const fx = s.fx, T = THREE, L = Lounge, E = this.E, MIX = this.MIX; if (!fx || !fx.on || !s.real) return;
    if (!L._ov) L._ov = {a: new T.Vector3(), b: new T.Vector3(), q: new T.Quaternion(), q1: new T.Quaternion(), q2: new T.Quaternion(), q3: new T.Quaternion(), id: new T.Quaternion()};
    const B = L.ovBones(s); if (!B.Pelvis || !B.L_UpperArm || !B.R_Thigh) return;
    dt *= this.slow; fx.clock += dt;
    // advance the move / reaction / dodge / knock-back
    if (fx.mv){ fx.t += dt; if (!fx.hitFired && fx.t >= fx.hitU*fx.dur){ fx.hitFired = true; const cb = fx.onHit; fx.onHit = null; if (cb) try{ cb(s); }catch(e){ console.warn(e); } }
      if (fx.mv && fx.t >= fx.dur){ const cb = fx.done; fx.mv = null; fx.done = null; if (cb) try{ cb(s); }catch(e){ console.warn(e); } } }
    if (fx.rk){ fx.rt += dt; if (fx.rt >= fx.rdur) fx.rk = null; }
    if (fx.dodge){ fx.dodge.t += dt; if (fx.dodge.t > .55) fx.dodge = null; }
    if (fx.kb.lengthSq() > 1e-6){ s.p.position.x += fx.kb.x*Math.min(1, dt*7); s.p.position.z += fx.kb.z*Math.min(1, dt*7); fx.kb.multiplyScalar(Math.max(0, 1 - dt*7)); }
    if (fx.slam) this.slamStep(s, dt);
    s.real.updateMatrixWorld(true);
    const q = s.p.getWorldQuaternion(new T.Quaternion()), F = {up: new T.Vector3(0, 1, 0), fwd: new T.Vector3(0, 0, 1).applyQuaternion(q), right: new T.Vector3(1, 0, 0).applyQuaternion(q)};
    const D = a => new T.Vector3().addScaledVector(F.right, a[0]).addScaledVector(F.up, a[1]).addScaledVector(F.fwd, a[2]).normalize();
    if (s.ovSide === undefined) s.ovSide = Math.sign(B.L_UpperArm.getWorldPosition(new T.Vector3()).sub(B.Pelvis.getWorldPosition(new T.Vector3())).dot(F.right)) || 1;
    const sL = s.ovSide, M = fx.mv && this.MOVES[fx.mv], R = fx.rk && this.REACT[fx.rk], u = fx.mv ? fx.t/fx.dur : 0, hu = fx.hitU;
    // move envelopes: w = winding up, e = snapping out, r = pulling back
    const w = M ? E(u, 0, Math.max(.05, hu - .1)) : 0, e = M ? E(u, hu - .1, hu) : 0, r = M ? E(u, hu + .08, 1) : 0, amt = w*(1 - r);
    const ra = R ? (fx.rt/fx.rdur < .12 ? fx.rt/fx.rdur/.12 : Math.exp(-(fx.rt/fx.rdur - .12)*3.2)) : 0, rs = fx.rside || 1;
    const lead = fx.lefty ? "R" : "L", bob = Math.sin(fx.clock*5.2 + (s.ph || 0)), sway = Math.sin(fx.clock*2.3 + 1);
    // ----- body numbers -----
    const strikeId = M && (M.arm === "lead" ? lead : M.arm === "rear" ? (lead === "L" ? "R" : "L") : M.arm === "leg" ? (fx.lefty ? "L" : "R") : null), strikeSd = strikeId ? (strikeId === "L" ? sL : -sL) : 1;
    let tw = M && M.tw ? strikeSd*amt*(M.tw[0] + (M.tw[1] - M.tw[0])*e) : 0;
    let bow = 0, lean = 0, crouch = .05 + .012*bob, lunge = M && M.lunge ? amt*(M.lunge[0] + (M.lunge[1] - M.lunge[0])*e) : 0;
    if (M && M.crouch) crouch += amt*(M.crouch[0] + (M.crouch[1] - M.crouch[0])*e);
    if (M && M.lean) bow += amt*(M.lean[0] + (M.lean[1] - M.lean[0])*e);
    let headP = 0, headY = 0, roll = 0, hop = 0, flail = 0;
    if (fx.mv === "slam"){ const lf = E(u, .22, .5), hl = E(u, .56, hu), bk = E(u, hu + .06, .95); bow += -.3*lf*(1 - hl) + .75*hl*(1 - bk); lunge += .12*hl*(1 - bk); }
    if (fx.exposed > 0) { bow += .12*fx.exposed; headP += .12*fx.exposed; }
    if (R){ bow += R.bw*ra; headP += R.hp*ra; headY += R.hy*rs*ra; tw += R.tw*rs*ra; roll += R.rl*rs*ra; hop += R.hop*ra*Math.max(0, 1 - fx.rt*3); crouch += R.cr*ra; flail = R.fl*ra; }
    if (fx.blk > .01 && !R) bow += .1*fx.blk, headP += .15*fx.blk;
    let dodgeOff = 0;
    if (fx.dodge){ const k = Math.sin(Math.min(1, fx.dodge.t/.55)*Math.PI); dodgeOff = fx.dodge.dir*.42*k; roll += fx.dodge.dir*-.5*k; bow += .12*k; crouch += .1*k; }
    // the whole body: height, lunge, sidestep
    s.real.position.set(fx.base.x + dodgeOff, fx.base.y - crouch*.8 + hop*.5, fx.base.z + lunge);
    if (fx.slam && fx.slam.lowerBy) s.real.position.y -= fx.slam.lowerBy;
    if (fx.ko) { /* lying down: the fall is driven elsewhere */ }
    // ----- hips and spine (never Spine itself: the thighs hang off it) -----
    const sp1 = B.Spine1 || B.Spine, sp2 = B.Spine2 || sp1;
    L.ovRot(B.Pelvis, F.up, -tw*.2 + (fx.stanceTw || 0)); L.ovRot(B.Pelvis, F.fwd, roll*.2);
    L.ovRot(sp1, F.up, -tw*.4); L.ovRot(sp2, F.up, -tw*.4);
    L.ovRot(sp1, F.right, bow*.5); L.ovRot(sp2, F.right, bow*.5); L.ovRot(sp1, F.fwd, roll*.5); L.ovRot(sp2, F.fwd, roll*.4);
    if (B.Neck) L.ovRot(B.Neck, F.right, headP*.3);
    if (B.Head){ L.ovRot(B.Head, F.right, headP*.7); L.ovRot(B.Head, F.up, headY); }
    // ----- arms -----
    const arms = [["L", sL], ["R", -sL]];
    for (const [id, sd] of arms){
      const ua = B[id + "_UpperArm"], fa = B[id + "_Forearm"], hd = B[id + "_Hand"]; if (!ua || !fa || !hd) continue;
      const role = id === lead ? "lead" : "rear";
      let A = this.G[role].ua, Fo = this.G[role].fa;
      if (fx.exposed > 0){ A = MIX(A, this.LOW.ua, fx.exposed*.8); Fo = MIX(Fo, this.LOW.fa, fx.exposed*.8); }
      if (fx.blk > .01){ A = MIX(A, this.BLK.ua, fx.blk); Fo = MIX(Fo, this.BLK.fa, fx.blk); }
      // idle bounce in the guard
      A = [A[0], A[1] + .04*bob, A[2]]; Fo = [Fo[0] + .04*sway, Fo[1], Fo[2]];
      if (M){
        if (fx.mv === "slam"){ const k = this.slamArms(u, hu); A = MIX(A, k.ua, k.a); Fo = MIX(Fo, k.fa, k.a); }
        else if (M.arm === role){ A = MIX(A, MIX(M.cock.ua, M.ext.ua, e), amt); Fo = MIX(Fo, MIX(M.cock.fa, M.ext.fa, e), amt); }
      }
      if (flail > .01){ A = MIX(A, this.FLAIL.ua, flail*.8); Fo = MIX(Fo, this.FLAIL.fa, flail*.8); }
      L.ovAim(ua, fa, D([sd*A[0], A[1], A[2]])); L.ovAim(fa, hd, D([sd*Fo[0], Fo[1], Fo[2]]));
    }
    // ----- legs: a fighter's stance, and kicks -----
    const legs = [["L", sL], ["R", -sL]], rearId = fx.lefty ? "L" : "R";
    for (const [id, sd] of legs){
      const th = B[id + "_Thigh"], ca = B[id + "_Calf"], ft = B[id + "_Foot"]; if (!th || !ca || !ft) continue;
      const isLead = id !== rearId; let T1 = isLead ? [.05*sd, -.93, .37] : [-.05*sd, -.95, -.28], C1 = isLead ? [0, -.99, -.12] : [0, -.99, .08];
      if (M && M.arm === "leg" && !isLead){
        const k = amt; T1 = MIX(T1, MIX(M.cock.th, M.ext.th, e), k); C1 = MIX(C1, MIX(M.cock.ca, M.ext.ca, e), k);
        L.ovAim(th, ca, D([sd*T1[0], T1[1], T1[2]])); L.ovAim(ca, ft, D([sd*C1[0], C1[1], C1[2]])); continue; }
      if (fx.mv === "slam" || fx.ko){ continue; }
      L.ovAim(th, ca, D([sd*T1[0], T1[1], T1[2]]).lerp(D([0, -1, 0]), .35).normalize()); L.ovAim(ca, ft, D([sd*C1[0], C1[1], C1[2]]));
    }
  },
  // overhead lift and slam: arms reach, press up, hurl down
  slamArms(u, hu){
    const E = this.E, reach = E(u, 0, .22), lift = E(u, .22, .5), hurl = E(u, .56, hu), back = E(u, hu + .06, .95);
    let ua = this.MIX([.15, .1, 1], [.1, 1, .15], lift), fa = this.MIX([0, .1, 1], [0, 1, .1], lift);
    ua = this.MIX(ua, [.1, -.1, 1], hurl); fa = this.MIX(fa, [0, -.35, 1], hurl);
    return {ua, fa, a: reach*(1 - back)};
  },
  /* ---------- the slam: lift him over your head and put him through the floor ---------- */
  slam(att, vic, o = {}){
    // att may be null (VR: your own hands). o.from = world position of the attacker; o.onHit fires on impact.
    const T = THREE, fx = this.on(vic); if (!fx || fx.slam) return false;
    const from = o.from ? o.from.clone() : att.p.getWorldPosition(new T.Vector3()), vw = vic.p.getWorldPosition(new T.Vector3());
    const dir = vw.clone().sub(from).setY(0); if (dir.lengthSq() < .01) dir.set(0, 0, 1); dir.normalize();
    const par = vic.p.parent, lp0 = vic.p.position.clone();
    fx.slam = {t: 0, dur: this.MOVES.slam.dur, hitU: this.MOVES.slam.hitU, att, from, dir, lp0, floorW: vw.y, q0: vic.p.quaternion.clone(), hit: false, onHit: o.onHit || null, done: o.done || null, hp: o.hp, lowerBy: 0};
    fx.mv = null; fx.rk = null; fx.onHit = null;
    if (att && att.real){ this.on(att); this.move(att, "slam", {force: true, quiet: true, hitU: this.MOVES.slam.hitU, dur: this.MOVES.slam.dur}); }
    try{ this.snd("whoosh", .5); }catch(e){}
    return true;
  },
  slamStep(s, dt){
    const T = THREE, fx = s.fx, S = fx.slam; if (!S) return; S.t += dt; const u = S.t/S.dur, E = this.E, par = s.p.parent; if (!par) return;
    const hu = S.hitU, lift = E(u, .2, .52), hurl = E(u, .58, hu), up = E(u, hu + .12, .98), reach = 1.05, over = -.85;
    let dist = reach + (over - reach)*lift; dist += (reach*.95 - dist)*hurl;
    const wp = S.from.clone().addScaledVector(S.dir, dist); wp.y = S.floorW + 1.5*lift*(1 - hurl) + .06*hurl*(1 - up);
    const lp = par.worldToLocal(wp.clone()); s.p.position.set(lp.x, lp.y, lp.z);
    // tip over onto his back, head away from the attacker
    const ax = new T.Vector3(S.dir.z, 0, -S.dir.x), ang = -lift*Math.PI/2*.96*(1 - up), qw = par.getWorldQuaternion(new T.Quaternion()).invert();
    s.p.quaternion.copy(S.q0).premultiply(new T.Quaternion().setFromAxisAngle(ax.applyQuaternion(qw), ang));
    // limp arms and legs flap
    fx.rk = "ko"; fx.rt = Math.min(.15, S.t*.3); fx.rdur = 1.2;
    if (!S.hit && u >= hu){ S.hit = true; const cb = S.onHit; S.onHit = null; if (cb) try{ cb(s); }catch(e){ console.warn(e); } }
    if (S.t >= S.dur){ const cb = S.done; fx.slam = null; fx.rk = null; s.p.quaternion.copy(S.q0); if (cb) try{ cb(s); }catch(e){ console.warn(e); } }
  },
  /* ---------- sound ---------- */
  ctx(){ const L = Lounge; return this._ac || (this._ac = (L.listener && L.listener.context) || new (window.AudioContext || window.webkitAudioContext)()); },
  noise(ac){ if (this._nb) return this._nb; const b = ac.createBuffer(1, ac.sampleRate*.5, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return this._nb = b; },
  snd(kind, delay = 0, pow = 1){
    const ac = this.ctx(); if (!ac || ac.state === "closed") return; const t = ac.currentTime + Math.max(0, delay), out = ac.destination;
    if (kind === "whoosh"){ const n = ac.createBufferSource(); n.buffer = this.noise(ac); const f = ac.createBiquadFilter(), g = ac.createGain(); f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + .16);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .07); g.gain.exponentialRampToValueAtTime(.0001, t + .22); n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + .25); return; }
    if (kind === "hit" || kind === "slam"){
      const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(kind === "slam" ? 120 : 190, t); o.frequency.exponentialRampToValueAtTime(40, t + .2); g.gain.setValueAtTime(Math.min(.8, .45*pow), t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === "slam" ? .5 : .25)); o.connect(g); g.connect(out); o.start(t); o.stop(t + .55);
      const n = ac.createBufferSource(); n.buffer = this.noise(ac); const hp = ac.createBiquadFilter(), g2 = ac.createGain(); hp.type = "highpass"; hp.frequency.value = kind === "slam" ? 500 : 1400; g2.gain.setValueAtTime(.3*Math.min(1.4, pow), t); g2.gain.exponentialRampToValueAtTime(.001, t + .1); n.connect(hp); hp.connect(g2); g2.connect(out); n.start(t); n.stop(t + .15); return; }
    if (kind === "block"){ const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(140, t + .08); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); o.connect(g); g.connect(out); o.start(t); o.stop(t + .15); }
  },
  /* ---------- the comic-book impact: star burst, word, ring, shake, a short freeze ---------- */
  tex(word){
    this._tx = this._tx || {}; if (this._tx[word]) return this._tx[word]; const c = document.createElement("canvas"), x = c.getContext("2d");
    if (word === "*"){ c.width = c.height = 128; x.translate(64, 64); x.beginPath(); for (let i = 0; i < 16; i++){ const a = i/16*Math.PI*2, rr = i % 2 ? 26 : 60; x.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } x.closePath(); x.fillStyle = "#ffe14a"; x.fill(); x.lineWidth = 5; x.strokeStyle = "#ff6a1a"; x.stroke(); }
    else if (word === "o"){ c.width = c.height = 128; x.strokeStyle = "rgba(255,255,255,.95)"; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 52, 0, Math.PI*2); x.stroke(); }
    else { c.width = 256; c.height = 128; x.font = "900 74px Impact, 'Arial Black', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.lineWidth = 14; x.strokeStyle = "#1a0a0a"; x.strokeText(word, 128, 66); x.lineWidth = 5; x.fillStyle = "#ffe14a"; x.fillText(word, 128, 66); }
    const t = new THREE.CanvasTexture(c); return this._tx[word] = t;
  },
  impact(wp, pow = 1, word, kind = "hit"){
    const T = THREE, L = Lounge, add = (tex, sc, life, rise, add) => { const sp = new T.Sprite(new T.SpriteMaterial({map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false})); sp.renderOrder = 999; sp.position.copy(wp); sp.scale.setScalar(sc*.3); L.scene.add(sp); this.fxs.push({sp, t: 0, life, sc, rise}); return sp; };
    add(this.tex("*"), .55 + .25*pow, .26, 0); add(this.tex("o"), .35, .35, 0);
    if (word){ const sp = add(this.tex(word), .95 + .2*pow, .75, .55); sp.scale.set(.5, .25, 1); sp.userData.word = true; sp.position.x += (Math.random() - .5)*.2; }
    try{ L.burst(wp, 8 + Math.round(pow*5), "foam"); }catch(e){}
    try{ this.snd(kind === "slam" ? "slam" : "hit", 0, pow); }catch(e){}
    if (!(L.renderer && L.renderer.xr.isPresenting)) this.shake = Math.max(this.shake, .012*pow + (kind === "slam" ? .03 : 0));
    this.hold(60 + 50*pow);
  },
  hold(ms){ this.slow = .08; clearTimeout(this._ht); this._ht = setTimeout(() => { this.slow = 1; }, ms); },
  tick(dt){
    for (const f of this.fxs){ f.t += dt; const k = f.t/f.life, sp = f.sp; sp.material.opacity = Math.max(0, 1 - k*k); if (sp.userData.word){ const s = Math.min(1, k*8)*f.sc; sp.scale.set(s, s*.5, 1); } else sp.scale.setScalar(f.sc*(.3 + Math.min(1, k*3)*.7)); if (f.rise) sp.position.y += f.rise*dt; }
    if (this.fxs.length && this.fxs.some(f => f.t >= f.life)){ for (const f of this.fxs) if (f.t >= f.life){ Lounge.scene.remove(f.sp); f.sp.material.dispose(); } this.fxs = this.fxs.filter(f => f.t < f.life); }
    if (this.duels.length) this.duelTick(dt);
  },
  /* ---------- two characters going at it (the bouncer's fight, bar scuffles) ---------- */
  duel(a, b, o = {}){
    if (!a || !b || !a.real || !b.real) return null; const d = {a, b, t: 0, next: .6, calm: o.calm || 1, heat: o.heat === undefined ? 1 : o.heat, ko: !!o.ko, hpA: o.hp || 8, hpB: o.hp || 8, turn: Math.random() < .5, over: false};
    for (const s of [a, b]){ this.on(s); s.fx.lefty = Math.random() < .25; this.clip(s, "idle"); }
    this.duels.push(d); return d;
  },
  stopDuel(d){ if (!d) return; d.over = true; for (const s of [d.a, d.b]){ this.off(s); } this.duels = this.duels.filter(x => x !== d); },
  duelTick(dt){
    const T = THREE;
    for (const d of this.duels.slice()){
      const A = d.a, B = d.b; if (!A.p.parent || !B.p.parent){ this.stopDuel(d); continue; }
      const wa = A.p.getWorldPosition(new T.Vector3()), wb = B.p.getWorldPosition(new T.Vector3()), dx = wb.x - wa.x, dz = wb.z - wa.z, dist = Math.hypot(dx, dz) || 1;
      A.p.rotation.y = Math.atan2(dx, dz); B.p.rotation.y = Math.atan2(-dx, -dz);
      // keep a fighting distance
      const hh = d.heat, want = .8 + .32*Math.min(1, hh*1.6), push = (dist - want)*Math.min(1, dt*2); for (const [s, sg] of [[A, 1], [B, -1]]){ const lp = s.p.parent.worldToLocal(s.p.getWorldPosition(new T.Vector3()).add(new T.Vector3(dx/dist*push*.5*sg, 0, dz/dist*push*.5*sg))); s.p.position.x = lp.x; s.p.position.z = lp.z; }
      d.next -= dt; if (d.next > 0 || this.busy(A) || this.busy(B) || A.fx.rk || B.fx.rk) continue;
      d.turn = !d.turn; const at = d.turn ? A : B, df = d.turn ? B : A, kinds = hh < .3 ? ["jab"] : hh < .55 ? ["jab", "cross", "jab"] : ["jab", "cross", "hook", "jab", "upper", "kick"], kind = kinds[Math.floor(Math.random()*kinds.length)], shove = hh < .3;
      d.next = hh < .3 ? 2.4 + Math.random()*2.2 : hh < .55 ? 1.3 + Math.random()*1.2 : (.55 + Math.random()*.8)*d.calm;
      this.move(at, kind, {onHit: () => {
        if (shove){ const dw = df.p.getWorldPosition(new T.Vector3()).sub(at.p.getWorldPosition(new T.Vector3())).setY(0).normalize(); this.react(df, "block", {push: dw.multiplyScalar(2.2)}); this.impact(df.p.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.35, 0)), .25, "SHOVE", "block"); try{ this.snd("block"); }catch(e){} return; }
        const r = Math.random(), hp = at.p.getWorldPosition(new T.Vector3()), chest = df.p.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 1.35, 0));
        const dirw = df.p.getWorldPosition(new T.Vector3()).sub(hp).setY(0).normalize();
        if (r < .3){ this.react(df, "block", {push: dirw}); this.impact(chest, .5, null, "block"); try{ this.snd("block"); }catch(e){} }
        else if (r < .45){ this.dodge(df, Math.random() < .5 ? 1 : -1); try{ this.snd("whoosh"); }catch(e){} }
        else { this.react(df, kind === "upper" ? "upper" : kind === "kick" ? "kick" : kind === "hook" ? "hook" : kind === "cross" ? "cross" : "jab", {push: dirw}); this.impact(chest.add(new T.Vector3(0, .15, 0)), this.MOVES[kind].pow, this.MOVES[kind].word); if (df === A) d.hpA--; else d.hpB--;
          if (!d.ko && (d.hpA < 3 || d.hpB < 3)){ d.hpA = d.hpB = 8; } }
      }});
    }
  }
};

/* ================= 🥊 Bar Brawl: block, dodge, counter. In VR, real punches ================= */
Mogul.GAMES.brawl = {
  panelSide: .9, anyWorld: true,
  howTo: ["Tap 🥊 Brawl mode on the party bar to start a fight right where you stand, in any world. In the club it happens on the dance floor.", "Troublemakers walk up and square off. A red ring under one means he's winding up a punch or a kick. Your fighter is on screen; the camera sits behind your shoulder.", "Hold 🛡 Block when he swings (keyboard: Space), or dodge ◀ ▶ (A / D).", "Right after a swing he flashes blue: that's your opening. Tap 👊 Punch for a combo: jab, cross, hook, uppercut. 🦵 Kick (K) hits hard. 💥 Slam (L) lifts him over your head and drives him into the floor.", "Grab stuff! Mugs, bottles and bar stools are on the table next to you. Tap 🍺 Throw (keyboard: T), or in VR grab one and really throw it.", "Drink the glowing 🥃 Liquid Courage for double-power punches, but the room starts spinning.", "Later rounds, their buddies jump in. Only one can swing at a time, so keep your eyes moving. You have 5 hearts."],
  vrTip: "Hands up in front of your face to block, lean to dodge, and throw real punches when one flashes blue. Grab mugs, bottles and stools off the table and throw them for real. Bring the glowing shot to your mouth to drink it.",
  start(s){
    const m = this.m, T = THREE, L = Lounge;
    this.hp = 5; this.kos = 0; this.total = s.train ? 2 : 3 + Math.floor(s.lv/2); this.foes = []; this.spawned = 0;
    this.blocks = 0; this.hits = 0; this.dodges = 0; this.throwHits = 0; this.drinks = 0; this.courage = 0; this.spawnT = 1.5; this.crowdT = 2;
    this.maxAt = s.train ? 1 : Math.min(3, 1 + (s.lv >= 2 ? 1 : 0) + (s.lv >= 5 ? 1 : 0));
    // in the club the fight happens on the dance floor; anywhere else it starts right where you're standing
    let ax, az, yaw; if (L.worldId === "club"){ ax = 0; az = -3.4; yaw = 0; m.moveMe(0, -3.4, m.vr() ? 0 : -.38); }
    else { const h = L.headPos(); ax = h.x; az = h.z; yaw = L.renderer.xr.isPresenting ? L.headYaw() : L.yaw; if (!m.vr()){ L.yaw = yaw - .38; L.pitch = -.12; } }
    const fy = L.floorAt(ax, az, L.headPos().y + .5); this.anchor = {x: ax, z: az, yaw, y: fy != null ? fy : (L.rig.position.y || 0)};
    if (L.worldId !== "club") m.say("🥊 Brawl mode! Trouble's coming from straight ahead.");
    this.cam3 = !m.vr(); this.comboI = 0; this.comboT = -9; this.queued = null; this.slamCd = 0; this.dead = false; this.pko = null; this.dodgeDir = 1;
    if (this.cam3){ try{ L.standing = true; }catch(e){} this.makeAvatar(); this.mkPad(); if (m.box) m.box.hidden = true; }
    this.buildProps();
    if (s.train) this.steps = [
      {say: "Hold 🛡 Block (or Space) to raise your guard.", vr: "Raise both hands in front of your face to guard.", done: g => g.guardT > .8},
      {say: "Block a punch: when you see the red ring, keep your guard up.", vr: "When the red ring appears, keep your hands up.", done: g => g.blocks >= 1},
      {say: "Counter: when he flashes blue after swinging, hit 👊 Punch (or J).", vr: "When he flashes blue, throw a real punch at his head or chest.", done: g => g.hits >= 1},
      {say: "Dodge: tap ◀ or ▶ (A / D) just as he swings.", vr: "Lean to the side just as he swings.", done: g => g.dodges >= 1},
      {say: "Use the bar! Tap 🍺 Throw (or T) to chuck a mug at him.", vr: "Grab a mug or bottle off the table beside you and throw it at him.", done: g => g.throwHits >= 1},
      {say: "Tap 🥃 Liquid Courage to knock back the glowing shot: double-power punches for a bit.", vr: "Grab the glowing shot glass and bring it to your mouth.", done: g => g.drinks >= 1},
      {say: "Finish him: knock him out!", done: g => g.kos >= 1}
    ];
  },
  /* your body: on a screen the camera hangs behind your shoulder, so "where you are" is the camera minus that offset */
  bodyPos(v){ const L = Lounge, h = L.headPos(v); if (this.cam3 && L.camera){ h.x -= L.camera.position.x; h.z -= L.camera.position.z; } return h; },
  makeAvatar(){ const m = this.m, T = THREE, g = this.wgroup(), A = this.anchor; if (!g) return;
    const lp = g.worldToLocal(new T.Vector3(A.x, A.y, A.z)), sl = m.spawn(lp.x, lp.z, 0, "idle", {gender: Math.random() < .5 ? "m" : "f"}); if (!sl) return;
    sl.p.position.y = A.y - g.getWorldPosition(new T.Vector3()).y; sl.isMe = true; this.avatar = sl; },
  /* a fight-game camera: off to the side, so you can see both fighters and every punch land */
  frameCam(dt){ const L = Lounge, T = THREE, me = this.bodyPos(), pool = this.foes.filter(f => !f.down && f.sl.p.parent), k = Math.min(1, dt*3.5);
    let tx, tz, n = 0, ax = -Math.sin(L.yaw), az = -Math.cos(L.yaw);
    if (pool.length){ tx = 0; tz = 0; pool.forEach(f => { const wp = f.sl.p.getWorldPosition(new T.Vector3()); tx += wp.x; tz += wp.z; n++; }); tx /= n; tz /= n; const dx = tx - me.x, dz = tz - me.z, dd = Math.hypot(dx, dz); if (dd > .2){ ax = dx/dd; az = dz/dd; } }
    else { tx = me.x + ax*1.1; tz = me.z + az*1.1; }
    const mx = (me.x + tx)/2, mz = (me.z + tz)/2, spread = pool.length ? Math.max(...pool.map(f => { const wp = f.sl.p.getWorldPosition(new T.Vector3()); return Math.hypot(wp.x - me.x, wp.z - me.z); })) : 1.1;
    const side = 1.9 + spread*.8, behind = .9, px = -az, pz = ax;       // off to your right, a little behind, so both fighters and every punch are in view
    const cx = mx + px*side - ax*behind, cz = mz + pz*side - az*behind;
    L.camLift = .65; const want = Math.atan2(-(mx - cx), -(mz - cz)); let d = want - L.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); L.yaw += d*k;
    L.pitch += (-.3 - L.pitch)*Math.min(1, dt*2);
    L.camera.position.x += (cx - me.x - L.camera.position.x)*k; L.camera.position.z += (cz - me.z - L.camera.position.z)*k;
    // anyone standing between the camera and the fight steps out of the picture
    const cwx = me.x + L.camera.position.x, cwz = me.z + L.camera.position.z, sx = mx - cwx, sz = mz - cwz, sl2 = sx*sx + sz*sz || 1;
    for (const s of L.slots || []){ if (s.world !== L.worldId || !s.p || s === this.avatar || s.mogul || !s.real) continue;
      const wp = s.p.getWorldPosition(new T.Vector3()), t = Math.max(0, Math.min(1, ((wp.x - cwx)*sx + (wp.z - cwz)*sz)/sl2)), qx = cwx + sx*t - wp.x, qz = cwz + sz*t - wp.z, hide = t < .98 && qx*qx + qz*qz < 1.0;
      if (hide && !s.hidFight){ s.hidFight = true; s.p.visible = false; } else if (!hide && s.hidFight){ s.hidFight = false; s.p.visible = true; } } },
  /* thumb controls for phones and tablets: the fight stays in view */
  mkPad(){ if (this.padEl) return; const d = this.padEl = document.createElement("div"); d.className = "fpad";
    d.innerHTML = '<div class="fhud"><div class="fhp"></div><div class="fstat"></div><div class="fstep" hidden></div><div class="fmsg"></div></div><button class="fx" data-a="quit" aria-label="Leave the fight">✕</button>'
      + '<div class="fl"><button data-a="dl">◀<small>Dodge</small></button><button data-a="blk">🛡<small>Block</small></button><button data-a="dr">▶<small>Dodge</small></button></div>'
      + '<div class="fr"><div class="frow"><button data-a="slm">💥<small>Slam</small></button><button data-a="kck">🦵<small>Kick</small></button></div><div class="frow"><button data-a="thr">🍺<small>Throw</small></button><button data-a="drk">🥃<small>Courage</small></button><button data-a="cmb" class="big">👊<small>Combo</small></button></div></div>';
    document.body.appendChild(d); document.body.classList.add("fighting"); this.pad = {};
    const act = (a, down) => { const g = this; if (!g.m || g.m.game !== g) return; if (a === "blk"){ g.blocking = down; return; } if (!down) return;
      if (a === "dl") g.dodgeAnim(1); else if (a === "dr") g.dodgeAnim(-1); else if (a === "cmb") g.punch(); else if (a === "kck") g.kick(); else if (a === "slm") g.slamNow(); else if (a === "thr") g.throwNext(); else if (a === "drk") g.drink(); else if (a === "quit") g.m.close(); };
    d.querySelectorAll("button").forEach(b => { const a = b.dataset.a; this.pad[a] = b;
      b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); try{ b.setPointerCapture(e.pointerId); }catch(_){} act(a, true); });
      const up = e => { e.preventDefault(); act(a, false); }; b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up); b.addEventListener("contextmenu", e => e.preventDefault()); });
    this.pTxt = {}; },
  rmPad(){ document.body.classList.remove("fighting"); if (this.padEl){ this.padEl.remove(); this.padEl = null; this.pad = null; } },
  padUpdate(){ const d = this.padEl; if (!d) return; const m = this.m, q = s => d.querySelector(s), set = (k, el, t) => { if (this.pTxt[k] !== t){ this.pTxt[k] = t; el.textContent = t; } };
    set("hp", q(".fhp"), `${"❤️".repeat(Math.max(0, this.hp))}${"🖤".repeat(Math.max(0, 5 - this.hp))}  💫 ${this.kos}/${this.total}${this.courage > 0 ? "  🥃 " + Math.ceil(this.courage) + "s" : ""}`);
    const live = (this.foes || []).filter(f => !f.down), wind = live.find(f => f.st === "wind"), open = live.find(f => f.st === "open"), st = q(".fstat");
    set("stat", st, !live.length ? (this.kos >= this.total ? "Bar's clear." : "Here comes the next one…") : wind ? "🔴 WINDING UP: BLOCK OR DODGE!" : open ? "🔵 OPENING: HIT HIM NOW!" : live.some(f => f.st === "stagger") ? "He's rocked! Keep going!" : live.length > 1 ? `${live.length} of them. Watch the red rings.` : "He's sizing you up…");
    st.style.color = wind ? "#ff8a7a" : open ? "#7ad8ff" : "#fff";
    const s = m.shift, step = s && s.train && this.steps && this.steps[this.ti || 0], se = q(".fstep"); se.hidden = !step; if (step) set("step", se, `STEP ${(this.ti || 0) + 1}/${this.steps.length}: ${step.say}`);
    const fm = q(".fmsg"), fl = m.flash && performance.now() - m.flash.t < 2200 ? m.flash : null; set("msg", fm, fl ? fl.msg : ""); fm.className = "fmsg" + (fl && fl.bad ? " bad" : "");
    this.pad.slm.classList.toggle("dim", this.slamCd > 0 || !live.some(f => f.st === "open" || f.st === "stagger")); this.pad.drk.classList.toggle("on", this.courage > 0); this.pad.blk.classList.toggle("on", !!this.blocking);
    const sm = this.pad.slm.querySelector("small"); set("slm", sm, this.slamCd > 0 ? Math.ceil(this.slamCd) + "s" : "Slam"); },
  syncAvatar(dt){ const av = this.avatar, T = THREE; if (!av || !av.p.parent) return;
    if (av.real && (!av.fx || !av.fx.on)){ Fight.on(av); Fight.clip(av, "idle"); }
    if (!av.fx) return; const me = this.bodyPos(), tg = this.target(), L = Lounge;
    const lp = av.p.parent.worldToLocal(new T.Vector3(me.x, 0, me.z)); if (!this.dead){ av.p.position.x = lp.x; av.p.position.z = lp.z; }
    if (!this.dead && !av.fx.slam){ const wp = tg ? tg.sl.p.getWorldPosition(new T.Vector3()) : null; av.p.rotation.y = wp ? Math.atan2(wp.x - me.x, wp.z - me.z) : L.yaw + Math.PI; }
    av.fx.blk += ((this.guard() ? 1 : 0) - av.fx.blk)*Math.min(1, dt*10); },
  // a spot relative to where the fight started: rx to your right, fz in front of you
  at(rx, fz){ const A = this.anchor, y = A.yaw; return {x: A.x + Math.cos(y)*rx - Math.sin(y)*fz, z: A.z - Math.sin(y)*rx - Math.cos(y)*fz}; },
  wgroup(){ const L = Lounge, w = L.worlds[L.worldId]; return w ? w.group : L.scene; },
  /* ---------- the stuff on the table: mugs, bottles, stools, and the glowing shot ---------- */
  buildProps(){
    const T = THREE, L = Lounge, g = this.wgroup(); if (!g) return; const prevW = L.buildingWorld; L.buildingWorld = L.worldId; try{ this.buildProps2(T, L, g); } finally { L.buildingWorld = prevW; } },
  buildProps2(T, L, g){
    this.root = new T.Group(); g.add(this.root); g.updateMatrixWorld(true); const A = this.anchor; this.root.position.copy(g.worldToLocal(new T.Vector3(A.x, A.y, A.z))); this.root.rotation.y = A.yaw; this.root.updateMatrixWorld(true); this.props = [this.root]; this.throwables = [];
    const table = new T.Group(); table.position.set(1.05, 0, .15); this.root.add(table);
    const top = new T.Mesh(new T.CylinderGeometry(.34, .34, .035, 24), new T.MeshStandardMaterial({color: 0x3a2414, roughness: .55})); top.position.y = 1.02; table.add(top);
    const leg = new T.Mesh(new T.CylinderGeometry(.04, .04, 1.0, 10), new T.MeshStandardMaterial({color: 0x1a1a1a, metalness: .7, roughness: .3})); leg.position.y = .51; table.add(leg);
    const foot = new T.Mesh(new T.CylinderGeometry(.22, .25, .03, 20), leg.material); foot.position.y = .015; table.add(foot);
    try{ L.surface(top); }catch(e){}
    const add = (o, kind, x, y, z) => { o.position.set(x, y, z); o.userData.brawl = {kind, home: new T.Vector3(x, y, z), homeQ: o.quaternion.clone(), gone: 0}; this.root.add(o); L.grabbable(o, {world: L.worldId, bounce: kind === "stool" ? .15 : .35}); this.throwables.push(o); return o; };
    const glassM = new T.MeshPhysicalMaterial({color: 0xe8f0e0, roughness: .08, transparent: true, opacity: .45, clearcoat: 1});
    const beerM = new T.MeshStandardMaterial({color: 0xe0a020, roughness: .3, transparent: true, opacity: .9}), foamM = new T.MeshStandardMaterial({color: 0xfff8e6, roughness: .9});
    const mug = () => { const o = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.045, .042, .14, 14, 1, true), glassM); b.position.y = .07; o.add(b);
      const beer = new T.Mesh(new T.CylinderGeometry(.04, .038, .11, 14), beerM); beer.position.y = .058; o.add(beer); const foam = new T.Mesh(new T.CylinderGeometry(.041, .041, .02, 14), foamM); foam.position.y = .122; o.add(foam);
      const h = new T.Mesh(new T.TorusGeometry(.03, .008, 6, 12, Math.PI), glassM); h.rotation.z = -Math.PI/2; h.position.set(.05, .07, 0); o.add(h); return o; };
    const bottleM = new T.MeshPhysicalMaterial({color: 0x2a6a2a, roughness: .12, transparent: true, opacity: .85, clearcoat: 1});
    const bottle = () => { const o = new T.Group(); o.add(new T.Mesh(Props.lathe([[0, 0], [.032, 0], [.033, .01], [.033, .15], [.022, .19], [.011, .21], [.011, .26], [0, .26]], 14), bottleM)); return o; };
    const stool = () => { const o = new T.Group(), wood = new T.MeshStandardMaterial({color: 0x6a3a1a, roughness: .6}), metal = new T.MeshStandardMaterial({color: 0x222222, metalness: .7, roughness: .35});
      const seat = new T.Mesh(new T.CylinderGeometry(.19, .19, .05, 18), wood); seat.position.y = .74; o.add(seat);
      for (let i = 0; i < 3; i++){ const a = i/3*Math.PI*2, l = new T.Mesh(new T.CylinderGeometry(.018, .018, .76, 6), metal); l.position.set(Math.cos(a)*.13, .37, Math.sin(a)*.13); l.rotation.set(Math.sin(a)*.12, 0, -Math.cos(a)*.12); o.add(l); }
      const ring = new T.Mesh(new T.TorusGeometry(.13, .01, 6, 18), metal); ring.rotation.x = Math.PI/2; ring.position.y = .3; o.add(ring); return o; };
    add(mug(), "mug", .9, 1.04, .25); add(mug(), "mug", 1.13, 1.04, .3); add(mug(), "mug", 1.0, 1.04, -.02);
    add(bottle(), "bottle", 1.2, 1.04, .07); add(bottle(), "bottle", .82, 1.04, .03);
    add(stool(), "stool", -.95, 0, .4); add(stool(), "stool", 1.7, 0, .7);
    // liquid courage: a shot glass that glows
    const shot = new T.Group(); const sg = new T.Mesh(new T.CylinderGeometry(.024, .02, .055, 12, 1, true), glassM); sg.position.y = .028; shot.add(sg);
    const liq = new T.Mesh(new T.CylinderGeometry(.021, .018, .04, 12), new T.MeshBasicMaterial({color: 0xffb020, toneMapped: false})); liq.position.y = .022; shot.add(liq);
    const glow = new T.Sprite(new T.SpriteMaterial({map: L.glowT, color: 0xffa020, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .8})); glow.scale.setScalar(.22); glow.position.y = .03; shot.add(glow);
    shot.position.set(1.05, 1.04, .15); shot.userData.brawl = {kind: "shot", home: shot.position.clone(), homeQ: shot.quaternion.clone(), gone: 0}; this.root.add(shot); L.grabbable(shot, {world: L.worldId}); this.shot = shot; this.shotGlow = glow;
  },
  resetProp(o){ const b = o.userData.brawl, gd = o.userData.grab; if (gd.held) return; if (o.parent !== this.root) this.root.add(o); o.visible = true; o.position.copy(b.home); o.quaternion.copy(b.homeQ); gd.vel.set(0, 0, 0); gd.spin.set(0, 0, 0); gd.resting = true; b.gone = 0; b.flying = false; },
  /* ---------- the troublemakers ---------- */
  spawnFoe(){ const m = this.m, T = THREE, joining = this.foes.length > 0;
    const L = Lounge, wp0 = this.at((Math.random() - .5)*3, 3.8), g = this.wgroup(), lp = g.worldToLocal(new T.Vector3(wp0.x, 0, wp0.z)), sl = m.spawn(lp.x, lp.z, 0, "idle", {gender: Math.random() < .7 ? "m" : "f"}); if (!sl) return; this.spawned++;
    const fy = L.floorAt(wp0.x, wp0.z, this.anchor.y + 2); sl.p.position.y = (fy != null ? fy : this.anchor.y) - g.getWorldPosition(new T.Vector3()).y;
    const lines = joining ? ["🍻 Hey! That's my buddy!", "😤 Nobody touches my boy!", "🤪 I wanna fight too!"] : ["😠 You lookin' at me?", "🤬 Who spilled my drink?!", "🥴 You wanna go, pal?", "😤 Outside, now!"];
    const f = {sl, baseY: sl.p.position.y, hp: m.shift.train ? 5 : 3 + Math.floor(m.shift.lv/4), st: "walk", t: 0, cd: 1.2, home: null, ang: 0, sway: Math.random()*6};
    m.bubble(sl, lines[Math.floor(Math.random()*lines.length)], "#ff5a4a"); if (joining) m.say("🍻 His buddy just jumped in!", true);
    f.ring = new T.Mesh(new T.RingGeometry(.35, .5, 32).rotateX(-Math.PI/2), new T.MeshBasicMaterial({color: 0xff3030, transparent: true, opacity: 0, toneMapped: false, depthWrite: false})); sl.p.add(f.ring); f.ring.position.y = .03;
    sl.fx = null; f.kind = "jab"; this.foes.push(f); this.spreadFoes(); },
  spreadFoes(){ const live = this.foes.filter(f => !f.down), n = live.length; live.forEach((f, i) => { f.ang = n === 1 ? 0 : (i/(n - 1) - .5)*1.5; }); },
  target(){ const live = this.foes.filter(f => !f.down); if (!live.length) return null; const open = live.filter(f => f.st === "open" || f.st === "stagger"); const pool = open.length ? open : live;
    const me = this.bodyPos(); return pool.slice().sort((a, b) => a.sl.p.getWorldPosition(new THREE.Vector3()).distanceTo(me) - b.sl.p.getWorldPosition(new THREE.Vector3()).distanceTo(me))[0]; },
  guard(){ if (this.m.vr()){ const h = Lounge.headPos(), cs = (Lounge.xrCtls || []).map(c => new THREE.Vector3().setFromMatrixPosition((c.userData.grip || c).matrixWorld)); return cs.length >= 2 && cs.every(p => p.distanceTo(h) < .42 && p.y > h.y - .32); } return !!this.blocking; },
  WORDS: {jab: "POW!", cross: "WHAM!", hook: "SMACK!", upper: "BAM!", kick: "THWACK!", throw: "CRASH!", stool: "CRUNCH!", slam: "SLAM!", courage: "KA-POW!"},
  damage(f, n, push, how, kind){ const m = this.m; kind = kind || (how === "courage" ? "cross" : how) || "jab"; f.hp -= n;
    const dir = (push && push.lengthSq() > .0001 ? push.clone().setY(0).normalize() : this.toFoe(f)), chest = m.headOf(f.sl).add(new THREE.Vector3(0, -.28, 0));
    if (kind !== "slam"){ Fight.react(f.sl, Fight.REACT[kind] ? kind : "throw", {push: dir.clone().multiplyScalar(n > 1 ? 1.3 : 1)}); f.st = "stagger"; f.t = 0; }
    else { f.st = "slam"; }
    f.ring.material.opacity = 0; Fight.impact(chest, Math.min(2.4, .8 + n*.45), this.WORDS[how === "courage" ? "courage" : kind] || "POW!", kind === "slam" ? "slam" : "hit");
    if (f.hp <= 0) this.knockout(f, how, kind === "slam"); },
  /* a hit actually lands (or doesn't) at the moment the fist gets there */
  connect(kind, foe, vel){ const f = foe || this.target(), m = this.m; if (!f || f.down || f.st === "slam") return;
    const dir = (vel ? vel.clone().setY(0).normalize() : this.toFoe(f));
    if (f.st === "open" || f.st === "stagger"){ this.hits++; const strong = kind === "upper" || kind === "kick", pow = (strong ? 2 : 1)*(this.courage > 0 ? 2 : 1); try{ Lounge.xrCtls.forEach(c => Lounge.haptic(c, .8, 60)); }catch(e){}
      this.damage(f, pow, dir, this.courage > 0 ? "courage" : kind, kind); }
    else if (f.st === "wind" || f.st === "walk" || f.st === "guard"){ Fight.react(f.sl, "block", {push: dir}); Fight.impact(m.headOf(f.sl).add(new THREE.Vector3(0, -.3, 0)), .5, null, "block"); try{ Fight.snd("block"); }catch(e){}
      m.say(this.courage > 0 ? "🥴 Blocked! Wait for the blue opening." : "Blocked! Wait for the blue opening.", true); } },
  /* your own moves: on a screen your fighter throws them; in a headset your hands do */
  attack(kind){ const av = this.avatar, f = this.target(); if (!f || this.dead) { if (!f) this.m.say("Nobody close enough… yet.", true); return; }
    if (!av || !av.fx || !av.fx.on){ this.connect(kind, f); return; }
    if (Fight.busy(av)){ this.queued = kind; return; }
    Fight.move(av, kind, {onHit: () => this.connect(kind), done: () => { const q = this.queued; this.queued = null; if (q && !this.dead && this.m.game === this) this.attack(q); }}); },
  combo(){ const now = performance.now()/1000; this.comboI = now - this.comboT < 1.2 ? (this.comboI + 1) % 4 : 0; this.comboT = now; this.attack(["jab", "cross", "hook", "upper"][this.comboI]); },
  punch(vel, foe){ if (vel){ const f = foe || this.target(); if (!f) return; const v = vel.clone(); const kind = v.y > Math.abs(v.x) + Math.abs(v.z) ? "upper" : Math.abs(v.x) > Math.abs(v.z)*1.3 ? "hook" : "cross"; this.connect(kind, f, vel); } else this.combo(); },
  kick(){ this.attack("kick"); },
  slamNow(){ const m = this.m, f = this.target(); if (this.dead) return;
    if (!f || !(f.st === "open" || f.st === "stagger")){ m.say("Slam needs an opening: wait for the blue flash, or when he's rocked.", true); return; }
    if (this.slamCd > 0){ m.say(`Slam is catching its breath (${Math.ceil(this.slamCd)}s).`, true); return; }
    const av = this.avatar, from = this.bodyPos(), T = THREE; this.slamCd = 5; this.hits++; f.st = "slam"; f.t = 0; f.ring.material.opacity = 0;
    const strong = this.courage > 0 ? 2 : 1;
    Fight.slam(av && av.fx && av.fx.on ? av : null, f.sl, {from, onHit: () => { f.st = "stagger"; this.damage(f, 3*strong, null, this.courage > 0 ? "courage" : "slam", "slam"); try{ Lounge.xrCtls.forEach(c => Lounge.haptic(c, 1, 160)); }catch(e){} },
      done: () => { if (!f.down){ f.st = "stagger"; f.t = .2; } }}); },
  toFoe(f){ const me = this.bodyPos(), wp = f.sl.p.getWorldPosition(new THREE.Vector3()); return wp.sub(me).setY(0).normalize(); },
  knockout(f, how, lying){ const m = this.m, T = THREE; if (f.down) return; f.down = true; f.st = "down"; f.t = 0; this.kos++; const sq = f.sl.fx && f.sl.fx.slam;
    m.score(how === "throw" ? 100 : 95, 18 + (how === "stool" ? 6 : 0)); m.say(how === "stool" ? "🪑 STOOL KNOCKOUT! Classic." : how === "throw" ? "🍺 Bottled 'em! KNOCKOUT!" : "💫 KNOCKOUT!"); m.bubble(f.sl, null);
    const dir = sq ? sq.dir.clone() : this.toFoe(f); f.fall = {ax: new T.Vector3(dir.z, 0, -dir.x), q0: sq ? sq.q0.clone() : f.sl.p.quaternion.clone()}; if (lying) f.t = .55; Fight.cancel(f.sl); if (f.sl.fx){ f.sl.fx.ko = true; f.sl.fx.exposed = 0; if (!lying) Fight.react(f.sl, "ko"); }
    // cartoon stars circling his head
    const st = f.stars = new T.Group(); for (let i = 0; i < 4; i++){ const s = new T.Sprite(new T.SpriteMaterial({map: this.starTex(), transparent: true, depthWrite: false})); s.scale.setScalar(.16); st.add(s); } Lounge.scene.add(st);
    try{ this.bonk(); }catch(e){}
    this.spreadFoes(); this.spawnT = Math.min(this.spawnT, 1.6);
    if (!m.shift.train && this.kos >= this.total && !this.foes.some(x => !x.down)) setTimeout(() => { if (m.game === this) m.endGame(this.kos >= 5 ? "You cleared the whole bar. Legendary." : "You cleared the bar. Security wants to hire you."); }, 2200); },
  starTex(){ if (this._starT) return this._starT; const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.font = "48px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("⭐", 32, 34); return this._starT = new THREE.CanvasTexture(c); },
  bonk(){ const L = Lounge, ac = (L.listener && L.listener.context) || this.ac || (this.ac = new (window.AudioContext || window.webkitAudioContext)()); const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(220, t + .35); g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .55);
    const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = "sine"; o2.frequency.setValueAtTime(1760, t + .3); g2.gain.setValueAtTime(.12, t + .3); g2.gain.exponentialRampToValueAtTime(.001, t + 1); o2.connect(g2); g2.connect(ac.destination); o2.start(t + .3); o2.stop(t + 1.05); },
  /* ---------- 2D: throw the nearest thing at whoever's closest ---------- */
  throwNext(){ const m = this.m, f = this.target(); if (!f){ m.say("Nobody to throw at… yet.", true); return; }
    const o = this.throwables.find(o => o.visible && !o.userData.grab.held && o.userData.grab.resting && !o.userData.brawl.gone && o.userData.brawl.kind !== "stool") || this.throwables.find(o => o.visible && !o.userData.grab.held && o.userData.grab.resting && !o.userData.brawl.gone);
    if (!o){ m.say("Nothing left on the table. Hang on, the barback's bringing more.", true); return; }
    const T = THREE, gd = o.userData.grab, from = this.bodyPos().add(new T.Vector3(0, -.25, 0)), to = m.headOf(f.sl).add(new T.Vector3(0, -.35, 0));
    o.parent.worldToLocal(from); o.position.copy(from); gd.hist = []; Lounge.release(o);
    const tt = .55, d = to.sub(o.getWorldPosition(new T.Vector3())); gd.vel.set(d.x/tt, d.y/tt + 4.9*tt, d.z/tt); gd.spin.set(8, 2, 4); o.userData.brawl.flying = true; o.userData.brawl.thrown = performance.now(); },
  drink(){ const m = this.m; if (this.courage > 0){ m.say("You're already full of courage.", true); return; } if (!this.shot.visible){ m.say("The next shot is on its way.", true); return; }
    this.courage = 12; this.drinks++; this.shot.visible = false; this.shot.userData.brawl.gone = 25; m.say("🥃 LIQUID COURAGE! Double-power punches… but the room's spinning."); try{ Lounge.xrCtls.forEach(c => Lounge.haptic(c, .6, 200)); }catch(e){} },
  update(dt){
    const m = this.m, T = THREE, L = Lounge, me = this.bodyPos();
    if (this.cam3){ this.frameCam(dt); this.syncAvatar(dt); this.padUpdate(); }
    if (this.slamCd > 0) this.slamCd -= dt;
    if (this.dead){ this.deadStep(dt); return; }
    this.guardT = this.guard() ? (this.guardT || 0) + dt : 0;
    // liquid courage: the room sways on a screen; in a headset we leave your view alone and pulse your hands instead
    if (this.courage > 0){ this.courage -= dt; const k = Math.min(1, this.courage/2);
      if (!m.vr()){ L.camRoll = Math.sin(performance.now()/420)*.07*k; L.yaw += Math.sin(performance.now()/700)*dt*.25*k; const cv = L.renderer.domElement; cv.style.filter = `saturate(${1 + .8*k}) hue-rotate(${Math.sin(performance.now()/900)*25*k}deg) blur(${.8*k}px)`; }
      else if (Math.random() < dt*1.2) try{ L.xrCtls.forEach(c => L.haptic(c, .25, 40)); }catch(e){}
      if (this.courage <= 0){ this.courage = 0; L.camRoll = 0; L.renderer.domElement.style.filter = ""; m.say("The courage wore off."); } }
    if (this.shot && !this.shot.visible){ const b = this.shot.userData.brawl; b.gone -= dt; if (b.gone <= 0) this.resetProp(this.shot); }
    if (this.shotGlow) this.shotGlow.material.opacity = .55 + Math.sin(performance.now()/250)*.3;
    // VR: bring the shot glass to your mouth to drink it
    if (this.shot && this.shot.visible && this.shot.userData.grab.held && this.shot.getWorldPosition(new T.Vector3()).distanceTo(me.clone().add(new T.Vector3(0, -.08, 0))) < .16){ L.grabEnd && (L.xrCtls || []).forEach(c => { if (c.userData.holding === this.shot) try{ L.grabEnd(c); }catch(e){} }); this.drink(); this.shot.visible = false; }
    // thrown things hitting people
    for (const o of this.throwables || []){ const gd = o.userData.grab, b = o.userData.brawl; if (!o.visible){ b.gone -= dt; if (b.gone <= 0) this.resetProp(o); continue; }
      if (gd.held){ b.flying = true; continue; }
      if (gd.resting){ if (b.flying){ b.flying = false; b.rest = 0; } b.rest = (b.rest || 0) + dt; if (b.rest > 6 && o.position.distanceTo(b.home) > .05) this.resetProp(o); continue; }
      const sp = gd.vel.length(); if (sp < 2.2) continue; const wp = o.getWorldPosition(new T.Vector3());
      for (const f of this.foes){ if (f.down) continue; if (L.touchDist(f.sl, wp) < (b.kind === "stool" ? .32 : .16)){
        const pow = b.kind === "stool" ? 2 : 1; this.throwHits++; this.damage(f, pow, gd.vel.clone().setY(0).normalize(), b.kind === "stool" ? "stool" : "throw", b.kind === "stool" ? "stool" : "throw");
        if (b.kind === "bottle" || b.kind === "mug"){ try{ L.burst(wp, 10, "foam"); }catch(e){} m.emoji(b.kind === "bottle" ? "🍾" : "🍺", wp); o.visible = false; b.gone = 5; }
        else { gd.vel.multiplyScalar(-.25); }
        m.say(b.kind === "stool" ? "🪑 STOOL TO THE FACE!" : b.kind === "bottle" ? "🍾 SMASH!" : "🍺 Direct hit!"); try{ L.xrCtls.forEach(c => L.haptic(c, .5, 40)); }catch(e){} break; } } }
    // knocked-out folks topple over with stars around their heads
    for (const f of this.foes) if (f.down){ f.t += dt; const k = Math.min(1, f.t/.55), e = k < 1 ? k*k : 1 + Math.sin((f.t - .55)*14)*Math.exp(-(f.t - .55)*6)*.08;
      f.sl.p.quaternion.copy(f.fall.q0).premultiply(new T.Quaternion().setFromAxisAngle(f.fall.ax, -e*Math.PI/2*.96)); f.sl.p.position.y = f.baseY + .08*Math.min(1, k*2);
      if (f.t > .6 && f.sl.mixer) f.sl.mixer.timeScale = 0;
      if (f.stars){ const h = m.headOf(f.sl); f.stars.children.forEach((s, i) => { const a = f.t*5 + i/4*Math.PI*2; s.position.set(h.x + Math.cos(a)*.22, h.y + .18 + Math.sin(f.t*7 + i)*.03, h.z + Math.sin(a)*.22); }); }
      if (f.t > 3 && !f.gone){ f.gone = true; if (f.stars) Lounge.scene.remove(f.stars); m.despawn(f.sl); } }
    this.foes = this.foes.filter(f => !f.gone);
    const live = this.foes.filter(f => !f.down);
    // more of them
    this.spawnT -= dt; if (this.spawnT <= 0 && (this.spawned < this.total || (m.shift.train && (this.ti || 0) < this.steps.length)) && live.length < this.maxAt){ this.spawnFoe(); this.spawnT = this.m.shift.train ? 4 : 5 - Math.min(2.5, this.m.shift.lv*.3); }
    // the crowd reacts
    this.crowdT -= dt; if (this.crowdT <= 0 && live.length){ this.crowdT = 1.5 + Math.random()*2; const ss = (L.slots || []).filter(s => s.real && !s.mogul && s.world === L.worldId && s.p.getWorldPosition(new T.Vector3()).distanceTo((c => new T.Vector3(c.x, this.anchor.y, c.z))(this.at(0, .6))) < 7); const s = ss[Math.floor(Math.random()*ss.length)]; if (s) m.emoji(["😱", "🍿", "📸", "😂", "🙈", "🔥"][Math.floor(Math.random()*6)], m.headOf(s).add(new T.Vector3(0, .3, 0))); }
    const busy = live.some(f => f.st === "wind" || f.st === "strike");
    const slow = m.shift.train ? 1.6 : Math.max(.6, 1.1 - m.shift.lv*.05);
    for (const f of live){
      if (f.st === "slam") continue;
      if (f.sl.real && (!f.sl.fx || !f.sl.fx.on)){ Fight.on(f.sl); if (f.sl.fx) f.sl.fx.lefty = !!f.lefty; Fight.clip(f.sl, f.st === "walk" ? "walk" : "idle"); }
      const p = f.sl.p.position, wp = f.sl.p.getWorldPosition(new T.Vector3()), dx = me.x - wp.x, dz = me.z - wp.z, d = Math.hypot(dx, dz) || 1;
      f.sl.p.rotation.y = Math.atan2(dx, dz); f.t += dt; f.sway += dt;
      // where he wants to stand: around you, so a gang spreads out instead of stacking
      const ux = -dx/d, uz = -dz/d, ca = Math.cos(f.ang), sa = Math.sin(f.ang), sx = me.x + (ux*ca - uz*sa)*1.08, sz = me.z + (ux*sa + uz*ca)*1.08;
      if (f.st === "walk"){ const tx = sx - wp.x, tz = sz - wp.z, td = Math.hypot(tx, tz); if (td > .08){ const sp = Math.min(td, dt*1.35); p.x += tx/td*sp + Math.sin(f.sway*3)*dt*.25; p.z += tz/td*sp; } else { f.st = "guard"; f.t = Math.random()*.4; f.home = p.clone(); m.bubble(f.sl, null); Fight.clip(f.sl, "idle"); } }
      else if (f.st === "guard"){ p.x += Math.sin(f.sway*2.2)*dt*.08; if (d > 1.5){ f.st = "walk"; Fight.clip(f.sl, "walk"); continue; }
        if (f.t > f.cd*slow && !busy){ f.st = "wind"; f.t = 0; f.home = p.clone();
          const lv = m.shift.lv, r = Math.random(); f.kind = r < .3 ? "jab" : r < .55 ? "cross" : r < .75 ? "hook" : (r < .88 && lv >= 2) ? "kick" : lv >= 3 ? "upper" : "cross";
          const windT = .85*slow, dd = windT + .55; Fight.move(f.sl, f.kind, {dur: dd, hitU: (windT + .12)/dd, tell: true}); } }
      else if (f.st === "wind"){ f.ring.material.color.set(0xff3030); f.ring.material.opacity = Math.min(1, f.t*2); if (f.t > .85*slow){ f.st = "strike"; f.t = 0; this.dodgeArm = false; } }
      else if (f.st === "strike"){ const k = Math.sin(Math.min(1, f.t/.25)*Math.PI); if (f.home){ p.x = f.home.x + dx/d*.28*k; p.z = f.home.z + dz/d*.28*k; }
        if (f.t >= .12 && !f.landed){ f.landed = true;
          let dodged = this.dodging > 0; if (m.vr()){ const base = this.vrBase || me.clone(); dodged = Math.hypot(me.x - base.x, me.z - base.z) > .22; }
          const av = this.avatar, dirIn = new T.Vector3(me.x - wp.x, 0, me.z - wp.z).normalize(), hitPos = av && av.real ? m.headOf(av).add(new T.Vector3(0, -.22, 0)) : me.clone().addScaledVector(dirIn, -.4).add(new T.Vector3(0, -.2, 0)), rk = f.kind || "jab";
          if (dodged){ this.dodges++; m.say("Dodged!"); try{ Fight.snd("whoosh"); }catch(e){} }
          else if (this.guard()){ this.blocks++; m.say("🛡 Blocked!"); try{ L.xrCtls.forEach(c => L.haptic(c, .4, 50)); }catch(e){} Fight.impact(hitPos, .5, null, "block"); if (av) Fight.react(av, "block", {push: dirIn}); try{ Fight.snd("block"); }catch(e){} }
          else { this.hp--; m.hurtFlash(); m.say(`Ouch! ${this.hp} ❤️ left`, true); try{ L.xrCtls.forEach(c => L.haptic(c, 1, 120)); }catch(e){}
            Fight.impact(hitPos, 1.2, this.WORDS[rk], "hit"); if (av) Fight.react(av, rk, {push: dirIn}); Fight.shake = Math.max(Fight.shake, .035);
            if (this.hp <= 0){ m.score(Math.round(this.kos/this.total*70)); this.dead = true; this.pko = {t: 0, dir: dirIn.clone().multiplyScalar(1)};
              if (av && av.fx){ Fight.cancel(av); av.fx.ko = true; Fight.react(av, "ko"); this.pko.q0 = av.p.quaternion.clone(); }
              setTimeout(() => { if (m.game === this) m.endGame("You got knocked down. Train some more!"); }, av ? 1700 : 500); return; } } }
        if (f.t > .3){ f.st = "open"; f.t = 0; f.landed = false; f.ring.material.color.set(0x4ab0ff); f.ring.material.opacity = 1; if (f.home){ p.x = f.home.x; p.z = f.home.z; } } }
      else if (f.st === "open"){ if (f.t > (m.shift.train ? 1.6 : .9)){ f.st = "guard"; f.t = 0; f.cd = .8 + Math.random()*.8; f.ring.material.opacity = 0; } }
      else if (f.st === "stagger"){ if (f.t > .7){ f.st = "guard"; f.t = 0; f.cd = .6 + Math.random()*.6; f.ring.material.opacity = 0; } }
      if (f.st !== "wind" && f.st !== "open") f.ring.material.opacity = Math.max(0, f.ring.material.opacity - dt*3);
      if (f.sl.fx) f.sl.fx.exposed += ((f.st === "open" ? 1 : 0) - f.sl.fx.exposed)*Math.min(1, dt*10);
    }
    if (this.dodging > 0) this.dodging -= dt;
    if (!live.some(f => f.st === "wind" || f.st === "strike")) this.vrBase = me.clone();
    // VR: a fast hand near someone's head or chest is a punch
    if (m.vr() && live.length) for (const c of L.xrCtls || []){ if (c.userData.holding) continue; const hand = c.userData.grip || c, hp = new T.Vector3().setFromMatrixPosition(hand.matrixWorld), last = c.userData.lastPunchP || hp.clone(), v = hp.clone().sub(last).divideScalar(Math.max(dt, .008)); c.userData.lastPunchP = hp.clone();
      if (v.length() > 2.2 && (!c.userData.punchT || performance.now() - c.userData.punchT > 400)){ const f = live.find(f => L.touchDist(f.sl, hp) < .18); if (f){ c.userData.punchT = performance.now(); this.punch(v, f); } } }
    m.tutTick(this);
  },
  deadStep(dt){ const av = this.avatar, P = this.pko; if (!P || !av || !av.p.parent || !P.q0) return; P.t += dt; const e = Math.min(1, P.t/.6); const ax = new THREE.Vector3(P.dir.z, 0, -P.dir.x);
    av.p.quaternion.copy(P.q0).premultiply(new THREE.Quaternion().setFromAxisAngle(ax, -e*e*Math.PI/2*.96)); },
  dodgeAnim(dir){ this.dodging = .35; this.dodgeDir = dir; if (this.avatar && this.avatar.fx) Fight.dodge(this.avatar, dir); },
  key(k, down){ if (k === " " ){ this.blocking = down; return true; } if (down && (k === "a" || k === "d")){ this.dodgeAnim(k === "a" ? 1 : -1); return true; } if (down && k === "j"){ this.punch(); return true; } if (down && k === "k"){ this.kick(); return true; } if (down && k === "l"){ this.slamNow(); return true; } if (down && k === "t"){ this.throwNext(); return true; } if (down && k === "q"){ this.drink(); return true; } return false; },
  draw(m){
    const x = m.x, W = m.W; let Y = m.tutDraw(this, 82);
    m.text(`${"❤️".repeat(Math.max(0, this.hp))}${"🖤".repeat(Math.max(0, 5 - this.hp))}   💫 ${this.kos}/${this.total} down${this.courage > 0 ? `   🥃 ${Math.ceil(this.courage)}s` : ""}`, 28, Y + 30, 26, "#fff", 700, "left", W - 56); Y += 56;
    const live = (this.foes || []).filter(f => !f.down), wind = live.find(f => f.st === "wind"), open = live.find(f => f.st === "open");
    m.text(!live.length ? (this.kos >= this.total ? "Bar's clear." : "Here comes the next one…") : wind ? "🔴 WINDING UP: BLOCK OR DODGE!" : open ? "🔵 OPENING: PUNCH NOW!" : live.some(f => f.st === "strike") ? "💢" : live.some(f => f.st === "stagger") ? "He's rocked! Hit him again!" : live.length > 1 ? `${live.length} of them. Watch for the red ring.` : "He's sizing you up…", W/2, Y + 34, 30, wind ? "#ff8a7a" : open ? "#7ad8ff" : "#fff", 800, "center", W - 56);
    Y += 70;
    m.btn("dl", 28, Y, 200, 84, "◀ Dodge", () => this.dodgeAnim(1), {size: 26});
    m.btn("blk", 240, Y, 260, 84, this.blocking ? "🛡 Guarding" : "🛡 Block (hold)", () => {}, {size: 26, on: this.blocking, hold: on => { this.blocking = on; }});
    m.btn("pun", 512, Y, 260, 84, this.courage > 0 ? "👊 Combo ×2" : "👊 Combo", () => this.punch(), {primary: true, size: 30});
    m.btn("dr", 784, Y, 212, 84, "Dodge ▶", () => this.dodgeAnim(-1), {size: 26});
    Y += 96;
    const left = (this.throwables || []).filter(o => o.visible && !o.userData.brawl.gone).length, bw4 = (W - 56 - 36)/4;
    m.btn("kck", 28, Y, bw4, 70, "🦵 Kick", () => this.kick(), {size: 24});
    m.btn("slm", 28 + (bw4 + 12), Y, bw4, 70, this.slamCd > 0 ? `💥 ${Math.ceil(this.slamCd)}s` : "💥 Slam", () => this.slamNow(), {size: 24, on: this.slamCd <= 0 && live.some(f => f.st === "open" || f.st === "stagger")});
    m.btn("thr", 28 + (bw4 + 12)*2, Y, bw4, 70, `🍺 Throw (${left})`, () => this.throwNext(), {size: 22});
    m.btn("drk", 28 + (bw4 + 12)*3, Y, bw4, 70, this.courage > 0 ? "🥴 Brave…" : this.shot && this.shot.visible ? "🥃 Courage" : "🥃 Next…", () => this.drink(), {size: 22, on: this.courage > 0});
    m.text("Keys: Space block · A / D dodge · J combo · K kick · L slam · T throw · Q courage", W/2, Y + 100, 18, "rgba(255,255,255,.5)", 500, "center");
  },
  end(){ const m = this.m, L = Lounge; for (const f of this.foes || []){ if (f.stars) L.scene.remove(f.stars); Fight.off(f.sl); if (!f.gone) m.despawn(f.sl); } this.foes = [];
    if (this.avatar){ Fight.off(this.avatar); m.despawn(this.avatar); this.avatar = null; } if (this.cam3){ try{ L.camera.position.x = 0; L.camera.position.z = 0; L.standing = false; L.camLift = 0; L.pitch = -.05; for (const sl of L.slots || []) if (sl.hidFight){ sl.hidFight = false; sl.p.visible = true; } }catch(e){} this.cam3 = false; this.rmPad(); if (m.box && !m.vr() && m.on) m.box.hidden = false; }
    L.camRoll = 0; try{ L.renderer.domElement.style.filter = ""; }catch(e){}
    for (const c of L.xrCtls || []) if (c.userData.holding && this.props && this.props[0] && (function inside(q, r){ for (; q; q = q.parent) if (q === r) return true; return false; })(c.userData.holding, this.props[0])) try{ L.grabEnd(c); }catch(e){}
    m.dropProps(this.throwables || []); m.dropProps(this.shot ? [this.shot] : []); m.dropProps(this.props || []); }
};
/* ================= 🧺 Barback / Busser: glasses, ice, kegs and spills, all over the club ================= */
Mogul.GAMES.barback = {
  panelSide: .8,
  howTo: ["Walk around the club. Empty glasses pile up on tables and the bar: tap them to collect (you can carry 6).", "Drop them at the 🧺 bus tub at the end of the bar.", "When the bar calls for ICE, get a bucket from the ice machine and dump it in the bar's ice well.", "When a keg runs dry, go to the keg cooler and change it.", "Mop ⚠ spills fast. If you walk through one, you'll slip and drop everything."],
  vrTip: "Point at glasses, the tub, the ice machine, the keg and spills, and pull the trigger. You have to walk close enough first.",
  start(s){
    const m = this.m, T = THREE, L = Lounge; this.props = []; this.carry = 0; this.ice = false; this.glasses = []; this.spills = []; this.tasks = []; this.done = 0; this.overT = 0;
    const root = this.root = new T.Group(); L.worlds.club.group.add(root); this.props.push(root);
    const box = (w, h, d, c, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({color: c, roughness: .5, metalness: .3})); o.position.set(x, y, z); root.add(o); return o; };
    // high-top tables to bus
    this.tables = [[5.2, -3.2], [6.2, -7.4], [-4.6, -1.6], [4.2, -10.2]].map(([tx, tz]) => { const t = new T.Group(); t.position.set(tx, 0, tz); root.add(t);
      t.add(new T.Mesh(new T.CylinderGeometry(.34, .34, .03, 24), new T.MeshStandardMaterial({color: 0x1a1a22, roughness: .3, metalness: .6}))).position.y = 1.08;
      t.add(new T.Mesh(new T.CylinderGeometry(.03, .03, 1.08, 10), new T.MeshStandardMaterial({color: 0x888888, metalness: .9, roughness: .3}))).position.y = .54; L.surface(t.children[0]); return {x: tx, y: 1.1, z: tz}; });
    this.surfaces = this.tables.concat([[-8.4, -9], [-8.4, -7.3], [-8.4, -4.8], [-8.4, -3.2], [0, .2]].map(([x, z]) => ({x, y: x < -8 ? 1.17 : .5, z})));
    const tub = box(.45, .2, .32, 0x3a4a6a, -8.6, 1.26, -2.1); tub.add(new T.Mesh(new T.PlaneGeometry(.4, .27).rotateX(-Math.PI/2), new T.MeshStandardMaterial({color: 0x9ab8d8}))).position.y = .101;
    m.clickable(tub, () => { if (!this.carry) return m.say("You're not carrying any glasses."); m.score(100, this.carry*1.5, `🧺 Dropped ${this.carry} glass${this.carry > 1 ? "es" : ""} ✓`); this.done += this.carry; this.carry = 0; });
    const iceM = box(.7, 1.3, .6, 0xd8dde4, -9.8, .65, -1.2); const ice2 = box(.4, .06, .3, 0x9fe8ff, -9.8, 1.33, -1.2); ice2.material.emissive = new T.Color(0x3aa8ff); ice2.material.emissiveIntensity = .4;
    m.clickable(iceM, () => { if (this.ice) return m.say("You already have a full bucket."); this.ice = true; m.say("🪣 Bucket full of ice. Take it to the bar's ice well."); });
    const well = box(.3, .04, .26, 0x9fe8ff, -8.82, 1.18, -5.6); m.clickable(well, () => { const t = this.tasks.find(t => t.kind === "ice"); if (!this.ice) return m.say("Get a bucket from the ice machine first.", true); this.ice = false; if (t){ this.complete(t); } else m.say("Ice topped up.", false); });
    const keg = new T.Mesh(new T.CylinderGeometry(.22, .22, .6, 20), new T.MeshStandardMaterial({color: 0xb8b8c0, metalness: 1, roughness: .25})); keg.position.set(-9.7, .3, -9.9); root.add(keg);
    m.clickable(keg, () => { const t = this.tasks.find(t => t.kind === "keg"); if (!t) return m.say("The kegs are fine right now."); m.kit(this, {type: "timing", title: "Change the keg", text: "Twist the coupler off the empty keg and lock it on the new one. Tap when it's lined up (2 times).", count: 2, speed: .8, zw: .18, done: sc => { if (sc > 45) this.complete(t); else m.say("It's leaking. Try the keg again.", true); }}); });
    this.mkGlass = () => { const sp = this.surfaces[Math.floor(Math.random()*this.surfaces.length)], g = Props.tumbler("water", 0); g.position.set(sp.x + (Math.random() - .5)*.3, sp.y, sp.z + (Math.random() - .5)*.3); g.scale.setScalar(1.2); root.add(g); this.glasses.push(g);
      m.clickable(g, () => { if (this.carry >= 6) return m.say("Your hands are full (6). Drop them at the 🧺 tub.", true); this.carry++; root.remove(g); this.glasses = this.glasses.filter(x => x !== g); Lounge.clickables = Lounge.clickables.filter(c => c !== g); }); };
    this.mkSpill = () => { const x = (Math.random() - .5)*10, z = -2 - Math.random()*9, sp = new T.Mesh(new T.CircleGeometry(.45, 24).rotateX(-Math.PI/2), new T.MeshStandardMaterial({color: 0xb8a060, roughness: .05, metalness: .2, transparent: true, opacity: .75})); sp.position.set(x, .012, z); root.add(sp);
      const w = new T.Sprite(new T.SpriteMaterial({map: Tex.make((() => { const [c, cx] = Tex.canvas(64, 64); cx.font = "48px serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText("⚠️", 32, 34); return c; })()), transparent: true, depthWrite: false})); w.scale.setScalar(.4); w.position.set(x, .6, z); root.add(w);
      const s = {sp, w, x, z, t: 0}; this.spills.push(s); const task = {kind: "spill", t: 0, limit: 30, s}; this.tasks.push(task);
      m.clickable(sp, () => { m.kit(this, {type: "hold", title: "Mop it up", text: "Hold to mop until the floor is dry.", rounds: [{label: "Mopping", target: 2, max: 2.6, rate: 1, unit: "s"}], done: sc => { this.complete(task); root.remove(sp); root.remove(w); this.spills = this.spills.filter(x => x !== s); }}); }, 3); };
    for (let i = 0; i < (s.train ? 3 : 6); i++) this.mkGlass();
    this.spawnT = s.train ? 999 : 8; m.moveMe(-6.5, -2.4, -Math.PI*.6);
    if (s.train) this.steps = [
      {say: "Empty glasses are on the tables and the bar. Walk close and tap them to pick them up.", done: g => g.carry >= 2},
      {say: "Take them to the 🧺 bus tub at the end of the bar (by the entrance side) and tap it.", done: g => g.done >= 2},
      {say: "The bartender needs ICE! Tap the ice machine in the corner behind the bar to fill a bucket.", before: g => g.task("ice"), done: g => g.ice || !g.tasks.some(t => t.kind === "ice")},
      {say: "Now tap the blue ice well on the bar to dump the ice.", done: g => !g.tasks.some(t => t.kind === "ice")},
      {say: "A spill ⚠ on the dance floor! Go mop it (tap it and hold to mop) before someone slips.", before: g => g.mkSpill(), done: g => !g.spills.length},
      {say: "Keg's empty! Go to the silver keg behind the far end of the bar and change it.", before: g => g.task("keg"), done: g => !g.tasks.some(t => t.kind === "keg")}
    ];
  },
  task(kind){ if (this.tasks.some(t => t.kind === kind)) return; this.tasks.push({kind, t: 0, limit: kind === "ice" ? 35 : 45}); this.m.say(kind === "ice" ? "🧊 Bartender: “I need ICE!”" : "🍺 Bartender: “The keg's dry!”", true); },
  complete(t){ this.tasks = this.tasks.filter(x => x !== t); this.m.score(Math.max(40, 100 - t.t*2), 6, "✓ Done: " + (t.kind === "ice" ? "ice delivered" : t.kind === "keg" ? "keg changed" : "spill mopped")); this.done++; },
  update(dt){
    const m = this.m, s = m.shift;
    if (this.steps){ const st = this.steps[this.ti || 0]; if (st && st.before && !st._b){ st._b = true; st.before(this); } }
    if (!s.train){ if (s.t > 140 + s.lv*8) return m.endGame("Bar's closed. Nice hustle!");
      this.spawnT -= dt; if (this.spawnT <= 0){ this.spawnT = Math.max(4, 9 - s.lv*.5); const r = Math.random(); if (r < .55) this.mkGlass(); else if (r < .72) this.task("ice"); else if (r < .82) this.task("keg"); else this.mkSpill(); } }
    for (const t of this.tasks){ t.t += dt; if (!s.train && t.t > t.limit){ m.strike(t.kind === "spill" ? "Someone slipped on a spill you didn't mop." : t.kind === "ice" ? "The bar ran out of ice." : "No beer for 45 seconds: the keg never got changed."); m.score(0); this.tasks = this.tasks.filter(x => x !== t); if (t.s){ this.root.remove(t.s.sp); this.root.remove(t.s.w); this.spills = this.spills.filter(x => x !== t.s); } break; } }
    if (!s.train && this.glasses.length > 9){ this.overT += dt; if (this.overT > 15){ this.overT = 0; m.strike("The tables are covered in empty glasses."); } } else this.overT = 0;
    // walking through a spill
    const h = Lounge.headPos(); for (const sp of this.spills){ if (Math.hypot(h.x - sp.x, h.z - sp.z) < .4){ sp.t += dt; if (sp.t > .35 && !sp.slipped){ sp.slipped = true; if (this.carry){ m.strike(`You slipped and dropped ${this.carry} glasses!`); this.carry = 0; } else m.say("Careful! You almost slipped.", true); } } else { sp.t = 0; sp.slipped = false; } }
    m.kitUpdate(this, dt); m.tutTick(this);
  },
  draw(m){
    const s = m.shift; let Y = m.tutDraw(this, 82);
    if (!s.train){ m.text(`⏱ ${Math.max(0, Math.ceil(140 + s.lv*8 - s.t))}s   💵 ${m.money(s.earn)}   ❌ ${s.strikes}/${s.maxStrikes}`, 28, Y + 20, 22, "#ffd87a", 700); Y += 34; }
    if (this.kit) return m.kitDraw(this, Y);
    m.text(`🍸 Carrying ${this.carry}/6 glasses${this.ice ? "   🪣 ice bucket" : ""}`, 28, Y + 30, 26, "#fff", 700);
    m.text(`Glasses waiting: ${this.glasses.length}${this.glasses.length > 7 ? "  ⚠ piling up!" : ""}`, 28, Y + 70, 22, this.glasses.length > 7 ? "#ff8a7a" : "rgba(255,255,255,.75)", 600);
    let y = Y + 116; m.text("TO DO", 28, y, 16, "#ffc21a", 800); y += 30;
    if (!this.tasks.length) m.text("All caught up. Keep busing tables!", 28, y, 21, "rgba(255,255,255,.6)");
    for (const t of this.tasks){ m.text(`${t.kind === "ice" ? "🧊 Bring ice to the bar" : t.kind === "keg" ? "🍺 Change the keg" : "⚠ Mop the spill"}`, 28, y, 22, "#fff", 600); m.bar(420, y - 14, 300, 16, 1 - t.t/t.limit, t.t/t.limit > .7 ? "#ff6a5a" : "#ffc21a"); y += 38; }
  },
  end(){ this.m.dropProps(this.glasses); this.m.dropProps(this.props); }
};

/* ================= 🍾 Bottle service ================= */
Mogul.BOTTLES = [["Prosecco", 180], ["House vodka", 300], ["Premium tequila", 450], ["Champagne", 550], ["Premium vodka", 650], ["Rosé magnum", 800], ["Vintage champagne", 1400]];
Mogul.GAMES.bottle = Mogul.scripted({
  panelSide: .8,
  howTo: ["Read the table: how many, what they're celebrating, and their budget. Recommend the right bottle.", "Pick the bottle up at the bar, then carry it with the sparkler through the crowd without spilling.", "Show the label to the host before you open it. Pour evenly for the table.", "Close the tab correctly: bottle + 8% tax + 20% service."],
  vrTip: "When carrying, really hold the bottle (grip) upright and walk it to the VIP booth. Tip it too far and the sparkler drips.",
  make(s){
    const tables = [{who: "a birthday crew of 6", budget: 900, best: "Champagne", hint: "It's a birthday, so they want bubbles and a big moment."}, {who: "8 coworkers after a big win", budget: 1000, best: "Premium vodka", hint: "A big group wants something that goes far and mixes with anything."}, {who: "4 friends ready to party", budget: 600, best: "Premium tequila", hint: "They keep asking the DJ for reggaeton and doing shots."}, {who: "a couple on their anniversary", budget: 1600, best: "Vintage champagne", hint: "Something special, and money isn't a problem tonight."}];
    const t = this.t = s.train ? tables[0] : tables[Math.floor(Math.random()*tables.length)], opts = [t.best, ...this.m.BOTTLES.map(b => b[0]).filter(n => n !== t.best).sort(() => Math.random() - .5).slice(0, 2)].sort(() => Math.random() - .5);
    const price = n => this.m.BOTTLES.find(b => b[0] === n)[1];
    this.bottle = t.best;
    const total = b => Math.round(price(b)*1.28), wrong = [Math.round(price(t.best)*1.2), Math.round(price(t.best)*1.08 + 50), total(t.best) + 100];
    return [
      {type: "choice", title: `VIP table: ${t.who}`, text: `Budget about ${this.m.money(t.budget)}. ${t.hint} What do you recommend?`, log: "Recommendation", cash: 25,
        options: opts.map(n => ({t: `${n} · ${this.m.money(price(n))}`, s: n === t.best ? 100 : price(n) > t.budget ? 10 : 45, fb: n === t.best ? "Perfect pick. The host loves it." : price(n) > t.budget ? "Way over their budget. They look uncomfortable." : "It's fine, but it doesn't fit the occasion."})), after: () => {}},
      {type: "custom", run: g => g.carry()},
      {type: "choice", title: "You're at the table", text: "The host is waving you over. What first?", log: "Presentation", cash: 15, options: [{t: "Show the host the label, then open it with the sparkler up", s: 100, fb: "Classic. The table cheers when the cork pops."}, {t: "Pop it right away and start pouring", s: 40, fb: "A little rushed. They wanted to see the bottle."}, {t: "Hand the bottle to a guest to open", s: 5, fb: "Never hand off the bottle. That's your job."}]},
      {type: "hold", title: "Pour for the table", text: "Pour about 4 oz in each glass (2 glasses shown). Even pours, no overflowing.", log: "Pouring", cash: 20, rounds: [{label: "Glass 1", target: 4, max: 6, rate: 1.6, unit: "oz"}, {label: "Glass 2", target: 4, max: 6, rate: 1.9, unit: "oz"}]},
      {type: "choice", title: "Close the tab", text: `${t.best} is ${this.m.money(price(t.best))}. Add 8% tax and a 20% service charge (both on the bottle price). What's the total?`, log: "The tab", cash: 30, strike: "You charged the wrong amount.", options: [total(t.best), ...wrong].sort(() => Math.random() - .5).map(v => ({t: this.m.money(v), s: v === total(t.best) ? 100 : 0, fb: v === total(t.best) ? "Spot on." : `Not quite: it's ${this.m.money(total(t.best))}.`}))}
    ];
  },
  setup(s){ this.m.moveMe(-7.7, -2.4, {x: 0, z: .3}); },
  drawExtra(m, Y){ if (this.vrCarry) { m.text("🍾 Carry the bottle to the VIP booth up front. Keep it upright!", 28, Y + 40, 24, "#fff", 700, "left", m.W - 56); m.text(`⏱ ${Math.max(0, Math.ceil(60 - this.vrCarry.t))}s${this.vrCarry.spills ? "  💦 " + this.vrCarry.spills : ""}`, 28, Y + 80, 22, "#ffd87a", 700); } },
  carry(){
    const m = this.m, T = THREE, L = Lounge, vr = m.vr();
    m.moveMe(-7.7, -2.4, {x: 0, z: .3});
    const b = this.bob = new T.Group(); b.position.set(-8.45, 1.17, -2.6); L.worlds.club.group.add(b);
    b.add(new T.Mesh(Props.lathe([[0, 0], [.05, 0], [.052, .02], [.052, .2], [.03, .27], [.016, .3], [.016, .38], [0, .38]], 18), new T.MeshPhysicalMaterial({color: 0x1a3a1a, roughness: .1, clearcoat: 1})));
    const sp = new T.Sprite(new T.SpriteMaterial({map: L.glowT, color: 0xffe08a, transparent: true, depthWrite: false, blending: T.AdditiveBlending})); sp.scale.setScalar(.35); sp.position.y = .46; b.add(sp); this.spark = sp;
    if (vr){ L.grabbable(b); m.kit(this, {type: "info", title: "Carry the bottle", text: "Grab the bottle on the bar (hold grip), keep it upright, and walk it to the VIP booth up front. Tipping it spills.", btn: "I'm carrying it"}); this.vrCarry = {t: 0, tilt: 0}; this.kit.done = () => {}; return; }
    m.kit(this, {type: "info", title: "Pick up the bottle", text: "It's at the end of the bar with a sparkler. Next you'll carry it through the crowd: keep it level!", btn: "Pick it up ▶", done: () => {
      L.glide = {from: L.rig.position.clone(), to: new T.Vector3(0, L.rig.position.y, 1.6), t: 0}; b.position.set(.3, 1.2, 1.2);
      m.kit(this, {type: "balance", title: "Through the crowd…", text: "Dancers keep bumping you. Hold ◀ ▶ to keep the bottle level in the green.", dur: 9, force: 2.6, spillMsg: "Someone bumped you! A splash of champagne hit the floor.", done: sc => { m.score(sc, Math.round(sc/5)); m.shift.log.push(`Carry: ${Math.round(sc)}%`); if (sc < 30) m.strike("You spilled most of the bottle."); this.next(); }}); }});
  },
  tick(dt){
    const v = this.vrCarry; if (this.spark) this.spark.material.opacity = .6 + Math.random()*.4;
    if (!v || !this.bob) return; const m = this.m, b = this.bob, gd = b.userData.grab; v.t += dt;
    if (gd && gd.held){ b.updateMatrixWorld(true); const up = new THREE.Vector3(0, 1, 0).transformDirection(b.matrixWorld); if (up.y < .8){ v.tilt += dt; if (v.tilt > .6){ v.tilt = 0; v.spills = (v.spills || 0) + 1; m.say("You're tipping it! Champagne everywhere.", true); } }
      const wp = b.getWorldPosition(new THREE.Vector3()); if (Math.hypot(wp.x, wp.z - .5) < 1.3){ const sc = Math.max(0, 100 - (v.spills || 0)*25 - Math.max(0, v.t - 25)*2); this.vrCarry = null; m.score(sc, Math.round(sc/5)); m.shift.log.push(`Carry: ${Math.round(sc)}%`); this.kit = null; this.next(); } }
    if (v && v.t > 60){ this.vrCarry = null; this.m.strike("The table waited too long for their bottle."); this.kit = null; this.next(); }
  },
  outro(){ if (this.bob){ this.m.dropProps([this.bob]); this.bob = null; } const m = this.m; m.emoji("🍾", new THREE.Vector3(0, 2, .5)); try{ Lounge.burst(new THREE.Vector3(0, 1.6, .5), 16); }catch(e){} return "The VIP table had a great night. 🍾"; },
  end(){ if (this.bob){ this.m.dropProps([this.bob]); this.bob = null; } }
});

/* ================= 📣 Promoter ================= */
Mogul.GAMES.promoter = Mogul.scripted({
  howTo: ["Look at your audience data and pick the night's theme.", "Book a DJ who fits the theme and the budget.", "Pick the marketing channels that reach that crowd, and an offer that gets them in early.", "Handle the curveball (rain, a rival party), then check VIPs in fast at the door."],
  make(s){
    const aud = s.train ? {afro: 45, hiphop: 30, latin: 25} : (() => { const a = Math.random()*60 + 20, b = Math.random()*(100 - a); return {afro: Math.round(a), hiphop: Math.round(b), latin: Math.round(100 - a - b)}; })();
    const best = Object.entries(aud).sort((a, b) => b[1] - a[1])[0][0], name = {afro: "Afrobeats Friday", hiphop: "Hip-Hop & R&B Night", latin: "Noche Latina"};
    const djs = {afro: "DJ Tunde (Afrobeats, $400)", hiphop: "DJ Kash (Hip-Hop, $450)", latin: "DJ Luna (Reggaeton, $380)"};
    const N = this.m.NAMES, vip = Array.from({length: 4}, () => N[0][Math.floor(Math.random()*N[0].length)] + " " + N[1][Math.floor(Math.random()*N[1].length)]);
    const curve = Math.random() < .5 ? {t: "Rain is in the forecast for Friday night.", o: [["Post: “Free coat check, we're right by the train. Rain or shine, we're dancing.”", 100], ["Postpone the party", 20], ["Ignore it", 40]]} : {t: "A bigger club announced a party the same night.", o: [["Team up: their after-party moves to your club", 100], ["Cut your cover to $0 all night", 45], ["Post something trash-talking them", 5]]};
    return [
      {type: "choice", title: "Pick the night's theme", text: `Your followers: ${aud.afro}% love Afrobeats, ${aud.hiphop}% Hip-Hop/R&B, ${aud.latin}% Latin. What's Friday?`, log: "Theme", cash: 40, options: Object.keys(name).map(k => ({t: name[k], s: k === best ? 100 : 40 + aud[k]/2, fb: k === best ? "That's what your crowd wants." : "Some people will come, but not your biggest crowd."}))},
      {type: "choice", title: "Book the DJ", text: `Budget: $500. The theme is ${name[best]}.`, log: "DJ booking", cash: 40, options: Object.keys(djs).map(k => ({t: djs[k], s: k === best ? 100 : 30, fb: k === best ? "Perfect fit." : "Great DJ, wrong crowd for this theme."}))},
      {type: "choice", title: "Main channel", text: "Your crowd is 21–30 and lives on their phones. Where do you spend most of the budget?", log: "Marketing", cash: 40, options: [{t: "Instagram & TikTok videos with the DJ", s: 100, fb: "Reach and shares through the roof."}, {t: "Newspaper ad", s: 10, fb: "Not where this crowd looks."}, {t: "Text blast to your regulars", s: 70, fb: "Solid, but it won't reach new people."}]},
      {type: "choice", title: "The offer", text: "You want people in early so the line looks great by 11.", log: "Offer", cash: 30, options: [{t: "Free entry before 11 with an RSVP", s: 100, fb: "Early crowd, great line, big night."}, {t: "No offer", s: 35, fb: "People show up late and the room feels empty early."}, {t: "Half-price drinks all night", s: 55, fb: "Busy, but the bar loses money."}]},
      {type: "choice", title: "Curveball!", text: curve.t, log: "Curveball", cash: 30, options: curve.o.map(([t, sc]) => ({t, s: sc}))},
      {type: "match", title: "Check in your VIPs", text: "Your VIPs are arriving. Tap their names fast so they skip the line.", log: "VIP check-in", cash: 30, time: 6, rounds: vip.map(n => ({q: `Here's ${n}`, correct: n, options: [n, ...vip.filter(v => v !== n).slice(0, 1), n.split(" ")[0] + " " + N[1][Math.floor(Math.random()*16)], N[0][Math.floor(Math.random()*N[0].length)] + " " + n.split(" ")[1]].sort(() => Math.random() - .5)}))}
    ];
  },
  setup(){ this.m.moveMe(6.6, .2, {x: 0, z: -6}); },
  outro(){ const m = this.m, sc = m.shift.scores.reduce((a, b) => a + b, 0)/Math.max(1, m.shift.scores.length), heads = Math.round(120 + sc*2.2); m.shift.earn += Math.round(heads*.6); m.shift.log.push(`${heads} people came through the door`); return `${heads} people came out on your list. 📣`; }
});

/* ================= 🌟 Celebrity ================= */
Mogul.GAMES.celebrity = Mogul.scripted({
  howTo: ["Red carpet: when a camera flashes, face it (tap the direction, or turn your head in VR).", "Answer the press like a pro. No drama.", "Sign for fans in rhythm, then hype the crowd from the stage on the beat.", "Your fame grows with every great appearance, and so does your fee."],
  vrTip: "On the red carpet, actually turn your head toward each camera flash.",
  make(s){
    return [
      {type: "dir", title: "Red carpet", text: "Cameras everywhere. Face each flash fast.", count: s.train ? 3 : 6, window: s.train ? 2 : 1.3, log: "Red carpet", cash: 60},
      {type: "choice", title: "A reporter asks…", text: "“Rumor is you're feuding with another artist. Any comment?”", log: "Press", cash: 50, options: [{t: "“I wish everybody success. Tonight's about the fans.”", s: 100, fb: "Classy. That clip goes viral for the right reasons."}, {t: "“They know what they did.”", s: 10, fb: "Now it's a headline. Your team is not happy."}, {t: "Walk off without answering", s: 50, fb: "It looks a little shady, but no damage done."}]},
      {type: "timing", title: "Sign for fans", text: "Sign each autograph smoothly. Tap when the pen is in the zone.", count: s.train ? 2 : 4, speed: .7, zw: .2, log: "Autographs", cash: 50},
      {type: "choice", title: "A fan asks…", text: "A fan wants to come into your VIP section, and they seem young.", log: "VIP section", cash: 40, options: [{t: "“Love you! Security will check IDs; if you're 21+, come say hi.”", s: 100, fb: "Kind and safe. Exactly right."}, {t: "Sneak them in yourself", s: 0, fb: "Never. If they're underage, that's a scandal and worse."}, {t: "Ignore them", s: 40, fb: "Not a great look."}]},
      {type: "rhythm", title: "Hype the crowd!", text: "On stage: hit each beat as it reaches the line.", bpm: 100, count: s.train ? 8 : 14, log: "Stage hype", cash: 80}
    ];
  },
  setup(){ this.m.moveMe(7.2, .6, {x: 0, z: -6}); },
  outro(){ const m = this.m, sc = m.shift.scores.reduce((a, b) => a + b, 0)/Math.max(1, m.shift.scores.length); m.shift.fame = Math.round(sc/10); m.emoji("🌟", new THREE.Vector3(0, 2.6, -8)); return `Fame +${m.shift.fame}. Your appearance fee goes up as you get more famous.`; }
});

/* ================= 🎂 Birthday boy / girl ================= */
Mogul.GAMES.birthday = Mogul.scripted({
  howTo: ["You have a budget. Pick friends who bring the fun, and a cake that fits.", "Ask the DJ for the birthday song at the right moment.", "Win the dance-off, and handle the drama (spills, an ex, a lost phone) with grace.", "The more fun the night, the more gifts you get."],
  make(s){
    return [
      {type: "choice", title: "Who's coming?", text: "You can bring one more friend. Who makes the night better?", log: "Guest list", cash: 30, options: [{t: "Jaylen: always first on the dance floor", s: 100, fb: "Instant energy."}, {t: "Riley: complains about the music everywhere", s: 20, fb: "Hmm. You'll hear about the playlist all night."}, {t: "Sam: brings drama with every ex", s: 10, fb: "Risky…"}]},
      {type: "choice", title: "Pick the cake", text: "Budget left: $120.", log: "Cake", cash: 25, options: [{t: "Gold drip cake with sparklers · $95", s: 100, fb: "A showstopper, and in budget."}, {t: "Five-tier fondant cake · $340", s: 15, fb: "Gorgeous, and way over budget."}, {t: "Gas station cupcakes · $8", s: 35, fb: "Cheap… and it shows."}]},
      {type: "timing", title: "Cue the birthday song", text: "Tap when the crowd energy peaks so the DJ drops the birthday song at the best moment.", count: 1, speed: .5, zw: .18, log: "Birthday song", cash: 40, before: () => this.cake()},
      {type: "rhythm", title: "Dance-off!", text: "Someone challenged you. Hit the moves on the beat.", bpm: 110, count: s.train ? 8 : 14, log: "Dance-off", cash: 60},
      {type: "choice", title: "Uh oh…", text: "Someone bumps into you and spills a drink on your outfit.", log: "Drama", cash: 30, options: [{t: "Laugh it off and grab napkins: it's your night", s: 100, fb: "The vibe stays perfect."}, {t: "Demand they pay for the outfit", s: 30, fb: "The mood dips for a while."}, {t: "Start a fight", s: 0, fb: "Security walks you out on your own birthday."}]}
    ];
  },
  setup(){ this.m.moveMe(.2, 1.4, 0); },
  cake(){ const T = THREE, g = this.cakeG = new T.Group(); g.position.set(0, .5, -.2); Lounge.worlds.club.group.add(g);
    g.add(new T.Mesh(new T.CylinderGeometry(.18, .18, .16, 24), new T.MeshStandardMaterial({color: 0xf6e0c8, roughness: .6}))).position.y = .08;
    g.add(new T.Mesh(new T.CylinderGeometry(.185, .185, .03, 24), new T.MeshStandardMaterial({color: 0xd4a937, metalness: .8, roughness: .3}))).position.y = .16;
    for (let i = 0; i < 5; i++){ const a = i/5*Math.PI*2, c = new T.Mesh(new T.CylinderGeometry(.006, .006, .06, 6), new T.MeshStandardMaterial({color: 0xff8ad8})); c.position.set(Math.cos(a)*.1, .2, Math.sin(a)*.1); g.add(c);
      const f = new T.Sprite(new T.SpriteMaterial({map: Lounge.glowT, color: 0xffb040, transparent: true, depthWrite: false, blending: T.AdditiveBlending})); f.scale.setScalar(.06); f.position.set(Math.cos(a)*.1, .245, Math.sin(a)*.1); g.add(f); } },
  outro(){ const m = this.m; if (this.cakeG){ const g = this.cakeG; setTimeout(() => m.dropProps([g]), 8000); } m.emoji("🎂", new THREE.Vector3(0, 1.4, -.2)); try{ Lounge.burst(new THREE.Vector3(0, 1.5, -.2), 24); }catch(e){} return "Best. Birthday. Ever. Your friends chipped in gifts. 🎁"; },
  end(){ if (this.cakeG && !this.m.shift.over) this.m.dropProps([this.cakeG]); }
});

/* ================= ❓ Question banks: every game draws fresh questions and doesn't repeat until it has used them all ================= */
const QB = {
  /* each item: [question, right answer, wrong, wrong, (wrong)] */
  music: [
    ["Hip-hop was born at a 1973 back-to-school party in which New York borough?", "The Bronx", "Brooklyn", "Queens", "Harlem"],
    ["Which DJ threw that 1973 party at 1520 Sedgwick Avenue?", "DJ Kool Herc", "Grandmaster Flash", "Afrika Bambaataa", "DJ Premier"],
    ["Which 1979 single was the first hip-hop record to become a Top 40 hit?", "“Rapper's Delight” by The Sugarhill Gang", "“The Message” by Grandmaster Flash", "“Walk This Way” by Run-DMC", "“It Takes Two” by Rob Base"],
    ["“The Message” (1982) is by…", "Grandmaster Flash and the Furious Five", "The Sugarhill Gang", "Public Enemy", "LL Cool J"],
    ["Run-DMC teamed up with which rock band on “Walk This Way” (1986)?", "Aerosmith", "Led Zeppelin", "The Rolling Stones", "Queen"],
    ["What was The Notorious B.I.G.'s real name?", "Christopher Wallace", "Sean Combs", "Shawn Carter", "Calvin Broadus"],
    ["Dr. Dre's 1992 debut solo album is…", "The Chronic", "2001", "Doggystyle", "Straight Outta Compton"],
    ["N.W.A.'s 1988 debut album is…", "Straight Outta Compton", "The Chronic", "Efil4zaggin", "AmeriKKKa's Most Wanted"],
    ["The first single from Kanye West's The College Dropout was…", "Through the Wire", "Jesus Walks", "All Falls Down", "Gold Digger"],
    ["Which album followed Kanye West's The College Dropout?", "Late Registration", "Graduation", "808s & Heartbreak", "Yeezus"],
    ["Kendrick Lamar's debut studio album is…", "Section.80", "good kid, m.A.A.d city", "To Pimp a Butterfly", "DAMN."],
    ["Which Kendrick Lamar album won the Pulitzer Prize for Music?", "DAMN.", "To Pimp a Butterfly", "Section.80", "Mr. Morale & the Big Steppers"],
    ["Jay-Z's The Blueprint came out in…", "2001", "1996", "2006", "1999"],
    ["Lauryn Hill's 1998 solo album is called…", "The Miseducation of Lauryn Hill", "The Score", "Unplugged", "Ready or Not"],
    ["OutKast is from which city?", "Atlanta", "Houston", "New Orleans", "Memphis"],
    ["Missy Elliott's hometown is…", "Portsmouth, Virginia", "Atlanta, Georgia", "Detroit, Michigan", "Newark, New Jersey"],
    ["Which album did Eminem's breakout single “My Name Is” come from?", "The Slim Shady LP", "The Marshall Mathers LP", "The Eminem Show", "Encore"],
    ["Drake's debut studio album is…", "Thank Me Later", "Take Care", "So Far Gone", "Views"],
    ["Breaking made its Olympic debut at which Games?", "Paris 2024", "Tokyo 2020", "Los Angeles 2028", "Brisbane 2032"],
    ["Trap music grew up mostly in which city?", "Atlanta", "Chicago", "Los Angeles", "Miami"],
    ["Who is called the Queen of Soul?", "Aretha Franklin", "Diana Ross", "Gladys Knight", "Patti LaBelle"],
    ["Who is called the Godfather of Soul?", "James Brown", "Ray Charles", "Otis Redding", "Sam Cooke"],
    ["Who founded Motown Records in Detroit in 1959?", "Berry Gordy", "Quincy Jones", "Clive Davis", "Ahmet Ertegun"],
    ["Michael Jackson's best-selling album is…", "Thriller", "Bad", "Off the Wall", "Dangerous"],
    ["“What's Going On” (1971) is by…", "Marvin Gaye", "Stevie Wonder", "Curtis Mayfield", "Al Green"],
    ["Prince's 1984 album and film share which title?", "Purple Rain", "1999", "Sign o' the Times", "Under the Cherry Moon"],
    ["Who wrote “I Will Always Love You” before Whitney Houston's famous version?", "Dolly Parton", "Diane Warren", "Carole King", "Babyface"],
    ["Beyoncé first became famous in which group?", "Destiny's Child", "TLC", "En Vogue", "SWV"],
    ["Who recorded “Respect” before Aretha Franklin made it a 1967 anthem?", "Otis Redding", "Sam Cooke", "Wilson Pickett", "James Brown"],
    ["George Clinton led which funk collective?", "Parliament-Funkadelic", "Earth, Wind & Fire", "Kool & the Gang", "The Gap Band"],
    ["Usher's diamond-selling 2004 album is…", "Confessions", "8701", "Here I Stand", "Raymond v. Raymond"],
    ["Jazz is widely said to have been born in which city?", "New Orleans", "Chicago", "Kansas City", "New York"],
    ["Which jazz legend was nicknamed “Satchmo”?", "Louis Armstrong", "Duke Ellington", "Count Basie", "Dizzy Gillespie"],
    ["Miles Davis's best-selling 1959 album is…", "Kind of Blue", "Bitches Brew", "Sketches of Spain", "Birth of the Cool"],
    ["John Coltrane's spiritual 1965 album is…", "A Love Supreme", "Giant Steps", "Blue Train", "Ascension"],
    ["Ella Fitzgerald was known as…", "The First Lady of Song", "Lady Day", "The Divine One", "The Empress of the Blues"],
    ["Charlie “Bird” Parker played which instrument?", "Alto saxophone", "Trumpet", "Piano", "Double bass"],
    ["Bob Marley's band was called…", "The Wailers", "Toots and the Maytals", "Steel Pulse", "Third World"],
    ["Reggae was born in which country?", "Jamaica", "Trinidad and Tobago", "Barbados", "Cuba"],
    ["Fela Kuti pioneered which genre?", "Afrobeat", "Highlife", "Juju", "Amapiano"],
    ["Burna Boy is from which country?", "Nigeria", "Ghana", "South Africa", "Kenya"],
    ["Amapiano music comes from which country?", "South Africa", "Nigeria", "Angola", "Tanzania"],
    ["Reggaeton grew up mostly in which Caribbean island in the 1990s?", "Puerto Rico", "Jamaica", "Cuba", "Trinidad"],
    ["Who sang “Despacito” (2017)?", "Luis Fonsi and Daddy Yankee", "J Balvin and Bad Bunny", "Shakira and Maluma", "Pitbull and Marc Anthony"],
    ["Celia Cruz is known as the Queen of…", "Salsa", "Merengue", "Bachata", "Cumbia"],
    ["House music was born in which city?", "Chicago", "Detroit", "New York", "London"],
    ["Techno was born in which city?", "Detroit", "Chicago", "Berlin", "Manchester"],
    ["Go-go music is the sound of which city?", "Washington, D.C.", "Baltimore", "Philadelphia", "Richmond"],
    ["The Roland TR-808 is a famous…", "Drum machine", "Turntable", "Microphone", "Guitar pedal"],
    ["How many keys does a standard piano have?", "88", "76", "61", "100"],
    ["In music, BPM stands for…", "Beats per minute", "Bass per measure", "Bars per melody", "Beats per measure"],
    ["How many lines are on a musical staff?", "5", "4", "6", "7"],
    ["Most house music sits at about what tempo?", "120 to 128 BPM", "60 to 70 BPM", "170 to 180 BPM", "90 to 95 BPM"],
    ["A song's catchy repeated part is called the…", "Hook", "Bridge", "Outro", "Verse"],
    ["What does a DJ do when “beatmatching”?", "Lines up two tracks to the same tempo", "Plays two songs in different keys", "Turns the bass all the way up", "Talks over the intro"]
  ],
  dance: [
    ["Salsa's roots are mainly in which country's music and dance?", "Cuba", "Brazil", "Spain", "Mexico"],
    ["Bachata comes from…", "The Dominican Republic", "Colombia", "Cuba", "Venezuela"],
    ["Kizomba comes from…", "Angola", "Cape Verde", "Brazil", "Portugal"],
    ["The Argentine tango was born around…", "Buenos Aires and Montevideo", "Madrid and Seville", "Havana", "Mexico City"],
    ["The cha-cha came from Cuba in which decade?", "The 1950s", "The 1920s", "The 1970s", "The 1990s"],
    ["The Lindy Hop was born in which neighborhood?", "Harlem, New York", "The French Quarter, New Orleans", "South Side, Chicago", "Watts, Los Angeles"],
    ["The Charleston craze swept the U.S. in which decade?", "The 1920s", "The 1950s", "The 1890s", "The 1970s"],
    ["The Hustle was a disco dance from which city in the 1970s?", "New York", "Miami", "Detroit", "Philadelphia"],
    ["Breaking (breakdancing) started in which borough in the 1970s?", "The Bronx", "Brooklyn", "Manhattan", "Staten Island"],
    ["Vogue dancing grew out of which scene?", "Harlem's ballroom scene", "Hollywood musicals", "Paris fashion shows", "Ballet schools"],
    ["Michael Jackson first showed the moonwalk on TV at…", "Motown 25 in 1983", "The Grammys in 1984", "Soul Train in 1979", "The Super Bowl in 1993"],
    ["A waltz is counted in…", "Threes (1-2-3)", "Fours (1-2-3-4)", "Twos (1-2)", "Sixes"],
    ["Krumping started in which city in the early 2000s?", "Los Angeles", "Atlanta", "Chicago", "New York"],
    ["Locking was created by…", "Don Campbell", "Michael Jackson", "Bob Fosse", "Gene Kelly"],
    ["Cumbia comes from…", "Colombia", "Argentina", "Peru", "Chile"],
    ["Merengue is the national dance of…", "The Dominican Republic", "Puerto Rico", "Cuba", "Haiti"],
    ["The polka started in Bohemia, now part of…", "The Czech Republic", "Austria", "Poland", "Germany"],
    ["In salsa “On1”, you break forward on count…", "1", "2", "4", "8"],
    ["What's a “freeze” in breaking?", "Holding a still pose, often on your hands", "A spin on your back", "Fast footwork near the floor", "A jump turn"],
    ["Toprock in breaking is…", "Dancing standing up before going to the floor", "Spinning on your head", "Holding a handstand", "A partner lift"]
  ],
  fitness: [
    ["What should you do before a hard workout?", "Warm up with 5 to 10 minutes of light movement", "Stretch cold muscles as far as they go", "Go straight to your heaviest weight", "Eat a huge meal"],
    ["Which is safe squat form?", "Chest up, back flat, knees tracking over your toes", "Knees caving in, back rounded", "Heels off the floor, leaning way forward", "Locked knees and a bent back"],
    ["A good plank looks like…", "A straight line from head to heels", "Hips high in the air", "Hips sagging to the floor", "Head hanging down"],
    ["When lifting, you usually breathe out…", "On the effort (the hard part)", "Never: hold your breath the whole time", "Only between sets", "On the easy part"],
    ["HIIT stands for…", "High-intensity interval training", "Heavy iron interval training", "Healthy indoor intensity training", "High-impact isometric training"],
    ["Why do rest days matter?", "Muscles repair and get stronger while you rest", "They don't: train hard every day", "Rest makes you lose all progress", "Only beginners need them"],
    ["Static stretches (holding still) are best done…", "After your workout", "Before sprinting, held for minutes", "Never", "In the middle of a heavy set"],
    ["How should you drink water during exercise?", "Sip regularly before, during and after", "Only once you feel dizzy", "Chug a gallon at the end", "Avoid water while training"],
    ["Most adults need about how much sleep a night?", "At least 7 hours", "4 hours", "12 hours", "It doesn't matter"],
    ["Sharp pain (not just burn) during an exercise means…", "Stop and check it", "Push harder", "Add more weight", "Hold your breath"],
    ["In a push-up, your elbows should…", "Bend at about 45° from your body", "Flare straight out to the sides", "Lock straight the whole time", "Point forward"],
    ["A deadlift should be done by…", "Hinging at the hips with a flat back", "Rounding your back to reach the bar", "Jerking the bar up fast", "Lifting with your arms"],
    ["Cardio mainly trains your…", "Heart and lungs", "Hair and nails", "Eyesight", "Bones only"],
    ["The “burn” in your muscles during reps is…", "Normal fatigue from hard work", "Always an injury", "A sign to add more weight", "Dehydration"],
    ["After a workout, protein helps your…", "Muscles recover", "Bones grow longer", "Eyes focus", "Hair grow faster"],
    ["Good running posture is…", "Tall, relaxed shoulders, arms swinging forward", "Hunched over, fists clenched", "Leaning way back", "Arms crossing your chest"]
  ],
  mind: [
    ["A worry about tomorrow pops into your head. What do you do?", "Notice it kindly, let it float by, and return to your breath", "Push it away angrily", "Follow it and plan everything out"],
    ["Your shoulders feel tight. What helps?", "Drop them on an exhale and soften your jaw", "Hold them up high and hope it passes", "Check your phone"],
    ["Your mind has wandered for a minute. What now?", "Gently come back. Noticing it IS the practice.", "Give up: you're bad at this", "Scold yourself for it"],
    ["Box breathing is…", "In 4, hold 4, out 4, hold 4", "As fast as you can for a minute", "Holding your breath as long as possible", "Breathing only through your mouth"],
    ["A body scan means…", "Slowly noticing each part of your body, head to toe", "Checking yourself in a mirror", "Counting your heartbeat out loud", "Stretching every muscle hard"],
    ["A noisy sound outside breaks your focus. Try…", "Let the sound be part of the moment, then return to your breath", "Get up and yell", "Quit for today"],
    ["Which posture helps meditation?", "Upright but relaxed, hands resting", "Slumped and tense", "Standing on one foot", "Lying face down"],
    ["Counting breaths, you lose count at 6. What do you do?", "Start again at 1, no big deal", "Stop meditating", "Make up a number"],
    ["A slow, long exhale tends to…", "Calm your body down", "Make you jittery", "Raise your heart rate", "Do nothing at all"],
    ["Gratitude practice means…", "Noticing a few things you're thankful for", "Listing everything that went wrong", "Comparing yourself to others"]
  ],
  riddle: [
    ["I have keys but open no locks. I have space but no room. What am I?", "A keyboard", "A piano tuner", "A door"],
    ["The more you take, the more you leave behind. What am I?", "Footsteps", "Memories", "Money"],
    ["What gets wetter the more it dries?", "A towel", "A sponge", "The rain"],
    ["I speak without a mouth and hear without ears. What am I?", "An echo", "A ghost", "A radio"],
    ["What has to be broken before you can use it?", "An egg", "A promise", "A record"],
    ["What has hands but can't clap?", "A clock", "A glove", "A statue"],
    ["What has a neck but no head?", "A bottle", "A guitar pick", "A scarf"],
    ["What goes up but never comes down?", "Your age", "A balloon", "Smoke"],
    ["What has many teeth but can't bite?", "A comb", "A zipper's pull", "A shark doll"],
    ["What can you catch but not throw?", "A cold", "A ball", "A wave"],
    ["What has one eye but can't see?", "A needle", "A cyclops", "A storm"],
    ["The more of me there is, the less you see. What am I?", "Darkness", "Fog", "Glasses"],
    ["What has legs but doesn't walk?", "A table", "A spider", "A snake"],
    ["What is full of holes but still holds water?", "A sponge", "A net", "A bucket"],
    ["What gets bigger the more you take away from it?", "A hole", "A pile", "A shadow"],
    ["What runs but never walks, has a mouth but never talks?", "A river", "A clock", "A road"],
    ["What has a head and a tail but no body?", "A coin", "A snake", "A comet"],
    ["What can travel around the world while staying in a corner?", "A stamp", "A map", "The moon"],
    ["What building has the most stories?", "A library", "A skyscraper", "A hotel"],
    ["What belongs to you, but other people use it more than you do?", "Your name", "Your phone", "Your car"],
    ["What has cities but no houses, forests but no trees, and water but no fish?", "A map", "A desert", "A dream"],
    ["Which month has 28 days?", "All of them", "February", "None"],
    ["I'm tall when I'm young and short when I'm old. What am I?", "A candle", "A tree", "A pencil sharpener"],
    ["What can fill a room but takes up no space?", "Light", "Air", "Water"],
    ["What has words but never speaks?", "A book", "A parrot", "A singer"],
    ["What comes once in a minute, twice in a moment, but never in a thousand years?", "The letter M", "A heartbeat", "A blink"],
    ["What invention lets you look right through a wall?", "A window", "X-ray glasses", "A mirror"],
    ["What has a ring but no finger?", "A telephone", "A boxer", "A bell tower"],
    ["What kind of band never plays music?", "A rubber band", "A boy band", "A marching band"],
    ["What has an eye but never cries, and spins in a storm?", "A hurricane", "A potato", "A needle"],
    ["Forward I'm heavy, backward I'm not. What am I?", "Ton", "Rock", "Lead"],
    ["What can you hold in your right hand but never in your left?", "Your left hand (or elbow)", "A pen", "A cup"],
    ["What has 13 hearts but no other organs?", "A deck of cards", "A hospital", "A valentine box"],
    ["What goes through cities and fields but never moves?", "A road", "A train", "The wind"],
    ["What can't talk but will reply when spoken to?", "An echo", "A mirror", "A parrot"],
    ["What has hands but can't clap?", "A clock", "A statue", "A glove"],
    ["What gets wetter the more it dries?", "A towel", "A sponge cake", "The sun"],
    ["What has a neck but no head?", "A bottle", "A guitar pick", "A scarf"],
    ["What runs all around a yard without moving?", "A fence", "A dog", "A hose"],
    ["I'm tall when I'm young and short when I'm old. What am I?", "A candle", "A tree", "A pencil sharpener"],
    ["What has many teeth but can't bite?", "A comb", "A shark fossil", "A zipper pull"],
    ["What building has the most stories?", "A library", "A skyscraper", "A hotel"],
    ["What can you catch but not throw?", "A cold", "A ball", "A wave"],
    ["What has one eye but can't see?", "A needle", "A pirate", "A storm cloud"],
    ["What goes up but never comes down?", "Your age", "A balloon", "A rocket"],
    ["What word is spelled wrong in every dictionary?", "Wrong", "Dictionary", "Misspelled"],
    ["What has legs but doesn't walk?", "A table", "A snake", "A cloud"],
    ["What belongs to you, but other people use it more than you do?", "Your name", "Your phone", "Your car"],
    ["The person who makes it sells it. The person who buys it never uses it. What is it?", "A coffin", "A gift card", "A ticket"],
    ["I have cities but no houses, forests but no trees, water but no fish. What am I?", "A map", "A desert", "A painting"],
    ["What can fill a room but takes up no space?", "Light", "Air", "Furniture"],
    ["What is always in front of you but can't be seen?", "The future", "Your nose", "Glass"],
    ["What has to be broken before you can use it?", "An egg", "A promise", "A record"]
  ],
  /* general knowledge for the Escape Room's professor and the puzzle games */
  brain: [
    ["What is the largest planet in our solar system?", "Jupiter", "Saturn", "Neptune", "Earth"],
    ["How many continents are there?", "7", "5", "6", "8"],
    ["What gas do plants take in from the air?", "Carbon dioxide", "Oxygen", "Helium", "Nitrogen"],
    ["What is the hardest natural substance?", "Diamond", "Gold", "Iron", "Quartz"],
    ["Which ocean is the largest?", "The Pacific", "The Atlantic", "The Indian", "The Arctic"],
    ["How many sides does a hexagon have?", "6", "5", "7", "8"],
    ["What is the boiling point of water at sea level in Celsius?", "100°C", "90°C", "212°C", "80°C"],
    ["Which planet is known as the Red Planet?", "Mars", "Venus", "Mercury", "Jupiter"],
    ["What is the chemical symbol for gold?", "Au", "Ag", "Go", "Gd"],
    ["Who painted the Mona Lisa?", "Leonardo da Vinci", "Michelangelo", "Vincent van Gogh", "Pablo Picasso"],
    ["What is the longest river in Africa?", "The Nile", "The Congo", "The Niger", "The Zambezi"],
    ["How many minutes are in a day?", "1,440", "1,240", "2,400", "1,000"],
    ["Which animal is the largest mammal on Earth?", "The blue whale", "The African elephant", "The giraffe", "The sperm whale"],
    ["What is the square root of 144?", "12", "14", "11", "16"],
    ["Which country gave the Statue of Liberty to the United States?", "France", "England", "Spain", "Italy"],
    ["How many bones are in an adult human body?", "206", "186", "250", "300"],
    ["What does a thermometer measure?", "Temperature", "Air pressure", "Humidity", "Wind speed"],
    ["Which is the smallest prime number?", "2", "1", "3", "0"],
    ["What is the capital of Japan?", "Tokyo", "Kyoto", "Osaka", "Seoul"],
    ["In which year did humans first land on the Moon?", "1969", "1959", "1972", "1965"],
    ["What do bees make?", "Honey", "Silk", "Wax paper", "Pollen bread"],
    ["How many players are on a soccer team on the field?", "11", "9", "10", "12"],
    ["Which instrument has 88 keys?", "The piano", "The organ", "The accordion", "The harpsichord"],
    ["What color do you get when you mix blue and yellow?", "Green", "Purple", "Orange", "Brown"],
    ["Which shape has three sides?", "A triangle", "A square", "A pentagon", "A circle"],
    ["What is the freezing point of water in Fahrenheit?", "32°F", "0°F", "100°F", "40°F"],
    ["Who wrote Romeo and Juliet?", "William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
    ["What is the fastest land animal?", "The cheetah", "The lion", "The horse", "The greyhound"],
    ["How many hours are in a week?", "168", "148", "172", "160"],
    ["Which organ pumps blood around the body?", "The heart", "The lungs", "The liver", "The kidneys"],
    ["What is the main language spoken in Brazil?", "Portuguese", "Spanish", "Brazilian", "French"],
    ["Which planet has the most famous rings?", "Saturn", "Uranus", "Mars", "Mercury"],
    ["What is 15 × 4?", "60", "45", "54", "65"],
    ["What is the tallest mountain on Earth above sea level?", "Mount Everest", "K2", "Kilimanjaro", "Denali"],
    ["Which city is home to the Eiffel Tower?", "Paris", "Rome", "London", "Brussels"],
    ["What is H2O better known as?", "Water", "Salt", "Hydrogen gas", "Ice cream"],
    ["Which month has the fewest days?", "February", "April", "June", "November"],
    ["What is the opposite of 'ancient'?", "Modern", "Old", "Antique", "Historic"],
    ["How many strings does a standard guitar have?", "6", "4", "5", "12"],
    ["Which country is shaped like a boot?", "Italy", "Greece", "Portugal", "Chile"]
  ],
  caps: [["FRANCE", "Paris"], ["JAPAN", "Tokyo"], ["KENYA", "Nairobi"], ["CANADA", "Ottawa"], ["AUSTRALIA", "Canberra"], ["BRAZIL", "Brasília"], ["EGYPT", "Cairo"], ["SPAIN", "Madrid"], ["ITALY", "Rome"], ["GERMANY", "Berlin"], ["MEXICO", "Mexico City"], ["INDIA", "New Delhi"], ["GHANA", "Accra"], ["NIGERIA", "Abuja"], ["JAMAICA", "Kingston"], ["PERU", "Lima"], ["ARGENTINA", "Buenos Aires"], ["NORWAY", "Oslo"], ["SOUTH KOREA", "Seoul"], ["THAILAND", "Bangkok"], ["PORTUGAL", "Lisbon"], ["IRELAND", "Dublin"], ["GREECE", "Athens"], ["TURKEY", "Ankara"], ["CHINA", "Beijing"], ["SOUTH AFRICA", "Pretoria"], ["MOROCCO", "Rabat"], ["CUBA", "Havana"], ["SWEDEN", "Stockholm"], ["RUSSIA", "Moscow"]],
  words: ["MUSIC", "DANCE", "BASS", "VIBES", "RHYTHM", "GROOVE", "PARTY", "TEMPO", "SOUL", "JAZZ", "BEAT", "DRUMS", "PIANO", "SALSA", "LYRIC", "VINYL", "STAGE", "CHORUS", "SPEAKER", "MELODY", "REMIX", "HOOK", "FUNK", "DISCO", "SWING", "TRUMPET", "GUITAR", "STUDIO", "ENCORE", "SPOTLIGHT"],
  /* pick n items from a bank without repeating until every item has been seen */
  pick(bank, n){
    const all = this[bank], seen = new Set(store.get("qbSeen:" + bank, [])); let fresh = all.map((_, i) => i).filter(i => !seen.has(i));
    if (fresh.length < n){ seen.clear(); fresh = all.map((_, i) => i); }
    const out = []; while (out.length < n && fresh.length){ const k = Math.floor(Math.random()*fresh.length); out.push(fresh.splice(k, 1)[0]); }
    out.forEach(i => seen.add(i)); store.set("qbSeen:" + bank, [...seen]); return out.map(i => all[i]);
  },
  shuffle(a){ return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]); },
  /* a ready-made multiple-choice stage */
  choice(item, o = {}){ const [q, a, ...w] = item; return Object.assign({type: "choice", title: o.title || "Question", text: q, log: o.log || "Question", cash: o.cash || 20, time: o.time, options: this.shuffle([a, ...w.slice(0, 3)]).map(t => ({t, s: t === a ? 100 : 0, fb: t === a ? (o.yes || "Correct!") : `Not quite. It's ${a}.`}))}, o.extra || {}); },
  /* puzzles made fresh every time */
  math(){ const a = 2 + Math.floor(Math.random()*12), b = 2 + Math.floor(Math.random()*12), c = 1 + Math.floor(Math.random()*20), r = a*b + c, w = new Set([r]); while (w.size < 4) w.add(r + (Math.floor(Math.random()*13) - 6 || 7));
    return {q: `The lock wants ${a} × ${b} + ${c}. What's the number?`, correct: String(r), options: this.shuffle([...w].map(String))}; },
  sequence(){ const kinds = [() => { const s = 1 + Math.floor(Math.random()*5), d = 2 + Math.floor(Math.random()*6); return [[s, s + d, s + 2*d, s + 3*d], s + 4*d]; }, () => { const s = 1 + Math.floor(Math.random()*3), k = 2 + Math.floor(Math.random()*2); return [[s, s*k, s*k*k, s*k*k*k], s*k*k*k*k]; }, () => { const a = 1 + Math.floor(Math.random()*3), b = a + 1 + Math.floor(Math.random()*2); const f = [a, b]; while (f.length < 5) f.push(f[f.length - 1] + f[f.length - 2]); return [f.slice(0, 4), f[4]]; }, () => { const s = 1 + Math.floor(Math.random()*4); return [[s*s, (s + 1)**2, (s + 2)**2, (s + 3)**2], (s + 4)**2]; }];
    const [seq, ans] = kinds[Math.floor(Math.random()*kinds.length)](), w = new Set([ans]); while (w.size < 4) w.add(ans + (Math.floor(Math.random()*9) - 4 || 5));
    return {q: `What comes next? ${seq.join(", ")}, …`, correct: String(ans), options: this.shuffle([...w].map(String))}; },
  oddOne(){ const sets = [[["Salsa", "Bachata", "Merengue"], "Waltz"], [["Trumpet", "Saxophone", "Trombone"], "Violin"], [["Kick", "Snare", "Hi-hat"], "Chorus"], [["House", "Techno", "Trance"], "Bluegrass"], [["Bronx", "Brooklyn", "Queens"], "Detroit"], [["Verse", "Chorus", "Bridge"], "Turntable"], [["Guitar", "Bass", "Violin"], "Flute"], [["Afrobeats", "Amapiano", "Highlife"], "Polka"], [["Vinyl", "Cassette", "CD"], "Microphone"], [["Breaking", "Popping", "Locking"], "Tango"]];
    const [grp, odd] = sets[Math.floor(Math.random()*sets.length)]; return {q: "Which one doesn't belong?", correct: odd, options: this.shuffle([...grp, odd])}; }
};

/* ================= 🧘 Wellness: calm, fitness, fun and brain power, fed by four activities ================= */
const Wellness = {
  NEEDS: {calm: "🧘 Calm", fit: "💪 Fitness", fun: "🎉 Fun", brain: "🧠 Brain", social: "👥 Social"},
  FEED: {meditate: {calm: 1}, gym: {fit: 1}, dance: {fun: .8, fit: .4}, escape: {brain: 1, fun: .3}},
  get(){
    const d = Object.assign({n: {calm: 60, fit: 50, fun: 60, brain: 55, social: 50}, t: Date.now(), s: {}}, store.get("well", {})); d.n = Object.assign({calm: 60, fit: 50, fun: 60, brain: 55, social: 50}, d.n);
    const hrs = Math.min(48, Math.max(0, (Date.now() - d.t)/36e5)); for (const k in d.n) d.n[k] = Math.max(8, d.n[k] - hrs*1.6); return d;
  },
  put(d){ d.t = Date.now(); store.set("well", d); },
  add(need, v, quiet){ const d = this.get(); d.n[need] = Math.min(100, (d.n[need] || 0) + v); this.put(d); if (!quiet) try{ Home.refresh && Home.refresh(); }catch(e){} },
  fed(role, avg){
    const f = this.FEED[role]; if (!f) return; const d = this.get(); d.s[role] = (d.s[role] || 0) + 1;
    for (const [k, w] of Object.entries(f)) d.n[k] = Math.min(100, d.n[k] + 22*w*(.4 + avg/100*.6));
    this.put(d); try{ toast("Wellness up: " + Object.keys(f).map(k => this.NEEDS[k]).join(", ")); Home.refresh && Home.refresh(); }catch(e){}
  },
  tone(freq, dur = 1, type = "sine", vol = .2){
    try{ const L = typeof Lounge !== "undefined" ? Lounge : null, ac = this.ac || (this.ac = (L && L.listener && L.listener.context) || new (window.AudioContext || window.webkitAudioContext)()); if (ac.state === "suspended") ac.resume();
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0008, ac.currentTime + dur); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur + .05); }catch(e){}
  }
};
Mogul.ROLES.splice(Mogul.ROLES.findIndex(r => r.id === "owner"), 0,
  {id: "meditate", well: true, icon: "🧘", name: "Meditation", pay: [20, 90], blurb: "Breathe with the glowing orb, keep a still body and quiet the mind. Raises your Calm. No strikes, no pressure."},
  {id: "gym", well: true, icon: "🏋", name: "Exercise", pay: [30, 130], blurb: "A full workout: warm up, jumping jacks, squats, plank, boxing pads and a cool-down stretch. Raises your Fitness."},
  {id: "dance", well: true, icon: "💃", name: "Dance Class", pay: [30, 130], blurb: "Learn salsa basics from the instructor: mirror her moves, hit the counts, spin and perform the routine. Raises your Fun."},
  {id: "escape", well: true, icon: "🔐", name: "Escape Room", pay: [40, 180], blurb: "You're locked in a study. Find the code in the painting, the order of the blinking lamps and the secret word on the board, then crack the lock."});
Mogul.GAMES.meditate = Mogul.scripted({
  anyWorld: true, well: true, world: "terrace", panelSide: .9, peek: true,
  howTo: ["Watch the glowing orb: it grows as you breathe in and shrinks as you breathe out.", "Hold the button while you breathe in or out for the number of seconds shown.", "Keep the stone in the green zone. Calm minds don't overcorrect.", "There are no strikes here. Just breathe."],
  vrTip: "Sit or stand comfortably. The orb in the middle of the room is your guide.",
  make(s){
    const th = QB.pick("mind", 2);
    return [
      {type: "info", title: "Settle in", text: "Find a cushion, or just stand tall and relax. Look at the glowing orb in the room. Breathe in as it grows, out as it shrinks. Tap Next when you're ready.", btn: "I'm ready ▶"},
      {type: "hold", title: "Breathe with the orb", text: "Hold the button for the number of seconds, then let go.", log: "Breathing", cash: 40, rounds: [
        {label: "Breathe IN slowly", target: 4, unit: "s", rate: 1, max: 8}, {label: "Breathe OUT slowly", target: 6, unit: "s", rate: 1, max: 10}, {label: "Breathe IN slowly", target: 4, unit: "s", rate: 1, max: 8}, {label: "Breathe OUT slowly", target: 6, unit: "s", rate: 1, max: 10}]},
      {type: "balance", title: "Still body", text: "Lean gently to keep the stone in the green zone. Small moves only.", dur: 16, bumps: .8, force: 1.5, spillMsg: "Let it go and re-center.", log: "Stillness", cash: 40},
      QB.choice(th[0], {title: "A passing thought", log: "Mindfulness", cash: 30, yes: "That's the practice."}),
      QB.choice(th[1], {title: "Mindful moment", log: "Mindfulness", cash: 20, yes: "Exactly."}),
      {type: "timing", title: "Ring the singing bowl", text: "Tap when the marker is in the green zone, slow and easy.", count: 3, speed: .35, zw: .3, label: "RING", log: "Singing bowl", cash: 30, after: () => { try{ Wellness.tone(220, 2.6, "sine", .22); Wellness.tone(331, 2.2, "sine", .08); }catch(e){} }}
    ];
  },
  outro(){ try{ Lounge.burst(new THREE.Vector3(.6, 1.3, -3.8), 24); }catch(e){} return "You feel lighter. Your Calm went up. 🧘"; }
});
Mogul.GAMES.gym = Mogul.scripted({
  anyWorld: true, well: true, world: "loft", panelSide: .9,
  howTo: ["Warm up first. Then follow the beat for jumping jacks.", "Tap when the marker is in the green zone to finish clean squat reps.", "Hold the plank: lean to keep the dot centered.", "Boxing pads: face the flash. Then cool down with a stretch."],
  vrTip: "For the boxing pads, turn your head toward the flash.",
  make(s){
    const fq = QB.pick("fitness", 3);
    return [
      QB.choice(fq[0], {title: "Coach asks…", log: "Fitness know-how", cash: 20}),
      {type: "rhythm", title: "Jumping jacks", text: "Hit each beat as it reaches the line.", bpm: 110, count: 14, log: "Jacks", cash: 40},
      QB.choice(fq[1], {title: "Form check", log: "Form", cash: 20}),
      {type: "timing", title: "Squat reps", text: "Tap at the bottom of each rep, in the green zone.", count: 6, speed: .9, zw: .2, label: "REP!", log: "Squats", cash: 50},
      {type: "balance", title: "Plank hold", text: "Keep your core tight: lean to keep the dot in the zone.", dur: 15, bumps: 1.4, force: 2.2, spillMsg: "Core! Reset your plank.", log: "Plank", cash: 50},
      QB.choice(fq[2], {title: "Quick quiz", log: "Fitness know-how", cash: 20}),
      {type: "dir", title: "Boxing pads", text: "Face the flash and throw the combo.", count: 6, window: 1.3, log: "Pads", cash: 40},
      {type: "hold", title: "Cool down", text: "Hold the stretch for the time shown. Breathe.", log: "Stretch", cash: 20, rounds: [{label: "Hamstring stretch", target: 6, unit: "s", rate: 1, max: 10}, {label: "Quad stretch", target: 6, unit: "s", rate: 1, max: 10}]}
    ];
  },
  outro(){ try{ Lounge.burst(new THREE.Vector3(0, 1.4, -4), 24); }catch(e){} return "Workout done. Your Fitness went up. 💪"; }
});
Mogul.GAMES.dance = Mogul.scripted({
  anyWorld: true, well: true, world: "warehouse", panelSide: .9, peek: true,
  howTo: ["Watch the instructor in the studio, then mirror her moves.", "Hit the beat: arrows come up the lanes, tap them on the line.", "Salsa counts 1-2-3, pause, 5-6-7, pause.", "End with the full routine."],
  vrTip: "The instructor is in the middle of the room, facing the mirror.",
  make(s){
    const dq = QB.pick("dance", 2);
    return [
      {type: "info", title: "Class begins", text: "Welcome! Today: salsa basics. Count 1-2-3, hold on 4, then 5-6-7, hold on 8. Watch the instructor, then follow along.", btn: "Let's dance ▶"},
      {type: "dir", title: "Mirror the teacher", text: "She points left, front or right. Move that way!", count: 6, window: 1.4, log: "Mirror", cash: 30},
      QB.choice(dq[0], {title: "Dance history", log: "Dance know-how", cash: 20}),
      {type: "rhythm", title: "Basic step", text: "Hit each beat as it reaches the line.", bpm: 100, count: 12, log: "Basic step", cash: 40},
      {type: "timing", title: "The spin", text: "Tap when you finish the spin facing front.", count: 4, speed: .8, zw: .18, label: "SPIN!", log: "Spin", cash: 40},
      QB.choice(dq[1], {title: "Instructor's question", log: "Dance know-how", cash: 20}),
      {type: "rhythm", title: "Full routine!", text: "Faster now. Show the class what you've got.", bpm: 118, count: 18, log: "Routine", cash: 60}
    ];
  },
  outro(){ try{ Lounge.burst(new THREE.Vector3(0, 1.6, -4), 30); }catch(e){} return "The class applauds. Your Fun went up. 💃"; }
});
Mogul.GAMES.escape = Mogul.scripted({
  anyWorld: true, well: true, world: "escape", panelSide: .9, peek: true,
  howTo: ["You're locked in a study. Every game picks different puzzles from the room: the painting, the lamps, the blackboard, the typewriter, the clock, the globe, the treasure chest, plus riddles and the professor's quiz.", "On each puzzle, tap 🔍 Show me the clue: you'll walk right up to it. Tap 🧩 Back to the puzzle to answer.", "Some puzzles have a timer. Pick the vault lock at the end.", "Get at least half right to escape."],
  vrTip: "Walk up to the clues: the painting and blackboard on the back wall, the lamps on the shelf, the typewriter on the desk, the clock, the globe and the chest.",
  make(s){
    const A = Lounge.esApi, pick = a => a[Math.floor(Math.random()*a.length)], sh = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
    const setups = []; this.pre = () => { try{ A.open(false); A.reset(); setups.forEach(f => f()); }catch(e){ console.warn(e); } };
    const words = QB.words, n4 = (good, make) => { const o = new Set([good]); let g = 0; while (o.size < 4 && g++ < 60) o.add(make()); return sh([...o]); };
    const P = {
      painting(){ const code = String(100 + Math.floor(Math.random()*900)); setups.push(() => A.code(code));
        return {type: "match", title: "The painting", text: "A number is glowing in the painting on the back wall (left side).", time: 60, decay: 1, log: "Painting code", cash: 40, look: {at: [-3.9, 1.9, -8.9], from: [-3.2, -6.2]},
          rounds: [{q: "What is the 3-digit code?", correct: code, options: n4(code, () => String(100 + Math.floor(Math.random()*900)))}]}; },
      lamps(){ const seq = sh([0, 1, 2, 3]).slice(0, 3 + (Math.random() < .5 ? 1 : 0)), ico = ["🔴", "🟢", "🔵", "🟡"], S = a => a.map(i => ico[i]).join(" "); setups.push(() => A.seq(seq));
        const opts = new Set([S(seq)]); let g = 0; while (opts.size < 3 && g++ < 40) opts.add(S(sh([0, 1, 2, 3]).slice(0, seq.length)));
        return {type: "choice", title: "The lamps", text: "Watch the four lamps on the shelf (red, green, blue, yellow from left to right). They light up in a pattern, pause, then repeat. What was the order?", time: 90, log: "Lamp order", cash: 40, look: {at: [0, 1.5, -8.8], from: [0, -5.6]},
          options: sh([...opts]).map(t => ({t, s: t === S(seq) ? 100 : 0, fb: t === S(seq) ? "Exactly the pattern." : "That's not the order they lit."}))}; },
      cipher(){ const k = 1 + Math.floor(Math.random()*3), word = pick(words), enc = word.split("").map(c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65)).join(""); setups.push(() => A.word(enc, k));
        return {type: "match", title: "The blackboard", text: `Each letter on the blackboard was moved forward by ${k} (A→${String.fromCharCode(65 + k)}). Move them back to read the secret word.`, time: 75, decay: 1, log: "Cipher", cash: 40, look: {at: [3, 1.9, -8.9], from: [2.6, -6.2]},
          rounds: [{q: `Decode: ${enc}`, correct: word, options: n4(word, () => pick(words))}]}; },
      typewriter(){ const word = pick(words.filter(w => w.length >= 5)); let mix = word; for (let i = 0; i < 12 && mix === word; i++) mix = sh(word.split("")).join(""); setups.push(() => A.paper(mix));
        const same = words.filter(w => w.length === word.length && w !== word);
        return {type: "match", title: "The typewriter", text: "Someone left a message in the typewriter on the desk, but the letters are scrambled. Unscramble it.", time: 75, decay: 1, log: "Anagram", cash: 40, look: {at: [-2.1, 1.1, -8.2], from: [-2.1, -6.4]},
          rounds: [{q: `Unscramble: ${mix}`, correct: word, options: n4(word, () => pick(same.length >= 3 ? same : words))}]}; },
      clock(){ const h = 1 + Math.floor(Math.random()*12), mm = pick([0, 10, 15, 20, 30, 40, 45, 50]), f = (a, b) => `${a}:${String(b).padStart(2, "0")}`, t = f(h, mm); setups.push(() => A.clock(h, mm));
        return {type: "choice", title: "The grandfather clock", text: "The grandfather clock in the corner stopped. The time it shows opens the next lock. Short hand = hours, long hand = minutes.", time: 60, log: "Clock", cash: 35, look: {at: [3.9, 1.8, -8.4], from: [3.0, -6.6]},
          options: n4(t, () => f(1 + Math.floor(Math.random()*12), pick([0, 10, 15, 20, 30, 40, 45, 50]))).map(o => ({t: o, s: o === t ? 100 : 0, fb: o === t ? "Tick-tock. Correct!" : `It showed ${t}.`}))}; },
      globe(){ const C = QB.caps, [land, cap] = pick(C); setups.push(() => A.globe(land));
        return {type: "match", title: "The globe", text: "A note is pinned to the antique globe: a pin marks the capital city of a country. Which city is it?", time: 60, decay: 1, log: "Globe", cash: 35, look: {at: [-3.3, 1.0, -3.8], from: [-1.4, -2.2]},
          rounds: [{q: `The capital of ${land}`, correct: cap, options: n4(cap, () => pick(C)[1])}]}; },
      chest(){ const a = 2 + Math.floor(Math.random()*8), b = 2 + Math.floor(Math.random()*9); setups.push(() => A.chest(a, b));
        return {type: "match", title: "The treasure chest", text: "The chest's lock has a picture puzzle on its lid. Each shape stands for a number.", time: 75, decay: 1, log: "Shape math", cash: 40, look: {at: [3.0, .6, -2.6], from: [2.2, -.9]},
          rounds: [{q: "What number is the ■ square?", correct: String(b), options: n4(String(b), () => String(Math.max(1, b + Math.floor(Math.random()*9) - 4)))}]}; },
      riddle(){ const rd = QB.pick("riddle", 1)[0]; return {type: "choice", title: "A riddle on the door", text: rd[0], log: "Riddle", cash: 30, options: sh([rd[1], ...rd.slice(2, 4)]).map(t => ({t, s: t === rd[1] ? 100 : 0, fb: t === rd[1] ? "Yes!" : "Not quite."}))}; },
      safe(){ const gen = [QB.math, QB.sequence, QB.oddOne][Math.floor(Math.random()*3)].call(QB); return {type: "match", title: "The little safe", text: "A little safe under the desk has a puzzle on its dial.", time: 45, decay: 1, log: "Safe puzzle", cash: 30, rounds: [gen]}; },
      quiz(){ const q = QB.pick("brain", 1)[0]; return QB.choice(q, {title: "The professor's quiz card", log: "Trivia", cash: 30, time: 30}); }
    };
    const room = sh(["painting", "lamps", "cipher", "typewriter", "clock", "globe", "chest"]).slice(0, 4), talk = sh(["riddle", "safe", "quiz", "quiz"]).slice(0, 2);
    const order = sh([...room, ...talk]), stages = order.map(k => P[k]());
    return [
      {type: "info", title: "Locked in!", text: "The study door slammed shut. Six puzzles stand between you and the vault door, and the clues are hidden around the room. On each puzzle, tap 🔍 Show me the clue to walk up to it.", btn: "Start ▶", before: () => this.pre()},
      ...stages.map((st, i) => Object.assign(st, {title: `Puzzle ${i + 1}: ${st.title.replace(/^(The|A) /, m => m.toLowerCase())}`})),
      {type: "timing", title: "Pick the lock", text: "The vault lock has a sweet spot. Tap when the pick is in the green zone.", count: 3, speed: .85, zw: .14, label: "PICK", log: "Lock", cash: 40, look: {at: [4.9, 1.1, -5.4], from: [2.6, -5.4]}}
    ];
  },
  setup(){ try{ this.pre && this.pre(); }catch(e){} },
  outro(){ const m = this.m, sc = m.shift.scores.reduce((a, b) => a + b, 0)/Math.max(1, m.shift.scores.length);
    if (sc >= 50){ try{ Lounge.esApi.open(true); Lounge.burst(new THREE.Vector3(4.2, 1.4, -5.4), 28); Wellness.tone(523, .5, "triangle", .2); }catch(e){} return "CLICK! The vault door swings open. You escaped! 🔓"; }
    return "Time's up. The door stays locked. Try again: the puzzles change every time. 🔐"; }
});

/* house-party invites: check now and then while the app is open */
setTimeout(() => { try{ Home.inviteCheck(); }catch(e){} setInterval(() => { try{ if (!document.hidden) Home.inviteCheck(); }catch(e){} }, 120e3); }, 9000);

/* ================= 🕺 Dance-off: a Just Dance-style challenge right on the dance floor ================= */
Mogul.GAMES.danceoff = {
  panelSide: .9, anyWorld: true, well: true,
  MOVES: {L: {n: "Point left", e: "👈"}, U: {n: "Hands up", e: "🙌"}, R: {n: "Point right", e: "👉"}, D: {n: "Drop it", e: "⬇"}, C: {n: "Clap", e: "👏"}},
  KEYS: {arrowleft: "L", a: "L", arrowup: "U", w: "U", arrowright: "R", d: "R", arrowdown: "D", s: "D", " ": "C", enter: "C"},
  howTo: ["A rival steps up. Move cards slide toward the ring in time with the beat.", "Hit each move as its card reaches the ring: ◀ point left, ▲ hands up, ▶ point right, ▼ drop it, 👏 clap (or the arrow keys and Space).", "Perfect timing scores most. Keep a combo going for bonus points.", "Beat your rival's score to win the crowd."],
  vrTip: "Do the moves with your real arms: both hands up, point a hand out to the left or right, both hands low to drop it, hands together to clap.",
  start(s){
    const m = this.m, L = Lounge, T = THREE, lv = s.lv || 1;
    this.bpm = Math.min(132, 96 + lv*4); this.spb = 60/this.bpm; this.notes = []; this.hits = {perfect: 0, good: 0, miss: 0}; this.score = 0; this.combo = 0; this.best = 0; this.flash = null; this.over = false;
    // the chart: a short warm-up, then faster patterns, with the occasional double move
    const keys = ["L", "U", "R", "D", "C"], pats = [["L", "R", "L", "R"], ["U", "C", "U", "C"], ["L", "U", "R", "U"], ["D", "C", "D", "U"], ["R", "L", "U", "C"], ["C", "C", "U", "D"]];
    let beat = 8; for (let bar = 0; bar < 10; bar++){ const p = pats[Math.floor(Math.random()*pats.length)], step = bar < 3 ? 2 : bar < 7 ? 1 : (Math.random() < .5 ? 1 : .5);
      for (let i = 0; i < 4; i++){ this.notes.push({t: beat*this.spb, k: Math.random() < .15 ? keys[Math.floor(Math.random()*5)] : p[i], hit: null}); beat += step; } beat += 2; }
    this.len = beat*this.spb + 2; this.total = this.notes.length;
    this.rivalTarget = Math.min(95, 52 + lv*4 + Math.random()*14); this.rivalName = Mogul.NAMES[0][Math.floor(Math.random()*Mogul.NAMES[0].length)];
    // where: the dancers face you, a few steps ahead, like a game coach
    const h = L.headPos(), yaw = L.renderer.xr.isPresenting ? L.headYaw() : L.yaw; this.anchor = {x: h.x, z: h.z, yaw};
    const at = (rx, fz) => ({x: h.x + Math.cos(yaw)*rx - Math.sin(yaw)*fz, z: h.z - Math.sin(yaw)*rx - Math.cos(yaw)*fz}), g = this.wg(), pr = Profile.get();
    const put = (rx, opts) => { const p = at(rx, 2.7), lp = g.worldToLocal(new T.Vector3(p.x, 0, p.z)), sl = m.spawn(lp.x, lp.z, yaw, "dance", opts); if (sl){ const fy = L.floorAt(p.x, p.z, h.y + .5); if (fy != null) sl.p.position.y = fy - g.getWorldPosition(new T.Vector3()).y; } return sl; };
    this.me = put(-.75, {avatar: pr.avatar, outfit: pr.outfit, gear: {hat: pr.hat, eyes: pr.eyes, neck: pr.neck, phones: pr.phones, aura: pr.aura}});
    this.rival = put(.75, {gender: Math.random() < .5 ? "f" : "m"});
    if (!m.vr()){ L.pitch = -.08; L.userLooked = true; }
    this.pad = this.padEl = m.vr() ? null : this.mkHud(); if (this.pad && m.box) m.box.hidden = true;
    this.wasPlaying = (typeof S !== "undefined") && (S.playing || S.loading); if (this.wasPlaying) try{ togglePlay(); }catch(e){}
    this.ac = Wellness.ac || (Wellness.ac = (L.listener && L.listener.context) || new (window.AudioContext || window.webkitAudioContext)()); try{ this.ac.resume(); }catch(e){}
    this.t0 = this.ac.currentTime + 1.2; this.music(); this.clipT = 0; this.lastPose = ""; this.poseHeld = {};
    try{ Party.setEmote("dance"); }catch(e){}
    m.say(`🕺 Dance-off vs ${this.rivalName}! Hit the moves when the cards reach the ring.`);
  },
  wg(){ const L = Lounge, w = L.worlds[L.worldId]; return w ? w.group : L.scene; },
  now(){ return this.ac ? this.ac.currentTime - this.t0 : 0; },
  /* a built-in beat so the moves line up exactly: kick, snare, hats, bass and a synth stab */
  music(){
    const ac = this.ac, out = this.out = ac.createGain(); out.gain.value = .55; out.connect(ac.destination); const spb = this.spb, t0 = this.t0, beats = Math.ceil(this.len/spb) + 4;
    const noise = (() => { const b = ac.createBuffer(1, ac.sampleRate*.3, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return b; })();
    const kick = t => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g); g.connect(out); o.start(t); o.stop(t + .32); };
    const hiss = (t, len, f, v) => { const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; bp.type = "highpass"; bp.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + len + .02); };
    const tone = (t, f, len, v, type) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + .02); };
    const roots = [55, 55, 73.42, 65.41], chord = [[220, 277.18, 329.63], [220, 277.18, 329.63], [293.66, 369.99, 440], [261.63, 329.63, 392]];
    for (let b = -4; b < beats; b++){ const t = t0 + b*spb; if (t < ac.currentTime) continue; const bar = Math.floor((b + 4)/4) % 4;
      kick(t); hiss(t + spb/2, .05, 7000, .25); if ((b + 4) % 2 === 1) hiss(t, .18, 1500, .5); if (b >= 0){ tone(t, roots[bar], spb*.9, .35, "sawtooth"); if ((b + 4) % 4 === 2) chord[bar].forEach(f => tone(t + spb/2, f, spb*.4, .05, "square")); } }
  },
  /* phones and computers: an overlay with the move track and big buttons */
  mkHud(){
    const d = document.createElement("div"); d.className = "dhud";
    d.innerHTML = `<div class="dtop"><div class="dsc"><b>YOU</b><i class="dbar me"><span></span></i><em class="dpct me">0</em></div><div class="dmid"><div class="drate"></div><div class="dcombo"></div></div><div class="dsc r"><b class="rn">RIVAL</b><i class="dbar rv"><span></span></i><em class="dpct rv">0</em></div><button class="dx" aria-label="Stop the dance-off">✕</button></div>
      <canvas class="dtrack" width="1200" height="170"></canvas>
      <div class="dbtns">${["L", "U", "R", "D", "C"].map(k => `<button data-k="${k}"><span>${k === "L" ? "◀" : k === "U" ? "▲" : k === "R" ? "▶" : k === "D" ? "▼" : "👏"}</span><small>${this.MOVES[k].n}</small></button>`).join("")}</div>`;
    document.body.appendChild(d); d.querySelector(".rn").textContent = this.rivalName.toUpperCase();
    d.querySelectorAll("[data-k]").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); this.press(b.dataset.k); b.classList.add("on"); setTimeout(() => b.classList.remove("on"), 120); }));
    d.querySelector(".dx").addEventListener("click", () => { this.m.quitGame ? this.m.quitGame(true) : this.m.endGame("You left the dance floor."); });
    this.cv = d.querySelector(".dtrack"); this.cx = this.cv.getContext("2d"); return d;
  },
  key(k, down){ const mv = this.KEYS[k]; if (!mv) return false; if (down) this.press(mv); return true; },
  /* a move: find the nearest card of that kind near the ring */
  press(k){
    if (this.over) return; const t = this.now(); let best = null, bd = 9;
    for (const n of this.notes){ if (n.hit !== null || n.k !== k) continue; const d = Math.abs(n.t - t); if (d < bd){ bd = d; best = n; } }
    if (!best || bd > .3){ this.combo = 0; this.rate("Off beat", "#ff8a7a"); return; }
    const q = bd <= .12 ? "perfect" : "good"; best.hit = q; this.hits[q]++; this.combo++; this.best = Math.max(this.best, this.combo);
    this.score += (q === "perfect" ? 100 : 60) + Math.min(50, this.combo*2); this.rate(q === "perfect" ? "PERFECT!" : "GOOD", q === "perfect" ? "#7dffb0" : "#ffd87a");
    if (this.combo && this.combo % 8 === 0){ try{ Lounge.burst(this.me ? this.me.p.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.9, 0)) : Lounge.headPos(), 10); }catch(e){} if (this.me) Fight.clip(this.me, "cheer"); this.cheerT = 1.2; }
    try{ const c = (Lounge.xrCtls || [])[0]; if (c) Lounge.haptic(c, .4, 40); }catch(e){}
  },
  rate(txt, col){ this.flash = {txt, col, t: performance.now()}; },
  pct(){ const max = this.total*150; return Math.max(0, Math.min(100, Math.round(this.score/max*100*1.15))); },
  rivalPct(t){ return Math.round(this.rivalTarget*Math.max(0, Math.min(1, t/(this.len - 2)))); },
  /* VR: read your arms */
  pose(){
    const L = Lounge, T = THREE, head = L.headPos(), yaw = L.headYaw(), hands = {};
    for (const side of ["left", "right"]){ const h = Cam.gripFor && Cam.gripFor(side); if (h && h.grip) hands[side] = h.grip.getWorldPosition(new T.Vector3()); }
    if (!hands.left || !hands.right) return ""; const rx = v => (v.x - head.x)*Math.cos(yaw) - (v.z - head.z)*Math.sin(yaw);
    const l = hands.left, r = hands.right, up = l.y > head.y + .02 && r.y > head.y + .02, low = l.y < head.y - .85 && r.y < head.y - .85, clap = l.distanceTo(r) < .16 && l.y > head.y - .7;
    if (up) return "U"; if (clap) return "C"; if (low) return "D"; if (rx(l) < -.5 && rx(r) > -.25) return "L"; if (rx(r) > .5 && rx(l) < .25) return "R"; return "";
  },
  update(dt){
    const m = this.m; if (this.over) return; const t = this.now();
    for (const n of this.notes) if (n.hit === null && t > n.t + .3){ n.hit = "miss"; this.hits.miss++; this.combo = 0; this.rate("MISS", "#ff6a5a"); if (this.me){ Fight.clip(this.me, "idle", .15); this.missT = .5; } }
    if (m.vr()){ const p = this.pose(); if (p && p !== this.lastPose) this.press(p); this.lastPose = p; }
    // the dancers: switch moves every couple of bars; react to misses and combos
    this.clipT += dt; if (this.missT > 0){ this.missT -= dt; if (this.missT <= 0 && this.me) Fight.clip(this.me, "dance" + (1 + Math.floor(Math.random()*4))); }
    if (this.cheerT > 0){ this.cheerT -= dt; if (this.cheerT <= 0 && this.me) Fight.clip(this.me, "dance" + (1 + Math.floor(Math.random()*4))); }
    if (this.clipT > this.spb*8){ this.clipT = 0; if (this.rival) Fight.clip(this.rival, "dance" + (1 + Math.floor(Math.random()*4))); if (this.me && !(this.missT > 0) && !(this.cheerT > 0)) Fight.clip(this.me, "dance" + (1 + Math.floor(Math.random()*4))); }
    if (this.pad) this.drawHud(t);
    if (t > this.len) this.finish();
    if (m.vr() && (this.drawT = (this.drawT || 0) + dt) > .05){ this.drawT = 0; m.draw(); }
  },
  /* a stick figure doing each move, like a dance game pictogram */
  figure(x, X, Y, s, k, col){
    x.save(); x.translate(X, Y); x.scale(s, s); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 7; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.arc(0, -46, 11, 0, 7); x.fill(); x.beginPath(); x.moveTo(0, -34); x.lineTo(0, 6); x.stroke();
    const arm = (a, b, c, d) => { x.beginPath(); x.moveTo(0, -28); x.lineTo(a, b); x.lineTo(c, d); x.stroke(); };
    if (k === "U"){ arm(-14, -46, -20, -64); arm(14, -46, 20, -64); } else if (k === "L"){ arm(-22, -30, -44, -32); arm(12, -12, 16, 4); } else if (k === "R"){ arm(22, -30, 44, -32); arm(-12, -12, -16, 4); }
    else if (k === "D"){ arm(-18, -8, -24, 10); arm(18, -8, 24, 10); } else { arm(-14, -18, -2, -26); arm(14, -18, 2, -26); }
    const knee = k === "D" ? 14 : 6; x.beginPath(); x.moveTo(0, 6); x.lineTo(-knee, 24); x.lineTo(-12, 44); x.moveTo(0, 6); x.lineTo(knee, 24); x.lineTo(12, 44); x.stroke(); x.restore();
  },
  drawTrack(x, W, H, t){
    x.clearRect(0, 0, W, H); const ringX = 120, pps = 340, cy = H/2;
    x.fillStyle = "rgba(20,13,10,.55)"; x.beginPath(); x.roundRect ? x.roundRect(0, 10, W, H - 20, 24) : x.rect(0, 10, W, H - 20); x.fill();
    const pulse = 1 + Math.max(0, 1 - ((t % this.spb) + this.spb) % this.spb/this.spb*3)*.12; x.strokeStyle = "#ffc21a"; x.lineWidth = 6; x.beginPath(); x.arc(ringX, cy, 62*pulse, 0, 7); x.stroke();
    const col = {L: "#4de1ff", U: "#ffc21a", R: "#ff8ad8", D: "#8dff9e", C: "#ffffff"};
    for (const n of this.notes){ const dx = (n.t - t)*pps; if (dx < -90 || dx > W) continue; if (n.hit && n.hit !== "miss" && dx < -10) continue; const X = ringX + dx, a = n.hit === "miss" ? .35 : 1;
      x.globalAlpha = a; x.fillStyle = "rgba(0,0,0,.45)"; x.beginPath(); x.roundRect ? x.roundRect(X - 50, cy - 64, 100, 128, 18) : x.rect(X - 50, cy - 64, 100, 128); x.fill(); x.strokeStyle = col[n.k]; x.lineWidth = 4; x.stroke();
      this.figure(x, X, cy + 6, 1, n.k, col[n.k]); x.font = "700 18px system-ui"; x.textAlign = "center"; x.fillStyle = "#fff"; x.fillText(this.MOVES[n.k].e, X + 34, cy - 40); x.globalAlpha = 1; }
  },
  drawHud(t){
    const d = this.pad; if (!d) return; this.drawTrack(this.cx, this.cv.width, this.cv.height, t);
    const me = this.pct(), rv = this.rivalPct(t);
    d.querySelector(".dbar.me span").style.width = me + "%"; d.querySelector(".dpct.me").textContent = me; d.querySelector(".dbar.rv span").style.width = rv + "%"; d.querySelector(".dpct.rv").textContent = rv;
    const f = this.flash, r = d.querySelector(".drate"); if (f && performance.now() - f.t < 600){ r.textContent = f.txt; r.style.color = f.col; r.style.opacity = 1; } else r.style.opacity = 0;
    d.querySelector(".dcombo").textContent = this.combo >= 3 ? `🔥 ${this.combo} combo` : "";
  },
  /* VR: the same track on the floating panel */
  draw(m){
    const t = this.now(), x = m.x, W = m.W; let Y = 90;
    m.text(`🕺 Dance-off vs ${this.rivalName}   YOU ${this.pct()} · ${this.rivalPct(t)} RIVAL`, 28, Y, 26, "#fff", 800, "left", W - 56);
    if (this.flash && performance.now() - this.flash.t < 600) m.text(this.flash.txt, W/2, Y + 50, 40, this.flash.col, 900, "center");
    x.save(); x.translate(0, Y + 90); this.drawTrack(x, W, 200, t); x.restore();
    m.text(m.vr() ? "Do the moves with your arms: hands up, point left or right, hands low, clap." : "◀ ▲ ▶ ▼ and Space", W/2, Y + 330, 22, "rgba(255,255,255,.75)", 600, "center", W - 60);
    if (!m.vr()) ["L", "U", "R", "D", "C"].forEach((k, i) => m.btn("dk" + k, 40 + i*190, Y + 360, 176, 90, this.MOVES[k].e + " " + this.MOVES[k].n, () => this.press(k), {size: 20, primary: true}));
    if (this.combo >= 3) m.text(`🔥 ${this.combo} combo`, W/2, Y + 480, 26, "#ffd87a", 800, "center");
  },
  finish(){
    if (this.over) return; this.over = true; const m = this.m, me = this.pct(), rv = Math.round(this.rivalTarget), win = me >= rv;
    if (this.me) Fight.clip(this.me, win ? "cheer" : "idle"); if (this.rival) Fight.clip(this.rival, win ? "idle" : "cheer");
    try{ if (win){ Lounge.burst(this.me.p.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2, 0)), 30); m.emoji("🏆", this.me.p.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.2, 0))); } }catch(e){}
    m.score(me, win ? 120 : 30); m.shift.log.push(`Perfect ${this.hits.perfect} · Good ${this.hits.good} · Miss ${this.hits.miss} · best combo ${this.best}`);
    setTimeout(() => m.endGame(win ? `🏆 You won the dance-off, ${me} to ${rv}! The crowd goes wild.` : `${this.rivalName} won this one, ${rv} to ${me}. Run it back!`), 2200);
  },
  end(){
    const m = this.m; this.over = true; try{ if (this.out){ this.out.gain.setTargetAtTime(0, this.ac.currentTime, .05); setTimeout(() => { try{ this.out.disconnect(); }catch(e){} }, 400); } }catch(e){}
    if (this.wasPlaying && typeof S !== "undefined" && !S.playing) try{ togglePlay(); }catch(e){}
    setTimeout(() => { if (this.me) m.despawn(this.me); if (this.rival) m.despawn(this.rival); this.me = this.rival = null; }, 2500);
    if (this.pad){ this.pad.remove(); this.pad = this.padEl = null; if (m.box && !m.vr() && m.on) m.box.hidden = false; }
    try{ Party.setEmote("idle"); }catch(e){}
  }
};
Mogul.ROLES.splice(Mogul.ROLES.findIndex(r => r.id === "owner"), 0,
  {id: "trivia", well: true, icon: "🎵", name: "Music Trivia", pay: [30, 150], blurb: "Eight quick questions on hip-hop, R&B, soul, jazz, reggae, Afrobeats, Latin and dance history. Fresh questions every round, and they don't repeat until you've seen them all. Raises your Brain."},
  {id: "danceoff", well: true, icon: "🕺", name: "Dance-off", pay: [40, 200], blurb: "A Just Dance-style battle right where you're standing: a rival steps up, move cards slide in on the beat, and you hit each move on time. Beat their score to win. In VR, dance with your arms."});
Wellness.FEED.trivia = {brain: 1}; Wellness.FEED.danceoff = {fun: .8, fit: .6};
Mogul.GAMES.trivia = Mogul.scripted({
  anyWorld: true, well: true, panelSide: .9,
  howTo: ["Eight questions, 15 seconds each.", "Topics: hip-hop, R&B and soul, jazz, reggae, Afrobeats, Latin music, dance history and music basics.", "Questions don't repeat until you've seen the whole bank."],
  make(s){ const q = QB.pick("music", 7).map((it, i) => QB.choice(it, {title: `Question ${i + 1} of 8`, log: "Trivia", cash: 15, time: 15}));
    q.push(QB.choice(QB.pick("dance", 1)[0], {title: "Bonus: dance history", log: "Dance trivia", cash: 25, time: 15})); return q; },
  outro(){ const sc = this.m.shift.scores, right = sc.filter(v => v >= 100).length; return `${right} of ${sc.length} right. ${right >= 7 ? "Music genius! 🎓" : right >= 5 ? "Nice ear! 🎶" : "Keep listening, you'll get there. 🎧"}`; }
});
/* start a dance-off right here, from the party bar */
Mogul.danceHere = function(){
  if (!Age.ok("Dance-off")) return;
  const go = () => { this.ensure(); this.on = true; const xr = XRV(); this.box.hidden = xr; if (xr) this.vrPanel().visible = true; if (this.game && this.view === "game") this.quitGame(true); this.startGame("danceoff", false); };
  if ($("#stage").hidden || !Lounge.built){ openStage("lounge"); const w = setInterval(() => { if (Lounge.built && Lounge.worlds[Lounge.worldId]){ clearInterval(w); setTimeout(go, 800); } }, 300); setTimeout(() => clearInterval(w), 60000); }
  else go();
};

/* ================= 🎯 Trivia Live: big colored answer tiles, a countdown, speed points, leaderboards and a podium =================
   Play solo, or host a game for everyone in your party. Make your own quizzes, save them, and play or share them. */
const TriviaLive = {
  TILES: [{c: "#e21b3c", s: "▲"}, {c: "#1368ce", s: "◆"}, {c: "#d89e00", s: "●"}, {c: "#26890c", s: "■"}],
  PACKS: [{id: "music", n: "🎵 Music Mix", bank: "music", k: 10}, {id: "dance", n: "💃 Dance History", bank: "dance", k: 10}, {id: "riddle", n: "🧩 Riddles", bank: "riddle", k: 10},
    {id: "fitness", n: "💪 Fitness", bank: "fitness", k: 8}, {id: "mix", n: "🎲 Everything", mix: true, k: 12}],
  st: "lobby", game: null, el: null,
  me(){ return (window.TUNet && TUNet.selfId) || "me"; },
  myName(){ try{ return Profile.get().name || "You"; }catch(e){ return "You"; } },
  nameOf(id){ if (id === this.me()) return this.myName(); try{ const p = Party.peers[id]; return p ? p.profile.name : "Player"; }catch(e){ return "Player"; } },
  inParty(){ return !!(typeof Party !== "undefined" && Party.room && Party.act && Party.act.trivia); },
  send(m, o){ if (this.inParty()) try{ Party.act.trivia.send(m, o); }catch(e){} },
  clean(s, n){ return String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").slice(0, n).trim(); },
  esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c])); },
  beep(f, d = .12, type = "square", v = .08){ try{ Wellness.tone(f, d, type, v); }catch(e){} },
  /* ---------- quizzes ---------- */
  mine(){ const q = store.get("myQuizzes", []); return Array.isArray(q) ? q : []; },
  saveMine(list){ store.set("myQuizzes", list.slice(0, 40)); },
  fromBank(it, time = 20){ const [q, a, ...w] = it, opts = QB.shuffle([a, ...w.slice(0, 3)]); return {q, a: opts, c: opts.indexOf(a), time}; },
  pack(id){ const P = this.PACKS.find(p => p.id === id); if (!P) return null;
    const qs = P.mix ? QB.shuffle([...QB.pick("music", 5), ...QB.pick("dance", 3), ...QB.pick("riddle", 2), ...QB.pick("fitness", 2)]) : QB.pick(P.bank, P.k);
    return {title: P.n, qs: qs.map(it => this.fromBank(it))}; },
  /* checks anything that comes from another player */
  cleanQuiz(z){ if (!z || !Array.isArray(z.qs)) return null; const qs = z.qs.slice(0, 50).map(q => { const a = (Array.isArray(q.a) ? q.a : []).slice(0, 4).map(s => this.clean(s, 80)); const c = Math.max(0, Math.min(a.length - 1, q.c | 0));
      return {q: this.clean(q.q, 160), a, c, time: [5, 10, 20, 30, 60].includes(+q.time) ? +q.time : 20}; }).filter(q => q.q && q.a.filter(Boolean).length >= 2 && q.a[q.c]);
    return qs.length ? {title: this.clean(z.title, 50) || "Quiz", qs} : null; },
  /* ---------- the screen ---------- */
  open(){ this.ensure(); this.el.hidden = false; if (!this.game) this.st = "lobby"; this.draw(); },
  close(){ if (this.game && this.game.host && this.game.multi && this.st !== "end") this.send({t: "cancel"}); this.stop(); this.game = null; this.st = "lobby"; if (this.el) this.el.hidden = true; },
  ensure(){ if (this.el) return; const d = this.el = document.createElement("div"); d.className = "tlive"; d.hidden = true; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Trivia Live"); document.body.appendChild(d);
    d.addEventListener("click", e => this.click(e)); d.addEventListener("input", e => this.input(e)); },
  stop(){ clearInterval(this.timer); this.timer = null; clearTimeout(this.nextT); },
  draw(){
    const d = this.el, g = this.game; if (!d) return; let h = `<button class="tl-x" data-a="close" aria-label="Close">✕</button>`;
    if (this.st === "lobby"){
      const mine = this.mine();
      h += `<div class="tl-lobby"><h2>🎯 Trivia Live</h2><p class="tl-sub">Answer fast for more points. ${this.inParty() ? "Host a game and everyone in your party plays along." : "Join a party to play against friends."}</p>
        <h3>Quiz packs</h3><div class="tl-packs">${this.PACKS.map(p => `<div class="tl-pack"><b>${p.n}</b><span>${p.k} questions</span><div><button data-a="solo" data-p="${p.id}">Play solo</button>${this.inParty() ? `<button class="hl" data-a="host" data-p="${p.id}">Host for party</button>` : ""}</div></div>`).join("")}</div>
        <h3>My quizzes</h3><div class="tl-packs">${mine.map((z, i) => `<div class="tl-pack mine"><b>${this.esc(z.title)}</b><span>${z.qs.length} question${z.qs.length === 1 ? "" : "s"}</span><div><button data-a="solo" data-m="${i}">Play</button>${this.inParty() ? `<button class="hl" data-a="host" data-m="${i}">Host</button>` : ""}<button data-a="edit" data-m="${i}">Edit</button></div></div>`).join("")}
        <div class="tl-pack new"><b>✏️ Make your own quiz</b><span>Write your own questions and answers</span><div><button class="hl" data-a="new">Create a quiz</button></div></div></div></div>`;
    } else if (this.st === "make"){
      const z = this.draft;
      h += `<div class="tl-make"><h2>✏️ ${this.editIdx === null ? "New quiz" : "Edit quiz"}</h2><label class="tl-lbl">Quiz title<input data-f="title" maxlength="50" value="${this.esc(z.title)}" placeholder="Name your quiz"></label>
        ${z.qs.map((q, i) => `<div class="tl-qed"><div class="tl-qh"><b>Question ${i + 1}</b><select data-f="time" data-i="${i}" aria-label="Time limit">${[5, 10, 20, 30, 60].map(s => `<option value="${s}"${+q.time === s ? " selected" : ""}>${s} sec</option>`).join("")}</select><button data-a="delq" data-i="${i}" aria-label="Delete question ${i + 1}">🗑</button></div>
          <input data-f="q" data-i="${i}" maxlength="160" value="${this.esc(q.q)}" placeholder="Type your question">
          <div class="tl-aed">${[0, 1, 2, 3].map(k => `<label style="--c:${this.TILES[k].c}"><span>${this.TILES[k].s}</span><input data-f="a" data-i="${i}" data-k="${k}" maxlength="80" value="${this.esc(q.a[k] || "")}" placeholder="Answer ${k + 1}${k > 1 ? " (optional)" : ""}"><input type="radio" name="c${i}" data-f="c" data-i="${i}" data-k="${k}"${q.c === k ? " checked" : ""} aria-label="Answer ${k + 1} is correct" title="Correct answer"></label>`).join("")}</div></div>`).join("")}
        <div class="tl-row"><button data-a="addq">➕ Add a question</button><span class="grow"></span>${this.editIdx !== null ? `<button data-a="delquiz">Delete quiz</button>` : ""}<button data-a="back">Cancel</button><button class="hl" data-a="savequiz">💾 Save quiz</button></div>
        <p class="tl-sub">Tick the circle next to the right answer. Two to four answers per question. Your quizzes are saved on this device; when you host one, everyone in the party plays it and can save a copy.</p></div>`;
    } else if (this.st === "wait"){
      h += `<div class="tl-center"><h2>${this.esc(g.title)}</h2><p class="tl-sub">${g.host ? "Starting…" : `${this.esc(this.nameOf(g.hostId))} is hosting. Get ready!`}</p><div class="tl-big">${g.qn} questions</div></div>`;
    } else if (this.st === "q"){
      const Q = g.q, left = Math.max(0, Math.ceil(g.timeLeft)), ans = g.my;
      h += `<div class="tl-q"><div class="tl-top"><span class="tl-timer" style="--p:${Math.max(0, g.timeLeft/Q.time)}">${left}</span><span class="tl-n">${g.i + 1} / ${g.qn}</span><span class="tl-ans">${g.answered || 0} answer${g.answered === 1 ? "" : "s"}</span></div>
        <div class="tl-card">${this.esc(Q.q)}</div>
        <div class="tl-tiles">${Q.a.map((a, k) => a ? `<button class="tl-tile${ans !== undefined ? (ans === k ? " picked" : " dim") : ""}" style="--c:${this.TILES[k].c}" data-a="ans" data-k="${k}"${ans !== undefined ? " disabled" : ""}><span class="sh">${this.TILES[k].s}</span><span>${this.esc(a)}</span></button>` : "").join("")}</div>
        ${ans !== undefined ? `<p class="tl-wait">Answer locked in… waiting for the others</p>` : ""}</div>`;
    } else if (this.st === "reveal"){
      const Q = g.q, r = g.res || {}, mx = Math.max(1, ...(g.counts || [0, 0, 0, 0]));
      h += `<div class="tl-q"><div class="tl-top"><span class="tl-n">${g.i + 1} / ${g.qn}</span></div><div class="tl-card">${this.esc(Q.q)}</div>
        <div class="tl-bars">${Q.a.map((a, k) => a ? `<div class="tl-bar${k === g.correct ? " ok" : ""}" style="--c:${this.TILES[k].c}"><i style="height:${Math.round((g.counts[k] || 0)/mx*100)}%"></i><b>${g.counts[k] || 0}</b><span>${this.TILES[k].s}${k === g.correct ? " ✔" : ""}</span></div>` : "").join("")}</div>
        <div class="tl-tiles small">${Q.a.map((a, k) => a ? `<div class="tl-tile${k === g.correct ? " right" : " dim"}" style="--c:${this.TILES[k].c}"><span class="sh">${this.TILES[k].s}</span><span>${this.esc(a)}</span></div>` : "").join("")}</div>
        <div class="tl-me ${r.ok ? "good" : "bad"}">${r.ok ? `✔ Correct! +${r.pts}${r.streak > 1 ? `  🔥 Answer streak ${r.streak}` : ""}` : r.picked === undefined ? "⏰ Time's up!" : "✘ Not this time"}</div>
        ${g.host || !g.multi ? `<div class="tl-row center"><button class="hl" data-a="next">${g.i + 1 >= g.qn ? "🏆 Final results" : "Next ▶"}</button></div>` : `<p class="tl-wait">Next question soon…</p>`}</div>`;
    } else if (this.st === "board"){
      const list = this.ranking().slice(0, 5);
      h += `<div class="tl-center"><h2>Scoreboard</h2><ol class="tl-board">${list.map(p => `<li class="${p.id === this.me() ? "me" : ""}"><span>${this.esc(p.name)}</span><b>${p.score}</b></li>`).join("")}</ol></div>`;
    } else if (this.st === "end"){
      const list = this.ranking(), top = list.slice(0, 3), meI = list.findIndex(p => p.id === this.me());
      h += `<div class="tl-center"><h2>🏆 ${this.esc(g.title)}</h2><div class="tl-podium">${[1, 0, 2].map(i => top[i] ? `<div class="p${i + 1}"><span>${this.esc(top[i].name)}</span><b>${top[i].score}</b><i>${["🥇", "🥈", "🥉"][i]}</i></div>` : "<div></div>").join("")}</div>
        <p class="tl-sub">${meI >= 0 ? `You finished #${meI + 1} with ${list[meI].score} points and ${g.right || 0} of ${g.qn} right.` : ""}</p>
        <div class="tl-row center">${g.quiz && !g.host && g.custom ? `<button data-a="keep">💾 Save this quiz</button>` : ""}<button class="hl" data-a="lobby">Play again</button><button data-a="close">Done</button></div></div>`;
    }
    d.innerHTML = h;
  },
  input(e){ const t = e.target, f = t.dataset.f; if (!f || this.st !== "make") return; const z = this.draft, i = +t.dataset.i;
    if (f === "title") z.title = t.value; else if (f === "q") z.qs[i].q = t.value; else if (f === "a") z.qs[i].a[+t.dataset.k] = t.value; else if (f === "c") z.qs[i].c = +t.dataset.k; else if (f === "time") z.qs[i].time = +t.value; },
  click(e){
    const b = e.target.closest("[data-a]"); if (!b) return; const a = b.dataset.a;
    if (a === "close") return this.close();
    if (a === "lobby" || a === "back"){ this.stop(); this.game = null; this.st = "lobby"; return this.draw(); }
    if (a === "solo" || a === "host"){ const z = b.dataset.p ? this.pack(b.dataset.p) : this.cleanQuiz(this.mine()[+b.dataset.m]); if (!z){ toast("That quiz needs at least one complete question."); return; } return this.start(z, a === "host", !b.dataset.p); }
    if (a === "new" || a === "edit"){ this.editIdx = a === "edit" ? +b.dataset.m : null; const src = a === "edit" ? this.mine()[this.editIdx] : null;
      this.draft = src ? JSON.parse(JSON.stringify(src)) : {title: "", qs: [{q: "", a: ["", "", "", ""], c: 0, time: 20}]}; this.draft.qs.forEach(q => { while (q.a.length < 4) q.a.push(""); }); this.st = "make"; return this.draw(); }
    if (a === "addq"){ if (this.draft.qs.length >= 50) return toast("50 questions max."); this.draft.qs.push({q: "", a: ["", "", "", ""], c: 0, time: 20}); this.draw(); const ins = this.el.querySelectorAll('[data-f="q"]'); ins[ins.length - 1].focus(); return; }
    if (a === "delq"){ this.draft.qs.splice(+b.dataset.i, 1); if (!this.draft.qs.length) this.draft.qs.push({q: "", a: ["", "", "", ""], c: 0, time: 20}); return this.draw(); }
    if (a === "savequiz"){ const z = this.cleanQuiz(this.draft); if (!z) return toast("Add at least one question with two answers, and tick the right one."); const bad = this.draft.qs.filter(q => q.q.trim() && !(q.a[q.c] || "").trim()).length; if (bad) return toast("Tick a correct answer that isn't blank for every question.");
      const list = this.mine(); if (this.editIdx === null) list.push(z); else list[this.editIdx] = z; this.saveMine(list); toast(`💾 Saved “${z.title}” (${z.qs.length} questions).`); this.st = "lobby"; return this.draw(); }
    if (a === "delquiz"){ const list = this.mine(); list.splice(this.editIdx, 1); this.saveMine(list); toast("Quiz deleted."); this.st = "lobby"; return this.draw(); }
    if (a === "keep"){ const z = this.cleanQuiz(this.game.quiz); if (z){ const list = this.mine(); list.push(z); this.saveMine(list); toast(`💾 Saved “${z.title}” to My quizzes.`); b.disabled = true; } return; }
    if (a === "ans") return this.answer(+b.dataset.k);
    if (a === "next") return this.next();
  },
  /* ---------- running a game ---------- */
  start(quiz, host, custom){
    this.stop(); const multi = !!host && this.inParty(); const me = this.me();
    this.game = {quiz, title: quiz.title, qn: quiz.qs.length, i: -1, host: true, hostId: me, multi, custom, players: {[me]: {id: me, name: this.myName(), score: 0, streak: 0}}, right: 0};
    if (multi){ this.send({t: "start", title: quiz.title, n: quiz.qs.length, custom: !!custom}); try{ Party.sysMsg(`🎯 You started Trivia Live: ${quiz.title}`); }catch(e){} }
    this.st = "wait"; this.draw(); this.nextT = setTimeout(() => this.next(), multi ? 4000 : 1200);
  },
  next(){
    const g = this.game; if (!g || !g.host) return; this.stop();
    if (g.i + 1 >= g.qn) return this.finish();
    g.i++; const Q = g.quiz.qs[g.i]; g.q = Q; g.answers = {}; g.answered = 0; g.my = undefined; g.t0 = performance.now(); g.timeLeft = Q.time; g.res = null;
    if (g.multi) this.send({t: "q", i: g.i, n: g.qn, q: Q.q, a: Q.a, time: Q.time});
    this.st = "q"; this.draw(); this.runTimer();
  },
  runTimer(){ const g = this.game; this.timer = setInterval(() => { if (!g || this.game !== g) return this.stop(); const prev = Math.ceil(g.timeLeft); g.timeLeft = g.q.time - (performance.now() - g.t0)/1000;
      if (Math.ceil(g.timeLeft) !== prev && g.timeLeft > 0 && g.timeLeft <= 5) this.beep(880, .06, "sine", .06);
      if (this.st === "q"){ const tm = this.el.querySelector(".tl-timer"); if (tm){ tm.textContent = Math.max(0, Math.ceil(g.timeLeft)); tm.style.setProperty("--p", Math.max(0, g.timeLeft/g.q.time)); } }
      if (g.host && (g.timeLeft <= 0 || g.answered >= Object.keys(this.everyone()).length)) this.reveal(); else if (!g.host && g.timeLeft <= -1.5 && this.st === "q"){ /* wait for the host */ } }, 100); },
  everyone(){ const g = this.game, out = {[this.me()]: 1}; if (g.multi) try{ for (const id of Object.keys(Party.peers)) out[id] = 1; }catch(e){} return out; },
  answer(k){
    const g = this.game; if (!g || this.st !== "q" || g.my !== undefined) return; g.my = k; const ms = performance.now() - g.t0; this.beep(520, .08, "triangle", .1);
    if (g.host) this.record(this.me(), k, ms); else this.send({t: "ans", i: g.i, k, ms: Math.round(ms)});
    this.draw();
  },
  record(id, k, ms){ const g = this.game; if (!g || g.answers[id] !== undefined || this.st !== "q") return; g.answers[id] = {k, ms: Math.max(0, Math.min(ms, g.q.time*1000))}; g.answered = Object.keys(g.answers).length;
    if (!g.players[id]) g.players[id] = {id, name: this.nameOf(id), score: 0, streak: 0}; const el = this.el && this.el.querySelector(".tl-ans"); if (el) el.textContent = `${g.answered} answer${g.answered === 1 ? "" : "s"}`; },
  reveal(){
    const g = this.game; if (!g || this.st !== "q") return; this.stop(); const Q = g.q, counts = [0, 0, 0, 0], res = {};
    for (const [id, p] of Object.entries(g.players)){ const an = g.answers[id]; if (an) counts[an.k]++; const ok = !!an && an.k === Q.c;
      p.streak = ok ? p.streak + 1 : 0; const pts = ok ? Math.round(1000*(1 - an.ms/(Q.time*1000)/2)) + Math.min(500, (p.streak - 1)*100) : 0; p.score += pts; res[id] = {ok, pts, streak: p.streak, picked: an ? an.k : undefined}; }
    g.correct = Q.c; g.counts = counts; g.res = res[this.me()]; if (g.res && g.res.ok) g.right++;
    this.beep(g.res && g.res.ok ? 784 : 196, .35, g.res && g.res.ok ? "triangle" : "sawtooth", .09);
    if (g.multi) this.send({t: "reveal", i: g.i, c: Q.c, counts, res, scores: Object.values(g.players).map(p => ({id: p.id, name: p.name, score: p.score}))});
    this.st = "reveal"; this.draw();
    if (g.multi) this.nextT = setTimeout(() => { if (this.game === g && this.st === "reveal"){ this.st = "board"; this.draw(); this.send({t: "board"}); this.nextT = setTimeout(() => { if (this.game === g) this.next(); }, 4000); } }, 5000);
  },
  ranking(){ const g = this.game; return Object.values(g ? g.players : {}).sort((a, b) => b.score - a.score); },
  finish(){ const g = this.game; this.stop(); this.st = "end"; this.draw(); this.beep(523, .2, "triangle"); setTimeout(() => this.beep(659, .2, "triangle"), 180); setTimeout(() => this.beep(784, .4, "triangle"), 360);
    if (g.multi) this.send({t: "end", scores: Object.values(g.players).map(p => ({id: p.id, name: p.name, score: p.score})), quiz: g.custom ? g.quiz : null});
    try{ const me = g.players[this.me()]; if (me && !g.multi) Wellness.add("brain", Math.min(15, 3 + g.right)); else if (me) Wellness.add("social", 6); }catch(e){} },
  /* ---------- messages from the party ---------- */
  onMsg(from, m){
    if (!m || typeof m !== "object") return; const g = this.game;
    if (m.t === "start"){ if (g && g.host && this.st !== "end" && this.st !== "lobby") return; this.stop();
      this.game = {title: this.clean(m.title, 50) || "Trivia", qn: Math.max(1, Math.min(50, m.n | 0)), i: -1, host: false, hostId: from, multi: true, custom: !!m.custom, players: {}, right: 0};
      this.ensure(); if (this.el.hidden){ toast(`🎯 ${this.nameOf(from)} started Trivia Live! Tap 🎯 to join.`, 6000); this.pending = true; } this.st = "wait"; this.draw(); return; }
    if (!g && m.t === "q"){ this.game = {title: "Trivia Live", qn: Math.max(1, m.n | 0), i: -1, host: false, hostId: from, multi: true, players: {}, right: 0}; this.ensure(); toast(`🎯 ${this.nameOf(from)} is hosting Trivia Live. Tap 🎯 to join.`, 6000); return this.onMsg(from, m); }
    if (!g || g.host || from !== g.hostId){ if (g && g.host && m.t === "ans" && m.i === g.i) this.record(from, Math.max(0, Math.min(3, m.k | 0)), +m.ms || 0); return; }
    if (m.t === "q"){ const a = (Array.isArray(m.a) ? m.a : []).slice(0, 4).map(s => this.clean(s, 80)); this.stop(); g.i = m.i | 0; g.qn = Math.max(g.qn, m.n | 0); g.q = {q: this.clean(m.q, 160), a, time: [5, 10, 20, 30, 60].includes(+m.time) ? +m.time : 20}; g.my = undefined; g.answered = 0; g.t0 = performance.now(); g.timeLeft = g.q.time; this.st = "q"; if (!this.el.hidden) this.draw(); this.runTimer(); }
    else if (m.t === "reveal" && m.i === g.i){ this.stop(); g.correct = m.c | 0; g.counts = (m.counts || []).slice(0, 4).map(v => v | 0); const r = m.res && m.res[this.me()]; g.res = r ? {ok: !!r.ok, pts: r.pts | 0, streak: r.streak | 0, picked: r.picked} : {ok: false}; if (g.res.ok) g.right++;
      g.players = {}; for (const s of (m.scores || []).slice(0, 60)) g.players[s.id] = {id: s.id, name: s.id === this.me() ? this.myName() : this.clean(s.name, 24), score: s.score | 0};
      this.beep(g.res.ok ? 784 : 196, .35, g.res.ok ? "triangle" : "sawtooth", .09); this.st = "reveal"; if (!this.el.hidden) this.draw(); }
    else if (m.t === "board"){ this.st = "board"; if (!this.el.hidden) this.draw(); }
    else if (m.t === "end"){ g.players = {}; for (const s of (m.scores || []).slice(0, 60)) g.players[s.id] = {id: s.id, name: s.id === this.me() ? this.myName() : this.clean(s.name, 24), score: s.score | 0}; g.quiz = m.quiz ? this.cleanQuiz(m.quiz) : null; this.st = "end"; this.ensure(); this.el.hidden = false; this.draw(); }
    else if (m.t === "cancel"){ this.stop(); this.game = null; this.st = "lobby"; toast("The host ended the trivia game."); if (!this.el.hidden) this.draw(); }
  },
  peerLeft(id){ const g = this.game; if (g && !g.host && id === g.hostId){ this.stop(); this.game = null; this.st = "lobby"; if (this.el && !this.el.hidden){ this.draw(); toast("The trivia host left the party."); } } }
};

/* ================= 👑 Club owner: the empire ================= */
Object.assign(Mogul, {
  drawEmpire(){
    const d = this.d(), W = this.W, x = this.x; let Y = 84;
    if (this.vsel){ return this.drawVenue(this.vsel); }
    this.text(`👑 ${this.title(d)} · worth ${this.money(this.worth(d))}`, 28, Y + 30, 28, "#fff", 800, "left", W - 300);
    this.btn("sleep", W - 260, Y, 236, 52, "🌙 Next night", () => { const D = this.d(); D.day++; this.put(D); this.say("A new night. Every club can open again."); }, {size: 20});
    Y += 64;
    const owned = this.VENUES.filter(v => d.clubs[v.id]), forSale = this.VENUES.filter(v => !d.clubs[v.id]).sort((p, q) => p.price - q.price);
    this.text(`💵 Cash: ${this.money(d.cash)}`, 28, Y + 6, 22, "#ffd87a", 800); Y += 22;
    if (!owned.length) this.text(forSale[0] && d.cash >= forSale[0].price ? `You can afford the ${forSale[0].name} right now. Tap it below to buy your first club!` : `You don't own a club yet. The ${forSale[0] ? forSale[0].name + " costs " + this.money(forSale[0].price) : "cheapest one"}: work shifts to save up, then buy it below.`, 28, Y + 20, 20, "rgba(255,255,255,.75)", 500, "left", W - 56), Y += 40;
    const op = Math.min(this.ownPg || 0, Math.max(0, Math.ceil(owned.length/3) - 1)); this.ownPg = op;
    owned.slice(op*3, op*3 + 3).forEach((v, i) => { const c = d.clubs[v.id], ran = d.ran[v.id] === d.day, by = Y + i*86;
      this.btn("v" + v.id, 28, by, 560, 76, `${v.name} ›`, () => { this.vsel = v.id; this.draw(); }, {left: true, size: 24, sub: `⭐ rep ${Math.round(c.rep)} · ${c.lastProfit !== undefined ? "last night " + this.money(c.lastProfit) : "never opened"} · tap to upgrade & hire`});
      this.btn("run" + v.id, 600, by, 396, 76, ran ? "✓ Open tonight (done)" : "🎉 Open tonight", () => { const D = this.d(); if (D.ran[v.id] === D.day) return this.say("Already opened tonight. Tap 🌙 Next night."); this.runNight(v.id); }, {primary: !ran, size: 22}); });
    Y += Math.min(3, owned.length)*86;
    if (owned.length > 3){ this.btn("opv", 28, Y, 120, 40, "◀", () => { this.ownPg = Math.max(0, op - 1); }, {size: 20}); this.text(`My clubs ${op + 1}/${Math.ceil(owned.length/3)}`, 160, Y + 26, 18, "#fff", 700); this.btn("onx", 330, Y, 120, 40, "▶", () => { this.ownPg = op + 1; }, {size: 20}); Y += 48; }
    Y += 6; this.text("FOR SALE", 28, Y + 22, 16, "#ffc21a", 800);
    const sp = Math.min(this.salePg || 0, Math.max(0, Math.ceil(forSale.length/3) - 1)); this.salePg = sp;
    if (forSale.length > 3){ this.btn("spv", W - 260, Y, 110, 40, "◀", () => { this.salePg = Math.max(0, sp - 1); }, {size: 20}); this.btn("snx", W - 138, Y, 110, 40, "▶", () => { this.salePg = sp + 1; }, {size: 20}); }
    Y += 46;
    if (!forSale.length) this.text("You own every club in town. 👑", 28, Y + 30, 22, "#fff", 700);
    forSale.slice(sp*3, sp*3 + 3).forEach((v, i) => { const can = d.cash >= v.price; this.btn("buy" + v.id, 28 + i*328, Y, 318, 92, `${can ? "🛒 " : "🔒 "}${v.name}`, () => this.buyVenue(v.id),
      {left: true, size: 21, primary: can, sub: can ? `Buy for ${this.money(v.price)} · ${v.cap} people` : `${this.money(v.price)} · need ${this.money(v.price - d.cash)} more`}); });
    if (this.night){ const n = this.night; Y += 104; this.rr(x, 24, Y, W - 48, this.H - Y - 30, 16); x.fillStyle = "rgba(255,255,255,.05)"; x.fill();
      this.text(`Last night at ${n.name}: ${this.money(n.profit)} ${n.profit >= 0 ? "profit" : "loss"}`, 40, Y + 32, 24, n.profit >= 0 ? "#3ad07a" : "#ff8a7a", 800, "left", W - 80);
      let yy = Y + 64; for (const l of n.lines.slice(0, 6)){ this.text(l, 40, yy, 19, "rgba(255,255,255,.8)", 500, "left", W - 80); yy += 26; } }
  },
  buyVenue(id){ const D = this.d(), v = this.VENUES.find(x => x.id === id); if (!v || D.clubs[id]) return;
    if (D.cash < v.price){ const m = `You need ${this.money(v.price - D.cash)} more for ${v.name}. Work a few shifts (bartender and bouncer pay well), then come back.`; this.say(m, true); toast("🔒 " + m); return; }
    D.cash -= v.price; D.clubs[id] = {rep: 30, up: {}, staff: {}}; this.put(D); this.vsel = id; this.say(`🎉 You bought ${v.name}! Hire staff and upgrade it here, then open it tonight.`); toast(`🎉 You bought ${v.name}!`); try{ Lounge.burst(Lounge.headPos().add(new THREE.Vector3(0, .4, -1)), 18); }catch(e){} this.draw(); },
  drawVenue(id){
    const d = this.d(), v = this.VENUES.find(x => x.id === id), c = d.clubs[id], W = this.W; if (!c){ this.vsel = null; return this.drawEmpire(); }
    c.up = c.up || {}; c.staff = c.staff || {};
    this.btn("vback", 28, 84, 140, 48, "◀ Clubs", () => { this.vsel = null; this.draw(); }, {size: 20});
    this.text(`${v.name}`, 190, 118, 30, "#fff", 800, "left", 520);
    this.btn("visit", W - 280, 84, 256, 48, "🚪 Visit this club", () => { Lounge.chooseWorld(v.world); this.say(`Welcome to ${v.name}.`); }, {size: 20});
    this.text(`⭐ Reputation ${Math.round(c.rep)}/100 · ${v.cap} capacity · $${v.cover} cover · rent ${this.money(v.rent)}/night`, 28, 162, 20, "rgba(255,255,255,.75)", 500, "left", W - 56);
    this.text("UPGRADES", 28, 200, 16, "#ffc21a", 800);
    this.UPGRADES.forEach((u, i) => { const lv = c.up[u.id] || 0, cost = lv < 3 ? this.upCost(u, lv, v) : 0, X = 28 + (i % 2)*490, Y = 212 + Math.floor(i/2)*78;
      this.btn("u" + u.id, X, Y, 478, 70, `${u.icon} ${u.name}  ${"●".repeat(lv)}${"○".repeat(3 - lv)}`, () => { const D = this.d(), C = D.clubs[id]; if (!C) return; C.up = C.up || {}; const L2 = C.up[u.id] || 0, cst = L2 < 3 ? this.upCost(u, L2, v) : 0; if (L2 >= 3) return this.say("Maxed out."); if (D.cash < cst){ const m = `${u.name} costs ${this.money(cst)}. You need ${this.money(cst - D.cash)} more.`; this.say(m, true); toast("🔒 " + m); return; } D.cash -= cst; C.up[u.id] = L2 + 1; this.put(D); this.say(`${u.icon} ${u.name} upgraded to level ${L2 + 1}!`); toast(`${u.icon} ${u.name} upgraded!`); },
        {left: true, size: 20, primary: lv < 3 && d.cash >= cost, sub: lv >= 3 ? "Maxed" : d.cash >= cost ? `Upgrade: ${this.money(cost)} · ${u.fx}` : `${this.money(cost)} · need ${this.money(cost - d.cash)} more`}); });
    this.text("STAFF (paid every night you open)", 28, 466, 16, "#ffc21a", 800);
    this.STAFF.forEach((st, i) => { const n = c.staff[st.id] || 0, X = 28 + (i % 3)*326, Y = 478 + Math.floor(i/3)*76;
      this.btn("s" + st.id, X, Y, 230, 68, `${st.icon} ${st.name}: ${n}`, () => { const D = this.d(), C = D.clubs[id]; if (!C) return; C.staff = C.staff || {}; const N = C.staff[st.id] || 0; if (N >= (st.max || 1)) return this.say("That's the most you need."); C.staff[st.id] = N + 1; this.put(D); this.say(`Hired: ${st.name}.`); toast(`${st.icon} Hired: ${st.name}`); }, {left: true, size: 18, sub: `${this.money(st.wage)}/night · ${st.fx}`});
      this.btn("f" + st.id, X + 238, Y, 80, 68, "Let go", () => { const D = this.d(), C = D.clubs[id]; if (!C || !(C.staff && C.staff[st.id])) return; C.staff[st.id]--; this.put(D); }, {size: 15}); });
    this.text(`💵 Cash: ${this.money(d.cash)}`, W - 300, 200, 20, "#ffd87a", 800, "left", 280);
  },
  /* when a night report says "a fight broke out", two guests really do trade blows a few steps in front of you */
  scuffle(){ const L = Lounge, T = THREE, w = L.worlds && L.worlds[L.worldId]; if (!w || !L.built || (this.scuf && this.scuf.on)) return;
    const h = L.headPos(), yaw = L.renderer.xr.isPresenting ? L.headYaw() : L.yaw, cx = h.x - Math.sin(yaw)*3.2, cz = h.z - Math.cos(yaw)*3.2, rx = Math.cos(yaw), rz = -Math.sin(yaw), gy = w.group.getWorldPosition(new T.Vector3()).y;
    const mk = sg => { const wx = cx + rx*.55*sg, wz = cz + rz*.55*sg, lp = w.group.worldToLocal(new T.Vector3(wx, 0, wz)), sl = this.spawn(lp.x, lp.z, 0, "idle", {gender: Math.random() < .8 ? "m" : "f"}); if (!sl) return null;
      const fy = L.floorAt(wx, wz, h.y + .5); sl.p.position.y = (fy != null ? fy : (L.rig.position.y || 0)) - gy; return sl; };
    const a = mk(1), b = mk(-1); if (!a || !b){ if (a) this.despawn(a); if (b) this.despawn(b); return; }
    const S = this.scuf = {on: true, a, b, t: 0, d: null, dt: 0};
    S.iv = setInterval(() => { S.t += .5; if (!S.d && a.real && b.real) S.d = Fight.duel(a, b, {calm: .75, ko: false});
      if (S.d) S.dt += .5;
      if (S.dt >= 10 || S.t > 40){ clearInterval(S.iv); try{ if (S.d) Fight.stopDuel(S.d); }catch(e){} try{ Fight.off(a); Fight.off(b); }catch(e){} this.despawn(a); this.despawn(b); S.on = false; } }, 500); },
  runNight(id){
    const d = this.d(), v = this.VENUES.find(x => x.id === id), c = d.clubs[id]; c.up = c.up || {}; c.staff = c.staff || {};
    const U = k => c.up[k] || 0, S = k => c.staff[k] || 0, r = () => .8 + Math.random()*.4, lines = [];
    let crowd = v.cap*(.3 + c.rep/180)*(1 + .12*U("sound") + .08*U("lights") + (S("dj") ? .15 : 0) + (S("promoter") ? .2 : 0))*r();
    let mult = 1;
    const ev = Math.random(), fightOdds = Math.max(.03, .26 - .06*U("security") - .06*S("bouncers"));
    let fine = 0, repD = 0;
    if (ev < fightOdds){ fine = 300 + Math.random()*900*(v.price/8000 + 1); repD -= 6; lines.push(`🥊 A fight broke out. Fines and damage: ${this.money(fine)}. More security helps.`); try{ this.scuffle(); }catch(e){ console.warn(e); } }
    else if (ev < fightOdds + .07){ mult = 1.35; repD += 8; lines.push("🌟 A celebrity dropped in! Everyone posted about it."); }
    else if (ev < fightOdds + .13){ repD += 10; lines.push("📱 A video from your club went viral."); }
    else if (ev < fightOdds + .17 && U("sound") < 2){ mult = .6; lines.push("⚡ The sound system blew out for an hour. A better system would have held up."); }
    else if (ev < fightOdds + .23 && U("security") < 1){ fine += 500; lines.push("📋 A surprise inspection found problems: $500 fine."); }
    crowd = Math.min(v.cap*(1 + .1*U("vip")), crowd*mult); crowd = Math.round(crowd);
    const doorM = crowd*v.cover, barM = crowd*v.drink*(1.3 + .25*U("bar") + .12*S("bartenders"))*(S("bartenders") ? 1 : .55), vipM = U("vip")*3*(S("bottle") ? 1 : .4)*(250 + Math.random()*450)*(v.price/8000 + .5);
    const wages = this.STAFF.reduce((a, st) => a + st.wage*S(st.id), 0), upkeep = v.rent + Object.values(c.up).reduce((a, b) => a + b, 0)*40;
    const profit = Math.round(doorM + barM + vipM - wages - upkeep - fine);
    c.rep = Math.max(0, Math.min(100, (c.rep || 30) + repD + (profit > 0 ? 2 : -3) + U("lights")*.5)); c.lastProfit = profit;
    d.cash += profit; d.ran[id] = d.day; this.put(d);
    lines.unshift(`👥 ${crowd} guests · door ${this.money(doorM)} · bar ${this.money(barM)}${vipM > 1 ? " · VIP " + this.money(vipM) : ""}`, `💸 Staff ${this.money(wages)} · rent & upkeep ${this.money(upkeep)}`);
    if (!S("bartenders")) lines.push("🍸 No bartenders hired: the bar sold half as much.");
    this.night = {name: v.name, profit, lines}; this.say(profit >= 0 ? `${v.name} made ${this.money(profit)} tonight!` : `${v.name} lost ${this.money(-profit)} tonight.`, profit < 0);
  }
});


{ const start0 = Mogul.startGame.bind(Mogul);
  Mogul.startGame = function(role, train){
    if (role === 'escape'){ this.close(); Lounge.chooseWorld('escape'); setTimeout(() => document.querySelector('#escapeVault')?.scrollIntoView({block: 'nearest', behavior: 'smooth'}), 1200); toast('🔐 The Escape Room: find the clues in the study and open the vault. You get paid when it opens.', 5000); return; }
    return start0(role, train);
  }; }
window.Mogul = Mogul; window.TriviaLive = TriviaLive; window.Fight = Fight;
