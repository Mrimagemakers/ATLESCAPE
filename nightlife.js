'use strict';

const saveKey='atl-nightlife-career-v1';
const games={
  door:{title:'Bouncer',venue:'West End · The Velvet Door',unlock:0,pay:65,
    summary:'Check virtual IDs and manage the line.',rounds:[
      ['Avery Reed','ID age 24 · Current · Face matches',['Admit','Decline','Request another ID'],0,'Current ID, matching photo, and 21 or older.'],
      ['Morgan Lane','ID age 20 · Current · Face matches',['Admit','Decline','Request another ID'],1,'This club is 21+.'],
      ['Jordan Ellis','ID age 29 · Expired · Face matches',['Admit','Decline','Request another ID'],2,'Ask for current ID before entry.'],
      ['Sam Carter','ID age 31 · Current · Photo does not match',['Admit','Decline','Request another ID'],2,'Ask for matching ID before entry.'],
      ['Taylor Brooks','ID age 21 · Current · Face matches',['Admit','Decline','Request another ID'],0,'This patron meets the entry rules.']
    ]},
  service:{title:'Bottle Service',venue:'Midtown · Skyline Room',unlock:3,pay:95,
    summary:'Deliver orders to the right VIP tables.',rounds:[
      ['Table 4 calls first','Table 4 ordered sparkling water and two glasses. Table 7 ordered a citrus mixer.',['Water + two glasses to 4','Mixer to 4','Water to 7'],0,'Match both the table and the order.'],
      ['Table 7 requests a refill','They want a citrus mixer and ice.',['Water and ice','Citrus mixer and ice','Citrus mixer only'],1,'The refill includes both items.'],
      ['Table 2 changes its order','They cancel tonic and ask for ginger ale instead.',['Tonic','Both mixers','Ginger ale'],2,'Follow the updated ticket.'],
      ['Table 5 asks for the check','Their order is complete.',['Bring their check','Deliver a second order','Bring Table 2’s check'],0,'Close the correct ticket.']
    ]},
  promo:{title:'Promoter',venue:'Old Fourth Ward · BeltLine Loft',unlock:7,pay:145,
    summary:'Pick the right event, audience, and promotion.',rounds:[
      ['Thursday listening party','A local artist has 80 likely guests and a modest budget.',['80-person listening room','600-person ballroom','Outdoor festival stage'],0,'Match the room to expected attendance.'],
      ['Build the guest list','The budget is $60. An artist mailing list costs $20, a broad ad $90, and a billboard $300.',['Broad ad','Artist mailing list','Billboard'],1,'Reach relevant fans within budget.'],
      ['Choose the announcement','The date, venue and lineup are confirmed.',['Post only the logo','Promise a surprise headliner','Post date, venue, lineup and RSVP link'],2,'Give guests the details they need to attend.'],
      ['Event night','Attendance is nearing the venue’s approved limit.',['Keep counting and cap entry','Keep admitting everyone','Stop counting arrivals'],0,'Honor the capacity while keeping the event running.']
    ]}
};
const venueCost=500, ownerRep=12;
let profile={cash:0,rep:0,shifts:0,owns:false};
try {
  const saved=JSON.parse(localStorage.getItem(saveKey));
  if(saved) {
    for(const key of ['cash','rep','shifts']) if(Number.isSafeInteger(saved[key])&&saved[key]>=0)profile[key]=saved[key];
    profile.owns=saved.owns===true;
  }
}catch {}
const career=document.querySelector('#career'),roles=document.querySelector('#roles');
const shift=document.querySelector('#shift'),result=document.querySelector('#result');
let active=null;
const money=amount=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
function add(parent,tag,text,className) {
  const node=document.createElement(tag);
  node.textContent=text;
  if(className)node.className=className;
  parent.append(node);
  return node;
}
function action(parent,label,run) {
  const node=add(parent,'button',label);
  node.type='button';
  node.onclick=run;
  return node;
}
function saveCareer() {
  try {localStorage.setItem(saveKey,JSON.stringify(profile));}
  catch {result.textContent+=' Progress could not be saved on this device.';}
}
function refreshCareer() {
  career.replaceChildren();
  for(const metric of [money(profile.cash)+' club cash',profile.rep+' reputation',profile.shifts+' shifts',profile.owns?'Club Owner':'Club Staff'])add(career,'strong',metric);
  roles.replaceChildren();
  for(const [id,game] of Object.entries(games)){
    const button=action(roles,'',()=>startShift(id));
    button.className='job';
    add(button,'strong',game.title);
    add(button,'small',profile.rep<game.unlock?'Unlocks at '+game.unlock+' reputation':game.summary);
    button.disabled=!!active || profile.rep<game.unlock;
  }
  const owner=action(roles,profile.owns?'Open Owner Office':'Club ownership · '+money(venueCost),openOffice);
  owner.disabled=!!active;
}
function startShift(id) {
  if(active || profile.rep<games[id].unlock)return;
  active={id,index:0,correct:0,rounds:[...games[id].rounds]};
  for(let i=active.rounds.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [active.rounds[i],active.rounds[j]]=[active.rounds[j],active.rounds[i]];
  }
  result.textContent='';
  refreshCareer();
  showRound();
}
function showRound() {
  const run=active,game=games[run.id],index=run.index;
  const [title,ticket,choices,correct,feedback]=run.rounds[index];
  shift.replaceChildren();
  shift.dataset.role=run.id;
  add(shift,'h2',game.title);
  add(shift,'p',game.venue+' · '+(index+1)+' / '+run.rounds.length,'score');
  add(shift,'h3',title);
  add(shift,'p',ticket,'ticket');
  const options=add(shift,'div','','choices');
  let answered=false;
  choices.forEach((label,i)=>action(options,label,()=>{
    if(answered || active!==run || run.index!==index)return;
    answered=true;
    if(i===correct)run.correct++;
    for(const button of options.children)button.disabled=true;
    result.textContent=(i===correct?'Correct. ':'Missed. ')+feedback;
    action(shift,index+1===run.rounds.length?'Finish shift':'Next ticket',()=>{
      if(active!==run || run.index!==index)return;
      if(++run.index===run.rounds.length)finishShift(run,game);
      else {result.textContent='';showRound();}
    }).focus();
  }));
  action(shift,'Leave shift',()=>{active=null;refreshCareer();showHome();});
}
function finishShift(run,game) {
  const cash=35+run.correct*game.pay;
  profile.cash+=cash;
  profile.rep+=run.correct;
  profile.shifts++;
  active=null;
  refreshCareer();
  showHome();
  result.textContent=run.correct+'/'+run.rounds.length+' correct · '+money(cash)+' earned · +'+run.correct+' rep';
  saveCareer();
}
function showHome() {
  shift.replaceChildren();
  shift.removeAttribute('data-role');
  add(shift,'h2','Choose a shift');
  add(shift,'p','Start at the West End door, then unlock VIP service and promotion as your reputation grows.');
  add(shift,'p','Buy your own club at '+ownerRep+' reputation and '+money(venueCost)+' club cash.');
}
function openOffice() {
  if(active)return;
  shift.replaceChildren();
  shift.dataset.role='owner';
  add(shift,'h2','Owner Office');
  if(!profile.owns) {
    add(shift,'p','Acquire Peach Room for '+money(venueCost)+' at '+ownerRep+' reputation.');
    action(shift,'Buy Peach Room',()=>{
      if(profile.owns || profile.rep<ownerRep || profile.cash<venueCost)return;
      profile.cash-=venueCost;
      profile.owns=true;
      result.textContent='Peach Room is open. Book your first event.';
      saveCareer();refreshCareer();openOffice();
    }).disabled=profile.rep<ownerRep || profile.cash<venueCost;
    return;
  }
  add(shift,'p','Peach Room · Book an event. Booking costs are deducted from club cash.');
  for(const [name,cost,demand,capacity,ticket,staff] of [
    ['Local showcase',80,80,100,3,60],['Weekend DJ night',180,145,150,4,160],['VIP launch',340,170,150,6,350]
  ]){
    const visitors=Math.min(demand,capacity);
    const profit=visitors*ticket-staff-cost;
    action(shift,name+' · '+money(cost+staff)+' upfront',()=>{
      if(profile.cash<cost+staff)return;
      profile.cash+=profit;
      profile.rep+=profit>0?2:0;
      result.textContent=name+' drew '+visitors+' guests. '+(profit>=0?'Profit ':'Loss ')+money(Math.abs(profit))+'.';
      saveCareer();refreshCareer();openOffice();
    }).disabled=profile.cash<cost+staff;
    add(shift,'p','Expected demand '+demand+' · Capacity '+capacity+' · '+money(ticket)+' per guest · '+money(staff)+' staff costs','score');
  }
}
refreshCareer();
showHome();
