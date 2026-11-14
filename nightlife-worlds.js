// Venue builders and character rig adapted from Mrimagemakers/Turnupmusic, app/index.html.
'use strict';
window.createTurnUpVenue = function(scene,id,onPerson){
const rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t;
const MOODS = [
  {name:"Sunset Rooftop", top:0x0b1030, horizon:0xc8603a, a:0xffc21a, b:0xf08a0c, warm:0xffb46b},
  {name:"Neon City",      top:0x060418, horizon:0x4a1f7a, a:0xff4fd8, b:0x4de1ff, warm:0xffa0e6},
  {name:"Ocean Chill",    top:0x020c1a, horizon:0x1d5f7a, a:0x6be5ff, b:0x2f7dff, warm:0xbfe9ff},
  {name:"Forest Night",   top:0x030b07, horizon:0x2a5a3c, a:0x8dff9e, b:0x1fbf6b, warm:0xd9ffb0},
  {name:"Midnight Gold",  top:0x02030a, horizon:0x3b2a12, a:0xffd36b, b:0xb8860b, warm:0xffcf8a}
];
function roundedBox(w, h, d, r = .05, seg = 3){
  const T = THREE, s = new T.Shape(), eps = .00001, rad = Math.min(r, w/2, h/2, d/2) - eps;
  const R = rad + eps;
  s.absarc(eps, eps, eps, -Math.PI/2, -Math.PI, true);
  s.absarc(eps, h - R*2, eps, Math.PI, Math.PI/2, true);
  s.absarc(w - R*2, h - R*2, eps, Math.PI/2, 0, true);
  s.absarc(w - R*2, eps, eps, 0, -Math.PI/2, true);
  const g = new T.ExtrudeGeometry(s, {depth: Math.max(.001, d - R*2), bevelEnabled:true, bevelSegments: seg*2, steps:1, bevelSize: rad, bevelThickness: R, curveSegments: seg});
  g.center(); g.computeVertexNormals();
  return g;
}
const Tex = {
  canvas(w, h){ const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; },
  make(c, {repeat, srgb = true} = {}){
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.anisotropy = 8;
    return t;
  },
  wood(){   // warm oak deck planks
    const [c, x] = this.canvas(1024, 1024), rows = 8, ph = 1024/rows;
    for (let r=0;r<rows;r++){
      let px = -Math.random()*400;
      while (px < 1024){
        const len = 380 + Math.random()*420, l = 30 + Math.random()*10, hue = 26 + Math.random()*8;
        x.fillStyle = `hsl(${hue},${38 + Math.random()*12}%,${l}%)`; x.fillRect(px, r*ph, len, ph);
        x.globalAlpha = .18;
        for (let g=0; g<26; g++){
          x.strokeStyle = Math.random() < .5 ? "#1e120a" : "#c89a6a"; x.lineWidth = Math.random()*2 + .4;
          x.beginPath(); const y0 = r*ph + Math.random()*ph;
          x.moveTo(px, y0); for (let k=0;k<=8;k++) x.lineTo(px + len*k/8, y0 + Math.sin(k*1.3 + g)*3);
          x.stroke();
        }
        x.globalAlpha = 1;
        x.fillStyle = "rgba(10,6,3,.85)"; x.fillRect(px + len - 2, r*ph, 3, ph);
        px += len;
      }
      x.fillStyle = "rgba(10,6,3,.9)"; x.fillRect(0, r*ph, 1024, 3);
    }
    return c;
  },
  walnut(){
    const [c, x] = this.canvas(512, 512);
    x.fillStyle = "#3a2416"; x.fillRect(0, 0, 512, 512);
    for (let i=0;i<120;i++){
      x.strokeStyle = `rgba(${Math.random() < .5 ? "20,10,5" : "120,80,50"},${.08 + Math.random()*.18})`; x.lineWidth = .6 + Math.random()*2;
      x.beginPath(); const y0 = Math.random()*512; x.moveTo(0, y0);
      for (let k=0;k<=12;k++) x.lineTo(512*k/12, y0 + Math.sin(k*.8 + i)*6 + Math.sin(k*2.3)*2);
      x.stroke();
    }
    return c;
  },
  marble(){
    const [c, x] = this.canvas(1024, 1024);
    const g = x.createLinearGradient(0, 0, 1024, 1024); g.addColorStop(0, "#f4f1ec"); g.addColorStop(1, "#e3ded6");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    for (let v=0; v<16; v++){
      x.strokeStyle = `rgba(${90 + Math.random()*40},${90 + Math.random()*40},${100 + Math.random()*40},${.15 + Math.random()*.35})`;
      x.lineWidth = .5 + Math.random()*2.5; x.shadowColor = "rgba(80,80,90,.4)"; x.shadowBlur = 6;
      x.beginPath(); let px = Math.random()*1024, py = Math.random()*1024; x.moveTo(px, py);
      for (let k=0;k<40;k++){ px += (Math.random() - .3)*60; py += (Math.random() - .5)*60; x.lineTo(px, py); }
      x.stroke();
    }
    return c;
  },
  fabric(){   // bump map: woven texture
    const [c, x] = this.canvas(256, 256), img = x.createImageData(256, 256);
    for (let y=0;y<256;y++) for (let i=0;i<256;i++){
      const weave = ((i>>1) % 2 ^ (y>>1) % 2) ? 150 : 110, n = weave + Math.random()*60;
      const o = (y*256 + i)*4; img.data[o] = img.data[o+1] = img.data[o+2] = n; img.data[o+3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  },
  rug(){
    const [c, x] = this.canvas(1024, 1024), cx = 512;
    x.fillStyle = "#d9cdb8"; x.beginPath(); x.arc(cx, cx, 510, 0, Math.PI*2); x.fill();
    const rings = [[500,"#2b2420"],[470,"#d9cdb8"],[440,"#b8673f"],[420,"#d9cdb8"],[250,"#2b2420"],[236,"#d9cdb8"]];
    for (const [r, col] of rings){ x.strokeStyle = col; x.lineWidth = r === 440 ? 14 : 8; x.beginPath(); x.arc(cx, cx, r, 0, Math.PI*2); x.stroke(); }
    for (let i=0;i<24;i++){ const a = i/24*Math.PI*2; x.fillStyle = i % 2 ? "#b8673f" : "#2b2420"; x.save(); x.translate(cx + Math.cos(a)*340, cx + Math.sin(a)*340); x.rotate(a); x.fillRect(-22, -22, 44, 44); x.restore(); }
    const img = x.getImageData(0, 0, 1024, 1024);
    for (let i=0;i<img.data.length;i+=4){ const n = (Math.random() - .5)*26; img.data[i] += n; img.data[i+1] += n; img.data[i+2] += n; }
    x.putImageData(img, 0, 0);
    return c;
  },
  skyline(){   // city wrapped around the rooftop
    const [c, x] = this.canvas(4096, 1024);
    for (let layer=0; layer<3; layer++){
      let px = 0;
      while (px < 4096){
        const w = 40 + Math.random()*120, h = (layer === 0 ? 1000 : layer === 1 ? 760 : 470)*(.45 + Math.random()*.55);
        const base = 1024, top = base - h;
        x.fillStyle = ["#1a1c2c","#10111d","#08080e"][layer]; x.fillRect(px, top, w, h);
        if (Math.random() < .25){ x.fillRect(px + w/2 - 2, top - 40, 4, 40); x.fillStyle = "#ff3b30"; x.fillRect(px + w/2 - 3, top - 44, 6, 6); }
        for (let wy = top + 10; wy < base - 8; wy += 14) for (let wx = px + 6; wx < px + w - 8; wx += 11){
          if (Math.random() < .38){ x.fillStyle = Math.random() < .8 ? `rgba(255,${200 + Math.random()*40},${120 + Math.random()*60},${.5 + Math.random()*.5})` : "rgba(170,210,255,.7)"; x.fillRect(wx, wy, 5, 7); }
        }
        px += w + Math.random()*12;
      }
    }
    return c;
  },
  glow(){
    const [c, x] = this.canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c;
  },
  leaf(){
    const [c, x] = this.canvas(128, 512);
    const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, "#1f4d22"); g.addColorStop(.5, "#3f8a3a"); g.addColorStop(1, "#1f4d22");
    x.fillStyle = g; x.beginPath(); x.moveTo(64, 0); x.quadraticCurveTo(128, 200, 70, 512); x.lineTo(58, 512); x.quadraticCurveTo(0, 200, 64, 0); x.fill();
    x.strokeStyle = "rgba(200,230,150,.35)"; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 10); x.lineTo(64, 505); x.stroke();
    for (let y=40;y<500;y+=34){ x.strokeStyle = "rgba(180,220,120,.18)"; x.beginPath(); x.moveTo(64, y); x.quadraticCurveTo(80, y - 8, 100, y - 30); x.moveTo(64, y); x.quadraticCurveTo(48, y - 8, 28, y - 30); x.stroke(); }
    return c;
  }
};
Object.assign(Tex, {
  noise(x, w, h, amt){ const img = x.getImageData(0, 0, w, h); for (let i=0;i<img.data.length;i+=4){ const n = (Math.random() - .5)*amt; img.data[i] += n; img.data[i+1] += n; img.data[i+2] += n; } x.putImageData(img, 0, 0); },
  concrete(){
    const [c, x] = this.canvas(512, 512); x.fillStyle = "#8d8a86"; x.fillRect(0, 0, 512, 512);
    this.noise(x, 512, 512, 30);
    x.strokeStyle = "rgba(40,38,36,.7)"; x.lineWidth = 3;
    for (let i=0;i<=512;i+=128){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
    return c;
  },
  cloud(){
    const [c, x] = this.canvas(512, 256);
    for (let i=0;i<26;i++){ const px = 60 + Math.random()*390, py = 90 + Math.random()*90, r = 30 + Math.random()*60;
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 512, 256); }
    return c;
  },
  sign(text, color, {neon = true, bg = null, font = '700 120px "Chakra Petch", "Arial Narrow", sans-serif', w = 1024, h = 256} = {}){
    const [c, x] = this.canvas(w, h);
    if (bg){ x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.font = font; x.textAlign = "center"; x.textBaseline = "middle";
    let size = parseInt(font.match(/(\d+)px/)[1]);
    while (x.measureText(text).width > w*.9 && size > 20){ size -= 6; x.font = font.replace(/\d+px/, size + "px"); }
    if (neon){
      for (const [blur, lw, col] of [[40, 10, color], [18, 7, color], [4, 3, "#ffffff"]]){ x.shadowColor = color; x.shadowBlur = blur; x.strokeStyle = col; x.lineWidth = lw; x.strokeText(text, w/2, h/2 + 6); }
    } else { x.fillStyle = color; x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 6; x.fillText(text, w/2, h/2 + 6); }
    return c;
  },
  flame(){
    const [c, x] = this.canvas(128, 256);
    const g = x.createRadialGradient(64, 190, 6, 64, 170, 110);
    g.addColorStop(0, "rgba(255,250,220,1)"); g.addColorStop(.25, "rgba(255,200,80,.95)"); g.addColorStop(.6, "rgba(255,90,20,.6)"); g.addColorStop(1, "rgba(255,40,0,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(64, 0); x.bezierCurveTo(120, 120, 118, 250, 64, 250); x.bezierCurveTo(10, 250, 8, 120, 64, 0); x.fill();
    return c;
  },
  beam(){
    const [c, x] = this.canvas(64, 256), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 256); return c;
  },
});
const Props = {
  env: null,
  m: null,
  mats(){
    if (this.m) return this.m;
    const T = THREE, P = (o) => new T.MeshPhysicalMaterial(Object.assign({envMap:this.env}, o));
    return this.m = {
      glass: P({color:0xffffff, metalness:0, roughness:.03, transparent:true, opacity:.2, clearcoat:1, clearcoatRoughness:0, envMapIntensity:2.6, side:T.DoubleSide, depthWrite:false}),
      glassBase: P({color:0xf4fbff, metalness:0, roughness:.05, transparent:true, opacity:.45, clearcoat:1, envMapIntensity:2.2}),
      greenBottle: P({color:0x0a2613, metalness:.15, roughness:.05, clearcoat:1, clearcoatRoughness:.02, envMapIntensity:2.4}),
      redBottle: P({color:0x140b0c, metalness:.15, roughness:.05, clearcoat:1, clearcoatRoughness:.02, envMapIntensity:2.4}),
      brownBottle: P({color:0x3a1805, metalness:.1, roughness:.06, clearcoat:1, clearcoatRoughness:.03, envMapIntensity:2.2}),
      foilGold: P({color:0xd4a937, metalness:1, roughness:.32, envMapIntensity:1.6}),
      foilRed: P({color:0x6e0e1c, metalness:.8, roughness:.35}),
      steel: P({color:0xdfe3e8, metalness:1, roughness:.18, envMapIntensity:1.8, side:T.DoubleSide}),
      porcelain: P({color:0xf7f4ee, metalness:0, roughness:.22, clearcoat:.7, clearcoatRoughness:.1}),
      champagne: P({color:0xf1cf6a, emissive:0x3a2a05, metalness:0, roughness:.05, transparent:true, opacity:.78, depthWrite:false}),
      redWine: P({color:0x5a0a16, metalness:0, roughness:.05, transparent:true, opacity:.93, clearcoat:1}),
      whiskey: P({color:0xb8621b, emissive:0x1a0800, metalness:0, roughness:.05, transparent:true, opacity:.82, depthWrite:false}),
      blue: P({color:0x2fb6ff, emissive:0x05253a, metalness:0, roughness:.05, transparent:true, opacity:.82, depthWrite:false}),
      pink: P({color:0xff4f9a, emissive:0x2a0516, metalness:0, roughness:.05, transparent:true, opacity:.82, depthWrite:false}),
      water: P({color:0xdff3ff, metalness:0, roughness:.02, transparent:true, opacity:.28, depthWrite:false}),
      ice: P({color:0xeaf6ff, metalness:0, roughness:.12, transparent:true, opacity:.5, clearcoat:1}),
      cork: new T.MeshStandardMaterial({color:0xb98a55, roughness:.9}),
      olive: new T.MeshStandardMaterial({color:0x6b7d26, roughness:.4}),
      wood: new T.MeshStandardMaterial({color:0xc7a274, roughness:.7})
    };
  },
  lathe(pts, seg = 40){ const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); g.computeVertexNormals(); return g; },
  mesh(geo, mat, parent, x = 0, y = 0, z = 0){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; },
  labelTex(lines, {bg = "#efe6d2", ink = "#1b1b1b", accent = "#b0892d", w = 512, h = 256} = {}){
    const [c, x] = Tex.canvas(w, h);
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.strokeStyle = accent; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28);
    x.textAlign = "center"; x.textBaseline = "middle";
    lines.forEach(([t, size, color, weight], i) => { x.fillStyle = color || ink; x.font = `${weight || 700} ${size}px "Playfair Display", Georgia, serif`; x.fillText(t, w/2, h*(i + 1)/(lines.length + 1)); });
    const tex = Tex.make(c); return tex;
  },
  // a label wrapped part-way round a bottle
  label(parent, r, y0, y1, tex, arc = 2.4){
    const T = THREE, g = new T.CylinderGeometry(r, r, y1 - y0, 32, 1, true, -arc/2, arc);
    return this.mesh(g, new T.MeshStandardMaterial({map:tex, roughness:.6, polygonOffset:true, polygonOffsetFactor:-1}), parent, 0, (y0 + y1)/2, 0);
  },

  champagne({label = true} = {}){
    const T = THREE, M = this.mats(), g = new T.Group();
    const prof = [[0, .012], [.024, .006], [.036, 0], [.038, .006], [.038, .18], [.036, .2], [.027, .232], [.017, .255], [.0135, .272], [.0135, .292], [.0158, .296], [.0158, .304], [0, .305]];
    this.mesh(this.lathe(prof), M.greenBottle, g);
    // foil over the neck and cork
    this.mesh(this.lathe([[.0175, .235], [.0145, .255], [.0145, .292], [.0168, .296], [.0168, .306], [.012, .312], [0, .313]].map(([r, y]) => [r + .0012, y])), M.foilGold, g);
    if (label){
      if (!this.champLabel) this.champLabel = this.labelTex([["MAISON LUMIÈRE", 44, "#1b1b1b", 700], ["BRUT", 72, "#8a6a1e", 800], ["CHAMPAGNE · RÉSERVE", 26, "#333", 600]], {bg:"#f3ead6"});
      this.label(g, .0386, .07, .16, this.champLabel, 2.2);
      if (!this.neckLabel) this.neckLabel = this.labelTex([["ML", 120, "#f3ead6", 800]], {bg:"#0e1b12", accent:"#d4a937", w:256, h:256});
      this.label(g, .0205, .222, .238, this.neckLabel, 3.2).scale.set(1.12, 1, 1.12);
    }
    g.userData.kind = "champagne"; g.userData.neckY = .3;
    return g;
  },
  wineBottle(){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, .01], [.03, .004], [.036, 0], [.037, .006], [.037, .2], [.033, .222], [.02, .24], [.0145, .255], [.0145, .31], [.016, .313], [.016, .318], [0, .318]]), M.redBottle, g);
    this.mesh(this.lathe([[.0157, .262], [.0157, .313], [.0172, .316], [.0172, .32], [0, .321]]), M.foilRed, g);
    if (!this.wineLabel) this.wineLabel = this.labelTex([["CHÂTEAU", 34, "#333", 600], ["Belle Rive", 70, "#1b1b1b", 700], ["GRAND VIN · 2019", 26, "#6e0e1c", 700]], {bg:"#fbf7ee", accent:"#6e0e1c"});
    this.label(g, .0376, .07, .17, this.wineLabel, 2.0);
    g.userData.kind = "wine";
    return g;
  },
  beerBottle(){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, .008], [.024, .002], [.029, 0], [.03, .005], [.03, .12], [.027, .14], [.015, .17], [.0125, .2], [.0125, .215], [.014, .217], [.014, .222], [0, .222]]), M.brownBottle, g);
    this.mesh(new T.CylinderGeometry(.0145, .0145, .008, 20), M.foilGold, g, 0, .224, 0);
    if (!this.beerLabel) this.beerLabel = this.labelTex([["SUNSET", 60, "#fff", 800], ["GOLDEN LAGER", 34, "#ffd36b", 700]], {bg:"#b8261b", accent:"#ffd36b"});
    this.label(g, .0306, .045, .1, this.beerLabel, 2.6);
    g.userData.kind = "beer";
    return g;
  },
  flute(fill = "champagne"){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, 0], [.034, 0], [.034, .003], [.012, .006], [.0045, .014], [.0042, .1], [.008, .11], [.017, .125], [.024, .155], [.0262, .19], [.0255, .235]]), M.glass, g);
    this.mesh(new T.CylinderGeometry(.034, .034, .004, 40), M.glassBase, g, 0, .002, 0);
    if (fill) this.mesh(this.lathe([[0, .118], [.012, .122], [.021, .14], [.0245, .16], [.0252, .192], [0, .192]], 28), M[fill], g).castShadow = false;
    g.userData.kind = "glass";
    return g;
  },
  wineGlass(fill = "redWine"){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, 0], [.038, 0], [.038, .003], [.012, .007], [.0045, .016], [.0042, .085], [.012, .095], [.03, .108], [.042, .135], [.042, .16], [.036, .195], [.033, .21]]), M.glass, g);
    this.mesh(new T.CylinderGeometry(.038, .038, .004, 40), M.glassBase, g, 0, .002, 0);
    if (fill) this.mesh(this.lathe([[0, .092], [.012, .096], [.03, .109], [.0405, .132], [0, .132]], 28), M[fill], g).castShadow = false;
    g.userData.kind = "glass";
    return g;
  },
  martini(fill = "blue"){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, 0], [.036, 0], [.036, .003], [.008, .008], [.0042, .02], [.0042, .1], [.009, .104], [.06, .18], [.061, .182]]), M.glass, g);
    this.mesh(new T.CylinderGeometry(.036, .036, .004, 40), M.glassBase, g, 0, .002, 0);
    this.mesh(this.lathe([[0, .104], [.008, .106], [.05, .166], [0, .166]], 32), M[fill], g).castShadow = false;
    const pick = this.mesh(new T.CylinderGeometry(.0015, .0015, .1, 6), M.wood, g, .015, .16, 0); pick.rotation.z = .5;
    this.mesh(new T.SphereGeometry(.009, 12, 10).scale(1, 1.25, 1), M.olive, g, -.002, .137, 0).rotation.z = .5;
    g.userData.kind = "glass";
    return g;
  },
  tumbler(fill = "whiskey", ice = 3){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[.04, .016], [.04, 0], [.0415, 0], [.0435, .09]]), M.glass, g);
    this.mesh(new T.CylinderGeometry(.04, .041, .016, 40), M.glassBase, g, 0, .008, 0);
    if (fill) this.mesh(new T.CylinderGeometry(.0395, .039, .04, 32), M[fill], g, 0, .036, 0).castShadow = false;
    for (let i=0;i<ice;i++){ const c = this.mesh(roundedBox(.026, .026, .026, .005, 2), M.ice, g, Math.cos(i*2.1)*.014, .05 + (i % 2)*.012, Math.sin(i*2.1)*.014); c.rotation.set(i*.7, i*1.3, i*.4); c.castShadow = false; }
    g.userData.kind = "glass";
    return g;
  },
  iceBucket(){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, 0], [.074, 0], [.079, .008], [.094, .2], [.1, .206], [.1, .212], [.096, .214]], 48), M.steel, g);
    this.mesh(new T.CylinderGeometry(.075, .075, .004, 32), M.steel, g, 0, .002, 0);
    for (const s of [-1, 1]){ const h = this.mesh(new T.TorusGeometry(.024, .0045, 8, 20), M.steel, g, s*.104, .17, 0); h.rotation.y = Math.PI/2; }
    for (let i=0;i<9;i++){ const a = i*.7, r = .03 + (i % 3)*.017; const c = this.mesh(roundedBox(.03, .03, .03, .006, 2), M.ice, g, Math.cos(a)*r, .185 + (i % 2)*.01, Math.sin(a)*r); c.rotation.set(a, a*1.7, a*.3); c.castShadow = false; }
    g.userData.kind = "bucket";
    return g;
  },
  coffeeCup(){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, .001], [.028, .001], [.031, .004], [.036, .02], [.042, .06], [.0442, .075], [.0436, .078], [.0405, .076], [.0385, .06], [.032, .022], [.02, .013], [0, .012]], 40), M.porcelain, g);
    if (!this.latteT){
      const [c, x] = Tex.canvas(256, 256);
      const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "#c58d5b"); gr.addColorStop(.7, "#8a5328"); gr.addColorStop(1, "#5a3214");
      x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
      x.fillStyle = "rgba(248,236,216,.92)";
      for (let i=0;i<6;i++){ x.beginPath(); x.ellipse(128, 70 + i*22, 64 - i*8, 15 - i, 0, 0, Math.PI*2); x.fill(); x.fillStyle = i % 2 ? "rgba(248,236,216,.92)" : "rgba(170,110,60,.85)"; }
      x.fillStyle = "rgba(248,236,216,.92)"; x.beginPath(); x.moveTo(128, 60); x.quadraticCurveTo(160, 120, 128, 200); x.quadraticCurveTo(96, 120, 128, 60); x.fill();
      this.latteT = Tex.make(c);
    }
    this.mesh(new T.CircleGeometry(.0392, 32).rotateX(-Math.PI/2), new T.MeshStandardMaterial({map:this.latteT, roughness:.35}), g, 0, .066, 0).castShadow = false;
    const h = this.mesh(new T.TorusGeometry(.019, .0055, 10, 20, Math.PI*1.15), M.porcelain, g, .043, .043, 0); h.rotation.z = -Math.PI/2 - .08;
    g.userData.kind = "cup";
    return g;
  },
  saucer(r = .078){
    const M = this.mats();
    return this.mesh(this.lathe([[0, 0], [r*.6, 0], [r*.65, .004], [r*.9, .009], [r, .016], [r*.98, .018], [r*.88, .012], [r*.55, .009], [0, .01]], 48), M.porcelain, new THREE.Group()).parent;
  },
  croissant(){
    const T = THREE, g = new T.Group(), N = 48, R = 14;
    const path = new T.CatmullRomCurve3([-1.15, -.6, 0, .6, 1.15].map(a => new T.Vector3(Math.sin(a)*.06, 0, -Math.cos(a)*.045 + .03)));
    const tube = new T.TubeGeometry(path, N, 1, R, false), pos = tube.attributes.position, cols = [];
    const tmp = new T.Vector3(), ctr = new T.Vector3();
    for (let i=0;i<=N;i++){
      const t = i/N, k = 1 - Math.pow(Math.abs(2*t - 1), 1.6)*.72, band = 1 + .13*Math.cos(t*Math.PI*9);
      path.getPointAt(t, ctr);
      for (let j=0;j<=R;j++){
        const idx = i*(R + 1) + j; tmp.fromBufferAttribute(pos, idx).sub(ctr);   // unit offset
        const r = .026*k*band; tmp.multiplyScalar(r); tmp.y *= .78;
        pos.setXYZ(idx, ctr.x + tmp.x, ctr.y + tmp.y + .02*k, ctr.z + tmp.z);
        const top = Math.max(0, tmp.y/.02), c = new T.Color(0xd99a48).lerp(new T.Color(0x8a4a16), Math.min(1, top*.9 + (band - 1)*1.4));
        cols.push(c.r, c.g, c.b);
      }
    }
    tube.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); tube.computeVertexNormals();
    this.mesh(tube, new T.MeshPhysicalMaterial({vertexColors:true, roughness:.5, clearcoat:.35, clearcoatRoughness:.5}), g, 0, .004, 0);
    g.userData.kind = "food";
    return g;
  },
  plate(r = .11){
    const M = this.mats();
    return this.mesh(this.lathe([[0, 0], [r*.55, 0], [r*.6, .004], [r*.88, .01], [r, .018], [r*.97, .02], [r*.85, .013], [r*.55, .009], [0, .01]], 56), M.porcelain, new THREE.Group()).parent;
  },
  candle(){
    const T = THREE, M = this.mats(), g = new T.Group();
    this.mesh(this.lathe([[0, 0], [.04, 0], [.042, .09]]), M.glass, g);
    this.mesh(new T.CylinderGeometry(.034, .034, .05, 28), new T.MeshStandardMaterial({color:0xf2e8d6, roughness:.7, emissive:0x3a2008}), g, 0, .025, 0);
    const fl = new T.Sprite(new T.SpriteMaterial({map:Lounge.glowT, color:0xffb14a, transparent:true, depthWrite:false, blending:T.AdditiveBlending}));
    fl.position.y = .068; fl.scale.set(.05, .08, 1); g.add(fl);
    g.userData.kind = "candle"; g.userData.flame = fl;
    return g;
  },
  vinyl(){
    const T = THREE, g = new T.Group();
    if (!this.grooveT){
      const [c, x] = Tex.canvas(512, 512); x.fillStyle = "#0a0a0a"; x.fillRect(0, 0, 512, 512);
      for (let r=250;r>90;r-=2){ x.strokeStyle = `rgba(255,255,255,${.03 + Math.random()*.05})`; x.lineWidth = 1; x.beginPath(); x.arc(256, 256, r, 0, Math.PI*2); x.stroke(); }
      x.fillStyle = "#d9480f"; x.beginPath(); x.arc(256, 256, 84, 0, Math.PI*2); x.fill();
      x.fillStyle = "#fff"; x.font = '700 30px "Hanken Grotesk", sans-serif'; x.textAlign = "center"; x.fillText("TURN UP", 256, 236); x.font = '500 18px "Hanken Grotesk", sans-serif'; x.fillText("SIDE A · 33⅓", 256, 290);
      x.fillStyle = "#111"; x.beginPath(); x.arc(256, 256, 7, 0, Math.PI*2); x.fill();
      this.grooveT = Tex.make(c);
    }
    const top = new T.MeshPhysicalMaterial({map:this.grooveT, roughness:.28, metalness:.2, clearcoat:.8, clearcoatRoughness:.2});
    this.mesh(new T.CylinderGeometry(.15, .15, .003, 64), [new T.MeshStandardMaterial({color:0x0a0a0a, roughness:.3}), top, top], g, 0, .0015, 0);
    g.userData.kind = "record";
    return g;
  },
  sleeve(){
    const T = THREE, g = new T.Group();
    if (!this.sleeveT){
      const [c, x] = Tex.canvas(512, 512);
      const gr = x.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, "#ff7a45"); gr.addColorStop(.5, "#c2185b"); gr.addColorStop(1, "#311b92");
      x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
      for (let i=0;i<9;i++){ x.strokeStyle = `rgba(255,255,255,${.12 + i*.05})`; x.lineWidth = 4; x.beginPath(); x.arc(256, 330, 40 + i*26, Math.PI, 0); x.stroke(); }
      x.fillStyle = "#fff"; x.font = '800 54px "Chakra Petch", sans-serif'; x.textAlign = "center"; x.fillText("SUNSET SESSIONS", 256, 110); x.font = '600 26px "Hanken Grotesk", sans-serif'; x.fillText("VOL. 2", 256, 150);
      this.sleeveT = Tex.make(c);
    }
    const art = new T.MeshStandardMaterial({map:this.sleeveT, roughness:.55}), edge = new T.MeshStandardMaterial({color:0xe8e2d6, roughness:.8});
    this.mesh(new T.BoxGeometry(.31, .004, .31), [edge, edge, art, edge, edge, edge], g, 0, .002, 0);
    g.userData.kind = "record";
    return g;
  },
  book(color = 0x22313f, title = "CITY LIGHTS"){
    const T = THREE, g = new T.Group();
    const [c, x] = Tex.canvas(256, 320); x.fillStyle = "#" + new T.Color(color).getHexString(); x.fillRect(0, 0, 256, 320);
    x.strokeStyle = "#d4a937"; x.lineWidth = 4; x.strokeRect(18, 18, 220, 284);
    x.fillStyle = "#e9d9a8"; x.textAlign = "center"; x.font = '700 30px "Playfair Display", Georgia, serif'; x.fillText(title, 128, 130); x.font = '400 18px Georgia, serif'; x.fillText("a novel", 128, 170);
    const cover = new T.MeshStandardMaterial({map:Tex.make(c), roughness:.65}), plain = new T.MeshStandardMaterial({color, roughness:.65});
    const pages = new T.MeshStandardMaterial({color:0xf1e9d6, roughness:.9});
    this.mesh(new T.BoxGeometry(.205, .006, .26), [plain, plain, cover, plain, plain, plain], g, 0, .037, 0);
    this.mesh(new T.BoxGeometry(.205, .006, .26), plain, g, 0, .003, 0);
    this.mesh(new T.BoxGeometry(.012, .04, .26), plain, g, -.1, .02, 0);
    this.mesh(new T.BoxGeometry(.195, .028, .25), pages, g, .002, .02, 0);
    g.userData.kind = "book";
    return g;
  },
  beachBall(r = .22){
    const T = THREE, g = new T.Group();
    if (!this.ballT){
      const [c, x] = Tex.canvas(1024, 512), cols = ["#e8352a", "#ffffff", "#1f6fd1", "#ffd21a", "#ffffff", "#2aa84a"];
      cols.forEach((col, i) => { x.fillStyle = col; x.fillRect(i*1024/6, 0, 1024/6 + 1, 512); });
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, 1024, 26); x.fillRect(0, 486, 1024, 26);
      this.ballT = Tex.make(c);
    }
    this.mesh(new T.SphereGeometry(r, 48, 32), new T.MeshPhysicalMaterial({map:this.ballT, roughness:.28, clearcoat:.8, clearcoatRoughness:.15}), g, 0, r, 0);
    this.mesh(new T.CylinderGeometry(.012, .012, .008, 12), new T.MeshStandardMaterial({color:0xffffff, roughness:.4}), g, 0, 2*r + .002, 0);
    g.userData.kind = "ball"; g.userData.r = r;
    return g;
  },
  surfboard(){
    const T = THREE, g = new T.Group(), L = 2.1, W = .27;
    const outline = (w, l) => { const s = new T.Shape(); s.moveTo(0, -l/2);
      s.bezierCurveTo(w*.9, -l/2 + .05, w, -l*.15, w, 0); s.bezierCurveTo(w, l*.25, w*.55, l/2 - .06, 0, l/2);
      s.bezierCurveTo(-w*.55, l/2 - .06, -w, l*.25, -w, 0); s.bezierCurveTo(-w, -l*.15, -w*.9, -l/2 + .05, 0, -l/2); return s; };
    const body = new T.ExtrudeGeometry(outline(W, L), {depth:.03, bevelEnabled:true, bevelThickness:.018, bevelSize:.018, bevelSegments:5, curveSegments:32}); body.translate(0, 0, -.015);
    const glossW = new T.MeshPhysicalMaterial({color:0xf6f2ea, roughness:.18, clearcoat:1, clearcoatRoughness:.05});
    this.mesh(body, glossW, g);
    const stripe = new T.ExtrudeGeometry(outline(W*.32, L*.92), {depth:.002, bevelEnabled:false, curveSegments:32});
    const sm = new T.MeshPhysicalMaterial({color:0xe8553a, roughness:.2, clearcoat:1});
    this.mesh(stripe, sm, g, 0, 0, .0345); this.mesh(stripe, sm, g, 0, 0, -.0365).rotation.y = Math.PI;
    const fin = new T.Shape(); fin.moveTo(0, 0); fin.quadraticCurveTo(.02, .1, .1, .12); fin.lineTo(.12, 0); fin.closePath();
    const finG = new T.ExtrudeGeometry(fin, {depth:.008, bevelEnabled:false}); finG.translate(0, 0, -.004);
    const f = this.mesh(finG, new T.MeshStandardMaterial({color:0x222222, roughness:.4}), g, 0, -L/2 + .08, -.03); f.rotation.set(0, Math.PI/2, Math.PI/2);
    g.userData.kind = "board";
    return g;
  },
  djBooth(){
    const T = THREE, g = new T.Group(), M = this.mats();
    const shell = new T.MeshPhysicalMaterial({color: 0x141416, roughness: .3, metalness: .5, clearcoat: .7, envMap: this.env});
    const deckM = new T.MeshStandardMaterial({color: 0x232326, roughness: .45, metalness: .6, envMap: this.env});
    this.mesh(roundedBox(1.7, .95, .7, .04), shell, g, 0, .475, 0);
    // glowing front panel
    const [c, x] = Tex.canvas(512, 160), gr = x.createLinearGradient(0, 0, 512, 0);
    gr.addColorStop(0, "#ff4fd8"); gr.addColorStop(.5, "#ffc21a"); gr.addColorStop(1, "#4de1ff");
    x.fillStyle = "#0b0b0e"; x.fillRect(0, 0, 512, 160); x.fillStyle = gr; x.fillRect(0, 148, 512, 12); x.fillRect(0, 0, 512, 6);
    x.font = 'italic 700 92px "Chakra Petch", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = gr; x.fillText("TURN UP", 256, 80);
    this.mesh(new T.PlaneGeometry(1.6, .5), new T.MeshBasicMaterial({map: Tex.make(c), toneMapped: false}), g, 0, .55, .352).castShadow = false;
    // two turntables, a mixer, a laptop
    const platters = [];
    for (const s of [-1, 1]){
      this.mesh(roundedBox(.46, .05, .37, .015), deckM, g, s*.55, .975, -.02);
      const v = this.vinyl(); v.position.set(s*.55 - .03, 1.0, -.02); v.scale.setScalar(.95); g.add(v); platters.push(v);
      const arm = this.mesh(new T.CylinderGeometry(.004, .004, .2, 6), M.steel, g, s*.55 + .15, 1.03, .02); arm.rotation.set(Math.PI/2, 0, .4);
      this.mesh(new T.CylinderGeometry(.018, .018, .03, 12), M.steel, g, s*.55 + .17, 1.015, -.1);
    }
    this.mesh(roundedBox(.3, .06, .34, .015), deckM, g, 0, .98, -.02);
    const knobM = new T.MeshStandardMaterial({color: 0xdddddd, roughness: .3, metalness: .6});
    for (let i=0;i<8;i++) this.mesh(new T.CylinderGeometry(.012, .012, .018, 12), knobM, g, (i % 2 ? .06 : -.06), 1.015, -.13 + Math.floor(i/2)*.045);
    for (const s of [-1, 1]) this.mesh(new T.BoxGeometry(.016, .012, .03), new T.MeshBasicMaterial({color: 0xffc21a, toneMapped: false}), g, s*.06, 1.014, .1);
    const lap = new T.Group(); lap.position.set(0, .955, -.27); lap.rotation.y = Math.PI; g.add(lap);
    this.mesh(new T.BoxGeometry(.32, .012, .22), M.steel, lap, 0, .006, 0);
    const scr = this.mesh(new T.PlaneGeometry(.3, .19), new T.MeshBasicMaterial({color: 0x5ad1ff, toneMapped: false}), lap, 0, .1, -.1); scr.rotation.x = -.25;
    this.mesh(new T.BoxGeometry(.32, .2, .008), M.steel, lap, 0, .1, -.106).rotation.x = -.25;
    g.userData.platters = platters;
    return g;
  },
  hydrant(){
    const T = THREE, g = new T.Group(), paint = new T.MeshPhysicalMaterial({color:0xb81f18, roughness:.45, metalness:.2, clearcoat:.4, clearcoatRoughness:.4});
    const chrome = new T.MeshStandardMaterial({color:0x9a9a92, metalness:.9, roughness:.4});
    this.mesh(this.lathe([[0, 0], [.17, 0], [.17, .04], [.135, .05], [.125, .07], [.125, .46], [.14, .47], [.14, .5], [.12, .52], [.11, .58], [.08, .64], [.05, .66], [0, .665]], 32), paint, g);
    this.mesh(new T.CylinderGeometry(.03, .035, .05, 5), chrome, g, 0, .69, 0);
    for (const [a, r, len] of [[0, .055, .11], [Math.PI, .055, .11], [Math.PI/2, .07, .1]]){
      const n = new T.Group(); n.position.y = .4; n.rotation.y = a; g.add(n);
      const sp = this.mesh(new T.CylinderGeometry(r, r*1.1, len, 20), paint, n, .125 + len/2 - .02, 0, 0); sp.rotation.z = Math.PI/2;
      const cap = this.mesh(new T.CylinderGeometry(r*1.15, r*1.15, .03, 20), paint, n, .125 + len, 0, 0); cap.rotation.z = Math.PI/2;
      const nut = this.mesh(new T.CylinderGeometry(.018, .018, .02, 5), chrome, n, .125 + len + .02, 0, 0); nut.rotation.z = Math.PI/2;
    }
    for (const s of [-1, 1]){ for (let i=0;i<4;i++){ const l = this.mesh(new T.TorusGeometry(.009, .002, 6, 10), chrome, g, s*(.14 + i*.012), .33 - i*.012, .05); l.rotation.y = i % 2 ? Math.PI/2 : 0; } }
    return g;
  },
  newsBox(){
    const T = THREE, g = new T.Group(), paint = new T.MeshPhysicalMaterial({color:0x1d4fa0, roughness:.4, metalness:.3, clearcoat:.5});
    const dark = new T.MeshStandardMaterial({color:0x1a1a1c, roughness:.5, metalness:.5});
    this.mesh(roundedBox(.5, .62, .44, .03), paint, g, 0, .69, 0);
    this.mesh(roundedBox(.52, .05, .46, .02), paint, g, 0, 1.02, 0);
    this.mesh(new T.BoxGeometry(.12, .38, .12), dark, g, 0, .19, 0);
    this.mesh(new T.BoxGeometry(.4, .03, .34), dark, g, 0, .015, 0);
    const [c, x] = Tex.canvas(512, 512); x.fillStyle = "#f2efe6"; x.fillRect(0, 0, 512, 512);
    x.fillStyle = "#111"; x.font = '800 54px "Playfair Display", Georgia, serif'; x.textAlign = "center"; x.fillText("The Daily Beat", 256, 70);
    x.fillRect(30, 88, 452, 3); x.font = '800 40px Georgia, serif'; x.fillText("CITY TURNS UP", 256, 150); x.font = '600 24px Georgia, serif'; x.fillText("Rooftop radio takes over Market St", 256, 190);
    x.fillStyle = "#9a9a9a"; x.fillRect(30, 215, 220, 150); for (let i=0;i<14;i++){ x.fillStyle = "#555"; x.fillRect(270, 220 + i*11, 210 - (i % 4)*20, 4); x.fillRect(30, 380 + (i % 9)*12, 450 - (i % 3)*40, 4); }
    const paper = this.mesh(new T.PlaneGeometry(.38, .3), new T.MeshStandardMaterial({map:Tex.make(c), roughness:.8}), g, 0, .76, .224);
    this.mesh(new T.PlaneGeometry(.42, .34), new T.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:.15, roughness:.05, clearcoat:1}), g, 0, .76, .228);
    this.mesh(roundedBox(.44, .03, .03, .01), dark, g, 0, .56, .23);
    this.mesh(roundedBox(.1, .14, .05, .01), dark, g, .17, .93, .23);
    return g;
  }
};
const T=THREE;
const mats={};
for(const [name,color] of Object.entries({deck:0x60534e,walnut:0x503321,fabric:0x8a7f74,fabricDark:0x3a3330,velvet:0xb8673f,leather:0x6b3f26,marble:0xbcc5c8,brass:0xc9a46a,black:0x111115,grille:0x171717,ceramic:0xe8e2d8,led:0xffc21a})) mats[name]=new T.MeshStandardMaterial({color,roughness:.65});
mats.glass=new T.MeshPhysicalMaterial({color:0xaaccdd,transparent:true,opacity:.18,side:T.DoubleSide});
const people=[];
const Lounge={
 scene,mats,worlds:{},moodIdx:1,hemi:new T.HemisphereLight(0xeeccff,0x32202f,1),
 glowT:Tex.make(Tex.glow()), stdMat:(color,roughness=.8,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra}),
 add(mesh,parent){parent.add(mesh);return mesh;},
 walkable(){},surface(){},asset(){},addClickable(){},champagneFX(){},
 grabbable(obj){obj.userData.grab={home:obj.position.clone()};return obj;},
 person(parent,x,y,z,rotation,behavior){
   const p=this.makePerson(new T.MeshStandardMaterial({color:[0x815ca2,0x248c83,0xc96c53,0x343e64][people.length%4]}));
   p.userData.head.material=new T.MeshStandardMaterial({color:[0x8c583d,0xbc825d,0x5c382b][people.length%3]});
   p.position.set(x,y,z);p.rotation.y=rotation;p.userData.behavior=behavior;
   parent.add(p);people.push(p);return p;
 },
  makePerson(mat){
    const T = THREE, g = new T.Group();
    const limb = (len, r) => { const geo = new T.CylinderGeometry(r, r*.8, len, 10); geo.translate(0, -len/2, 0); return geo; };
    const mk = (geo, parent, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    const torso = new T.Group(); torso.position.y = .95; g.add(torso);
    mk(new T.CylinderGeometry(.17, .14, .55, 14), torso, 0, .3);
    const hips = mk(new T.SphereGeometry(.15, 14, 10), torso, 0, 0); hips.scale.set(1, .6, .75);
    const sh = mk(new T.SphereGeometry(.17, 14, 10), torso, 0, .56); sh.scale.set(1.2, .5, .7);
    const head = mk(new T.SphereGeometry(.105, 16, 12), torso, 0, .78); head.scale.set(.9, 1.08, .95);
    const arm = side => { const a = new T.Group(); a.position.set(side*.22, .54, 0); torso.add(a); mk(limb(.3, .05), a); const f = new T.Group(); f.position.y = -.3; a.add(f); mk(limb(.27, .042), f); return [a, f]; };
    const leg = side => { const l = new T.Group(); l.position.set(side*.09, 0, 0); torso.add(l); mk(limb(.45, .075), l); const s = new T.Group(); s.position.y = -.45; l.add(s); mk(limb(.45, .058), s); return [l, s]; };
    const [armL, foreL] = arm(-1), [armR, foreR] = arm(1), [legL, shinL] = leg(-1), [legR, shinR] = leg(1);
    g.userData = {torso, head, armL, foreL, armR, foreR, legL, shinL, legR, shinR, ph: rnd(0, 6.28), style: Math.floor(Math.random()*3)};
    return g;
  },
  dance(p, t, bass){
    const u = p.userData, ph = t*Math.PI*2*1.9 + u.ph, e = Math.min(1, bass*1.4);
    const bend = Math.abs(Math.sin(ph))*(.15 + e*.35);
    u.torso.position.y = .95 - bend*.12;
    u.legL.rotation.x = -bend; u.shinL.rotation.x = bend*2; u.legR.rotation.x = -bend; u.shinR.rotation.x = bend*2;
    u.torso.rotation.z = Math.sin(ph*.5)*.07*(.5 + e); u.torso.rotation.y = Math.sin(ph*.25)*.3;
    u.head.rotation.x = Math.sin(ph)*.18*e;
    if (u.style === 0){ const a = .5 + e*2.3 + Math.sin(ph)*.2; u.armL.rotation.set(0, 0, -a); u.armR.rotation.set(0, 0, a); u.foreL.rotation.z = -.3; u.foreR.rotation.z = .3; }
    else if (u.style === 1){ u.armL.rotation.set(-(1.1 + Math.sin(ph)*.6*(.4 + e)), 0, -.2); u.armR.rotation.set(-(1.1 + Math.sin(ph + Math.PI)*.6*(.4 + e)), 0, .2); u.foreL.rotation.x = -1.2; u.foreR.rotation.x = -1.2; }
    else { u.armL.rotation.set(0, 0, -(1.3 + Math.sin(ph*.5)*.6)); u.armR.rotation.set(0, 0, 2.6 + e*.3 + Math.sin(ph*.5 + 1)*.2); u.foreL.rotation.z = -.5 + Math.sin(ph)*.4; }
  },
  drawSign(){
    const c = this.signCanvas, x = c.getContext("2d"), m = MOODS[this.moodIdx];
    const hex = "#" + m.a.toString(16).padStart(6, "0");
    x.clearRect(0, 0, 1024, 256);
    x.font = 'italic 700 150px "Chakra Petch", "Arial Narrow", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle";
    x.lineJoin = "round";
    for (const [blur, lw, col] of [[60, 14, hex], [28, 10, hex], [8, 5, "#ffffff"]]){
      x.shadowColor = hex; x.shadowBlur = blur; x.strokeStyle = col; x.lineWidth = lw;
      x.strokeText("TURN UP", 512, 132);
    }
    this.signTex.needsUpdate = true;
  },
  buildClub(){
    const T = THREE, M = this.mats, add = this.add;
    const g = this.room = new T.Group(); this.scene.add(g);
    const glowT = this.glowT, beamT = Tex.make(Tex.beam());
    // Shell
    const floor = add(new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({color:0x0b0b10, roughness:.22, metalness:.4, envMapIntensity:.9})), g, false, true);
    floor.rotation.x = -Math.PI/2; floor.position.z = -5; this.walkable(floor);
    const wallMat = new T.MeshStandardMaterial({color:0x0c0a12, roughness:.9});
    for (const [w, x, z, ry] of [[22, 0, -16, 0], [22, 0, 6, Math.PI], [22, -11, -5, Math.PI/2], [22, 11, -5, -Math.PI/2]]){
      const m = add(new T.Mesh(new T.PlaneGeometry(w, 7.5), wallMat), g, false, true); m.position.set(x, 3.75, z); m.rotation.y = ry;
    }
    const ceil = add(new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({color:0x07070a, roughness:1})), g, false, false); ceil.rotation.x = Math.PI/2; ceil.position.set(0, 7.5, -5);
    // LED strips on the walls
    const stripMat = new T.MeshBasicMaterial({color:0xff4fd8, toneMapped:false});
    this.clubStrip = stripMat;
    for (let i=-4;i<=4;i++){
      for (const [x, z, ry] of [[-10.95, -5 + i*2.2, Math.PI/2], [10.95, -5 + i*2.2, -Math.PI/2]]){ const s = new T.Mesh(new T.BoxGeometry(.06, 6.6, .06), stripMat); s.position.set(x, 3.6, z); g.add(s); }
    }
    for (const y of [.15, 7.3]){ for (const [x, z, w, ry] of [[0, -15.9, 22, 0], [-10.9, -5, 22, Math.PI/2], [10.9, -5, 22, Math.PI/2]]){ const s = new T.Mesh(new T.BoxGeometry(w, .05, .05), stripMat); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); } }
    // Ceiling truss with par cans
    const truss = M.black;
    for (const z of [-3, -7, -11]){ const b = add(new T.Mesh(new T.BoxGeometry(18, .25, .25), truss), g, false, false); b.position.set(0, 6.6, z); }
    for (const x of [-8, 0, 8]){ const b = add(new T.Mesh(new T.BoxGeometry(.25, .25, 10), truss), g, false, false); b.position.set(x, 6.6, -7); }
    this.pars = [];
    for (let i=0;i<10;i++){
      const can = new T.Mesh(new T.CylinderGeometry(.14, .18, .35, 16), M.black); can.position.set(-8 + i*1.78, 6.35, -3 - (i % 3)*4); g.add(can);
      const lens = new T.Mesh(new T.CircleGeometry(.13, 20), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false})); lens.rotation.x = Math.PI/2; lens.position.set(can.position.x, 6.17, can.position.z); g.add(lens);
      this.pars.push(lens);
    }
    // LED dance floor
    const COLS = 10, ROWS = 8, TS = .95;
    const tiles = this.tiles = new T.InstancedMesh(new T.BoxGeometry(TS - .05, .05, TS - .05), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false}), COLS*ROWS);
    const d = new T.Object3D(); this.tileInfo = [];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      const i = r*COLS + c; d.position.set((c - (COLS - 1)/2)*TS, .03, -3.4 - r*TS); d.updateMatrix(); tiles.setMatrixAt(i, d.matrix);
      this.tileInfo.push({c, r, x:d.position.x, z:d.position.z});
      tiles.setColorAt(i, new T.Color(0x111111));
    }
    g.add(tiles); this.tileColor = new T.Color();
    // DJ booth
    const riser = add(new T.Mesh(new T.BoxGeometry(7, .6, 3), new T.MeshStandardMaterial({color:0x111116, roughness:.5, metalness:.3})), g); riser.position.set(0, .3, -12.6);
    const desk = add(new T.Mesh(roundedBox(3.4, 1.05, .9, .04), new T.MeshStandardMaterial({color:0x0e0e12, roughness:.35, metalness:.5})), g); desk.position.set(0, 1.12, -11.7);
    this.boothSignC = Tex.sign("TURN UP", "#ff4fd8"); this.boothSignT = Tex.make(this.boothSignC);
    const front = new T.Mesh(new T.PlaneGeometry(3.2, .8), new T.MeshBasicMaterial({map:this.boothSignT, transparent:true, toneMapped:false})); front.position.set(0, 1.1, -11.24); g.add(front);
    this.platters = [];
    for (const sx of [-1, 1]){
      const deck = add(new T.Mesh(new T.BoxGeometry(.9, .1, .7), new T.MeshStandardMaterial({color:0x2a2a2e, metalness:.6, roughness:.35})), g); deck.position.set(sx*1.05, 1.7, -11.75);
      const plat = new T.Mesh(new T.CylinderGeometry(.3, .3, .03, 40), new T.MeshStandardMaterial({color:0x080808, roughness:.25, metalness:.3})); plat.position.set(sx*1.05 - .08, 1.77, -11.75); g.add(plat);
      const lbl = new T.Mesh(new T.CylinderGeometry(.09, .09, .032, 24), new T.MeshBasicMaterial({color:0xffc21a})); plat.add(lbl);
      const mark = new T.Mesh(new T.BoxGeometry(.02, .034, .12), new T.MeshBasicMaterial({color:0xffffff})); mark.position.set(0, 0, .2); plat.add(mark);
      this.platters.push(plat);
    }
    const mixer = add(new T.Mesh(new T.BoxGeometry(.6, .12, .6), new T.MeshStandardMaterial({color:0x1d1d22, metalness:.6, roughness:.3})), g); mixer.position.set(0, 1.71, -11.75);
    for (let i=0;i<12;i++){ const k = new T.Mesh(new T.CylinderGeometry(.025, .025, .04, 10), new T.MeshBasicMaterial({color: i % 4 ? 0x888888 : 0x4de1ff})); k.position.set(-.22 + (i % 4)*.15, 1.79, -11.95 + Math.floor(i/4)*.15); g.add(k); }
    const dj = this.dj = this.person(g, 0, .6, -12.35, 0, "dj", {kind:"him"}); dj.userData.style = 1;
    // Speaker stacks
    this.clubWoofers = [];
    for (const sx of [-4.4, 4.4]){
      for (let k=0;k<2;k++){
        const cab = add(new T.Mesh(roundedBox(1.3, 1.25, 1, .03), new T.MeshStandardMaterial({color:0x101012, roughness:.8})), g); cab.position.set(sx, .65 + k*1.28, -12);
        const cone = new T.Mesh(new T.CircleGeometry(.42, 32), new T.MeshStandardMaterial({color:0x1d1d1d, roughness:.5, metalness:.3})); cone.position.set(sx, .65 + k*1.28, -11.49); g.add(cone);
        const ring = new T.Mesh(new T.TorusGeometry(.44, .03, 8, 32), M.black); ring.position.copy(cone.position); g.add(ring);
        this.clubWoofers.push(cone);
      }
    }
    // EQ walls beside the screen
    this.clubEq = new T.InstancedMesh(new T.BoxGeometry(.18, 1, .08), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false}), 32);
    this.clubEq.position.set(0, 0, -15.8); g.add(this.clubEq); this.clubEqC = new T.Color();
    // Lasers
    this.lasers = new T.Group(); this.lasers.position.set(0, 3.3, -12.4); g.add(this.lasers);
    this.laserMat = new T.MeshBasicMaterial({color:0x4de1ff, transparent:true, opacity:.8, blending:T.AdditiveBlending, depthWrite:false, toneMapped:false});
    for (let i=0;i<9;i++){ const geo = new T.CylinderGeometry(.008, .008, 30, 6); geo.translate(0, 15, 0); geo.rotateX(Math.PI/2); const l = new T.Mesh(geo, this.laserMat); l.userData.i = i; this.lasers.add(l); }
    // Moving-head light cones
    this.cones = [];
    for (let i=0;i<6;i++){
      const geo = new T.ConeGeometry(1.3, 6.2, 32, 1, true); geo.translate(0, -3.1, 0);
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({map:beamT, color: i % 2 ? 0xff4fd8 : 0x4de1ff, transparent:true, opacity:.22, blending:T.AdditiveBlending, depthWrite:false, side:T.DoubleSide, toneMapped:false}));
      m.position.set(-7 + i*2.8, 6.5, -4 - (i % 2)*5); g.add(m); this.cones.push(m);
    }
    // Disco ball and its sparkles
    this.disco = new T.Group(); this.disco.position.set(0, 5.7, -6); g.add(this.disco);
    const ball = new T.Mesh(new T.IcosahedronGeometry(.45, 3), new T.MeshStandardMaterial({color:0xffffff, metalness:1, roughness:.05, flatShading:true, envMap:this.envTex, envMapIntensity:2.2}));
    this.disco.add(ball);
    const wire = new T.Mesh(new T.CylinderGeometry(.01, .01, 1.4, 6), M.black); wire.position.y = .9; this.disco.add(wire);
    const sp = [];
    for (let i=0;i<260;i++){ const v = new T.Vector3(rnd(-1, 1), rnd(-.9, .5), rnd(-1, 1)).normalize().multiplyScalar(9.5); sp.push(v.x, v.y, v.z); }
    const sgeo = new T.BufferGeometry(); sgeo.setAttribute("position", new T.Float32BufferAttribute(sp, 3));
    this.sparkles = new T.Points(sgeo, new T.PointsMaterial({color:0xffffff, size:.22, map:glowT, transparent:true, depthWrite:false, blending:T.AdditiveBlending, toneMapped:false}));
    this.disco.add(this.sparkles);
    // VIP booth (you sit here) with rope line
    const vip = new T.Group(); vip.position.set(0, 0, .55); g.add(vip);
    const leather = new T.MeshStandardMaterial({color:0x3a0c18, roughness:.42, envMap:this.envTex, envMapIntensity:.5});
    add(new T.Mesh(roundedBox(3.2, .45, .9, .08, 4), leather), vip).position.set(0, .25, 0);
    const vb = add(new T.Mesh(roundedBox(3.2, .75, .22, .09, 4), leather), vip); vb.position.set(0, .8, .38);
    for (const sx of [-1, 1]){ const side = add(new T.Mesh(roundedBox(.9, .45, 1.6, .08, 4), leather), vip); side.position.set(sx*1.95, .25, -.45); }
    const tbl = add(new T.Mesh(new T.CylinderGeometry(.42, .42, .04, 40), M.marble), g); tbl.position.set(0, .48, -1.0);
    add(new T.Mesh(new T.CylinderGeometry(.05, .2, .46, 20), M.brass), g).position.set(0, .23, -1.0);
    // Bottle service: champagne on ice, flutes, a martini and a whiskey (pick them up in VR; shake the bottle to pop it)
    this.surface(tbl);
    const onVip = (obj, x, z, ry = 0) => { obj.position.set(x, .5, z); obj.rotation.y = ry; g.add(obj); return this.grabbable(obj); };
    const bucketP = onVip(Props.iceBucket(), .2, -1.12);
    const iced = Props.champagne(); iced.position.set(.2, .54, -1.12); iced.rotation.set(0, 0, .3); g.add(iced);
    this.grabbable(iced); this.champagneFX(iced);
    const bub = onVip(Props.champagne(), -.3, -1.2, .8); this.champagneFX(bub);
    onVip(Props.flute(), -.12, -.88); onVip(Props.flute(), -.02, -.84, 1);
    onVip(Props.martini("blue"), .12, -.82);
    onVip(Props.tumbler(), -.2, -1.02);
    onVip(Props.martini("pink"), .3, -.9);
    const rope = new T.MeshStandardMaterial({color:0x7a0d1e, roughness:.6});
    for (let i=0;i<5;i++){ const x = -3.2 + i*1.6; const post = add(new T.Mesh(new T.CylinderGeometry(.04, .04, .95, 12), M.brass), g); post.position.set(x, .48, -1.7); const base = add(new T.Mesh(new T.CylinderGeometry(.16, .18, .04, 20), M.brass), g); base.position.set(x, .02, -1.7);
      if (i < 4){ const curve = new T.CatmullRomCurve3([new T.Vector3(x, .9, -1.7), new T.Vector3(x + .8, .72, -1.7), new T.Vector3(x + 1.6, .9, -1.7)]); g.add(new T.Mesh(new T.TubeGeometry(curve, 16, .025, 8), rope)); } }
    // Bar on the left wall
    const bar = add(new T.Mesh(roundedBox(1, 1.1, 8, .03), new T.MeshStandardMaterial({color:0x101014, roughness:.3, metalness:.6})), g); bar.position.set(-8.6, .55, -6);
    const barTop = add(new T.Mesh(new T.BoxGeometry(1.2, .06, 8.2), M.marble), g); barTop.position.set(-8.6, 1.13, -6);
    const barGlow = new T.Mesh(new T.BoxGeometry(.03, .03, 8), stripMat); barGlow.position.set(-8.08, .12, -6); g.add(barGlow);
    const shelfMat = new T.MeshStandardMaterial({color:0x222226, roughness:.4, metalness:.5});
    const shapes = [
      Props.lathe([[0, 0], [.04, 0], [.042, .008], [.042, .2], [.03, .23], [.013, .25], [.012, .3], [0, .3]], 20),          // tall spirit
      Props.lathe([[0, 0], [.046, 0], [.048, .01], [.048, .15], [.04, .18], [.014, .2], [.013, .24], [0, .24]], 20),       // round gin/rum
      Props.lathe([[0, 0], [.034, 0], [.036, .2], [.024, .23], [.013, .25], [.012, .32], [0, .32]], 20)                       // wine-style
    ];
    const capGeo = new T.CylinderGeometry(.015, .015, .035, 12);
    const bottleMat = new T.MeshPhysicalMaterial({color:0xffffff, roughness:.05, metalness:.05, clearcoat:1, transparent:true, opacity:.88, envMap:this.envTex, envMapIntensity:1.6, emissive:0x161008});
    const lblTex = Props.labelTex([["RESERVE", 64, "#1b1b1b", 800], ["AGED 12 YEARS", 34, "#6b4a1a", 700]], {bg:"#efe3c6"});
    const lblMat = new T.MeshStandardMaterial({map:lblTex, roughness:.7});
    const lblGeo = new T.CylinderGeometry(1, 1, 1, 20, 1, true, -Math.PI*.45, Math.PI*.9);
    const tops = [.3, .24, .32], rads = [.0425, .0485, .0365];
    const IB = shapes.map(sg => new T.InstancedMesh(sg, bottleMat, 30)), IL = new T.InstancedMesh(lblGeo, lblMat, 90), IC = new T.InstancedMesh(capGeo, new T.MeshStandardMaterial({color:0x1a1410, metalness:.6, roughness:.35}), 90);
    const counts = [0, 0, 0]; let li = 0;
    const hues = [0x8a4a12, 0xb5671f, 0x2c5a2a, 0xd8e6ee, 0x5a1020, 0xc9a24a, 0x203a6a, 0xe0d8c8];
    for (const y of [1.6, 2.2, 2.8]){
      const sh = add(new T.Mesh(new T.BoxGeometry(.35, .04, 8), shelfMat), g, false); sh.position.set(-10.75, y, -6);
      const backlight = new T.Mesh(new T.PlaneGeometry(8, .5), new T.MeshBasicMaterial({map:glowT, color:0xffb070, transparent:true, opacity:.6, blending:T.AdditiveBlending, depthWrite:false})); backlight.rotation.y = Math.PI/2; backlight.position.set(-10.93, y + .25, -6); g.add(backlight);
      for (let k=0;k<28;k++){
        const v = Math.floor(Math.random()*3), sc = .9 + Math.random()*.2, z = -9.6 + k*.26;
        d.position.set(-10.75, y + .02, z); d.rotation.set(0, Math.random()*6, 0); d.scale.set(sc, sc, sc); d.updateMatrix();
        IB[v].setMatrixAt(counts[v], d.matrix); IB[v].setColorAt(counts[v], new T.Color(hues[Math.floor(Math.random()*hues.length)])); counts[v]++;
        d.position.set(-10.75, y + .02 + tops[v]*sc*.42, z); d.rotation.set(0, Math.PI/2, 0); d.scale.set(rads[v]*sc + .0012, tops[v]*sc*.28, rads[v]*sc + .0012); d.updateMatrix(); IL.setMatrixAt(li, d.matrix);
        d.position.set(-10.75, y + .02 + tops[v]*sc + .012, z); d.scale.set(sc, sc, sc); d.updateMatrix(); IC.setMatrixAt(li, d.matrix); li++;
      }
    }
    IB.forEach((m, v) => { m.count = counts[v]; g.add(m); }); IL.count = IC.count = li; g.add(IL, IC);
    d.scale.set(1, 1, 1); d.rotation.set(0, 0, 0);
    // glasses and bottles along the bar top
    this.surface(barTop);
    const onBar = (obj, z) => { obj.position.set(-8.35 + Math.random()*.15, 1.16, z); g.add(obj); return this.grabbable(obj); };
    onBar(Props.tumbler(), -4.0); onBar(Props.martini("pink"), -4.6); onBar(Props.flute(), -5.2); onBar(Props.beerBottle(), -6.6); onBar(Props.tumbler("whiskey", 2), -7.2); onBar(Props.wineGlass(), -8.1); onBar(Props.champagne(), -8.8);
    for (let i=0;i<5;i++){ const st = new T.Group(); st.position.set(-7.6, 0, -9 + i*1.5); g.add(st);
      add(new T.Mesh(new T.CylinderGeometry(.22, .2, .08, 24), leather), st).position.y = .78;
      add(new T.Mesh(new T.CylinderGeometry(.03, .03, .75, 10), M.brass), st).position.y = .38;
      add(new T.Mesh(new T.TorusGeometry(.16, .015, 8, 24), M.brass), st).rotation.x = Math.PI/2; }
    // Low-lying smoke on the dance floor
    const smokeT = Tex.make(Tex.cloud());
    this.smoke = [];
    for (let i=0;i<16;i++){ const sm = new T.Sprite(new T.SpriteMaterial({map:smokeT, color:i % 2 ? 0xff4fd8 : 0x4de1ff, transparent:true, opacity:.07, depthWrite:false}));
      sm.position.set(rnd(-5, 5), rnd(.1, .45), rnd(-10.5, -3)); sm.scale.set(rnd(4, 7), rnd(.8, 1.3), 1); sm.userData = {vx:rnd(-.15, .15), ph:rnd(0, 6)}; g.add(sm); this.smoke.push(sm); }
    // Crowd
    this.crowd = [];
    const people = new T.MeshStandardMaterial({color:0x15131a, roughness:.5, metalness:.15});
    const spots = [[-3.6,-4.2],[-2.2,-5.6],[2.4,-4.6],[3.7,-6],[-4,-7.4],[-1.6,-8.2],[1.5,-7.6],[3.2,-8.8],[-3,-9.6],[0,-9.8],[4.3,-3.6],[-1.9,-4.6],[-.6,-6.2],[.9,-5.2],[-4.6,-5.8],[4.6,-7.4],[1.8,-10],[-2.6,-7]];
    spots.forEach(([x, z], i) => { const face = Math.atan2(-x, -12 - z) + (i % 3 === 0 ? Math.PI : 0) + rnd(-.4, .4); this.crowd.push(this.person(g, x, 0, z, face, i === 7 || i === 9 ? "cheer" : "dance")); });
    // People at the bar and a friend in your VIP booth
    this.person(g, -7.4, 0, -4.2, -Math.PI/2 + .4, "talk", {gender:"m"});
    this.person(g, -7.5, 0, -5.1, -Math.PI/2 - .3, "talk", {gender:"f"});
    this.person(g, -7.3, 0, -8.3, -Math.PI/2, "idle");
    this.person(g, -7.5, 0, -6.4, .5, "talk", {gender:"f"});
    this.person(g, -6.9, 0, -5.8, Math.PI + .5, "talk", {gender:"m"});
    this.person(g, 1.15, 0, .5, Math.PI, "sit", {gender:"f"});
    // Exit sign
    const exitT = Tex.make(Tex.sign("EXIT", "#3dff7a", {neon:false, bg:"#0b2a12", w:256, h:96, font:'700 64px "Chakra Petch", sans-serif'}));
    const ex = new T.Mesh(new T.PlaneGeometry(.7, .26), new T.MeshBasicMaterial({map:exitT, toneMapped:false})); ex.position.set(10.95, 3, 2.5); ex.rotation.y = -Math.PI/2; g.add(ex);
    // Lights
    g.add(new T.HemisphereLight(0x6a5aff, 0x10060a, .22));
    const crowdFill = new T.DirectionalLight(0xffd6c4, .55); crowdFill.position.set(0, 4.5, 4); crowdFill.target.position.set(0, 1, -7); g.add(crowdFill, crowdFill.target);
    this.clubA = new T.PointLight(0xff4fd8, 1.6, 14, 2); this.clubA.position.set(-3, 5.5, -6); g.add(this.clubA);
    this.clubB = new T.PointLight(0x4de1ff, 1.6, 14, 2); this.clubB.position.set(3, 5.5, -7); g.add(this.clubB);
    const barL = new T.PointLight(0xffb070, 1.1, 7, 2); barL.position.set(-8, 3, -6); g.add(barL);
    const vipL = new T.PointLight(0xffc68a, .7, 4, 2); vipL.position.set(0, 2.4, -.4); g.add(vipL);
    this.strobe = new T.AmbientLight(0xffffff, 0); g.add(this.strobe);
    this.clubDummy = d;

    return {id:"club", name:"Nightclub", group:g, fog:new T.FogExp2(0x0b0714, .03), exposure:1.0, noEnv:true,
      screen:[0, 4.4, -15.75, 1.75, 0],
      onMood: m => {
        stripMat.color.setHex(m.a); this.laserMat.color.setHex(m.b);
        this.cones.forEach((c, i) => c.material.color.setHex(i % 2 ? m.a : m.b));
        this.clubA.color.setHex(m.a); this.clubB.color.setHex(m.b);
        const hex = "#" + m.a.toString(16).padStart(6, "0");
        const x = this.boothSignC.getContext("2d"); x.clearRect(0, 0, 1024, 256); this.boothSignC.width = 1024;
        const fresh = Tex.sign("TURN UP", hex); x.drawImage(fresh, 0, 0); this.boothSignT.needsUpdate = true;
      },
      update: (dt, t, A) => {
        const m = MOODS[this.moodIdx], ca = new T.Color(m.a), cb = new T.Color(m.b);
        // Dance floor: ripples from the center plus a column per frequency band
        this.tileInfo.forEach((ti, i) => {
          const dist = Math.hypot(ti.c - 4.5, ti.r - 3.5), band = A.vals[Math.floor(ti.c/10*30)] || 0;
          const wave = .5 + .5*Math.sin(dist*1.3 - t*6);
          const on = band > (ti.r/8)*.9 ? 1 : .15;
          this.tileColor.copy(((ti.c + ti.r + Math.floor(t*2)) % 2) ? ca : cb).multiplyScalar((.15 + wave*.5*A.bass + on*.6)*(.6 + A.bass*.8));
          this.tiles.setColorAt(i, this.tileColor);
        });
        this.tiles.instanceColor.needsUpdate = true;
        // EQ walls
        for (let i=0;i<32;i++){
          const side = i < 16 ? -1 : 1, k = i % 16, v = A.vals[Math.floor(k/16*34)] || 0, h = .2 + v*5;
          d.position.set(side*(4 + k*.24), 1 + h/2, 0); d.scale.set(1, h, 1); d.updateMatrix(); this.clubEq.setMatrixAt(i, d.matrix);
          this.clubEqC.copy(k > 11 ? cb : ca); this.clubEq.setColorAt(i, this.clubEqC);
        }
        d.scale.set(1, 1, 1);
        this.clubEq.instanceMatrix.needsUpdate = true; if (this.clubEq.instanceColor) this.clubEq.instanceColor.needsUpdate = true;
        // Lasers sweep, fan opens with the music
        this.lasers.children.forEach(l => { const i = l.userData.i; l.rotation.set(-.12 + Math.sin(t*1.3 + i)*.12, (i - 4)*(.12 + A.mid*.2) + Math.sin(t*.8)*.4, 0); });
        this.laserMat.opacity = A.bass > .35 ? .85 : .25 + A.high*.4;
        this.cones.forEach((c, i) => { c.rotation.set(Math.sin(t*.7 + i)*.45, 0, Math.cos(t*.6 + i*1.7)*.45); c.material.opacity = .12 + A.mid*.25; });
        this.disco.rotation.y += dt*.6;
        this.sparkles.material.opacity = .5 + A.high*.5;
        this.platters.forEach(p => p.rotation.y -= dt*3.5);
        this.clubWoofers.forEach(w => w.scale.setScalar(1 + A.bass*.12));
        this.pars.forEach((p, i) => p.material.color.copy(i % 2 ? ca : cb).multiplyScalar(.4 + (A.vals[i*3] || 0)*1.5));
        this.clubA.intensity = .7 + A.bass*2.2; this.clubB.intensity = .7 + A.mid*2.2;
        this.strobe.intensity = A.hit && A.bass > .5 ? .45 : this.strobe.intensity*.8;
        this.crowd.forEach(p => this.dance(p, t, A.bass)); this.dance(this.dj, t, A.bass*.7);
        this.smoke.forEach((sm, i) => { const u = sm.userData; sm.position.x += u.vx*dt; if (Math.abs(sm.position.x) > 6) u.vx *= -1; sm.material.opacity = .1 + Math.sin(t*.4 + u.ph)*.04 + A.bass*.05; sm.material.color.copy(i % 2 ? ca : cb); });
      }
    };
  },
  buildRooftop(){
    const T = THREE, M = this.mats, scene = this.scene, add = this.add, fabricB = this.fabricB;
    // ---------- Room: sky, city, rooftop deck ----------
    const room = this.room = new T.Group(); scene.add(room);
    this.skyMat = new T.ShaderMaterial({
      side:T.BackSide, depthWrite:false, fog:false,
      uniforms:{top:{value:new T.Color()}, horizon:{value:new T.Color()}},
      vertexShader:"varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:"uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.8+0.12,0.0,1.0); vec3 c = mix(horizon, top, pow(h,0.7)); gl_FragColor = vec4(c,1.0); }"
    });
    room.add(new T.Mesh(new T.SphereGeometry(150, 32, 16), this.skyMat));
    const starPos = [];
    for (let i=0;i<1200;i++){ const th = Math.random()*Math.PI*2, ph = Math.acos(.25 + Math.random()*.75); starPos.push(130*Math.sin(ph)*Math.cos(th), 130*Math.cos(ph), 130*Math.sin(ph)*Math.sin(th)); }
    const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.Float32BufferAttribute(starPos, 3));
    this.stars = new T.Points(sg, new T.PointsMaterial({color:0xffffff, size:.5, map:this.glowT, transparent:true, depthWrite:false, fog:false, opacity:.9}));
    room.add(this.stars);
    const moon = new T.Sprite(new T.SpriteMaterial({map:this.glowT, color:0xfff1d6, fog:false, depthWrite:false}));
    moon.position.set(-38, 34, -90); moon.scale.set(14, 14, 1); room.add(moon);
    const moonDisc = new T.Mesh(new T.CircleGeometry(2.2, 48), new T.MeshBasicMaterial({color:0xfff6e4, fog:false}));
    moonDisc.position.copy(moon.position); moonDisc.lookAt(0, 1.2, 0); room.add(moonDisc);
    const cityT = Tex.make(Tex.skyline());
    cityT.wrapS = T.RepeatWrapping; cityT.repeat.set(2, 1);
    const city = new T.Mesh(new T.CylinderGeometry(90, 90, 40, 64, 1, true), new T.MeshBasicMaterial({map:cityT, side:T.BackSide, transparent:true, fog:false, toneMapped:false}));
    city.position.y = -7; room.add(city);
    const haze = new T.Mesh(new T.CylinderGeometry(88, 88, 14, 64, 1, true), new T.MeshBasicMaterial({map:this.glowT, color:0xff9a5a, side:T.BackSide, transparent:true, opacity:.18, depthWrite:false, blending:T.AdditiveBlending, fog:false}));
    haze.position.y = -4; room.add(haze); this.haze = haze;
    const ground = new T.Mesh(new T.CircleGeometry(95, 48), new T.MeshBasicMaterial({color:0x05060b}));
    ground.rotation.x = -Math.PI/2; ground.position.y = -35; room.add(ground);

    // Deck, rug, railing
    const deck = add(new T.Mesh(new T.BoxGeometry(14, .2, 14), M.deck), room, false, true); deck.position.y = -.1; this.walkable(deck);
    const rugT = Tex.make(Tex.rug());
    const rug = add(new T.Mesh(new T.CircleGeometry(1.75, 64), new T.MeshStandardMaterial({map:rugT, roughness:1, bumpMap:fabricB, bumpScale:.003})), room, false, true);
    rug.rotation.x = -Math.PI/2; rug.position.set(0, .006, -1.25);
    for (const [x, z, ry] of [[0,-7,0],[0,7,0],[-7,0,Math.PI/2],[7,0,Math.PI/2]]){
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      const gl = new T.Mesh(new T.BoxGeometry(14, 1.05, .03), M.glass); gl.position.y = .58; g.add(gl);
      const rail = new T.Mesh(new T.BoxGeometry(14, .05, .08), M.brass); rail.position.y = 1.12; g.add(rail);
      for (let k=-7;k<=7;k+=1.75){ const p = new T.Mesh(new T.BoxGeometry(.05, 1.1, .05), M.black); p.position.set(k, .55, 0); g.add(p); }
      room.add(g);
    }

    // ---------- Sofa (you sit here), armchairs, tables ----------
    const legGeo = new T.CylinderGeometry(.025, .015, .1, 12);
    const sofa = new T.Group(); sofa.position.set(0, 0, .45); room.add(sofa);
    const sb = add(new T.Mesh(roundedBox(2.4, .24, .95, .05), M.fabricDark), sofa); sb.position.set(0, .2, 0);
    for (let i=-1;i<=1;i++){
      const seat = add(new T.Mesh(roundedBox(.74, .17, .8, .07, 4), M.fabric), sofa); seat.position.set(i*.75, .4, -.05);
      const back = add(new T.Mesh(roundedBox(.74, .5, .2, .09, 4), M.fabric), sofa); back.position.set(i*.75, .7, .34); back.rotation.x = -.12;
    }
    for (const sx of [-1, 1]){
      const arm = add(new T.Mesh(roundedBox(.2, .56, .95, .08, 4), M.fabricDark), sofa); arm.position.set(sx*1.12, .36, 0);
      for (const sz of [-1, 1]){ const l = add(new T.Mesh(legGeo, M.walnut), sofa); l.position.set(sx*1.1, .05, sz*.4); }
    }
    this.pillows = [];
    for (const [px, rz] of [[-.72, .25], [.72, -.22]]){
      const p = add(new T.Mesh(roundedBox(.44, .44, .14, .07, 4), M.velvet.clone()), sofa); p.position.set(px, .64, .18); p.rotation.set(-.25, 0, rz);
      this.pillows.push(p);
    }
    const throwB = add(new T.Mesh(roundedBox(.5, .03, .7, .015), new T.MeshStandardMaterial({color:0xd9cdb8, roughness:1, bumpMap:fabricB, bumpScale:.003})), sofa);
    throwB.position.set(.85, .5, -.05); throwB.rotation.z = -.05;

    const armchair = (x, z, ry) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
      const shell = add(new T.Mesh(roundedBox(.92, .3, .86, .08, 4), M.leather), g); shell.position.y = .26;
      const cush = add(new T.Mesh(roundedBox(.66, .14, .66, .06, 4), M.fabric), g); cush.position.set(0, .45, -.02);
      const back = add(new T.Mesh(roundedBox(.92, .55, .16, .07, 4), M.leather), g); back.position.set(0, .66, .35); back.rotation.x = -.18;
      for (const sx of [-1, 1]){ const a = add(new T.Mesh(roundedBox(.14, .3, .8, .06, 4), M.leather), g); a.position.set(sx*.4, .5, 0);
        for (const sz of [-1, 1]){ const l = add(new T.Mesh(legGeo, M.walnut), g); l.position.set(sx*.38, .05, sz*.34); } }
      this.asset(room, "armchair", {x, z, ry: ry + Math.PI, s: 1.08, replace: g});
    };
    armchair(-1.85, -1.35, Math.PI/2 + .45);
    armchair(1.85, -1.35, -Math.PI/2 - .45);

    const top = add(new T.Mesh(new T.CylinderGeometry(.58, .58, .045, 64), M.marble), room); top.position.set(0, .43, -1.3);
    const ring = add(new T.Mesh(new T.TorusGeometry(.58, .012, 8, 64), M.brass), room); ring.rotation.x = Math.PI/2; ring.position.set(0, .43, -1.3);
    const ped = add(new T.Mesh(new T.CylinderGeometry(.09, .2, .4, 32), M.brass), room); ped.position.set(0, .2, -1.3);
    const pbase = add(new T.Mesh(new T.CylinderGeometry(.3, .32, .03, 48), M.brass), room); pbase.position.set(0, .015, -1.3);
    // On the table: a record and its sleeve, a book, red wine and two glasses, a candle (pick any of them up in VR)
    this.surface(top);
    const onTop = (obj, x, z, ry = 0) => { obj.position.set(x, .4525, z); obj.rotation.y = ry; room.add(obj); return this.grabbable(obj); };
    onTop(Props.sleeve(), -.2, -1.5, .25);
    const vin = onTop(Props.vinyl(), -.12, -1.38, 0); vin.position.y += .004; vin.userData.grab.home.y += .004;
    onTop(Props.book(0x22313f, "CITY LIGHTS"), .12, -.97, .3);
    onTop(Props.wineBottle(), .26, -1.56, 0);
    onTop(Props.wineGlass(), .08, -1.67, 0);
    onTop(Props.wineGlass(), .44, -1.42, 0);
    this.rooftopCandle = onTop(Props.candle(), -.36, -1.1, 0);
    this.asset(room, "vaseflowers", {x: .4, y: .4525, z: -1.08, ry: .8});
    // Lava lamp (tap it to change the mood)
    const lamp = this.lamp = new T.Group();
    const glassMat = new T.MeshPhysicalMaterial({color:0xff7a45, emissive:0xff5a1f, emissiveIntensity:1.1, transparent:true, opacity:.8, roughness:.1, clearcoat:1});
    const glass = new T.Mesh(new T.CylinderGeometry(.055, .085, .34, 32), glassMat); glass.position.y = .27; lamp.add(glass);
    const cap = new T.Mesh(new T.CylinderGeometry(.04, .056, .08, 24), M.brass); cap.position.y = .48; lamp.add(cap);
    const lbase = new T.Mesh(new T.CylinderGeometry(.06, .095, .1, 24), M.brass); lbase.position.y = .05; lamp.add(lbase);
    this.blobs = [];
    for (let i=0;i<3;i++){ const bl = new T.Mesh(new T.SphereGeometry(.026, 16, 12), new T.MeshBasicMaterial({color:0xffe066, toneMapped:false})); lamp.add(bl); this.blobs.push(bl); }
    lamp.position.set(.36, .452, -1.18); room.add(lamp);
    this.lampMat = glassMat;
    this.lampLight = new T.PointLight(0xff7a45, .7, 3.5, 2); this.lampLight.position.set(.36, .85, -1.18); room.add(this.lampLight);
    this.addClickable(glass, () => this.nextMood());

    // Arc floor lamp beside the sofa
    const arcPts = [new T.Vector3(0,0,0), new T.Vector3(0,1.6,0), new T.Vector3(.3,2.25,0), new T.Vector3(1.0,2.35,0), new T.Vector3(1.55,2.0,0)];
    const arc = add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(arcPts), 48, .016, 10), M.brass), room);
    const arcG = new T.Group(); arcG.position.set(-1.55, 0, .55); arcG.rotation.y = -.75; room.add(arcG); arcG.add(arc);
    const marbleBase = add(new T.Mesh(new T.CylinderGeometry(.2, .22, .08, 40), M.marble), arcG); marbleBase.position.y = .04;
    const shade = add(new T.Mesh(new T.SphereGeometry(.24, 40, 20, 0, Math.PI*2, 0, Math.PI/2), new T.MeshStandardMaterial({color:0xc9a46a, metalness:1, roughness:.3, side:T.DoubleSide})), arcG, true, false);
    shade.position.set(1.55, 1.96, 0);
    const bulbGlow = new T.Sprite(new T.SpriteMaterial({map:this.glowT, color:0xffd29a, transparent:true, depthWrite:false, blending:T.AdditiveBlending})); bulbGlow.position.set(1.55, 1.86, 0); bulbGlow.scale.set(.6, .6, 1); arcG.add(bulbGlow);
    this.floorLamp = new T.PointLight(0xffc68a, 1.2, 6, 2); this.floorLamp.position.set(1.55, 1.8, 0); arcG.add(this.floorLamp);

    // Plants
    const leafT = Tex.make(Tex.leaf());
    const leafMat = new T.MeshStandardMaterial({map:leafT, transparent:true, alphaTest:.4, side:T.DoubleSide, roughness:.6});
    const plant = (x, z, s) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); room.add(g);
      const prof = [[.0,0],[.17,0],[.2,.05],[.22,.45],[.24,.5],[.21,.5],[.0,.48]].map(([a,b]) => new T.Vector2(a, b));
      add(new T.Mesh(new T.LatheGeometry(prof, 40), M.ceramic), g);
      const soil = new T.Mesh(new T.CircleGeometry(.2, 24), new T.MeshStandardMaterial({color:0x2a1d14, roughness:1})); soil.rotation.x = -Math.PI/2; soil.position.y = .47; g.add(soil);
      for (let i=0;i<11;i++){
        const h = .6 + Math.random()*.55, leaf = new T.Mesh(new T.PlaneGeometry(.14, h), leafMat);
        leaf.geometry.translate(0, h/2, 0);
        const a = i/11*Math.PI*2 + Math.random()*.4;
        leaf.position.set(Math.cos(a)*.06, .47, Math.sin(a)*.06);
        leaf.rotation.set(0, -a + Math.PI/2, 0); leaf.rotateX(.08 + Math.random()*.28);
        leaf.castShadow = true; g.add(leaf);
      }
      this.asset(room, "plant", {x, z, h: 1.0*s, ry: Math.random()*6, replace: g});
    };
    plant(2.9, -3.2, 1.1); plant(-3.0, -3.5, 1.25); plant(2.7, 1.3, .9); plant(-5.6, -5.5, 1.3); plant(5.6, -5.6, 1.2);

    // ---------- Media wall: slatted walnut, console, tower speakers, neon sign ----------
    const wall = new T.InstancedMesh(new T.BoxGeometry(.06, 3.9, .06), M.walnut, 64);
    const d = new T.Object3D();
    for (let i=0;i<64;i++){ d.position.set(-3.2 + i*.1016, 1.95, -5.85); d.updateMatrix(); wall.setMatrixAt(i, d.matrix); }
    wall.castShadow = wall.receiveShadow = true; room.add(wall);
    const wallBack = add(new T.Mesh(new T.BoxGeometry(6.6, 3.9, .04), M.black), room, false); wallBack.position.set(0, 1.95, -5.9);
    const cons = add(new T.Mesh(roundedBox(3.6, .42, .48, .02), M.walnut), room); cons.position.set(0, .31, -5.45);
    for (const sx of [-1.6, 1.6]) for (const sz of [-.18, .18]){ const l = add(new T.Mesh(legGeo, M.brass), room); l.position.set(sx, .05, -5.45 + sz); }
    this.ledStrip = add(new T.Mesh(new T.BoxGeometry(3.5, .015, .02), M.led), room, false, false); this.ledStrip.position.set(0, .1, -5.2);
    this.underGlow = new T.Mesh(new T.PlaneGeometry(4.6, 1.4), new T.MeshBasicMaterial({map:this.glowT, color:0xffc21a, transparent:true, opacity:.5, depthWrite:false, blending:T.AdditiveBlending}));
    this.underGlow.rotation.x = -Math.PI/2; this.underGlow.position.set(0, .01, -5.15); room.add(this.underGlow);
    // EQ meter on the console
    this.eq = new T.InstancedMesh(new T.BoxGeometry(.06, 1, .015), new T.MeshBasicMaterial({color:0xffffff, toneMapped:false}), 28);
    this.eq.position.set(0, .2, -5.205); room.add(this.eq);
    this.eqColor = new T.Color(); this.dummy = d;
    // Tower speakers with pumping woofers
    this.woofers = [];
    for (const sx of [-2.35, 2.35]){
      const g = new T.Group(); g.position.set(sx, 0, -5.3); room.add(g);
      const cab = add(new T.Mesh(roundedBox(.42, 1.35, .42, .03), M.walnut), g); cab.position.y = .72;
      const front = add(new T.Mesh(roundedBox(.38, 1.28, .02, .01), M.grille), g, false); front.position.set(0, .72, .215);
      const coneMat = new T.MeshStandardMaterial({color:0x222222, roughness:.6, metalness:.2});
      for (const [y, rr] of [[.38, .15], [.75, .15], [1.18, .06]]){
        const surround = add(new T.Mesh(new T.TorusGeometry(rr, .018, 10, 40), new T.MeshStandardMaterial({color:0x0c0c0c, roughness:.4})), g, false); surround.position.set(0, y, .23);
        const cone = new T.Mesh(new T.ConeGeometry(rr*.92, .07, 40, 1, true), coneMat); cone.rotation.x = -Math.PI/2; cone.position.set(0, y, .225); g.add(cone);
        const cap = new T.Mesh(new T.SphereGeometry(rr*.25, 20, 10, 0, Math.PI*2, 0, Math.PI/2), M.brass); cap.rotation.x = Math.PI/2; cap.position.set(0, y, .22); g.add(cap);
        if (rr > .1) this.woofers.push(cone, cap);
      }
      const pad = add(new T.Mesh(new T.BoxGeometry(.48, .03, .48), M.black), g); pad.position.y = .015;
    }
    // Neon sign
    this.signCanvas = document.createElement("canvas"); this.signCanvas.width = 1024; this.signCanvas.height = 256;
    this.signTex = Tex.make(this.signCanvas);
    this.sign = new T.Mesh(new T.PlaneGeometry(2.4, .6), new T.MeshBasicMaterial({map:this.signTex, transparent:true, depthWrite:false, blending:T.AdditiveBlending, toneMapped:false}));
    this.sign.position.set(0, 3.45, -5.78); room.add(this.sign);

    // ---------- String lights overhead ----------
    const bulbPos = [];
    const poleMat = M.black;
    for (const z of [-4.2, -1.8, .6]){
      for (const sx of [-5.6, 5.6]){ const p = add(new T.Mesh(new T.CylinderGeometry(.03, .04, 3.3, 10), poleMat), room); p.position.set(sx, 1.65, z); }
      const pts = [];
      for (let i=0;i<=24;i++){ const t = i/24, x = -5.6 + t*11.2, y = 3.25 - Math.sin(t*Math.PI)*.75; pts.push(new T.Vector3(x, y, z)); if (i % 1 === 0 && i > 0 && i < 24) bulbPos.push(x, y - .07, z); }
      const wire = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({color:0x111111})); room.add(wire);
    }
    const bg = new T.BufferGeometry(); bg.setAttribute("position", new T.Float32BufferAttribute(bulbPos, 3));
    this.bulbs = new T.Points(bg, new T.PointsMaterial({color:0xffcf8a, size:.42, map:this.glowT, transparent:true, depthWrite:false, blending:T.AdditiveBlending, toneMapped:false}));
    room.add(this.bulbs);
    this.bulbCores = new T.Points(bg, new T.PointsMaterial({color:0xfff2d8, size:.09, map:this.glowT, transparent:true, depthWrite:false, toneMapped:false}));
    room.add(this.bulbCores);

    // ---------- Lights ----------
    this.hemi = new T.HemisphereLight(0x8fa2ff, 0x2a1a10, .35); room.add(this.hemi);
    const moonLight = new T.DirectionalLight(0xb9c8ff, .55);
    moonLight.position.set(-6, 9, -4); moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048); moonLight.shadow.bias = -.0004; moonLight.shadow.normalBias = .02;
    Object.assign(moonLight.shadow.camera, {left:-7, right:7, top:7, bottom:-7, near:1, far:30});
    room.add(moonLight);
    this.stringLight = new T.PointLight(0xffc68a, .9, 12, 2); this.stringLight.position.set(0, 2.8, -1.6); room.add(this.stringLight);
    this.screenLight = new T.PointLight(0xffc21a, .6, 7, 2); this.screenLight.position.set(0, 2, -4.6); room.add(this.screenLight);

    // Friends hanging out by the railing
    this.person(room, -4.4, 0, -2.0, Math.PI/2 + .35, "talk", {gender:"f"});
    this.person(room, -3.6, 0, -2.5, -Math.PI/2 - .5, "talk", {gender:"m"});
    this.person(room, 4.3, 0, -2.4, -.7, "dance", {gender:"f"});
    this.person(room, 3.4, 0, -3.3, -.3, "dance", {gender:"m"});
    this.person(room, 1.85, .06, -1.35, -Math.PI/2 - .45 + Math.PI, "sit", {gender:"m"});
    return {id:"rooftop", name:"Rooftop Lounge", group:room, fog:new T.FogExp2(0x1a1020, .006), exposure:1.05,
      screen:[0, 2.1, -5.63, 1, 0],
      onMood: m => {
        this.skyMat.uniforms.top.value.setHex(m.top); this.skyMat.uniforms.horizon.value.setHex(m.horizon);
        this.worlds.rooftop?.fog.color.setHex(m.horizon).multiplyScalar(.35);
        this.haze.material.color.setHex(m.horizon);
        this.screenLight.color.setHex(m.b);
        this.mats.led.color.setHex(m.a); this.underGlow.material.color.setHex(m.a);
        this.bulbs.material.color.setHex(m.warm); this.stringLight.color.setHex(m.warm);
        this.lampMat.color.setHex(m.b); this.lampMat.emissive.setHex(m.b); this.lampLight.color.setHex(m.b);
        this.pillows.forEach(p => p.material.color.setHex(m.b).lerp(new T.Color(0x3a2a22), .45));
        this.drawSign();
      },
      update: (dt, t, A) => {
        const {bass, mid, high} = A, mood = MOODS[this.moodIdx];
        this.bulbs.material.size = .36 + mid*.25 + Math.sin(t*2)*.02;
        this.bulbs.material.opacity = .65 + high*.35;
        this.stringLight.intensity = .7 + mid*.5;
        this.mats.led.color.setHex(mood.a).multiplyScalar(.6 + bass*1.2);
        this.underGlow.material.opacity = .25 + bass*.55;
        this.screenLight.intensity = .35 + bass*.9;
        this.sign.material.opacity = bass > .55 && Math.random() < .08 ? .55 : .92;
        this.stars.material.opacity = .7 + Math.sin(t*.7)*.1;
        for (let i=0;i<this.woofers.length;i+=2){ const pump = 1 + bass*.9; this.woofers[i].scale.set(1, pump, 1); this.woofers[i+1].position.z = .22 + bass*.025; }
        for (let i=0;i<28;i++){
          const v = A.vals[Math.floor(i/28*34)] || 0, h = .01 + v*.16;
          this.dummy.position.set(-.95 + i*.07, h/2, 0); this.dummy.scale.set(1, h, 1); this.dummy.rotation.set(0, 0, 0); this.dummy.updateMatrix();
          this.eq.setMatrixAt(i, this.dummy.matrix);
          this.eqColor.setHex(i/28 > .75 ? mood.b : mood.a); this.eq.setColorAt(i, this.eqColor);
        }
        this.eq.instanceMatrix.needsUpdate = true; if (this.eq.instanceColor) this.eq.instanceColor.needsUpdate = true;
        this.blobs.forEach((b, i) => b.position.set(Math.sin(t*.7 + i)*.015, .14 + ((t*.07 + i*.33) % 1)*.24, Math.cos(t*.5 + i)*.015));
        this.lampLight.intensity = .5 + Math.sin(t*1.3)*.1 + bass*.4;
      }
    };
  },
  buildConcert(){
    const T = THREE, M = this.mats, add = this.add, glowT = this.glowT;
    const g = this.room = new T.Group(); this.scene.add(g);
    g.add(new T.Mesh(new T.BoxGeometry(70, 30, 70), new T.MeshBasicMaterial({color: 0x050508, side: T.BackSide})));
    // floors: the pit is a step down from the VIP riser where you start
    const cC = Tex.concrete(), concT = Tex.make(cC, {repeat: [10, 10]});
    const pit = add(new T.Mesh(new T.PlaneGeometry(36, 30), new T.MeshStandardMaterial({map: concT, color: 0x6a6a72, roughness: .5, metalness: .2})), g, false, true);
    pit.rotation.x = -Math.PI/2; pit.position.set(0, -1, -8); this.walkable(pit); this.surface(pit);
    const riserM = new T.MeshStandardMaterial({color: 0x15151a, roughness: .35, metalness: .4});
    const riser = add(new T.Mesh(new T.BoxGeometry(10, 1, 5), riserM), g, false, true); riser.position.set(0, -.5, .9); this.walkable(riser); this.surface(riser);
    for (let i=0;i<5;i++) add(new T.Mesh(new T.BoxGeometry(10/5 - .05, .02, .04), new T.MeshBasicMaterial({color: 0xffc21a, toneMapped: false})), g).position.set(-4 + i*2, .01, -1.58);
    add(new T.Mesh(new T.BoxGeometry(10, .55, .03), M.glass), g).position.set(0, .28, -1.6);
    add(new T.Mesh(new T.BoxGeometry(10, .04, .06), M.brass), g).position.set(0, .57, -1.6);
    // the stage
    const stageY = .6, stM = new T.MeshPhysicalMaterial({color: 0x0c0c10, roughness: .15, metalness: .3, clearcoat: .8, envMap: this.envTex});
    const stage = add(new T.Mesh(new T.BoxGeometry(20, stageY + 1, 8), stM), g); stage.position.set(0, (stageY - 1)/2, -18); this.walkable(stage);
    add(new T.Mesh(new T.BoxGeometry(20, .06, .06), new T.MeshBasicMaterial({color: 0xff4fd8, toneMapped: false})), g).position.set(0, stageY - .02, -14.02);
    // barricade
    const barM = this.stdMat(0x9aa0a8, .4, {metalness: .9});
    for (let i=0;i<16;i++){ const b = new T.Group(); b.position.set(-9.4 + i*1.25, -1, -12.6); g.add(b);
      add(new T.Mesh(new T.BoxGeometry(1.2, .05, .05), barM), b).position.y = 1.15; add(new T.Mesh(new T.BoxGeometry(1.2, .05, .05), barM), b).position.y = .3;
      for (let k=0;k<6;k++) add(new T.Mesh(new T.BoxGeometry(.02, .85, .02), barM), b).position.set(-.5 + k*.2, .72, 0);
      add(new T.Mesh(new T.BoxGeometry(.06, 1.2, .5), barM), b).position.set(-.6, .6, .2); }
    // LED side panels and the screen wall
    this.ccSide = [];
    for (const sx of [-1, 1]){
      const [c] = Tex.canvas(256, 512); const tex = Tex.make(c); this.ccSide.push({c, tex});
      const p = add(new T.Mesh(new T.PlaneGeometry(4, 8), new T.MeshBasicMaterial({map: tex, toneMapped: false})), g, false); p.position.set(sx*8.6, 4.6, -21.2); p.rotation.y = -sx*.2;
    }
    add(new T.Mesh(new T.BoxGeometry(12.2, 7.2, .3), M.black), g).position.set(0, 6.2, -21.6);
    // truss, line arrays, moving-head beams
    const trussM = this.stdMat(0xb8bcc4, .3, {metalness: .9});
    for (const z of [-15, -19.5]) add(new T.Mesh(new T.BoxGeometry(22, .35, .35), trussM), g).position.set(0, 11, z);
    for (const sx of [-1, 1]){
      add(new T.Mesh(new T.BoxGeometry(.35, 12, .35), trussM), g).position.set(sx*10.8, 5.5, -15);
      for (let k=0;k<7;k++){ const sp = add(new T.Mesh(roundedBox(1.1, .42, .8, .04), M.grille), g); sp.position.set(sx*11.8, 9.8 - k*.44, -13.2); sp.rotation.x = .06*k; sp.rotation.y = -sx*.25; }
    }
    this.ccBeams = [];
    const beamT = Tex.make(Tex.beam());
    for (let i=0;i<10;i++){
      const b = new T.Group(); b.position.set(-9 + i*2, 10.7, i % 2 ? -15 : -19.5); g.add(b);
      add(new T.Mesh(new T.CylinderGeometry(.18, .22, .4, 12), M.black), b);
      const cone = new T.Mesh(new T.ConeGeometry(1.6, 14, 24, 1, true), new T.MeshBasicMaterial({map: beamT, color: 0xffffff, transparent: true, opacity: .18, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false}));
      cone.position.y = -7; b.add(cone); b.userData = {ph: i*.7}; this.ccBeams.push(b);
    }
    // lasers from the stage
    this.ccLasers = new T.Group(); this.ccLasers.position.set(0, 1.2, -14.2); g.add(this.ccLasers);
    for (let i=0;i<14;i++){ const l = new T.Mesh(new T.CylinderGeometry(.008, .008, 40, 4), new T.MeshBasicMaterial({color: 0x39ff88, transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false}));
      l.geometry.translate(0, 20, 0); l.rotation.x = -1.3; l.rotation.z = (i - 6.5)*.09; this.ccLasers.add(l); }
    // pyro: flame jets along the front of the stage
    const flameT = Tex.make(Tex.flame());
    this.ccPyro = [];
    for (const x of [-8, -4, 4, 8]){
      add(new T.Mesh(new T.CylinderGeometry(.18, .22, .3, 12), M.black), g).position.set(x, stageY + .15, -14.6);
      const f = new T.Sprite(new T.SpriteMaterial({map: flameT, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending})); f.position.set(x, stageY + 2, -14.6); f.scale.set(1.4, 4, 1); g.add(f);
      const fl = new T.PointLight(0xff7a1a, 0, 14, 2); fl.position.set(x, stageY + 2, -13.8); g.add(fl);
      this.ccPyro.push({f, fl, life: 0});
    }
    // smoke along the stage lip
    const smokeT = Tex.make(Tex.cloud());
    for (let i=0;i<10;i++){ const s = new T.Sprite(new T.SpriteMaterial({map: smokeT, color: 0x8a7cff, transparent: true, opacity: .1, depthWrite: false})); s.position.set(rnd(-9, 9), stageY + .5, rnd(-17, -14.5)); s.scale.set(rnd(4, 6), 1.6, 1); g.add(s); }
    // performers: the rapper, a hype man and the DJ on stage
    const sb = Props.djBooth(); sb.position.set(4.5, stageY, -18.6); g.add(sb); this.ccBooth = sb;
    this.person(g, 4.5, stageY, -19.25, 0, "dj", {gender: "m"});
    this.ccRapper = this.person(g, 0, stageY, -15.6, 0, "cheer", {gender: "m"});
    this.person(g, -3, stageY, -16.2, .2, "dance", {gender: "m"});
    this.person(g, -6.5, stageY, -17.5, .3, "dance", {gender: "f"}); this.person(g, 7.2, stageY, -17.2, -.3, "dance", {gender: "f"});
    const mic = add(new T.Mesh(new T.CylinderGeometry(.012, .012, 1.4, 8), M.black), g); mic.position.set(.5, stageY + .7, -15.2);
    // the crowd in the pit, fans in the stands
    for (let r=0;r<4;r++) for (let k=0;k<7;k++){ const x = -7.2 + k*2.4 + (r % 2)*1.1 + rnd(-.3, .3), z = -11.6 + r*1.9 + rnd(-.3, .3);
      this.person(g, x, -1, z, Math.PI + Math.atan2(x*.08, 1) + rnd(-.3, .3), (r + k) % 4 === 0 ? "cheer" : "dance"); }
    const benchM = this.stdMat(0x2b2b33, .6);
    for (const sx of [-1, 1]) for (let tier=0;tier<4;tier++){
      const b = add(new T.Mesh(new T.BoxGeometry(1.2, .45 + tier*.55, 16), benchM), g); b.position.set(sx*(13.5 + tier*1.2), -1 + (.45 + tier*.55)/2, -9); this.walkable(b);
      for (let k=0;k<4;k++) if ((k + tier) % 2 === 0) this.person(g, sx*(13.5 + tier*1.2), -1 + .45 + tier*.55 - (tier % 2 ? 0 : .42), -14 + k*3.2, sx > 0 ? -Math.PI/2 : Math.PI/2, tier % 2 ? "cheer" : "sit");
    }
    // drinks on the VIP riser rail table
    const rt = add(new T.Mesh(roundedBox(2.2, .05, .45, .02), M.walnut), g); rt.position.set(2.6, 1.05, -1.25); this.surface(rt);
    add(new T.Mesh(new T.CylinderGeometry(.04, .04, 1.05, 8), M.black), g).position.set(2.6, .52, -1.25);
    for (const [x, maker] of [[1.8, () => Props.tumbler("whiskey")], [2.25, () => Props.beerBottle()], [2.7, () => Props.flute()], [3.2, () => Props.champagne()]]){ const o = maker(); o.position.set(x, 1.075, -1.25); g.add(o); this.grabbable(o); }
    // lights
    g.add(new T.HemisphereLight(0x5a4aff, 0x0a0606, .25));
    this.ccSpot = new T.SpotLight(0xffffff, 3, 30, .22, .5, 1.5); this.ccSpot.position.set(0, 11, -8); this.ccSpot.target.position.set(0, stageY, -15.6); g.add(this.ccSpot, this.ccSpot.target);
    this.ccWash = new T.PointLight(0xff4fd8, 1.6, 26, 2); this.ccWash.position.set(0, 7, -12); g.add(this.ccWash);
    const front = new T.DirectionalLight(0xffe0d0, .35); front.position.set(0, 6, 4); front.target.position.set(0, 0, -15); g.add(front, front.target);
    return {id: "concert", name: "Hip-Hop Concert", group: g, floorY: -1, noEnv: true, fog: new T.FogExp2(0x07060c, .018), exposure: 1.05,
      screen: [0, 6.2, -21.4, 3.2, 0],
      onMood: m => { this.ccWash.color.setHex(m.a); this.ccBeams.forEach((b, i) => b.children[1].material.color.setHex(i % 2 ? m.a : m.b)); },
      update: (dt, t, A) => {
        this.ccBeams.forEach(b => { const p = b.userData.ph; b.rotation.z = Math.sin(t*.7 + p)*.45; b.rotation.x = Math.cos(t*.5 + p)*.3 - .1; b.children[1].material.opacity = .1 + A.bass*.25; });
        this.ccLasers.visible = A.mid > .25 || Math.sin(t*.5) > .6;
        this.ccLasers.children.forEach((l, i) => { l.rotation.z = (i - 6.5)*.09 + Math.sin(t*1.3)*.25; l.rotation.x = -1.3 + Math.sin(t*.9 + i)*.08; });
        if (A.hit && Math.random() < .5){ const p = this.ccPyro[Math.floor(Math.random()*4)]; p.life = .7; }
        this.ccPyro.forEach(p => { p.life = Math.max(0, p.life - dt); const k = p.life/.7; p.f.material.opacity = k; p.f.scale.set(1.4, 2 + k*4, 1); p.f.position.y = .6 + 1 + k*2; p.fl.intensity = k*6; });
        this.ccWash.intensity = 1.2 + A.bass*2.4; this.ccSpot.intensity = 2.5 + A.mid*2;
        this.ccSide.forEach(({c, tex}, i) => { const x = c.getContext("2d"); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, 0, 256, 512);
          for (let k=0;k<8;k++){ const h = (A.vals[(k*4 + i*2) % A.vals.length] || 0)/255*512; x.fillStyle = `hsl(${(t*40 + k*30 + i*120) % 360},90%,60%)`; x.fillRect(k*32 + 2, 512 - h, 28, h); } tex.needsUpdate = true; });
        this.ccBooth.userData.platters.forEach(p => p.rotation.y -= dt*3.5);
      }};
  },
};
const venue=Lounge[{club:'buildClub',rooftop:'buildRooftop',concert:'buildConcert'}[id]]();
Lounge.worlds[id]=venue;
scene.fog=venue.fog;
scene.add(new T.HemisphereLight(0xc9ddff,0x513842,1.3));
venue.onMood?.(MOODS[1]);
const featured=id==='club' ? Lounge.person(venue.group,1.6,0,1,0,'idle') :
  id==='rooftop' ? Lounge.person(venue.group,2.1,0,2.5,0,'idle') :
  people.find(person=>person.userData.behavior==='dj');
if(featured) onPerson(featured);
const levels=new Float32Array(64).fill(.28);
return {update(dt,t){const pulse=.32+Math.sin(t*4)*.14;
venue.update?.(dt,t,{vals:levels,bass:pulse,mid:.3,high:.2,hit:false});
if(id!=='club')for(const p of people)if(['dj','dance','cheer'].includes(p.userData.behavior))Lounge.dance(p,t,pulse);
}};
};
