'use strict';
const quest = document.querySelector('#quest');
const base = 'https://peach-quest-atl.base44.app/';
const zones = [
  ['start_hub','Start Hub','Ponce City Market',300,62,30],
  ['strategy','Strategy','Old Fourth Ward Park',500,53,45],
  ['street_culture','Street Culture','Krog Street Tunnel',500,63,70],
  ['speed','Speed','Reynoldstown / Edgewood',600,85,81],
  ['culture_language','Culture & Language','Inman Park',550,83,55],
  ['precision','Precision','Midtown / Piedmont Park',700,65,11],
  ['power','Power','Westside Trail',700,13,82],
  ['final_hub','Final Hub','Downtown / Underground Atlanta',1000,30,65]
];
const hunt = [[0,'The Gateway Zone'],[2,'The Pulse Tunnel'],[5,'The Forest of Echoes'],[7,'The Rail Terminus']];
const key = 'atl-escape.peach-city-quest.v1';
let progress = {};
try { progress = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
let tab = 'map';
let zone = 0;
let vault = Number.isFinite(progress.vault?.end) && Number.isInteger(progress.vault?.step) && progress.vault.step >= 0 && progress.vault.step <= 6 ? progress.vault : null;
let clock;
const done = (i, type) => Boolean(progress[zones[i][0]]?.[type]);
const objectives = ['relic','quiz','relic','game','quiz'];
const earnedQuests = () => importedQuests.filter((entry,i)=>done(i,objectives[i]));
const teams = ['Solo','Team Peach','BeltLine Runners','ATL Strikers'];
function saveProgress() {
  try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
}
function award(i, type) {
  const id = zones[i][0];
  progress[id] = {...progress[id], [type]:true};
  saveProgress();
}
function add(parent, tag, label) {
  const node = document.createElement(tag);
  node.textContent = label;
  parent.append(node);
  return node;
}
function button(parent, label, action) {
  const node = add(parent, 'button', label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function links(entries) {
  const row = add(quest,'div','');
  row.className = 'resources';
  for (const [label,path] of entries) {
    const link = add(row,'a',label);
    link.href = new URL(path,base);
    link.target = '_blank';
    link.rel = 'noopener';
  }
}
function openZone(i) {
  zone = i;
  tab = 'map';
  render();
}
function renderTourCards(parent, tours) {
  const grid=add(parent,'div','');
  grid.className='tour-grid';
  for (const tour of tours) {
    const card=add(grid,'article','');
    card.className='quest-card tour-card';
    add(card,'p',tour.format).className='tour-format';
    add(card,'h3',tour.title);
    add(card,'p',tour.description);
    add(card,'p',tour.credit).className='tour-credit';
    const actions=add(card,'div','');
    actions.className='resources';
    for (const [label,url] of [[tour.format==='VR project archive'?'View project':'Open experience',tour.url],['Source and credits',tour.source]]) {
      if (!url) continue;
      const link=add(actions,'a',label);
      link.href=url;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label',label+' for '+tour.title+' (opens in a new tab)');
    }
  }
}
function showTours() {
  add(quest,'h2','Atlanta Virtual Tours');
  add(quest,'p','Free 3D tours, 360° views, and project resources from Atlanta creators. Each opens on its original site.');
  renderTourCards(quest,atlantaTours);
}
let selectedVideo = 0;
function showVideos() {
  add(quest,'h2','Atlanta Video Archive');
  add(quest,'a','Watch a 360° video in Cardboard').href='cardboard-video.html';
  const player=add(quest,'div','');
  player.className='video-player';
  function selectVideo(index, play=false) {
    selectedVideo=index;
    const video=atlantaVideos[index];
    player.replaceChildren();
    add(player,'h3',video.title);
    add(player,'p',video.credit).className='tour-credit';
    add(player,'p',video.description);
    const link=add(player,'a','Watch on Vimeo ↗');
    link.href='https://vimeo.com/'+video.id;
    link.target='_blank';
    link.rel='noopener noreferrer';
    const load=()=>{
      const frame=document.createElement('iframe');
      frame.title=video.title;
      frame.src='https://player.vimeo.com/video/'+video.id+'?dnt=1&autoplay=1';
      frame.allow='autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen=true;
      player.append(frame);
    };
    if(play) load();
    else button(player,'Play video',event=>{event.currentTarget.remove();load();});
  }
  selectVideo(selectedVideo);
  const list=add(quest,'div','');
  list.className='video-playlist';
  atlantaVideos.forEach((video,index)=>button(list,video.title,()=>selectVideo(index,true)));
}
function quiz(i, onWin) {
  const [question, choices, correct, fact] = historyCards[i];
  add(quest,'h3',question);
  const status = add(quest,'p','');
  status.setAttribute('role','status');
  const delay = {Beginner:30000,Intermediate:60000}[coachingProfile().tier];
  if (delay) {
    const hint = button(quest,'Show history clue',()=>{status.textContent=fact;});
    hint.hidden = true;
    setTimeout(()=>{if(hint.isConnected)hint.hidden=false;},delay);
  }
  choices.forEach((choice,index)=>button(quest,choice,()=>{
    if(index===correct)onWin();
    else status.textContent='Try another answer.';
  }));
}
function sequence(i) {
  const names = ['Peach','Bolt','Star','Crown'];
  const {tier} = coachingProfile();
  const length = {Beginner:3,Intermediate:4,Advanced:6,Expert:8}[tier];
  const order = Array.from({length},(_,step)=>step<3
    ? [i%4,(i+2)%4,(i+1)%4][step]
    : (i+step*3+Math.floor(Math.random()*3))%4);
  let step = 0;
  const status = add(quest,'p',order.map(n=>names[n]).join(' → '));
  const choices = add(quest,'div','');
  choices.hidden = true;
  setTimeout(() => {
    status.textContent = 'Repeat the sequence.';
    choices.hidden = false;
  },2600);
  names.forEach((label,n)=>button(choices,label,()=>{
    if (n !== order[step]) {
      step = 0;
      status.textContent = 'Sequence reset. Try again.';
    } else if (++step === order.length) {
      award(i,'game');
      render();
    } else status.textContent = step+' / '+order.length;
  }));
}
let mapMode='hologram',mapZoom=1,mapPanX=0,mapPanY=0;
let mapYaw = -7;

function landmarkPhoto(parent,i) {
  const photo=add(parent,'span','');
  photo.className='landmark-photo';
  photo.setAttribute('aria-hidden','true');
  photo.style.setProperty('--photo-x',((i%4)*100/3)+'%');
  photo.style.setProperty('--photo-y',(i<4?0:100)+'%');
  return photo;
}

function showMap() {
  const heading=add(quest,'div','');
  heading.className='atlas-heading';
  add(heading,'h2','Atlanta Inside the Perimeter');
  add(heading,'p','Central Atlanta inside I-285 · City building outlines with estimated heights.');
  add(heading,'p','Explore the city atlas. Zoom with + / − or pinch, then drag to pan. Select a landmark for its quest or nearby Street View.');
  button(heading,'Things to do in Atlanta',()=>{tab='city';render();});
  const viewBar=add(quest,'div','');
  viewBar.className='map-view-bar';
  viewBar.setAttribute('role','group');viewBar.setAttribute('aria-label','Map views');
  const modeButtons=new Map();
  for(const [id,label] of [['hologram','3D hologram'],['aerial','Aerial'],['street','Street map'],['terrain','Terrain'],['google','Google Maps']]){
    const select=button(viewBar,label,()=>{mapMode=id;updateMapView();});
    modeButtons.set(id,select);
  }
  const streetView=add(viewBar,'a','Street View ↗');
  const [,lat,lon]=fieldSites[zone];
  const streetUrl=new URL('https://www.google.com/maps/@');
  streetUrl.search=new URLSearchParams({api:'1',map_action:'pano',viewpoint:lat+','+lon});
  streetView.href=streetUrl;streetView.target='_blank';streetView.rel='noopener noreferrer';
  streetView.setAttribute('aria-label','Open Google Street View near '+fieldSites[zone][0]+' in a new tab');
  const google=add(quest,'section','');
  google.className='peach-google-map';google.hidden=true;
  const googleFrame=add(google,'iframe','');
  googleFrame.title='Google Maps · Atlanta, Georgia';googleFrame.loading='lazy';
  googleFrame.referrerPolicy='strict-origin-when-cross-origin';googleFrame.allowFullscreen=true;
  const googleLink=add(google,'a','Open Atlanta in Google Maps ↗');
  googleLink.href='https://www.google.com/maps/search/Atlanta,+GA/@33.7596208,-84.420207,11z';
  googleLink.target='_blank';googleLink.rel='noopener noreferrer';
  add(google,'p','Use the map’s own zoom and pan controls. Quest locations are listed below.');
  const map = add(quest,'div','');
  map.className = 'map map-city';
  map.setAttribute('aria-label','Atlanta landmark map');
  const board=add(map,'div','');
  board.className='map-board';
  const atlas=mountCityAtlas(board);
  const trail=document.createElementNS('http://www.w3.org/2000/svg','svg');
  trail.setAttribute('viewBox','0 0 100 100');
  trail.setAttribute('preserveAspectRatio','none');
  trail.setAttribute('aria-hidden','true');
  board.append(trail);
  const north=add(board,'span','↑ N');
  north.className='map-north';
  north.setAttribute('aria-hidden','true');
  const controls=add(map,'div','');
  controls.className='map-controls map-navigation';
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Map navigation');
  const zoomIn=button(controls,'+',()=>setZoom(mapZoom*1.28));
  const zoomOut=button(controls,'−',()=>setZoom(mapZoom/1.28));
  const reset=button(controls,'Reset',()=>{mapZoom=1;mapPanX=mapPanY=0;mapYaw=-7;updateMapView();});
  const rotateLeft=button(controls,'↶',()=>{mapYaw=Math.max(-27,mapYaw-8);updateMapView();});
  const rotateRight=button(controls,'↷',()=>{mapYaw=Math.min(27,mapYaw+8);updateMapView();});
  zoomIn.setAttribute('aria-label','Zoom in');zoomOut.setAttribute('aria-label','Zoom out');
  reset.setAttribute('aria-label','Reset zoom, pan and rotation');
  rotateLeft.setAttribute('aria-label','Rotate 3D map left');rotateRight.setAttribute('aria-label','Rotate 3D map right');
  const zoomOverlay=add(map,'span','');zoomOverlay.className='map-zoom-value';
  let currentLayer='';
  function updateMapView(){
    const showGoogle=mapMode==='google';
    google.hidden=!showGoogle;map.hidden=showGoogle;
    for(const [id,b] of modeButtons)b.setAttribute('aria-pressed',String(id===mapMode));
    if(showGoogle){
      if(!googleFrame.hasAttribute('src'))googleFrame.src='https://www.google.com/maps/embed?origin=mfe&pb=!1m12!1m8!1m3!1d212290.58202278204!2d-84.420207!3d33.7596208!3m2!1i1024!2i768!4f13.1!2m1!1sAtlanta,+GA!6i11';
      return;
    }
    const depth=mapMode==='hologram';
    const layer=depth?'aerial':mapMode;
    if(layer!==currentLayer){
      board.querySelector('.map-aerial')?.remove();
      board.prepend(addAerialBasemap(board,mapTileSources[layer],layer!=='terrain'?15:14));
      currentLayer=layer;
    }
    const maxX=(mapZoom-1)*board.clientWidth*.5,maxY=(mapZoom-1)*board.clientHeight*.5;
    mapPanX=Math.max(-maxX,Math.min(maxX,mapPanX));mapPanY=Math.max(-maxY,Math.min(maxY,mapPanY));
    map.dataset.mapMode=mapMode;
    map.classList.toggle('map-flat',!depth);
    atlas?.setDepth(depth);
    map.style.setProperty('--map-yaw',mapYaw+'deg');
    board.style.setProperty('--map-zoom',mapZoom);
    board.style.setProperty('--map-pan-x',mapPanX+'px');
    board.style.setProperty('--map-pan-y',mapPanY+'px');
    zoomIn.disabled=mapZoom>=4;zoomOut.disabled=mapZoom<=1;
    zoomOverlay.textContent=Math.round(mapZoom*100)+'%';
    rotateLeft.disabled=!depth||mapYaw<=-27;
    rotateRight.disabled=!depth||mapYaw>=27;
  }
  function setZoom(value){
    const next=Math.max(1,Math.min(4,value));
    const factor=next/mapZoom;mapPanX*=factor;mapPanY*=factor;
    mapZoom=next;updateMapView();
  }
  updateMapView();
  const pointers=new Map();
  const distance=()=>{
    const [a,b]=pointers.values();return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;
  };
  map.tabIndex=0;
  map.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button,a'))return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    map.setPointerCapture(event.pointerId);
  });
  map.addEventListener('pointermove',event=>{
    const prev=pointers.get(event.pointerId);if(!prev)return;
    const before=distance();
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2&&before>0){setZoom(mapZoom*distance()/before);return;}
    if(pointers.size!==1)return;
    if(mapZoom>1){mapPanX+=event.clientX-prev.x;mapPanY+=event.clientY-prev.y;}
    else if(mapMode==='hologram')mapYaw=Math.max(-27,Math.min(27,mapYaw+(event.clientX-prev.x)*.16));
    updateMapView();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])map.addEventListener(type,event=>pointers.delete(event.pointerId));
  map.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;
    event.preventDefault();setZoom(mapZoom*Math.exp(-event.deltaY*.004));
  },{passive:false});
  map.addEventListener('keydown',event=>{
    if(event.target!==map)return;
    if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(mapZoom*1.28);return;}
    if(event.key==='-'){event.preventDefault();setZoom(mapZoom/1.28);return;}
    const offsets={ArrowLeft:[24,0],ArrowRight:[-24,0],ArrowUp:[0,24],ArrowDown:[0,-24]};
    if(mapZoom>1&&offsets[event.key]){event.preventDefault();const [x,y]=offsets[event.key];mapPanX+=x;mapPanY+=y;updateMapView();}
  });
  const layerStatus = add(quest,'p','Loading BeltLine trail data…');
  layerStatus.className = 'map-status';
  drawBeltline(trail,layerStatus);
  links([['Aerial imagery · USDA / USGS The National Map',aerialSource],['Street map · Esri',mapTileSources.street],['Terrain · USGS',mapTileSources.terrain],['BeltLine ArcGIS resource',beltlineItem],['Official trail map','https://beltline.org/map/'],['Building footprints · City of Atlanta','https://services2.arcgis.com/I9cUOJUZvdGAJncI/ArcGIS/rest/services/BuildingsATL/FeatureServer/0']]);
  const list = add(quest,'div','');
  list.className = 'landmark-grid';
  zones.forEach((entry,i)=>{
    const selectLandmark=event=>{
      const selector=event.currentTarget.classList.contains('landmark-pin') ? '.landmark-pin' : '.landmark-card';
      const keyboard=event.detail===0;
      openZone(i);
      if(keyboard) quest.querySelector(selector+'[data-landmark="'+i+'"]')?.focus({preventScroll:true});
    };
    const pin = button(board,'',selectLandmark);
    pin.className='landmark-pin';
    pin.dataset.landmark=i;
    landmarkPhoto(pin,i);
    add(pin,'span',String(i+1)).className='landmark-number';
    const marker = importedZones[i];
    const [x,y]=fieldPoint(fieldSites[i][1],fieldSites[i][2]);
    pin.style.left = x+'%';
    pin.style.top = y+'%';
    pin.style.borderColor = marker.color;
    pin.setAttribute('aria-label','AR marker '+(i+1)+' · '+fieldSites[i][0]);
    pin.setAttribute('aria-pressed',String(i===zone));
    const card=button(list,'',selectLandmark);
    card.className='landmark-card';
    card.dataset.landmark=i;
    landmarkPhoto(card,i);
    const caption=add(card,'span','');
    caption.className='landmark-caption';
    add(caption,'span',fieldSites[i][0]);
    add(caption,'small',done(i,'ar')?'AR stamp collected':'AR marker '+(i+1));
    card.setAttribute('aria-pressed',String(i===zone));
  });
  addRailStops(board);
  addBeltlineHighlights(board);
  const i = zone;
  const [id,name,place,xp] = zones[i];
  add(quest,'h2',name+' · '+place);
  const [question,answers,correct,fact,source,relic] = historyCards[i];
  addVRLaunch(quest,i===2?'Explore Krog Street Market and the metro passage in VR':'Explore '+fieldSites[i][0]+' in VR',i);
  addLandmarkVisuals(quest,i);
  addFieldMarker(quest,i,session=>{
    award(i,'ar');
    queueQuestFind(i,'ar',session);
    collectQuestRelic(i,session);
  });
  add(quest,'p',fact);
  links([['Read the history',source]]);
  add(quest,'p',importedZones[i].desc);
  add(quest,'p',xp+' XP · Collect the relic, pass the quiz, and complete the sequence.');
  if (done(i,'relic')) add(quest,'p',relic+' collected');
  if (questRoomSession || !done(i,'relic')) button(quest,'Search for '+relic, event=>{
    event.currentTarget.disabled=true;
    const search=add(quest,'div','');
    add(search,'p','Clue · '+(i===2?'Check the service door at the far end of the passage.':fieldSites[i][4]));
    const correctSpots=['Warehouse crates','Low water wall','Service door','Far end of the track','Garden arch','Clearing','Tall sculpture','Stone column'];
    const spots=[correctSpots[i],'Trail entrance','Information kiosk'];
    const status=add(search,'p','');
    status.setAttribute('role','status');
    for(let j=0;j<3;j++){
      const label=spots[(j+i)%3];
      button(search,label,()=>{if(label===correctSpots[i]) collectQuestRelic(i);else status.textContent='Keep looking.';});
    }
  });
  if (done(i,'quiz')) add(quest,'p','Quiz complete');
  else {
    add(quest,'h3',question);
    const feedback=add(quest,'p','');
    feedback.setAttribute('role','status');
    answers.forEach((answer,index)=>button(quest,answer,()=>{
      if(index===correct){award(i,'quiz');render();}
      else feedback.textContent='Try again. The landmark history above has a clue.';
    }));
  }
  if (done(i,'game')) add(quest,'p','Sequence complete');
  else button(quest,'Play sequence',event=>{event.currentTarget.disabled=true;sequence(i);});
  const relatedTours=atlantaTours.filter(tour=>tour.zones.includes(i));
  if (relatedTours.length) {
    add(quest,'h3','Explore the real Atlanta');
    renderTourCards(quest,relatedTours);
  }
  const videoIndex=atlantaVideos.findIndex(video=>video.zones.includes(i));
  if(videoIndex>=0) button(quest,'Watch '+atlantaVideos[videoIndex].title,()=>{
    selectedVideo=videoIndex;tab='videos';render();
  });
}
function showCityGuide() {
  add(quest,'h2','Things to do in Atlanta');
  const guides=[
    ['Discover Atlanta','Atlanta Convention & Visitors Bureau',[
      ['Atlanta events calendar','https://discoveratlanta.com/events/main/'],
      ['This weekend','https://discoveratlanta.com/stories/things-to-do/things-to-do-in-atlanta-this-weekend/'],
      ['Free things to do','https://discoveratlanta.com/deals/free-things-to-do/']]],
    ['Eventbrite','Atlanta event listings and tickets',[
      ['Browse Atlanta events','https://www.eventbrite.com/d/ga--atlanta/events/']]]
  ];
  const grid=add(quest,'div','');
  grid.className='tour-grid';
  for(const [title,source,items] of guides) {
    const card=add(grid,'article','');
    card.className='quest-card city-guide-card';
    add(card,'h3',title);
    add(card,'p',source).className='tour-credit';
    for(const [label,url] of items){
      const link=add(card,'a',label+' ↗');
      link.href=url;
      link.target='_blank';
      link.rel='noopener noreferrer';
    }
  }
  const radio=add(quest,'button','Atlanta radio stations');
  radio.type='button';
  radio.setAttribute('data-open-radio','');
}
function collectQuestRelic(i, session=questRoomSession) {
  award(i,'relic');
  queueQuestFind(i,'relic',session);
  if (questPresence?.mode === 'VR') updateHuntProgress();
  else render();
}
function updateHuntProgress() {
  const list=document.querySelector('#hunt-checklist');
  if(!list)return;
  list.replaceChildren();
  const team=questRoomSession;
  const finds=new Map(team?.snapshot?.finds || []);
  const stamps=new Map(team?.snapshot?.stamps || []);
  const hasRelic=i=>team ? finds.has(i) || team.pending.has('relic'+i) || team.pending.has('ar'+i) : done(i,'relic');
  const hasStamp=i=>team ? stamps.has(i) || team.pending.has('ar'+i) : done(i,'ar');
  const relicCount=fieldSites.filter((_,i)=>hasRelic(i)).length;
  const stampCount=fieldSites.filter((_,i)=>hasStamp(i)).length;
  add(list,'p',(team?'Team collection':'Your collection')+' · '+relicCount+'/8 relics · '+stampCount+'/8 real-world AR stamps');
  if(relicCount===8) add(list,'p','Atlanta heritage collection complete.');
  fieldSites.forEach(([name],i)=>{
    const row=add(list,'div',''); row.className='hunt-row';
    button(row,name,()=>openZone(i));
    add(row,'span',(hasRelic(i)?'Relic found'+(finds.has(i)?' by '+finds.get(i):''):'Relic hidden')+' · '+(hasStamp(i)?'AR stamped':'AR stamp available'));
  });
}
const landmarkPreviews=new Map([[1,"https://d8j0ntlcm91z4.cloudfront.net/user_2xqdkXQxcL6UFHjJwLK5drKd1tT/hf_20261114_025149_54f619b8-6ead-45cb-a46e-4de3c628b837.png"],[3,"https://d8j0ntlcm91z4.cloudfront.net/user_2xqdkXQxcL6UFHjJwLK5drKd1tT/hf_20261114_025149_619f6e1d-6284-404c-9fda-77df430e27f2.png"]]);
function addLandmarkVisuals(parent,index) {
  const preview=landmarkPreviews.get(index);
  if(preview){
    const figure=add(parent,'figure','');
    figure.className='landmark-visual';
    const img=add(figure,'img','');
    img.src=preview;
    img.loading='lazy';
    img.alt='Photorealistic concept rendering of '+fieldSites[index][0];
    add(figure,'figcaption','Environment concept generated with Higgsfield');
  }
}

