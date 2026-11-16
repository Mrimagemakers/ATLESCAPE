// ATL Nightclub Mogul: the venue video walls. Show the built-in visuals, an image or video link, or your own upload.
// The choice is kept on this device (link in localStorage, uploaded file in IndexedDB) and shows in every venue.
import * as T from 'three';

const KEY = 'atl-screens-v1';
const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || {mode: 'default'}; }catch(e){ return {mode: 'default'}; } };
const save = s => { try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} };

/* uploaded files live in IndexedDB so they survive a reload */
function db(){ return new Promise((ok, no) => { const r = indexedDB.open('atl-screens', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); }
async function putFile(file){ const d = await db(); return new Promise((ok, no) => { const tx = d.transaction('files', 'readwrite'); tx.objectStore('files').put(file, 'upload'); tx.oncomplete = ok; tx.onerror = () => no(tx.error); }); }
async function getFile(){ const d = await db(); return new Promise((ok, no) => { const r = d.transaction('files').objectStore('files').get('upload'); r.onsuccess = () => ok(r.result || null); r.onerror = () => no(r.error); }); }

let screens = [], source = null, video = null, objectURL = null, status = () => {};
const isVideo = (url, type) => (type && type.startsWith('video/')) || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
const isPage = url => /(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com)/i.test(url);

function fit(tex, scr){
  const img = tex.image, iw = img.videoWidth || img.width || 16, ih = img.videoHeight || img.height || 9;
  const p = scr.mesh.geometry.parameters, sa = p.width/p.height, ia = iw/ih;
  const t = tex.clone(); t.needsUpdate = true; t.colorSpace = T.SRGBColorSpace;
  if (ia > sa){ t.repeat.set(sa/ia, 1); t.offset.set((1 - sa/ia)/2, 0); } else { t.repeat.set(1, ia/sa); t.offset.set(0, (1 - ia/sa)/2); }
  return t;
}
function show(tex){
  for (const s of screens){ if (s.map && s.map !== s.own) s.map.dispose(); s.map = tex ? fit(tex, s) : s.own; s.mat.map = s.map; s.mat.needsUpdate = true; s.custom = !!tex; }
}
function stopVideo(){ if (video){ video.pause(); video.removeAttribute('src'); video.load(); video = null; } if (objectURL){ URL.revokeObjectURL(objectURL); objectURL = null; } source = null; }

function useURL(url, type){
  return new Promise((ok, no) => {
    if (isVideo(url, type)){
      const v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.loop = true; v.muted = !load().sound; v.playsInline = true; v.src = url;
      v.addEventListener('loadeddata', () => { video = v; source = new T.VideoTexture(v); source.colorSpace = T.SRGBColorSpace; v.play().catch(() => {}); ok(source); }, {once: true});
      v.addEventListener('error', () => no(new Error('video')), {once: true});
    } else {
      new T.TextureLoader().setCrossOrigin('anonymous').load(url, t => { source = t; ok(t); }, undefined, () => no(new Error('image')));
    }
  });
}
async function apply(){
  const s = load();
  stopVideo();
  try{
    if (s.mode === 'url' && s.url){ const t = await useURL(s.url); show(t); status(`Showing your link on every screen.`); return; }
    if (s.mode === 'upload'){ const f = await getFile(); if (f){ objectURL = URL.createObjectURL(f); const t = await useURL(objectURL, f.type); show(t); status(`Showing ${f.name || 'your upload'} on every screen.`); return; } }
  }catch(e){ show(null); status(s.mode === 'url' ? "That link can't be shown. The site may not allow it to be used elsewhere. Upload the file instead, or use a direct image or .mp4 link." : 'That file could not be played. Try an image, .mp4 or .webm file.', true); return; }
  show(null); status('Showing the built-in visuals.');
}

window.ATLScreens = {
  attach(list){ screens = list; if (screens.length) apply(); },
  detach(){ stopVideo(); screens = []; },
  apply, load,
  setLink(url){ url = (url || '').trim(); if (!url) return; if (isPage(url)){ status('YouTube, Vimeo and social pages can’t play on a 3D screen. Use a direct image or video link (.jpg, .png, .mp4, .webm), or upload the file.', true); return; } save({...load(), mode: 'url', url}); apply(); },
  async setFile(file){ if (!file) return; if (!/^(image|video)\//.test(file.type)){ status('Pick an image or a video file.', true); return; } try{ await putFile(file); }catch(e){} save({...load(), mode: 'upload', name: file.name}); apply(); },
  reset(){ save({...load(), mode: 'default'}); apply(); },
  sound(on){ save({...load(), sound: on}); if (video) video.muted = !on; },
  onStatus(f){ status = f; }
};

/* the panel */
function panel(){
  const btn = document.querySelector('#venueScreens'); if (!btn) return;
  const dlg = document.createElement('dialog'); dlg.className = 'screens-dlg glass';
  dlg.innerHTML = `
    <form method="dialog">
      <p class="kick">Venue screens</p>
      <h3>Put your own visuals on the screens</h3>
      <p class="muted">Show an image or a video on every screen in every venue. Your choice stays on this device.</p>
      <label class="field">Image or video link<input type="url" id="scrURL" placeholder="https://…/flyer.jpg or …/video.mp4"></label>
      <div class="row"><button class="btn small primary" type="button" id="scrUseURL">Show link</button>
        <label class="btn small" for="scrFile">⬆ Upload a file</label><input type="file" id="scrFile" accept="image/*,video/*" hidden>
        <button class="btn small" type="button" id="scrReset">Built-in visuals</button></div>
      <label class="check"><input type="checkbox" id="scrSound"> Play video sound</label>
      <p class="scr-status" id="scrStatus" role="status"></p>
      <div class="row end"><button class="btn small" value="close">Done</button></div>
    </form>`;
  document.body.append(dlg);
  const $ = q => dlg.querySelector(q), st = $('#scrStatus');
  window.ATLScreens.onStatus((m, bad) => { st.textContent = m; st.classList.toggle('bad', !!bad); const f = document.querySelector('#venueStatus'); if (f && !dlg.open) f.textContent = '📺 ' + m; });
  btn.addEventListener('click', () => { const s = load(); $('#scrURL').value = s.url || ''; $('#scrSound').checked = !!s.sound; dlg.showModal(); });
  $('#scrUseURL').addEventListener('click', () => window.ATLScreens.setLink($('#scrURL').value));
  $('#scrURL').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); window.ATLScreens.setLink($('#scrURL').value); } });
  $('#scrFile').addEventListener('change', e => window.ATLScreens.setFile(e.target.files[0]));
  $('#scrReset').addEventListener('click', () => window.ATLScreens.reset());
  $('#scrSound').addEventListener('change', e => window.ATLScreens.sound(e.target.checked));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', panel); else panel();
