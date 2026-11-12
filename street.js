window.StreetWorld = (function () {
  'use strict';

  const Z0 = 44, Z1 = -1020, INT_STEP = 96, INT_FIRST = -96;
  const ROAD_HALF = 5.2, WALK_W = 2.3, FACADE_X = 8.2;
  const CHUNK = 108;

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return t;
  }

  function skyTexture() {
    return canvasTex(1024, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#050a12');
      grad.addColorStop(0.28, '#0b1624');
      grad.addColorStop(0.44, '#14263b');
      grad.addColorStop(0.5, '#242525');
      grad.addColorStop(0.53, '#a05d32');
      grad.addColorStop(0.57, '#241f1b');
      grad.addColorStop(0.68, '#121c27');
      grad.addColorStop(1.0, '#070c12');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);

      g.save();
      g.globalAlpha = 0.5;
      for (let i = 0; i < 190; i++) {
        const x = Math.random() * w;
        const y = 40 + Math.random() * 255;
        const rx = 40 + Math.random() * 190;
        const ry = 5 + Math.random() * 20;
        const cg = g.createRadialGradient(x, y, 0, x, y, rx);
        const shade = 32 + Math.random() * 54;
        cg.addColorStop(0, `rgba(${shade},${shade + 7},${shade + 16},0.55)`);
        cg.addColorStop(1, 'rgba(70,80,92,0)');
        g.fillStyle = cg;
        g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
      }
      g.restore();

      g.save();
      g.globalAlpha = 0.1;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * w;
        const y = 140 + Math.random() * 200;
        const rx = 60 + Math.random() * 220;
        const ry = 5 + Math.random() * 22;
        const cg = g.createRadialGradient(x, y, 0, x, y, rx);
        cg.addColorStop(0, 'rgba(182,190,198,0.55)');
        cg.addColorStop(1, 'rgba(150,162,172,0)');
        g.fillStyle = cg;
        g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
      }
      g.restore();

      g.save();
      g.globalAlpha = 0.22;
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * w;
        const y = 10 + Math.random() * 190;
        const rx = 80 + Math.random() * 230;
        const ry = 6 + Math.random() * 18;
        const cg = g.createRadialGradient(x, y, 0, x, y, rx);
        cg.addColorStop(0, 'rgba(18,24,32,0.7)');
        cg.addColorStop(1, 'rgba(18,24,32,0)');
        g.fillStyle = cg;
        g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
      }
      g.restore();

      g.save();
      const warm = g.createRadialGradient(520, 258, 10, 520, 268, 420);
      warm.addColorStop(0, 'rgba(226,138,74,0.58)');
      warm.addColorStop(0.55, 'rgba(190,112,64,0.12)');
      warm.addColorStop(1, 'rgba(180,100,60,0)');
      g.fillStyle = warm; g.fillRect(0, 150, w, 200);
      g.restore();

      g.save();
      g.globalAlpha = 0.15;
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        g.fillStyle = Math.random() > 0.5 ? '#d7dde4' : '#161c24';
        g.fillRect(x, y, 1.4, 1.4);
      }
      g.restore();
    });
  }

  function brickTexture(bump) {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = bump ? '#8b8b8b' : '#c3bcb1';
      g.fillRect(0, 0, w, h);
      const rows = 9, cols = 5, bh = h / rows, bw = w / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * bw * 0.5;
        for (let c = -1; c < cols + 1; c++) {
          const x = c * bw + off + 2;
          const y = r * bh + 2;
          const t = Math.random();
          if (bump) {
            const v = 118 + Math.floor(t * 54);
            g.fillStyle = `rgb(${v},${v},${v})`;
          } else {
            const rr = 112 + Math.floor(t * 46);
            const gg = 58 + Math.floor(t * 26);
            const bb = 44 + Math.floor(t * 20);
            g.fillStyle = `rgb(${rr},${gg},${bb})`;
          }
          g.fillRect(x, y, bw - 4, bh - 4);
          if (!bump) {
            g.fillStyle = 'rgba(28,16,10,0.26)';
            g.fillRect(x, y + bh - 7, bw - 4, 3);
            g.fillStyle = 'rgba(235,220,198,0.12)';
            g.fillRect(x, y, bw - 4, 2);
            if (Math.random() > 0.72) {
              g.fillStyle = 'rgba(40,28,20,0.2)';
              g.fillRect(x + Math.random() * bw * 0.5, y + 3, 6 + Math.random() * 16, 3);
            }
          }
        }
      }
      g.globalAlpha = 0.10;
      for (let i = 0; i < 2200; i++) {
        g.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      g.globalAlpha = 1;
    });
  }

  function concreteTexture(bump) {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = bump ? '#888' : '#787b7c';
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.18;
      for (let i = 0; i < 2400; i++) {
        const v = 70 + Math.random() * 80;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(28,30,31,0.5)';
      g.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        let x = Math.random() * w, y = Math.random() * h;
        g.moveTo(x, y);
        for (let k = 0; k < 7; k++) {
          x += (Math.random() - 0.5) * 52;
          y += (Math.random() - 0.5) * 52;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = bump ? 'rgba(30,30,30,0.9)' : 'rgba(48,50,50,0.55)';
      g.lineWidth = 3;
      g.strokeRect(0, 0, w, h);
    });
  }

  function roofTexture() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#23262b';
      g.fillRect(0, 0, w, h);
      const rows = 14, bh = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 11; c++) {
          const x = c * (w / 10) - (r % 2) * (w / 20);
          const y = r * bh;
          const v = 28 + Math.floor(Math.random() * 22);
          g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
          g.fillRect(x + 1, y + 1, w / 10 - 2, bh - 2);
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(x, y + bh - 2, w / 10, 2);
        }
      }
      g.globalAlpha = 0.12;
      for (let i = 0; i < 1200; i++) {
        g.fillStyle = Math.random() > 0.5 ? '#9aa' : '#000';
        g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    });
  }

  function windowTexture(kind) {
    return canvasTex(256, 320, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#0d1014';
      g.fillRect(0, 0, w, h);
      const frame = kind === 'dark' ? '#2c2f31' : '#5c5147';
      g.fillStyle = frame;
      g.fillRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#0a0d11';
      g.fillRect(20, 20, w - 40, h - 40);

      if (kind === 'warm' || kind === 'green') {
        const col = kind === 'warm' ? ['#f0dcbc', '#c89a62', '#6d4a2c'] : ['#cfe2cf', '#94b39a', '#4a6352'];
        const grad = g.createLinearGradient(20, 20, w - 20, h - 20);
        grad.addColorStop(0, col[0]);
        grad.addColorStop(0.62, col[1]);
        grad.addColorStop(1, col[2]);
        g.fillStyle = grad;
        g.fillRect(20, 20, w - 40, h - 40);
        g.fillStyle = 'rgba(60,40,24,0.5)';
        if (kind === 'warm') {
          const c1 = 40 + Math.random() * 40;
          g.fillRect(24, 24, 26, h - 48);
          g.fillRect(w - 50, 24, 26, h - 48);
          g.fillStyle = 'rgba(240,225,200,0.35)';
          g.fillRect(56, 60, w - 112, 40);
          g.fillStyle = 'rgba(22,16,12,0.65)';
          g.fillRect(w / 2 - 3, 20, 6, h - 40);
          g.fillRect(20, h / 2 - 3, w - 40, 6);
          g.fillStyle = `rgba(30,20,14,${0.25 + Math.random() * 0.2})`;
          g.fillRect(20, 20, w - 40, 34 + c1);
        } else {
          g.fillStyle = 'rgba(20,26,22,0.65)';
          for (let i = 0; i < 5; i++) g.fillRect(20 + i * 44, 20, 10, h - 40);
          g.fillRect(w / 2 - 3, 20, 6, h - 40);
        }
        g.globalAlpha = 0.12;
        for (let i = 0; i < 260; i++) {
          g.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
          g.fillRect(20 + Math.random() * (w - 40), 20 + Math.random() * (h - 40), 1, 1);
        }
        g.globalAlpha = 1;
      } else {
        const grad = g.createLinearGradient(20, 20, w - 30, h - 20);
        grad.addColorStop(0, '#1b242e');
        grad.addColorStop(0.45, '#0c1218');
        grad.addColorStop(1, '#151d25');
        g.fillStyle = grad;
        g.fillRect(20, 20, w - 40, h - 40);
        g.fillStyle = 'rgba(110,130,150,0.14)';
        g.beginPath();
        g.moveTo(30, h - 24); g.lineTo(w - 60, 24); g.lineTo(w - 30, 24); g.lineTo(70, h - 24);
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(200,214,226,0.10)';
        g.fillRect(20, 20, w - 40, 4);
      }
      g.strokeStyle = frame;
      g.lineWidth = 9;
      g.strokeRect(15, 15, w - 30, h - 30);
      g.fillStyle = 'rgba(10,12,14,0.5)';
      g.fillRect(14, h - 24, w - 28, 10);
    });
  }

  function meshWindowTexture(kind) {
    return canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = '#070a0d';
      g.fillRect(0, 0, w, h);
      const glass = g.createLinearGradient(0, 0, w * 0.8, h);
      if (kind === 'warm') {
        glass.addColorStop(0, '#f4e7cd');
        glass.addColorStop(0.5, '#c49a68');
        glass.addColorStop(1, '#57402b');
      } else if (kind === 'green') {
        glass.addColorStop(0, '#e4f2dc');
        glass.addColorStop(0.52, '#93b299');
        glass.addColorStop(1, '#3f5447');
      } else {
        glass.addColorStop(0, '#314754');
        glass.addColorStop(0.5, '#121c24');
        glass.addColorStop(1, '#243440');
      }
      g.fillStyle = glass;
      g.fillRect(12, 12, w - 24, h - 24);

      g.save();
      g.beginPath(); g.rect(12, 12, w - 24, h - 24); g.clip();
      if (kind === 'warm' || kind === 'green') {
        g.fillStyle = kind === 'warm' ? 'rgba(255,246,222,0.6)' : 'rgba(236,255,232,0.55)';
        g.fillRect(22, 24, w - 44, 9);
        g.fillRect(22, h * 0.42, w - 44, 5);
        g.fillStyle = 'rgba(24,22,20,0.32)';
        for (let i = 0; i < 4; i++) g.fillRect(24 + i * 54, h - 132, 38, 52);
        g.fillStyle = 'rgba(24,22,20,0.22)';
        for (let i = 0; i < 3; i++) g.fillRect(34 + i * 66, h - 190, 44, 40);
      } else {
        g.fillStyle = 'rgba(150,178,204,0.13)';
        g.beginPath();
        g.moveTo(18, h - 30); g.lineTo(w - 52, 20); g.lineTo(w - 20, 20); g.lineTo(48, h - 30);
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(226,138,52,0.2)';
        g.fillRect(26, 140, 8, h - 176);
      }
      g.strokeStyle = 'rgba(16,19,22,0.5)';
      g.lineWidth = 2;
      for (let x = -h; x < w + h; x += 14) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
        g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke();
      }
      g.strokeStyle = 'rgba(206,218,226,0.09)';
      g.lineWidth = 1;
      for (let x = -h + 1; x < w + h; x += 14) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
      }
      const grime = g.createLinearGradient(0, h - 110, 0, h - 12);
      grime.addColorStop(0, 'rgba(18,20,18,0)');
      grime.addColorStop(1, 'rgba(18,20,18,0.34)');
      g.fillStyle = grime;
      g.fillRect(12, h - 110, w - 24, 98);
      g.restore();

      g.fillStyle = '#1b1f23';
      g.fillRect(w / 2 - 5, 12, 10, h - 24);
      g.fillRect(12, h * 0.56 - 4, w - 24, 8);
      g.strokeStyle = '#262a2d';
      g.lineWidth = 18;
      g.strokeRect(9, 9, w - 18, h - 18);
      g.strokeStyle = 'rgba(196,204,210,0.22)';
      g.lineWidth = 2;
      g.strokeRect(20, 20, w - 40, h - 40);
    });
  }

  function noticeTexture() {
    return canvasTex(256, 192, (g, w, h) => {
      g.fillStyle = '#4a3726';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#2f2318';
      g.fillRect(9, 9, w - 18, h - 18);
      g.fillStyle = '#1b2327';
      g.fillRect(9, 9, w - 18, 24);
      g.fillStyle = 'rgba(226,222,210,0.8)';
      g.font = '700 12px Archivo, sans-serif';
      g.textAlign = 'center';
      g.fillText('NOTICES', w / 2, 26);
      const cols = ['#e9e3d3', '#d6d1be', '#efe8d6', '#c8c6b7', '#ded4bd'];
      for (let i = 0; i < 8; i++) {
        const pw = 38 + Math.random() * 34;
        const ph = 42 + Math.random() * 38;
        const px = 16 + Math.random() * Math.max(1, w - 32 - pw);
        const py = 42 + Math.random() * Math.max(1, h - 56 - ph);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(px + 2, py + 2, pw, ph);
        g.fillStyle = cols[i % cols.length];
        g.fillRect(px, py, pw, ph);
        g.fillStyle = 'rgba(40,38,34,0.5)';
        for (let l = 0; l < 5; l++) g.fillRect(px + 5, py + 9 + l * 6, pw - 10, 2);
        g.fillStyle = '#a23932';
        g.fillRect(px + pw - 8, py + 3, 5, 5);
      }
    });
  }

  function vendingTexture() {
    return canvasTex(160, 320, (g, w, h) => {
      g.fillStyle = '#0b0f11';
      g.fillRect(0, 0, w, h);
      const panel = g.createLinearGradient(0, 0, 0, h);
      panel.addColorStop(0, '#d8f0d4');
      panel.addColorStop(0.55, '#9fc9a6');
      panel.addColorStop(1, '#5b7f66');
      g.fillStyle = panel;
      g.fillRect(12, 26, w - 24, 176);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          g.fillStyle = ['#b23a30', '#2f5a8a', '#c9a13a', '#3f7a4a'][(r + c) % 4];
          g.fillRect(20 + c * 30, 36 + r * 40, 20, 30);
          g.fillStyle = 'rgba(255,255,255,0.3)';
          g.fillRect(22 + c * 30, 38 + r * 40, 4, 26);
        }
      }
      g.fillStyle = 'rgba(20,26,24,0.7)';
      g.fillRect(12, 210, w - 24, 46);
      g.fillStyle = '#0e1412';
      g.fillRect(20, 270, w - 40, 30);
      g.strokeStyle = 'rgba(220,230,224,0.25)';
      g.lineWidth = 3;
      g.strokeRect(10, 10, w - 20, h - 20);
    });
  }

  function doorTexture(color) {
    return canvasTex(160, 340, (g, w, h) => {
      g.fillStyle = '#121517'; g.fillRect(0, 0, w, h);
      g.fillStyle = color; g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(8, 8, w - 16, 8);
      g.fillRect(8, 8, 8, h - 16);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(28, 40, w - 56, 90);
      g.fillRect(28, 158, w - 56, 110);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(30, 42, w - 60, 4);
      g.fillRect(30, 160, w - 60, 4);
      g.fillStyle = '#b79a62';
      g.beginPath(); g.arc(w - 34, h * 0.5, 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(10,12,14,0.35)';
      g.fillRect(12, h - 30, w - 24, 16);
    });
  }

  function glowTexture() {
    return canvasTex(128, 128, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.18, 'rgba(255,245,222,0.85)');
      grad.addColorStop(0.44, 'rgba(255,210,150,0.30)');
      grad.addColorStop(1, 'rgba(255,190,120,0)');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    });
  }

  function leafTexture() {
    return canvasTex(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 110; i++) {
        const x = 64 + (Math.random() - 0.5) * 108;
        const y = 64 + (Math.random() - 0.5) * 108;
        const r = 2 + Math.random() * 8;
        const v = 52 + Math.random() * 76;
        g.fillStyle = `rgba(${Math.floor(v * 0.84)},${Math.floor(v)},${Math.floor(v * 0.42)},${0.45 + Math.random() * 0.55})`;
        g.beginPath();
        g.ellipse(x, y, r, r * (0.5 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  function poolTexture() {
    return canvasTex(128, 256, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h * 0.38, 2, w / 2, h * 0.42, w * 0.62);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.3, 'rgba(255,224,180,0.35)');
      grad.addColorStop(0.72, 'rgba(255,200,140,0.09)');
      grad.addColorStop(1, 'rgba(255,190,120,0)');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    });
  }

  function rainTexture() {
    return canvasTex(8, 48, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(210,224,236,0)');
      grad.addColorStop(0.3, 'rgba(210,224,236,0.85)');
      grad.addColorStop(0.86, 'rgba(190,206,222,0.5)');
      grad.addColorStop(1, 'rgba(190,206,222,0)');
      g.fillStyle = grad;
      g.fillRect(w / 2 - 1, 0, 2, h);
    });
  }

  function tapeTexture() {
    return canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = '#e6e2d6'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b3fa0';
      for (let x = -h; x < w + h; x += 34) {
        g.beginPath();
        g.moveTo(x, 0); g.lineTo(x + 17, 0); g.lineTo(x + 17 + h, h); g.lineTo(x + h, h);
        g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
    });
  }

  function binLabelTexture() {
    return canvasTex(128, 96, (g, w, h) => {
      g.fillStyle = '#e8ebe6';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(30,60,40,0.7)'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.strokeStyle = '#2f7a48'; g.lineWidth = 7; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(64, 16); g.lineTo(88, 58); g.lineTo(40, 58); g.closePath(); g.stroke();
      g.fillStyle = '#2b5e3a';
      g.font = '700 17px Inter Tight, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('RECYCLE', 64, 79);
      g.globalAlpha = 0.1;
      for (let i = 0; i < 60; i++) { g.fillStyle = '#000'; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
    });
  }

  function grimeTexture() {
    return canvasTex(64, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(8,9,8,0)');
      grad.addColorStop(0.45, 'rgba(8,9,8,0.10)');
      grad.addColorStop(0.8, 'rgba(6,7,6,0.34)');
      grad.addColorStop(1, 'rgba(4,5,4,0.62)');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.10;
      for (let i = 0; i < 70; i++) {
        g.fillStyle = '#000';
        g.fillRect(Math.random() * w, h * 0.4 + Math.random() * h * 0.6, 1 + Math.random() * 2, 2 + Math.random() * 8);
      }
    });
  }

  function aoTexture(flip) {
    return canvasTex(64, 64, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(flip ? 0 : 1, 'rgba(0,0,0,0)');
      grad.addColorStop(flip ? 1 : 0, 'rgba(0,0,0,0.52)');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    });
  }

  function coneTexture() {
    return canvasTex(16, 128, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(255,190,120,0.13)');
      grad.addColorStop(0.35, 'rgba(255,180,110,0.05)');
      grad.addColorStop(0.75, 'rgba(255,170,100,0.015)');
      grad.addColorStop(1, 'rgba(255,170,100,0)');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    });
  }

  function signTexture(text, bg, fg) {
    return canvasTex(512, 160, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = fg;
      g.font = '900 74px Archivo, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + 3);
      g.globalAlpha = 0.1;
      for (let i = 0; i < 400; i++) {
        g.fillStyle = '#000';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    });
  }


  function paintSign(tex, text, bg, fg, glow) {
    const c = tex.image;
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    g.clearRect(0, 0, w, h);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.globalAlpha = 0.55; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
    g.globalAlpha = 1;
    let size = 86;
    g.font = `900 ${size}px Archivo, sans-serif`;
    while (g.measureText(text).width > w - 60 && size > 30) { size -= 4; g.font = `900 ${size}px Archivo, sans-serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = glow || fg; g.shadowBlur = 22;
    g.fillStyle = fg;
    g.fillText(text, w / 2, h / 2 + 4);
    g.shadowBlur = 0;
    tex.needsUpdate = true;
  }

  function restyle(world, theme) {
    const { T, M } = world;
    const s = theme.signs;
    paintSign(T.school, s[0], theme.signBg || '#0d0f14', theme.accent, theme.accent);
    paintSign(T.cafe, s[1], '#120d0a', theme.accent2 || '#ffd28a', theme.accent2 || '#ffd28a');
    paintSign(T.shop, s[2], '#0b1013', '#e9f1f4', theme.accent);
    paintSign(T.hall, s[3], theme.owned ? '#1a1206' : '#0c0f13', theme.owned ? '#f2c14e' : '#d6dde2', theme.owned ? '#ff9a3c' : theme.accent);
    for (const k of ['schoolSign', 'cafe', 'shop', 'hallSign']) { M[k].color.setRGB(1.25, 1.25, 1.25); }
  }

  function railingTexture() {
    return canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(20,22,24,0.96)';
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(0, 16); g.lineTo(w, 16); g.stroke();
      g.beginPath(); g.moveTo(0, h - 12); g.lineTo(w, h - 12); g.stroke();
      g.lineWidth = 3;
      for (let x = 8; x < w; x += 22) {
        g.beginPath(); g.moveTo(x, 14); g.lineTo(x, h - 10); g.stroke();
      }
      g.strokeStyle = 'rgba(80,86,90,0.35)';
      g.lineWidth = 1;
      for (let x = 10; x < w; x += 22) {
        g.beginPath(); g.moveTo(x - 1, 14); g.lineTo(x - 1, h - 10); g.stroke();
      }
    });
  }

  function chainTexture() {
    return canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.lineCap = 'round';
      for (let off = -256; off < 512; off += 32) {
        g.strokeStyle = 'rgba(150,158,162,0.95)';
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(off, 0); g.lineTo(off + 256, 256); g.stroke();
        g.beginPath(); g.moveTo(off + 256, 0); g.lineTo(off, 256); g.stroke();
        g.strokeStyle = 'rgba(48,52,55,0.6)';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(off + 1, 0); g.lineTo(off + 257, 256); g.stroke();
        g.beginPath(); g.moveTo(off + 255, 0); g.lineTo(off - 1, 256); g.stroke();
      }
    });
  }

  function makeTextures(renderer) {
    const T = {};
    T.sky = skyTexture();
    T.sky.mapping = THREE.EquirectangularReflectionMapping;
    T.sky.colorSpace = THREE.SRGBColorSpace;
    const photo = (url, srgb, repeat) => {
      const t = new THREE.TextureLoader().load(url);
      t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      return t;
    };
    T.brick = photo('assets/textures/brick_red.webp', true, true);
    T.brickBrown = photo('assets/textures/brick_brown.webp', true, true);
    T.brickBrownBump = photo('assets/textures/brick_brown_bump.webp', false, true);
    T.renderPlaster = photo('assets/textures/render_plaster.webp', true, true);
    T.renderBump = photo('assets/textures/render_bump.webp', false, true);
    T.brickBump = photo('assets/textures/brick_bump.webp', false, true);
    T.concrete = photo('assets/textures/concrete_wet.webp', true, true);
    T.concreteBump = photo('assets/textures/concrete_bump.webp', false, true);
    T.roof = photo('assets/textures/roof_slate.webp', true, true);
    T.roofBump = photo('assets/textures/roof_bump.webp', false, true);
    T.winWarm = photo('assets/textures/window_warm.webp', true, false);
    T.winWarm2 = photo('assets/textures/window_warm2.webp', true, false);
    T.winDark = photo('assets/textures/window_dark.webp', true, false);
    T.winGreen = windowTexture('green');
    T.doorBlue = doorTexture('#24313b');
    T.doorRed = doorTexture('#4c2420');
    T.doorGreen = doorTexture('#2b382c');
    T.glow = glowTexture();
    T.pool = poolTexture();
    T.rain = rainTexture();
    T.leaves = leafTexture();
    T.leaves.colorSpace = THREE.SRGBColorSpace;
    T.binLabel = binLabelTexture();
    T.binLabel.colorSpace = THREE.SRGBColorSpace;
    T.grime = grimeTexture();
    T.grime.colorSpace = THREE.SRGBColorSpace;
    T.aoL = aoTexture(false);
    T.aoR = aoTexture(true);
    T.aoL.colorSpace = THREE.SRGBColorSpace;
    T.aoR.colorSpace = THREE.SRGBColorSpace;
    T.cone = coneTexture();
    T.cone.colorSpace = THREE.SRGBColorSpace;
    T.tape = tapeTexture();
    T.railing = railingTexture();
    T.chain = chainTexture();
    T.cafe = signTexture('NIGHT CAFE', '#2a221b', '#e6c887');
    T.shop = signTexture('BARBER', '#1d2327', '#d8dee2');
    T.school = signTexture('SCHOOL', '#14181d', '#e8e2d2');
    T.hall = signTexture('SPORTS HALL', '#14181d', '#c8d0d4');
    T.winMeshWarm = meshWindowTexture('warm');
    T.winMeshGreen = meshWindowTexture('green');
    T.winMeshDark = meshWindowTexture('dark');
    T.notice = noticeTexture();
    T.vending = vendingTexture();

    const asphalt = new THREE.TextureLoader().load('assets/elements/surface_swatches_01_wet_asphalt.webp');
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    asphalt.colorSpace = THREE.SRGBColorSpace;
    asphalt.anisotropy = renderer.capabilities.getMaxAnisotropy();
    T.asphalt = asphalt;
    const rough = asphalt.clone();
    rough.colorSpace = THREE.NoColorSpace;
    rough.needsUpdate = true;
    T.asphaltRough = rough;

    T.chainSwatch = null;
    new THREE.TextureLoader().load('assets/elements/surface_swatches_02_red_brick.webp', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.drawImage(tex.image, 0, 0, 256, 256);
      const d = g.getImageData(0, 0, 256, 256);
      for (let i = 0; i < d.data.length; i += 4) {
        const l = d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11;
        d.data[i] = 255; d.data[i + 1] = 255; d.data[i + 2] = 255;
        d.data[i + 3] = Math.max(0, Math.min(255, (l - 48) * 4.0));
      }
      g.putImageData(d, 0, 0);
      const a = new THREE.CanvasTexture(c);
      a.wrapS = a.wrapT = THREE.RepeatWrapping;
      a.colorSpace = THREE.NoColorSpace;
      if (T._setChainPhoto) T._setChainPhoto(tex, a);
    });

    const aniso = renderer.capabilities.getMaxAnisotropy();
    for (const k of ['brick', 'brickBump', 'brickBrown', 'brickBrownBump', 'renderPlaster', 'renderBump', 'concrete', 'concreteBump', 'roof', 'roofBump', 'winWarm', 'winWarm2', 'winDark', 'winGreen', 'doorBlue', 'doorRed', 'doorGreen', 'tape', 'railing', 'chain', 'winMeshWarm', 'winMeshGreen', 'winMeshDark', 'notice', 'vending', 'school', 'hall']) {
      T[k].anisotropy = aniso;
    }
    for (const k of ['brick', 'brickBrown', 'renderPlaster', 'concrete', 'roof', 'winWarm', 'winWarm2', 'winDark', 'winGreen', 'doorBlue', 'doorRed', 'doorGreen', 'tape', 'railing', 'chain', 'cafe', 'shop', 'grime', 'aoL', 'aoR', 'winMeshWarm', 'winMeshGreen', 'winMeshDark', 'notice', 'vending', 'school', 'hall']) {
      if (k === 'brickBump' || k === 'concreteBump') continue;
      T[k].colorSpace = THREE.SRGBColorSpace;
    }
    for (const k of ['winMeshWarm', 'winMeshGreen', 'winMeshDark', 'notice', 'vending', 'school', 'hall']) {
      T[k].wrapS = T[k].wrapT = THREE.ClampToEdgeWrapping;
    }
    T.brickBump.colorSpace = THREE.NoColorSpace;
    T.brickBrownBump.colorSpace = THREE.NoColorSpace;
    T.renderBump.colorSpace = THREE.NoColorSpace;
    T.concreteBump.colorSpace = THREE.NoColorSpace;
    T.roofBump.colorSpace = THREE.NoColorSpace;
    return T;
  }

  function makeMaterials(T) {
    const M = {};
    M.asphalt = new THREE.MeshPhysicalMaterial({
      map: T.asphalt, roughnessMap: T.asphaltRough, bumpMap: T.asphalt,
      bumpScale: 0.028, roughness: 0.55, metalness: 0.2, color: 0x646b73,
      envMapIntensity: 2.3, clearcoat: 0.9, clearcoatRoughness: 0.14
    });
    M.sidewalk = new THREE.MeshStandardMaterial({
      map: T.concrete, bumpMap: T.concreteBump, bumpScale: 0.045,
      roughness: 0.45, metalness: 0.1, color: 0x747b80, envMapIntensity: 1.8
    });
    M.brick = new THREE.MeshStandardMaterial({
      map: T.brick, bumpMap: T.brickBump, bumpScale: 0.06,
      roughness: 0.9, metalness: 0.0, color: 0xc8beb0,
      emissive: 0x241811, emissiveIntensity: 0.55, emissiveMap: T.brick
    });
    M.brickDark = new THREE.MeshStandardMaterial({
      map: T.brick, bumpMap: T.brickBump, bumpScale: 0.06,
      roughness: 0.93, metalness: 0.0, color: 0x6f665d
    });
    M.brickLight = new THREE.MeshStandardMaterial({
      map: T.brick, bumpMap: T.brickBump, bumpScale: 0.06,
      roughness: 0.88, metalness: 0.0, color: 0xe0cec0,
      emissive: 0x271c14, emissiveIntensity: 0.55, emissiveMap: T.brick
    });
    M.brickBrown = new THREE.MeshStandardMaterial({
      map: T.brickBrown, bumpMap: T.brickBrownBump, bumpScale: 0.06,
      roughness: 0.9, metalness: 0.0, color: 0xd8c8b8,
      emissive: 0x261a12, emissiveIntensity: 0.55, emissiveMap: T.brickBrown
    });
    M.render = new THREE.MeshStandardMaterial({
      map: T.renderPlaster, bumpMap: T.renderBump, bumpScale: 0.035,
      roughness: 0.85, metalness: 0.0, color: 0xd8d2c8
    });
    M.roof = new THREE.MeshStandardMaterial({ map: T.roof, bumpMap: T.roofBump, bumpScale: 0.05, roughness: 0.72, metalness: 0.08, color: 0xa8adb4 });
    M.trim = new THREE.MeshStandardMaterial({ color: 0xcfc9bb, roughness: 0.72, metalness: 0.0 });
    M.trimDark = new THREE.MeshStandardMaterial({ color: 0x8c877c, roughness: 0.8 });
    M.darkMetal = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.42, metalness: 0.78, envMapIntensity: 1.2 });
    M.iron = new THREE.MeshStandardMaterial({ map: T.railing, transparent: true, alphaTest: 0.28, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.6, color: 0x8e959b });
    M.chain = new THREE.MeshStandardMaterial({ map: T.chain, transparent: true, alphaTest: 0.24, side: THREE.DoubleSide, roughness: 0.48, metalness: 0.55, color: 0xc8ced2, emissive: 0x1b2226, emissiveIntensity: 0.9 });
    T._setChainPhoto = (photo, alpha) => {
      M.chain.map = photo;
      M.chain.alphaMap = alpha;
      M.chain.color.setHex(0xffffff);
      M.chain.needsUpdate = true;
    };
    M.glassDark = new THREE.MeshStandardMaterial({ color: 0x0b1116, roughness: 0.12, metalness: 0.45, envMapIntensity: 2.2 });
    M.glass = new THREE.MeshPhysicalMaterial({ color: 0xaebcc6, transparent: true, opacity: 0.2, roughness: 0.1, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 });
    M.winWarm = new THREE.MeshBasicMaterial({ map: T.winWarm, color: 0xe2d6c4 });
    M.winWarm2 = new THREE.MeshBasicMaterial({ map: T.winWarm2, color: 0xe2d6c4 });
    M.winDark = new THREE.MeshStandardMaterial({ map: T.winDark, roughness: 0.18, metalness: 0.45, envMapIntensity: 1.8 });
    M.winGreen = new THREE.MeshBasicMaterial({ map: T.winGreen, color: 0xd8ffd8 });
    M.winMeshWarm = new THREE.MeshBasicMaterial({ map: T.winMeshWarm, color: 0xe9ddc9 });
    M.winMeshGreen = new THREE.MeshBasicMaterial({ map: T.winMeshGreen, color: 0xd6e8d2 });
    M.winMeshDark = new THREE.MeshBasicMaterial({ map: T.winMeshDark, color: 0xe2ebf0 });
    M.notice = new THREE.MeshBasicMaterial({ map: T.notice, color: 0xd8cfc0 });
    M.vending = new THREE.MeshBasicMaterial({ map: T.vending, color: 0xffffff });
    M.schoolSign = new THREE.MeshBasicMaterial({ map: T.school, color: 0xe4ded0, side: THREE.DoubleSide });
    M.hallSign = new THREE.MeshBasicMaterial({ map: T.hall, color: 0xc9d1d5, side: THREE.DoubleSide });
    M.paving = new THREE.MeshStandardMaterial({
      map: T.concrete, bumpMap: T.concreteBump, bumpScale: 0.04,
      roughness: 0.58, metalness: 0.08, color: 0xb9bdbd, envMapIntensity: 1.5
    });
    M.court = new THREE.MeshPhysicalMaterial({
      map: T.asphalt, roughnessMap: T.asphaltRough, bumpMap: T.asphalt, bumpScale: 0.022,
      roughness: 0.5, metalness: 0.16, color: 0x5d646c, envMapIntensity: 2.4,
      clearcoat: 0.82, clearcoatRoughness: 0.15
    });
    M.courtLine = new THREE.MeshStandardMaterial({ color: 0xd9d8ce, roughness: 0.86, metalness: 0.0, transparent: true, opacity: 0.55 });
    M.canopy = new THREE.MeshStandardMaterial({
      map: T.concrete, bumpMap: T.concreteBump, bumpScale: 0.035,
      roughness: 0.5, metalness: 0.12, color: 0xb4b8b8, envMapIntensity: 1.4
    });
    M.kerb = new THREE.MeshStandardMaterial({ color: 0x9aa0a1, roughness: 0.68, metalness: 0.05 });
    M.tagRed = new THREE.MeshStandardMaterial({ color: 0xa2352f, roughness: 0.8, side: THREE.DoubleSide });
    M.tagBlue = new THREE.MeshStandardMaterial({ color: 0x2f5a8a, roughness: 0.8, side: THREE.DoubleSide });
    M.tagWhite = new THREE.MeshStandardMaterial({ color: 0xd6d3c6, roughness: 0.8, side: THREE.DoubleSide });
    M.fluorPool = new THREE.MeshBasicMaterial({ map: T.pool, color: 0xa8d6a8, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    M.doorBlue = new THREE.MeshStandardMaterial({ map: T.doorBlue, roughness: 0.66, metalness: 0.05 });
    M.doorRed = new THREE.MeshStandardMaterial({ map: T.doorRed, roughness: 0.66, metalness: 0.05 });
    M.doorGreen = new THREE.MeshStandardMaterial({ map: T.doorGreen, roughness: 0.66, metalness: 0.05 });
    M.hedge = new THREE.MeshStandardMaterial({ color: 0x1e2a1c, roughness: 0.95 });
    M.soil = new THREE.MeshStandardMaterial({ color: 0x1b1a16, roughness: 1.0 });
    M.whitePaint = new THREE.MeshStandardMaterial({ color: 0xaaa89d, roughness: 0.95, metalness: 0.0, transparent: true, opacity: 0.36 });
    M.yellowPaint = new THREE.MeshStandardMaterial({ color: 0xb39435, roughness: 0.84, metalness: 0.0 });
    M.tar = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.55, metalness: 0.1, envMapIntensity: 1.0 });
    M.puddle = new THREE.MeshPhysicalMaterial({ color: 0x0a0e14, roughness: 0.035, metalness: 0.62, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 3.4 });
    M.pool = new THREE.MeshBasicMaterial({ map: T.pool, color: 0xffb066, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    M.spill = new THREE.MeshBasicMaterial({ map: T.pool, color: 0xffd0a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    M.lampWash = new THREE.MeshBasicMaterial({ map: T.pool, color: 0xffb060, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    M.lampHead = new THREE.MeshBasicMaterial({ color: 0xffc98c });
    M.fluoro = new THREE.MeshBasicMaterial({ color: 0xc4e2c2 });
    M.tape = new THREE.MeshStandardMaterial({ map: T.tape, roughness: 0.7, side: THREE.DoubleSide, color: 0xd9dbe0 });
    M.cafe = new THREE.MeshBasicMaterial({ map: T.cafe, color: 0xc9bb9b, side: THREE.DoubleSide });
    M.shop = new THREE.MeshBasicMaterial({ map: T.shop, color: 0xb9c0c3, side: THREE.DoubleSide });
    M.wood = new THREE.MeshStandardMaterial({ color: 0x3d2d20, roughness: 0.88 });
    M.binGreen = new THREE.MeshStandardMaterial({ color: 0x7fa886, roughness: 0.34, metalness: 0.1 });
    M.binDark = new THREE.MeshStandardMaterial({ color: 0x46524e, roughness: 0.32, metalness: 0.16 });
    M.binLid = new THREE.MeshStandardMaterial({ color: 0x9aa8a3, roughness: 0.3, metalness: 0.15 });
    M.cone = new THREE.MeshStandardMaterial({ color: 0xb4512e, roughness: 0.72 });
    M.coneBand = new THREE.MeshStandardMaterial({ color: 0xd7d8d2, roughness: 0.4 });
    M.binLabel = new THREE.MeshBasicMaterial({ map: T.binLabel, color: 0xffffff });
    M.postbox = new THREE.MeshStandardMaterial({ color: 0x8e1f1c, roughness: 0.48, metalness: 0.12 });
    M.soil = new THREE.MeshStandardMaterial({ color: 0x191714, roughness: 1 });
    M.grime = new THREE.MeshBasicMaterial({ map: T.grime, transparent: true, depthWrite: false });
    M.aoL = new THREE.MeshBasicMaterial({ map: T.aoL, transparent: true, depthWrite: false });
    M.aoR = new THREE.MeshBasicMaterial({ map: T.aoR, transparent: true, depthWrite: false });
    return M;
  }

  function prism(w, h, len) {
    const hw = w / 2, hl = len / 2;
    const p = [
      -hw, 0, -hl, hw, 0, -hl, 0, h, -hl,
      -hw, 0, hl, hw, 0, hl, 0, h, hl
    ];
    const idx = [0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const uv = new Float32Array(12);
    for (let i = 0; i < 12; i += 2) { uv[i] = i % 4 === 0 ? 0 : 1; uv[i + 1] = i % 4 === 2 ? 1 : 0; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g.toNonIndexed();
  }

  function scaleUV(g, su, sv) {
    const a = g.attributes.uv;
    if (!a) return g;
    for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv);
    a.needsUpdate = true;
    return g;
  }

  function xform(g, x, y, z, rx, ry, rz) {
    const m = new THREE.Matrix4();
    const e = new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ');
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    return g;
  }

  function build(scene, renderer) {
    const T = makeTextures(renderer);
    const M = makeMaterials(T);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.background = T.sky;
    scene.environment = pmrem.fromEquirectangular(T.sky).texture;
    scene.environmentIntensity = 0.62;
    pmrem.dispose();

    scene.fog = new THREE.FogExp2(0x3a4753, 0.0062);

    const SPAN = 1200;
    const chunks = new Map();
    function chunkAt(z) {
      const k = Math.floor((Z0 - z) / SPAN);
      let c = chunks.get(k);
      if (!c) { c = { buckets: new Map(), z }; chunks.set(k, c); }
      return c;
    }
    function push(chunk, mat, geo) {
      let arr = chunk.buckets.get(mat);
      if (!arr) { arr = []; chunk.buckets.set(mat, arr); }
      arr.push(geo);
    }
    function box(mat, w, h, d, x, y, z, ry, tile) {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      if (tile) scaleUV(g, Math.max(w, d) / tile, h / tile);
      xform(g, x, y, z, 0, ry || 0, 0);
      push(chunkAt(z), mat, g);
    }
    function plane(mat, w, h, x, y, z, rx, ry, rz, tileW, tileH) {
      const g = new THREE.PlaneGeometry(w, h).toNonIndexed();
      if (tileW) scaleUV(g, w / tileW, h / (tileH || tileW));
      xform(g, x, y, z, rx || 0, ry || 0, rz || 0);
      push(chunkAt(z), mat, g);
    }
    function cyl(mat, rt, rb, h, x, y, z, rx, rz, seg) {
      const g = new THREE.CylinderGeometry(rt, rb, h, seg || 8, 1).toNonIndexed();
      xform(g, x, y, z, rx || 0, 0, rz || 0);
      push(chunkAt(z), mat, g);
    }

    const lamps = [];
    const litWindows = [];
    const porchPos = [];
    const glowPos = [];
    const R = rng(20261109);

    const FX = 8.18;
    const WRIGHT = 6.34;
    const WLEFT = -6.34;
    const FENCE_X = -7.47;

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c1013, roughness: 1 });
    const base = new THREE.Mesh(new THREE.PlaneGeometry(280, 1180), groundMat);
    base.rotation.x = -Math.PI / 2;
    base.position.set(-8, -0.07, -480);
    base.receiveShadow = true;
    scene.add(base);

    for (let z = Z0; z > Z1; z -= SPAN) {
      const zEnd = Math.max(Z1, z - SPAN);
      const len = z - zEnd;
      const cz = (z + zEnd) / 2;

      plane('court', 10.4, len, 0, 0.001, cz, -Math.PI / 2, 0, 0, 2.6, 2.6);
      plane('paving', WALK_W, len, WRIGHT, 0.17, cz, -Math.PI / 2, 0, 0, 1.9, 1.9);
      plane('paving', WALK_W, len, WLEFT, 0.17, cz, -Math.PI / 2, 0, 0, 1.9, 1.9);
      plane('aoR', WALK_W, len, WRIGHT + 0.62, 0.176, cz, -Math.PI / 2, 0, 0, WALK_W, len);
      plane('aoL', WALK_W, len, WLEFT - 0.62, 0.176, cz, -Math.PI / 2, 0, 0, WALK_W, len);
      box('kerb', 0.24, 0.2, len, 5.32, 0.1, cz, 0, 1.6);
      box('kerb', 0.24, 0.2, len, -5.32, 0.1, cz, 0, 1.6);

      for (const lx of [-3.9, 3.9]) {
        plane('courtLine', 0.08, len, lx, 0.007, cz, -Math.PI / 2, 0, 0, 2, 2);
      }
      for (let zz = zEnd + 8; zz < z; zz += 24) {
        plane('courtLine', 8.0, 0.08, 0, 0.007, zz, -Math.PI / 2, 0, 0, 2, 2);
      }
      for (let zz = zEnd + 20; zz < z; zz += 48) {
        const ring = new THREE.RingGeometry(2.18, 2.26, 40, 1).toNonIndexed();
        xform(ring, 0, 0.0075, zz, -Math.PI / 2, 0, 0);
        push(chunkAt(zz), 'courtLine', ring);
      }
      for (let zz = zEnd + 5; zz < z; zz += 19) {
        const w = 0.15 + R() * 0.4;
        plane('tar', 5.6 + R() * 3, w, (R() - 0.5) * 2, 0.006, zz + R() * 3, -Math.PI / 2, 0, (R() - 0.5) * 0.06, 4, 4);
      }
      for (let zz = zEnd + 10; zz < z; zz += 27) {
        for (const sx of [-4.9, 4.9]) {
          if (R() > 0.55) {
            const g = new THREE.CircleGeometry(0.3, 10).toNonIndexed();
            xform(g, sx * (0.9 + R() * 0.1), 0.01, zz + R() * 8, -Math.PI / 2, 0, 0);
            push(chunkAt(zz), 'darkMetal', g);
          }
        }
      }

      plane('court', 24.2, len, -19.7, 0.002, cz, -Math.PI / 2, 0, 0, 3.4, 3.4);
      for (const lx of [-11.2, -28.2]) {
        plane('courtLine', 0.08, len, lx, 0.007, cz, -Math.PI / 2, 0, 0, 2, 2);
      }
      for (let zz = zEnd + 14; zz < z; zz += 26) {
        plane('courtLine', 16.9, 0.08, -19.7, 0.007, zz, -Math.PI / 2, 0, 0, 2, 2);
      }

      const puddles = Math.max(6, Math.round(len / 22));
      for (let i = 0; i < puddles; i++) {
        const zz = zEnd + 6 + R() * Math.max(1, len - 10);
        const xx = (R() - 0.5) * 8.4;
        const g = new THREE.CircleGeometry(0.5 + R() * 1.3, 12).toNonIndexed();
        g.scale(1.5 + R() * 1.5, 1, 0.65 + R() * 0.8);
        xform(g, xx, 0.012, zz, -Math.PI / 2, 0, R() * 3);
        push(chunkAt(zz), 'puddle', g);
      }
    }

    const BAY = 7.0;
    for (let z = Z0 - 3.5; z > Z1; z -= BAY) {
      const i = Math.round((Z0 - z) / BAY);
      let facadeMat = 'brick';
      if (i % 11 === 0) facadeMat = 'brickBrown';
      else if (i % 9 === 4) facadeMat = 'render';
      else if (i % 7 === 2) facadeMat = 'brickLight';
      else if (i % 5 === 1) facadeMat = 'brickBrown';

      box('brickDark', 7.0, 9.0, BAY + 0.02, 11.8, 4.5, z, 0, 1.6);
      plane(facadeMat, BAY, 9.0, FX, 4.5, z, 0, -Math.PI / 2, 0, 1.55, 1.55);
      plane('grime', BAY, 2.5, FX - 0.012, 1.25, z, 0, -Math.PI / 2, 0, BAY, 2.5);

      box('brick', 0.34, 9.0, 0.5, FX - 0.14, 4.5, z - BAY / 2, 0, 1.2);
      box('brick', 0.34, 9.0, 0.5, FX - 0.14, 4.5, z + BAY / 2, 0, 1.2);
      box('trim', 0.2, 0.22, BAY, FX - 0.12, 4.28, z, 0, 1.2);
      box('trim', 0.28, 0.22, BAY, FX - 0.16, 8.95, z, 0, 1.2);
      box('brick', 0.4, 0.42, BAY, FX - 0.24, 9.22, z, 0, 1.2);
      box('trim', 0.5, 0.14, BAY, FX - 0.3, 9.48, z, 0, 1.2);

      if (i % 8 === 3) {
        plane('winMeshDark', 4.4, 3.4, FX - 0.02, 6.0, z, 0, -Math.PI / 2, 0, 4.4, 3.4);
        box('trim', 0.16, 0.22, 4.9, FX - 0.05, 4.18, z, 0, 1);
        box('trim', 0.16, 0.2, 4.8, FX - 0.05, 7.82, z, 0, 1);
        box('trim', 0.14, 3.6, 0.16, FX - 0.05, 6.0, z - 2.32, 0, 1);
        box('trim', 0.14, 3.6, 0.16, FX - 0.05, 6.0, z + 2.32, 0, 1);
        box('brickDark', 0.2, 1.6, 3.8, FX - 0.14, 1.5, z, 0, 1.2);
      } else {
        for (const dz of [-1.72, 1.72]) {
          const warm = R() > 0.72;
          const green = !warm && R() > 0.42;
          const upMat = warm ? (R() > 0.5 ? 'winMeshWarm' : 'winMeshGreen') : green ? 'winMeshGreen' : 'winMeshDark';
          plane(upMat, 1.48, 2.6, FX - 0.02, 6.18, z + dz, 0, -Math.PI / 2, 0, 1.48, 2.6);
          box('trim', 0.18, 0.22, 1.85, FX - 0.07, 4.78, z + dz, 0, 1);
          box('trim', 0.16, 0.2, 1.78, FX - 0.07, 7.56, z + dz, 0, 1);
          box('trim', 0.14, 2.75, 0.14, FX - 0.06, 6.18, z + dz - 0.81, 0, 1);
          box('trim', 0.14, 2.75, 0.14, FX - 0.06, 6.18, z + dz + 0.81, 0, 1);
          if (upMat !== 'winMeshDark') {
            plane('spill', 2.5, 3.3, FX - 0.005, 6.1, z + dz, 0, -Math.PI / 2, 0, 2, 2);
            litWindows.push({ x: FX, y: 6.18, z: z + dz, side: 1 });
            glowPos.push(FX - 0.1, 6.18, z + dz);
          }
          const lowMat = R() > 0.46 ? (R() > 0.5 ? 'winMeshWarm' : 'winMeshGreen') : 'winMeshDark';
          plane(lowMat, 1.36, 1.62, FX - 0.02, 2.18, z + dz, 0, -Math.PI / 2, 0, 1.36, 1.62);
          box('trim', 0.18, 0.2, 1.72, FX - 0.07, 1.3, z + dz, 0, 1);
          box('trim', 0.16, 0.18, 1.66, FX - 0.07, 3.02, z + dz, 0, 1);
          if (lowMat !== 'winMeshDark') {
            plane('spill', 2.2, 2.2, FX - 0.005, 2.1, z + dz, 0, -Math.PI / 2, 0, 2, 2);
            plane('lampWash', 2.6, 2.6, WRIGHT + 0.2, 0.183, z + dz, -Math.PI / 2, 0, 0, 2, 2);
          }
        }
      }

      plane('lampWash', BAY, 8.6, FX - 0.045, 4.3, z, 0, -Math.PI / 2, 0, 4.8, 5.2);
      box('canopy', 2.9, 0.16, BAY, 6.72, 3.28, z, 0, 2.0);
      box('trimDark', 0.1, 0.26, BAY, 5.3, 3.3, z, 0, 1);
      cyl('darkMetal', 0.055, 0.078, 3.2, 5.46, 1.6, z - 3.0, 0, 0, 8);
      cyl('darkMetal', 0.055, 0.078, 3.2, 5.46, 1.6, z + 3.0, 0, 0, 8);
      box('fluoro', 0.07, 0.05, 6.4, 7.35, 3.17, z, 0, 1);
      plane('fluorPool', 2.0, 6.2, 6.65, 0.184, z, -Math.PI / 2, 0, 0, 2, 2);
      cyl('darkMetal', 0.045, 0.055, 8.9, FX - 0.12, 4.45, z + 3.36, 0, 0, 6);

      if (i % 3 === 1) {
        const dz = z + 1.9;
        plane('doorBlue', 0.94, 2.12, FX - 0.02, 1.23, dz, 0, -Math.PI / 2, 0, 0.94, 2.12);
        box('trim', 0.16, 0.24, 1.36, FX - 0.08, 2.38, dz, 0, 1);
        box('trim', 0.12, 2.3, 0.1, FX - 0.06, 1.22, dz - 0.52, 0, 1);
        box('trim', 0.12, 2.3, 0.1, FX - 0.06, 1.22, dz + 0.52, 0, 1);
        box('trimDark', 0.26, 0.06, 1.45, FX - 0.2, 0.19, dz, 0, 1);
        plane('spill', 1.7, 1.9, FX - 0.005, 1.3, dz, 0, -Math.PI / 2, 0, 2, 2);
      }
      if (i % 4 === 2) {
        const nz = z - 1.8;
        box('wood', 0.09, 1.08, 1.72, FX - 0.18, 1.86, nz, 0, 1);
        plane('notice', 1.56, 0.96, FX - 0.24, 1.86, nz, 0, -Math.PI / 2, 0, 1.56, 0.96);
      }
      if (i % 4 === 1) {
        box('darkMetal', 1.3, 0.62, 0.9, 11.4, 9.75, z + 0.6, 0, 1);
        box('trimDark', 0.5, 0.3, 0.5, 12.6, 9.6, z - 1.2, 0, 1);
      }
      if (i % 6 === 0) {
        box('darkMetal', 0.34, 0.1, 0.22, FX - 0.28, 3.6, z + 2.2, 0, 1);
        plane('lampHead', 0.28, 0.16, FX - 0.32, 3.53, z + 2.2, Math.PI / 2, 0, 0, 1, 1);
        plane('lampWash', 4.6, 5.2, FX - 0.04, 3.3, z + 2.2, 0, -Math.PI / 2, 0, 4.8, 5.2);
      }
      if (i % 3 === 1) {
        plane('fluorPool', 4.4, 2.7, FX - 0.05, 2.15, z + 1.6, 0, -Math.PI / 2, 0, 2, 2);
      }
      if (i % 8 === 5 || i === 9) {
        plane(['cafe', 'shop', 'schoolSign'][i % 3], 3.0, 0.64, FX - 0.05, 3.7, z, 0, -Math.PI / 2, 0, 3.0, 0.64);
      }
      if (i % 10 === 7) {
        const g = new THREE.PlaneGeometry(2.5, 0.56).toNonIndexed();
        xform(g, 6.72, 2.92, z + BAY / 2, 0, 0, 0);
        push(chunkAt(z), 'shop', g);
      }
      if (i === 13 || i === 58 || i === 103) {
        plane('schoolSign', 3.6, 0.76, FX - 0.05, 8.1, z, 0, -Math.PI / 2, 0, 3.6, 0.76);
      }
      if (Math.abs(z + 40.5) < 3.6) {
        box('darkMetal', 0.78, 1.92, 1.0, FX - 0.55, 1.15, z, 0, 1);
        plane('vending', 0.92, 1.5, FX - 0.95, 1.28, z, 0, -Math.PI / 2, 0, 0.92, 1.5);
        plane('fluorPool', 2.4, 3.2, FX - 1.6, 0.184, z, -Math.PI / 2, 0, 0, 2, 2);
      }
      if (Math.abs(z + 34) < 3.6) {
        for (let k = 0; k < 3; k++) {
          const bz = z - 2 + k * 1.7;
          cyl('darkMetal', 0.035, 0.035, 0.78, 7.05, 0.55, bz - 0.34, 0, 0, 6);
          cyl('darkMetal', 0.035, 0.035, 0.78, 7.05, 0.55, bz + 0.34, 0, 0, 6);
          cyl('darkMetal', 0.035, 0.035, 0.7, 7.05, 0.95, bz, Math.PI / 2, 0, 6);
        }
      }

      if (i % 3 === 2) {
        const bm = ['schoolSign', 'cafe', 'shop'][Math.floor(i / 3) % 3];
        box('darkMetal', 1.9, 0.08, 0.08, FX - 0.95, 6.02, z, 0, 1);
        plane(bm, 2.3, 0.72, FX - 1.35, 5.55, z, 0, 0, 0, 2.3, 0.72);
        plane('lampWash', 3.4, 2.0, FX - 1.35, 5.55, z - 0.02, 0, 0, 0, 2, 2);
      }
      if (i % 9 === 4) {
        const bz = z - 1.5;
        cyl('darkMetal', 0.12, 0.14, 7.0, -12.1, 3.5, bz + 2.55, 0, 0, 8);
        cyl('darkMetal', 0.12, 0.14, 7.0, -9.0, 3.5, bz - 2.55, 0, 0, 8);
        box('darkMetal', 6.7, 2.4, 0.2, -10.74, 8.0, bz - 0.12, Math.PI / 2 - 0.55, 1);
        plane(i % 18 === 4 ? 'hallSign' : 'schoolSign', 6.4, 2.1, -10.55, 8.0, bz, 0, Math.PI / 2 - 0.55, 0, 6.4, 2.1);
      }
      const gateBay = i % 27 === 0 || i === 8;
      if (!gateBay) {
        plane('chain', BAY, 2.6, FENCE_X, 1.93, z, 0, Math.PI / 2, 0, 3.2, 1.4);
        box('brick', 0.36, 0.6, BAY, FENCE_X, 0.3, z, 0, 1.2);
        box('trim', 0.44, 0.08, BAY, FENCE_X, 0.64, z, 0, 1.2);
        cyl('darkMetal', 0.05, 0.062, 3.34, FENCE_X, 1.67, z - BAY / 2, 0, 0, 8);
        cyl('darkMetal', 0.05, 0.062, 3.34, FENCE_X, 1.67, z + BAY / 2, 0, 0, 8);
        cyl('darkMetal', 0.028, 0.028, BAY, FENCE_X, 3.3, z, Math.PI / 2, 0, 6);
        if (R() > 0.48) {
          const tag = R() > 0.62 ? 'tagRed' : (R() > 0.5 ? 'tagBlue' : 'tagWhite');
          plane(tag, 0.3, 0.2, FENCE_X + 0.02, 1.2 + R() * 1.8, z + (R() - 0.5) * 5.4, 0, Math.PI / 2, (R() - 0.5) * 0.5, 1, 1);
        }
      } else {
        for (const gz of [z - BAY / 2, z + BAY / 2]) {
          box('brick', 0.74, 3.7, 0.74, FENCE_X, 1.85, gz, 0, 1.2);
          box('trim', 0.9, 0.16, 0.9, FENCE_X, 3.76, gz, 0, 1);
        }
        const leaf = (xx, zz, ry) => {
          const g = new THREE.PlaneGeometry(2.9, 2.5).toNonIndexed();
          scaleUV(g, 1.4, 1.1);
          xform(g, xx, 1.32, zz, 0, ry, 0);
          push(chunkAt(zz), 'iron', g);
        };
        leaf(FENCE_X - 1.0, z - BAY / 2 + 1.2, Math.PI / 2 - 0.5);
        leaf(FENCE_X - 1.0, z + BAY / 2 - 1.2, Math.PI / 2 + 0.5);
        plane('cafe', 1.5, 0.4, FENCE_X + 0.04, 3.0, z - BAY / 2, 0, Math.PI / 2, 0, 1.5, 0.4);
      }
      if (i % 13 === 5) {
        const bz = z + 0.8;
        for (let k = 0; k < 3; k++) box('wood', 0.5, 0.06, 1.9, WLEFT - 0.1 + (k - 1) * 0.16, 0.52, bz, 0, 1);
        box('wood', 0.06, 0.42, 1.9, WLEFT - 0.34, 0.78, bz, 0, 1);
        for (const s of [-1, 1]) box('darkMetal', 0.5, 0.46, 0.08, WLEFT - 0.05, 0.26, bz + s * 0.82, 0, 1);
      }
      if (i % 17 === 7) {
        const bz = z + 0.9;
        for (let k = 0; k < 3; k++) box('wood', 0.5, 0.06, 1.9, WRIGHT + 0.9 + (k - 1) * 0.16, 0.52, bz, 0, 1);
        box('wood', 0.06, 0.42, 1.9, WRIGHT + 1.14, 0.78, bz, 0, 1);
        for (const s2 of [-1, 1]) box('darkMetal', 0.5, 0.46, 0.08, WRIGHT + 0.95, 0.26, bz + s2 * 0.82, 0, 1);
      }
      if (i % 11 === 3) {
        const bx = WLEFT + 0.2;
        const bz = z - 1.3;
        box('binGreen', 0.64, 0.94, 0.68, bx, 0.64, bz, 0, 1);
        box('binLid', 0.7, 0.09, 0.74, bx, 1.16, bz, 0, 1);
        box('binLid', 0.2, 0.05, 0.06, bx, 1.24, bz + 0.16, 0, 1);
        plane('binLabel', 0.33, 0.24, bx + 0.33, 0.78, bz, 0, Math.PI / 2, 0, 1, 1);
      }
      if (i % 3 === 1) {
        const tz = z - 1.2;
        cyl('darkMetal', 0.07, 0.09, 6.4, WLEFT + 0.3, 3.37, tz, 0, 0, 8);
        cyl('darkMetal', 0.055, 0.055, 1.55, WLEFT + 0.95, 6.44, tz, 0, -1.16, 8);
        box('darkMetal', 0.5, 0.16, 0.3, WLEFT + 1.63, 6.33, tz, 0, 1);
        plane('lampHead', 0.34, 0.22, WLEFT + 1.63, 6.23, tz, Math.PI / 2, 0, 0, 1, 1);
        lamps.push({ x: WLEFT + 1.63, y: 6.15, z: tz, side: -1 });
        plane('pool', 5.6, 8.0, WLEFT + 2.7, 0.016, tz + 2.2, -Math.PI / 2, 0, 0, 2, 2);
        plane('pool', 2.0, 13.0, WLEFT + 2.2, 0.017, tz + 8.0, -Math.PI / 2, 0, 0, 2, 2);
        plane('lampWash', 4.8, 5.4, FENCE_X + 0.02, 3.4, tz, 0, Math.PI / 2, 0, 4.8, 5.4);
      }

      box('brickDark', 9.0, 5.6, BAY + 0.02, -42.0, 2.8, z, 0, 1.6);
      plane('brick', BAY, 5.6, -37.48, 2.8, z, 0, Math.PI / 2, 0, 1.55, 1.55);
      box('trim', 0.24, 0.18, BAY, -37.4, 5.46, z, 0, 1.2);
      box('brick', 0.4, 0.34, BAY, -37.52, 5.72, z, 0, 1.2);
      if (i % 3 === 0) {
        plane(R() > 0.78 ? 'winMeshWarm' : 'winMeshDark', 1.7, 1.7, -37.42, 3.55, z + 1.2, 0, Math.PI / 2, 0, 1.7, 1.7);
      }
      plane('chain', BAY, 2.5, -31.95, 1.42, z, 0, Math.PI / 2, 0, 3.2, 1.4);
      cyl('darkMetal', 0.045, 0.055, 2.7, -31.95, 1.35, z - BAY / 2, 0, 0, 6);
      cyl('darkMetal', 0.045, 0.055, 2.7, -31.95, 1.35, z + BAY / 2, 0, 0, 6);
      if (i % 18 === 0) {
        plane('hallSign', 3.2, 0.75, -37.42, 4.7, z, 0, Math.PI / 2, 0, 3.2, 0.75);
      }
      if (Math.abs(z + 110) < 3.6 || Math.abs(z + 610) < 3.6) {
        cyl('darkMetal', 0.08, 0.09, 3.6, -10.2, 1.8, z, 0, 0, 8);
        cyl('darkMetal', 0.06, 0.06, 1.3, -9.7, 3.5, z, 0, Math.PI / 2, 6);
        box('trim', 0.06, 0.85, 1.25, -9.05, 3.55, z, 0, 1);
        const ring = new THREE.TorusGeometry(0.24, 0.028, 6, 14).toNonIndexed();
        xform(ring, -8.72, 3.22, z, Math.PI / 2, 0, 0);
        push(chunkAt(z), 'trimDark', ring);
      }
    }

    function schoolEntrance(z) {
      plane('winDark', 2.4, 2.5, FX - 0.02, 1.5, z, 0, -Math.PI / 2, 0, 1, 1);
      plane('doorBlue', 0.92, 2.12, FX - 0.03, 1.23, z - 0.52, 0, -Math.PI / 2, 0, 0.92, 2.12);
      plane('doorBlue', 0.92, 2.12, FX - 0.03, 1.23, z + 0.52, 0, -Math.PI / 2, 0, 0.92, 2.12);
      box('trim', 0.2, 0.3, 2.9, FX - 0.1, 2.55, z, 0, 1);
      box('trim', 0.7, 0.16, 3.2, FX - 0.45, 0.18, z, 0, 1);
      box('trim', 0.6, 0.16, 3.0, FX - 0.55, 0.34, z, 0, 1);
      box('darkMetal', 0.1, 0.1, 2.8, FX - 0.16, 2.76, z, 0, 1);
      plane('schoolSign', 2.1, 0.5, FX - 0.05, 3.62, z, 0, -Math.PI / 2, 0, 2.1, 0.5);
      plane('spill', 3.0, 2.8, FX - 0.9, 0.185, z, -Math.PI / 2, 0, 0, 2, 2);
    }
    schoolEntrance(-54.5);

    function bikeShelter(z) {
      const x = -6.42;
      for (const dz of [-2.0, 2.0]) {
        cyl('darkMetal', 0.06, 0.06, 2.6, x - 0.9, 1.32, z + dz, 0, 0, 8);
        cyl('darkMetal', 0.06, 0.06, 2.6, x + 0.9, 1.32, z + dz, 0, 0, 8);
      }
      box('darkMetal', 2.2, 0.1, 4.8, x, 2.68, z, 0, 1);
      plane('glass', 2.1, 4.4, x, 2.62, z, -Math.PI / 2, 0, 0, 1, 1);
      box('wood', 0.42, 0.08, 3.0, x + 0.6, 0.66, z, 0, 1);
      box('fluoro', 1.8, 0.05, 0.08, x, 2.55, z, 0, 1);
      plane('fluorPool', 2.8, 5.4, x, 0.185, z, -Math.PI / 2, 0, 0, 2, 2);
      for (let k = -1; k <= 1; k++) {
        const bz = z + k * 1.2;
        cyl('darkMetal', 0.032, 0.032, 0.72, x - 0.3, 0.54, bz - 0.3, 0, 0, 6);
        cyl('darkMetal', 0.032, 0.032, 0.72, x - 0.3, 0.54, bz + 0.3, 0, 0, 6);
        cyl('darkMetal', 0.032, 0.032, 0.64, x - 0.3, 0.9, bz, Math.PI / 2, 0, 6);
      }
    }
    bikeShelter(-128);

    const farGeos = [];
    for (let i = 0; i < 16; i++) {
      const g = new THREE.BoxGeometry(9 + (i % 3) * 4, 9 + (i % 5) * 4, 12).toNonIndexed();
      xform(g, -66 + i * 8.6, 6, -1008 - (i % 3) * 15, 0, (i % 2) * 0.24, 0);
      farGeos.push(g);
    }
    if (farGeos.length) {
      const merged = THREE.mergeGeometries(farGeos, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, M.brickDark);
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
      }
      farGeos.forEach((g) => g.dispose());
    }

    const coneGeos = [];
    for (const l of lamps) {
      const g = new THREE.CylinderGeometry(0.18, 2.2, 5.6, 8, 1, true).toNonIndexed();
      xform(g, l.x, 2.86, l.z, 0, 0, 0);
      coneGeos.push(g);
    }
    if (coneGeos.length) {
      const merged = THREE.mergeGeometries(coneGeos, false);
      if (merged) {
        const coneMat = new THREE.MeshBasicMaterial({
          map: T.cone, color: 0xffb066, transparent: true, opacity: 0.4,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });
        const coneMesh = new THREE.Mesh(merged, coneMat);
        coneMesh.renderOrder = 3;
        scene.add(coneMesh);
      }
      coneGeos.forEach((g) => g.dispose());
    }

    for (const [k, chunk] of chunks) {
      for (const [mat, geos] of chunk.buckets) {
        if (!geos.length) continue;
        const merged = THREE.mergeGeometries(geos, false);
        if (!merged) { console.warn('merge failed', mat); continue; }
        const mesh = new THREE.Mesh(merged, M[mat]);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        scene.add(mesh);
        for (const g of geos) g.dispose();
      }
      chunk.buckets.clear();
    }

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3));
    const glowMat = new THREE.PointsMaterial({
      map: T.glow, color: 0xffa14e, size: 1.2, sizeAttenuation: true,
      transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
      depthWrite: false, alphaTest: 0.01
    });
    const glows = new THREE.Points(glowGeo, glowMat);
    glows.frustumCulled = false;
    scene.add(glows);

    const lampGlows = [];
    for (const l of lamps) lampGlows.push(l.x, l.y, l.z);
    const lampGlowGeo = new THREE.BufferGeometry();
    lampGlowGeo.setAttribute('position', new THREE.Float32BufferAttribute(lampGlows, 3));
    const lampGlowMat = new THREE.PointsMaterial({
      map: T.glow, color: 0xffa14e, size: 3.4, sizeAttenuation: true,
      transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending,
      depthWrite: false, alphaTest: 0.01
    });
    const lampGlowPts = new THREE.Points(lampGlowGeo, lampGlowMat);
    lampGlowPts.frustumCulled = false;
    scene.add(lampGlowPts);

    const porch = new THREE.BufferGeometry();
    porch.setAttribute('position', new THREE.Float32BufferAttribute(porchPos, 3));
    const porchPts = new THREE.Points(porch, new THREE.PointsMaterial({
      map: T.glow, color: 0xffc27d, size: 0.8, sizeAttenuation: true,
      transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    porchPts.frustumCulled = false;
    scene.add(porchPts);

    return { T, M, restyle: (theme) => restyle({ T, M }, theme), lamps, chunks: chunks.size, litWindows, bounds: { Z0, Z1, ROAD_HALF, WALK_W } };
  }

  return { build };
})();