function addRailStops(board) {
  const panel=add(quest,'section','');
  panel.className='quest-card rail-stops';
  add(panel,'h3','MARTA quest stops');
  add(panel,'p','Select a station to see its quest connection. Enter the Five Points station scene in the Underground Atlanta VR level.');
  const list=add(panel,'div','');
  list.className='rail-stop-list';
  const detail=add(panel,'p','');
  detail.setAttribute('role','status');
  let selected=1;
  const pins=[], options=[];
  function select(index) {
    selected=index;
    const [name,,,landmark]=railStops[index];
    detail.textContent=name+' · '+landmark;
    for(let i=0;i<railStops.length;i++){
      pins[i].setAttribute('aria-pressed',String(i===index));
      options[i].setAttribute('aria-pressed',String(i===index));
    }
    questLink.hidden=index===0;
    stadiumLink.hidden=index!==0;
  }
  railStops.forEach(([name,lat,lon],index)=>{
    const pin=button(board,'M'+(index+1),()=>select(index));
    pin.className='rail-pin';
    const [x,y]=fieldPoint(lat,lon);
    pin.style.left=x+'%';
    pin.style.top=y+'%';
    pin.title=name;
    pin.setAttribute('aria-label','MARTA · '+name);
    pins.push(pin);
    options.push(button(list,name,()=>select(index)));
  });
  const questLink=button(panel,'Open connected quest location',()=>openZone(railStops[selected][4]));
  const stadiumLink=add(panel,'a','Mercedes-Benz Stadium visitor information');
  stadiumLink.href='https://www.mercedesbenzstadium.com/';
  addVRLaunch(panel,'Explore Five Points in VR',7);
  select(selected);
}

