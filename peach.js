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
function showMap() {
  const map = add(quest,'div','');
  map.className = 'map';
  map.setAttribute('aria-label','Schematic BeltLine map');
  const route = importedZones.map(({x,y})=>x+','+y).join(' ');
  map.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="'+route+'" fill="none" stroke="#f7a974" stroke-width="1" stroke-dasharray="2 2"/></svg>';
  const list = add(quest,'div','');
  list.className = 'list';
  zones.forEach((entry,i)=>{
    const pin = button(map,String(i+1),()=>openZone(i));
    const marker = importedZones[i];
    pin.style.left = marker.x+'%';
    pin.style.top = marker.y+'%';
    pin.style.borderColor = marker.color;
    pin.setAttribute('aria-label',entry[2]);
    pin.setAttribute('aria-pressed',String(i===zone));
    button(list,entry[2],()=>openZone(i)).setAttribute('aria-pressed',String(i===zone));
  });
  const i = zone;
  const [id,name,place,xp] = zones[i];
  add(quest,'h2',name+' · '+place);
  const [question,answers,correct,fact,source,relic] = historyCards[i];
  add(quest,'p',fact);
  links([['Read the history',source]]);
  add(quest,'p',importedZones[i].desc);
  add(quest,'p',xp+' XP · Collect the relic, pass the quiz, and complete the sequence.');
  if (done(i,'relic')) add(quest,'p',relic+' collected');
  else button(quest,'Collect '+relic,()=>{award(i,'relic');render();});
  if (window.addPeachXR) window.addPeachXR(quest,i,()=>{award(i,'relic');render();});
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
}
function showHunt() {
  add(quest,'h2','Atlanta Heritage Hunt');
  const count = hunt.filter(([i])=>done(i,'relic')).length;
  add(quest,'p',count===4?'The Atlanta heritage collection is complete.':count+' / 4 fragments recovered');
  for (const [i,name] of hunt) button(quest,name+' · '+zones[i][2]+(done(i,'relic')?' ✓':''),()=>openZone(i));
  
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
  add(quest,'p','Finish the listed activity in ATL Escape to earn quest rewards.');
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
function render() {
  clearInterval(clock);
  quest.replaceChildren();
  const cleared = zones.filter((_,i)=>['relic','quiz','game'].every(type=>done(i,type)));
  document.querySelector('#progress').textContent = cleared.length+' / 8 zones cleared · '+cleared.reduce((xp,entry)=>xp+entry[3],0)+' XP';
  document.querySelectorAll('[data-tab]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.tab===tab)));
  ({map:showMap,hunt:showHunt,vault:showVault,arcade:showArcade,coach:showCoach,quests:showQuests,profile:showProfile})[tab]();
}
document.querySelectorAll('[data-tab]').forEach(node=>node.addEventListener('click',()=>{
  tab = node.dataset.tab;
  render();
}));
render();
