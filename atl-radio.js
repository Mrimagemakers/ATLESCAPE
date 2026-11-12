'use strict';

(() => {
  const stations = [
    ['FIP Hip-Hop','Hip-hop and rap','https://icecast.radiofrance.fr/fiphiphop-midfi.mp3'],
    ['FIP Groove','Funk and soul','https://icecast.radiofrance.fr/fipgroove-midfi.mp3'],
    ['FIP Jazz','Jazz','https://icecast.radiofrance.fr/fipjazz-midfi.mp3'],
    ['FIP World','Afrobeat, Latin and world','https://icecast.radiofrance.fr/fipworld-midfi.mp3'],
    ['FIP Reggae','Reggae and dub','https://icecast.radiofrance.fr/fipreggae-midfi.mp3'],
    ['SomaFM Space Station Soma','Ambient electronica','https://ice5.somafm.com/spacestation-128-mp3']
  ];
  const panel = document.createElement('dialog');
  panel.className = 'atl-radio';
  panel.setAttribute('aria-labelledby','atl-radio-title');
  panel.innerHTML = '<form method="dialog"><button class="radio-close" aria-label="Close radio">×</button></form>'+
    '<h2 id="atl-radio-title">Turn Up Music</h2><p>Live radio</p><label for="atl-station">Station</label>'+
    '<select id="atl-station"></select><div class="radio-actions"><button type="button" id="atl-radio-play">Play station</button>'+
    '<button type="button" id="atl-radio-stop">Stop</button></div><audio controls preload="none"></audio>'+
    '<p id="atl-radio-status" role="status"></p>'+
    '<a href="https://turnupmusic.online/app/" target="_blank" rel="noopener noreferrer">Browse all Turn Up Music stations ↗</a>'+
    '<h3>Atlanta radio stations</h3><ul class="local-radio-links"></ul>';
  document.body.append(panel);
  const select=panel.querySelector('select');
  const audio=panel.querySelector('audio');
  const status=panel.querySelector('#atl-radio-status');
  for(const [index,[name,genre]] of stations.entries()) select.add(new Option(name+' · '+genre,index));
  function updatePlaying(playing) {
    document.querySelectorAll('[data-open-radio]').forEach(button=>button.dataset.playing=String(playing));
    document.dispatchEvent(new CustomEvent('atl-radio-playing',{detail:playing}));
  }
  const localStations=[
    ['Hot 107.9','Hip-hop','https://hotspotatl.com/listen-live/'],
    ['V-103','Hip-hop and R&B','https://www.audacy.com/stations/v103'],
    ['Jazz 91.9 WCLK','Jazz','https://www.wclk.com/'],
    ['90.1 WABE','Public radio','https://www.wabe.org/live/'],
    ['89.3 WRFG','Community radio','https://wrfg.org/']
  ];
  const localList=panel.querySelector('.local-radio-links');
  for(const [name,genre,url] of localStations){
    const item=document.createElement('li');
    const link=document.createElement('a');
    link.textContent=name+' · '+genre+' ↗';
    link.href=url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    item.append(link);
    localList.append(item);
  }
  document.addEventListener('click',event=>{
    if (event.target.closest('[data-open-radio]') && !panel.open) panel.showModal();
  });
  panel.querySelector('#atl-radio-play').addEventListener('click',async ()=>{
    const [name,,url]=stations[select.selectedIndex];
    status.textContent='Connecting to '+name+'…';
    if(audio.getAttribute('src')!==url) audio.src=url;
    try {await audio.play();}
    catch(error) {if(error.name!=='AbortError') status.textContent='The stream is unavailable. Try another station or open Turn Up Music.';}
  });
  panel.querySelector('#atl-radio-stop').addEventListener('click',()=>{
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    status.textContent='Radio stopped.';
    updatePlaying(false);
  });
  audio.addEventListener('playing',()=>{
    const station=stations.find(([, ,url])=>url===audio.getAttribute('src'));
    status.textContent='Playing '+(station?.[0] || 'live radio');
    updatePlaying(true);
  });
  audio.addEventListener('pause',()=>updatePlaying(false));
  audio.addEventListener('error',()=>{
    if(audio.hasAttribute('src')) status.textContent='The station could not be loaded.';
    updatePlaying(false);
  });
})();