function addVRLaunch(parent,label,startZone=-1) {
  const status=add(parent,'p','Checking VR support…');
  status.className='map-status';
  const launch=button(parent,label,async ()=>{
    launch.disabled=true;
    const startedInRoom=questRoomSession;
    try {
      await enterPeachHunt(i=>collectQuestRelic(i,startedInRoom),(i,position)=>{
        questPresence=i===null?null:{zone:i,mode:'VR',position};
        if(i===null && launch.isConnected){
          launch.disabled=false;
          if(tab==='map') render();
          else updateHuntProgress();
        }
      },startZone);
    } catch {status.textContent='The VR session could not start. Try again in a headset browser.';launch.disabled=false;}
  });
  launch.disabled=true;
  if (navigator.xr && window.THREE) navigator.xr.isSessionSupported('immersive-vr').then(supported=>{
    launch.disabled=!supported;
    status.textContent=supported?'Aim at a relic or portal and pull the trigger. Point at the floor and pull the trigger to teleport.':'Use the map to play on this device.';
  }).catch(()=>{status.textContent='Use the map to play on this device.';});
  else status.textContent='Use the map to play on this device.';
}
function showHunt() {
  add(quest,'h2','Atlanta VR Scavenger Hunt');
  button(quest,'Browse Atlanta virtual tours',()=>{tab='tours';render();});
  add(quest,'p','Recover eight relics across Atlanta. Explore landmark scenes in VR, search on the map, or collect AR stamps at the real locations.');
  addVRLaunch(quest,'Enter VR scavenger hunt');
  add(quest,'div','').id='hunt-checklist';
  updateHuntProgress();
  
}
function showVault() {
  add(quest,'h2','Golden Peach Vault');
  if (vault?.step === 6) {
    add(quest,'p','Vault unlocked. All three keys recovered.');
    return;
  }
  if (!vault || Date.now()>=vault.end) {
    const minutes = 60 * {Beginner:1.5,Intermediate:1,Advanced:.8,Expert:.6}[coachingProfile().tier];
    add(quest,'p',vault?'Time expired.':'Three keys · Six questions · '+minutes+' minutes');
    button(quest,vault?'Retry vault':'Start vault',()=>{
      vault = {step:0,end:Date.now()+minutes*60000}; progress.vault=vault; saveProgress();
      render();
    });
    return;
  }
  const step = vault.step;
  const status = add(quest,'p','');
  const update = () => {
    const left = Math.max(0,Math.ceil((vault.end-Date.now())/1000));
    status.textContent = Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' · '+Math.floor(step/2)+' / 3 keys';
    if (!left) render();
  };
  clock = setInterval(update,1000);
  update();
  quiz([2,3,5,6,0,7][step],()=>{
    if (Date.now()<vault.end && vault.step===step) {vault.step++;saveProgress();}
    render();
  });
}
function showArcade() {
  add(quest,'h2','Peach City Arcade');
  button(quest,'Play local sequence',event=>{event.currentTarget.disabled=true;sequence(zone);});

}
function showQuests() {
  add(quest,'h2','BeltLine Quest Journal');
  add(quest,'p','Finish the listed activity in ATL Nightclub Mogul to earn quest rewards.');
  const actions = {relic:'Collect the zone relic',quiz:'Pass the landmark quiz',game:'Complete the memory sequence'};
  importedQuests.forEach((entry,i)=>{
    const card = add(quest,'article','');
    card.className = 'quest-card';
    add(card,'h3',entry.icon+' '+entry.title);
    add(card,'p',entry.desc);
    add(card,'p',entry.difficulty+' · '+entry.xp+' quest XP · '+entry.coins+' coins');
    if (done(i,objectives[i])) add(card,'p','Completed');
    else button(card,actions[objectives[i]],()=>openZone(i));
  });
}
function showProfile() {
  add(quest,'h2','Player Profile');
  const entries = earnedQuests();
  add(quest,'p',entries.length+' / 5 quests completed · '+entries.reduce((sum,q)=>sum+q.xp,0)+' quest XP · '+entries.reduce((sum,q)=>sum+q.coins,0)+' coins');
  const label = add(quest,'label','Team ');
  const select = add(label,'select','');
  teams.forEach(team=>{const option=add(select,'option',team);option.value=team;});
  select.value = teams.includes(progress.team) ? progress.team : 'Solo';
  select.addEventListener('change',()=>{progress.team=select.value;saveProgress();});
  const badges = [
    ['Portal Pioneer',done(0,'relic')], ['Tactician',done(1,'quiz')],
    ['Speed Demon',done(3,'game')], ['Sharp Shooter',done(5,'game')],
    ['Champion',hunt.every(([i])=>done(i,'relic'))], ['Linguist',done(4,'quiz')]
  ];
  add(quest,'h3','Historical relics');
  const collection = add(quest,'ul','');
  historyCards.forEach((card,index)=>add(collection,'li',card[5]+' · '+(done(index,'relic')?'Collected':'Undiscovered')));
  add(quest,'h3','Badges');
  const list = add(quest,'ul','');
  badges.forEach(([name,earned])=>add(list,'li',name+' · '+(earned?'Earned':'Locked')));
}
function coachingProfile() {
  const cleared = zones.filter((_,i)=>['relic','quiz','game'].every(type=>done(i,type)));
  const xp = cleared.reduce((total,entry)=>total+entry[3],0);
  const puzzles = zones.reduce((total,_,i)=>total+Number(done(i,'quiz'))+Number(done(i,'game')),0);
  // The export references a level table that was not supplied.
  const level = 1 + Math.floor(xp/300);
  let tier = 'Expert';
  if (level <= 2 && puzzles < 3) tier = 'Beginner';
  else if (level <= 4 && puzzles < 7) tier = 'Intermediate';
  else if (level <= 7) tier = 'Advanced';
  return {tier,level,xp,puzzles,cleared};
}
function showCoach() {
  const {tier,level,xp,puzzles,cleared} = coachingProfile();
  const recommendations = {
    Beginner:[0,6], Intermediate:[0,5], Advanced:[5,1], Expert:[1,5]
  }[tier];
  const next = [...new Set([...recommendations,...zones.keys()])].filter(i=>!cleared.includes(zones[i]));
  const detail = {
    Beginner:'3-symbol sequences · 90-minute Vault',
    Intermediate:'4-symbol sequences · 60-minute Vault',
    Advanced:'6-symbol sequences · 48-minute Vault',
    Expert:'8-symbol sequences · 36-minute Vault'
  }[tier];
  add(quest,'h2','Quest Coach');
  add(quest,'p',tier+' · Level '+level+' · '+xp+' XP · '+puzzles+' / 16 puzzles');
  add(quest,'p',detail);
  if (!next.length) {
    add(quest,'p','All eight zones are clear. Try the Vault or revisit the Atlanta Heritage Hunt.');
    return;
  }
  const i = next[0];
  const tip = !done(i,'relic') ? 'Collect the relic' : !done(i,'quiz') ? 'Finish the landmark quiz' : 'Complete the memory sequence';
  add(quest,'p',tip+' at '+zones[i][2]+' to move closer to clearing the BeltLine.');
  for (const index of next.slice(0,2)) button(quest,'Visit '+zones[index][2],()=>openZone(index));
}
function updatePeachProgress(){
  const cleared=zones.filter((_,i)=>['relic','quiz','game'].every(type=>done(i,type)));
  const bonus=peachBonusXP()+atlTriviaXP();
  document.querySelector('#progress').textContent=cleared.length+' / 8 zones cleared · '+(cleared.reduce((xp,entry)=>xp+entry[3],0)+bonus)+' XP';
}
function render() {
  clearInterval(clock);
  quest.replaceChildren();
  updatePeachProgress();
  document.querySelectorAll('[data-tab]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.tab===tab)));
  quest.dataset.view=tab;
  ({map:showMap,markets:showPeachMarkets,challenges:showPeachChallenges,trivia:showAtlTrivia,city:showCityGuide,hunt:showHunt,tours:showTours,videos:showVideos,vault:showVault,arcade:showArcade,coach:showCoach,quests:showQuests,profile:showProfile})[tab]();
}
document.querySelectorAll('[data-tab]').forEach(node=>node.addEventListener('click',()=>{
  tab = node.dataset.tab;
  render();
}));
initQuestRoom();
render();
