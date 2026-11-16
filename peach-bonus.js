'use strict';

const peachMarkets=[
  ['Ponce City Market',33.77277,-84.36560,'Eastside Trail','Food hall and shops inside the former Sears complex.','https://www.poncecitymarket.com/',0],
  ['Krog Street Market',33.7568,-84.3640,'Eastside Trail','Inman Park food hall near Krog Street Tunnel.','https://www.thekrogdistrict.com/',2],
  ['Lee + White Food Hall',33.731492,-84.421457,'Westside Trail','Food hall and gathering spot on White Street SW.','https://www.leeandwhiteatl.com/tenant-directory/',6]
];
const beltlineHighlights=[
  ['Eastside · Ponce City Market',0,'Food hall and a BeltLine access point'],
  ['Eastside · Historic Fourth Ward Park',1,'A park stop just off the trail'],
  ['Eastside · Krog Street Tunnel',2,'Public street art near Krog Street Market'],
  ['Westside · West End',6,'West End landmark quest near the Westside Trail']
];
const peachChallenges=[
  ['market-hall','Quiz',35,'Which market occupies the former Sears complex?',['Ponce City Market','Krog Street Market','Lee + White'],0],
  ['westside','Trivia',30,'Which food hall is on the Westside Trail?',['Ponce City Market','Lee + White','Krog Street Market'],1],
  ['eastside-order','Puzzle',45,'Travel south from Ponce City Market. Which sequence is in order?',['Krog Street Tunnel → Ponce City Market → Fourth Ward Park','Ponce City Market → Krog Street Tunnel → Fourth Ward Park','Ponce City Market → Fourth Ward Park → Krog Street Tunnel'],2],
  ['peach','Riddle',35,'I have fuzzy skin, a sweet center, and a stone I never throw. What am I?',['A pecan','A peach','A magnolia'],1],
  ['rail','Trivia',30,'Which station on the quest map connects to Underground Atlanta?',['King Memorial','Inman Park / Reynoldstown','Five Points'],2],
  ['marker','Quiz',25,'Which tool verifies your physical location before a real-world AR stamp?',['Compass artwork','GPS','The VR controller'],1],
  ['route-code','Puzzle',45,'Your route code is made from map pin numbers. Visit Ponce, then Fourth Ward Park, then Krog Tunnel. What is the code?',['1-2-3','2-1-3','3-2-1'],0],
  ['rails','Riddle',35,'I have a line but no fishing rod, stops but no stop signs, and tracks I never leave. What am I?',['A street mural','A market stall','A train'],2]
];
function peachBonusXP(){return peachChallenges.reduce((xp,[id,,reward])=>xp+(progress.bonus?.[id]===true?reward:0),0);}
function showPeachChallenges(){
  add(quest,'h2','Bonus challenges');
  const status=add(quest,'p',peachBonusXP()+' bonus XP earned');status.setAttribute('role','status');
  const grid=add(quest,'div','');grid.className='peach-feature-grid';
  for(const [id,type,reward,prompt,answers,correct] of peachChallenges){
    const card=add(grid,'article','');card.className='quest-card';
    add(card,'p',type+' · +'+reward+' XP').className='peach-eyebrow';
    add(card,'h3',prompt);
    const solved=progress.bonus?.[id]===true;
    const options=add(card,'div','');options.className='challenge-options';
    const feedback=add(card,'p',solved?'Solved. Bonus collected.':'');feedback.setAttribute('role','status');
    for(const [index,label] of answers.entries()){
      const choice=button(options,label,()=>{
        if(progress.bonus?.[id]===true)return;
        if(index!==correct){feedback.textContent='Try another answer.';return;}
        progress.bonus={...progress.bonus,[id]:true};saveProgress();
        for(const node of options.children)node.disabled=true;
        feedback.textContent='Correct. +'+reward+' XP.';
        status.textContent=peachBonusXP()+' bonus XP earned';updatePeachProgress();
      });
      choice.disabled=solved;
    }
  }
}
function showPeachMarkets(){
  add(quest,'h2','AR Market Map');
  add(quest,'p','Place a miniature Atlanta map on a surface, or open a nearby landmark’s location-based AR quest.');
  const status=add(quest,'p','Checking tabletop AR support…');status.setAttribute('role','status');
  const launch=button(quest,'Place market map in AR',async()=>{
    launch.disabled=true;
    try{await openPeachMarketAR();}
    catch{status.textContent='AR could not start. Check camera access and use a compatible device.';}
    finally{launch.disabled=false;}
  });
  launch.disabled=true;
  const unsupported=()=>{status.textContent='Tabletop AR is unavailable here. Market details and walking directions are below.';};
  if(navigator.xr&&window.THREE)navigator.xr.isSessionSupported('immersive-ar').then(ok=>{
    if(ok){launch.disabled=false;status.textContent='Point your camera at a level surface and tap to place.';}
    else unsupported();
  }).catch(unsupported);else unsupported();
  const grid=add(quest,'div','');grid.className='peach-feature-grid';
  for(const [name,lat,lon,trail,detail,url,zone] of peachMarkets){
    const card=add(grid,'article','');card.className='quest-card';
    add(card,'p',trail).className='peach-eyebrow';add(card,'h3',name);add(card,'p',detail);
    const links=add(card,'div','');links.className='resources';
    for(const [label,href] of [['Market details',url],['Walking directions','https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+encodeURIComponent(name+', Atlanta, GA')]]){
      const anchor=add(links,'a',label);anchor.href=href;anchor.target='_blank';anchor.rel='noopener noreferrer';
    }
    button(card,'Nearby AR quest',()=>openZone(zone));
  }
}
function addBeltlineHighlights(board){
  const landmarks=new Set(beltlineHighlights.map(entry=>entry[1]));
  board.querySelectorAll('.landmark-pin').forEach(pin=>{
    if(landmarks.has(Number(pin.dataset.landmark)))pin.classList.add('beltline-highlight');
  });
  for(const [name,lat,lon] of peachMarkets.slice(1)){
    const pin=button(board,'',()=>{tab='markets';render();});
    pin.className='peach-market-pin';pin.title=name;
    pin.setAttribute('aria-label','Open AR Market Map · '+name);
    const [x,y]=fieldPoint(lat,lon);
    pin.style.left=x+'%';pin.style.top=y+'%';pin.append(peachIcon('markets'));
  }
  const panel=add(quest,'section','');panel.className='peach-highlights';
  add(panel,'h3','BeltLine highlights');
  const list=add(panel,'div','');list.className='peach-feature-grid';
  for(const [label,zone,detail] of beltlineHighlights){
    const tile=button(list,'',()=>openZone(zone));tile.className='peach-highlight';
    tile.append(peachIcon('trail'));add(tile,'strong',label);add(tile,'small',detail);
  }
}
