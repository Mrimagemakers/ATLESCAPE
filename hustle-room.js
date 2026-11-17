'use strict';
(()=>{
  const field=document.querySelector('#hustleRoomCode'),status=document.querySelector('#hustleRoomStatus');
  const list=document.querySelector('#hustlePlayers'),create=document.querySelector('#hustleCreate');
  const join=document.querySelector('#hustleJoin'),share=document.querySelector('#hustleInvite'),leave=document.querySelector('#hustleLeave');
  const valid=/^[a-f0-9]{24}$/;
  const peers=new Set(),players=new Map();
  let peer,host=false,room='',self='',venue='',pos=[0,0,0],score=0;
  const publicPage='https://mrimagemakers.github.io/ATLESCAPE/nightlife.html';
  function invite(code){return publicPage+(code?'?room='+code:'');}
  function controls(){
    create.disabled=join.disabled=!!peer;share.disabled=!room;leave.disabled=!peer;field.readOnly=!!peer;
  }
  function roster(){
    list.replaceChildren();
    for(const [id,p] of players){
      const li=document.createElement('li');
      li.textContent=(id===self?'You':'Player '+id.slice(-4).toUpperCase())+' · '+(p.venue?p.venue:'Lobby')+' · '+p.score+' correct';
      list.append(li);
    }
  }
  function sanitize(value){
    if(!value||!Array.isArray(value.pos)||value.pos.length!==3||!value.pos.every(n=>Number.isFinite(n)&&Math.abs(n)<100))return null;
    if(typeof value.venue!=='string'||!/^[-a-z]{0,24}$/.test(value.venue))return null;
    if(!Number.isSafeInteger(value.score)||value.score<0||value.score>10000)return null;
    return {venue:value.venue,pos:value.pos,score:value.score};
  }
  function publish(){
    if(!self)return;
    const own={venue,pos,score};players.set(self,own);
    const payload=host?{type:'roster',players:[...players]}:{type:'presence',own};
    for(const channel of peers)if(channel.open)channel.send(payload);
    roster();
  }
  function stop(message){
    const old=peer;peer=null;self='';room='';score=0;
    peers.clear();players.clear();old?.destroy();
    status.textContent=message;controls();roster();
  }
  function attach(channel){
    if(host&&peers.size>=3){channel.on('open',()=>{channel.send({type:'full'});setTimeout(()=>channel.close(),250);});return;}
    peers.add(channel);
    channel.on('open',()=>{if(!peer)return;room=field.value;status.textContent='Room '+room.toUpperCase()+' · Up to four players';controls();publish();});
    channel.on('data',data=>{
      if(!peer||!peers.has(channel)||!data)return;
      if(host&&data.type==='presence'){
        const own=sanitize(data.own);if(own){players.set(channel.peer,own);publish();}
      }else if(!host&&data.type==='roster'&&Array.isArray(data.players)&&data.players.length<=4){
        players.clear();
        for(const item of data.players){if(!Array.isArray(item)||typeof item[0]!=='string')continue;const p=sanitize(item[1]);if(p)players.set(item[0],p);}
        roster();
      }else if(!host&&data.type==='full')stop('That room is full.');
    });
    channel.on('close',()=>{
      if(!peers.delete(channel)||!peer)return;
      if(!host){stop('Host disconnected. Start or join another room.');return;}
      players.delete(channel.peer);publish();
    });
    channel.on('error',()=>{if(!host&&peer)stop('Connection failed. Check the room code and try again.');});
  }
  function start(isHost){
    if(peer)return;
    if(!window.Peer){status.textContent='Multiplayer could not load. Refresh to retry.';return;}
    const code=isHost?Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join(''):field.value.trim().toLowerCase();
    if(!valid.test(code)){status.textContent='Enter the room code from your invitation.';return;}
    host=isHost;field.value=code;status.textContent=isHost?'Opening room…':'Connecting to host…';
    const instance=peer=isHost?new Peer('atl-hustle-'+code):new Peer();
    controls();
    const timeout=setTimeout(()=>{if(peer===instance&&!room)stop('Connection timed out. Check the room code and try again.');},18000);
    instance.on('open',id=>{
      if(peer!==instance)return;
      self=id;
      if(host){clearTimeout(timeout);room=code;status.textContent='Room open. Invite up to three friends.';controls();publish();}
      else attach(instance.connect('atl-hustle-'+code,{reliable:true}));
    });
    instance.on('connection',channel=>host&&peer===instance?attach(channel):channel.close());
    instance.on('error',()=>{if(peer===instance)stop('Could not connect. Check that the host is online and try again.');});
  }
  async function sendLink(url,title){
    try{
      if(navigator.share)await navigator.share({title,url});
      else{await navigator.clipboard.writeText(url);status.textContent='Link copied.';}
    }catch(error){if(error.name!=='AbortError')status.textContent='Could not share automatically. Copy the room code to invite a friend.';}
  }
  create.onclick=()=>start(true);join.onclick=()=>start(false);leave.onclick=()=>stop('You left the room.');
  share.onclick=()=>sendLink(invite(room),'Join my ATL Nightclub Mogul room');
  document.querySelector('#hustleShare').onclick=()=>sendLink(invite(''),'Play ATL Nightclub Mogul');
  const incoming=new URLSearchParams(location.search).get('room');
  if(valid.test(incoming||'')){field.value=incoming;status.textContent='Invite loaded. Select Join room.';document.querySelector('#friends').open=true;}
  controls();
  window.hustleRoom={
    position(id,x,y,z){venue=id;pos=[x,y,z];},
    score(points){score+=points;publish();},
    nearby(id){return [...players].filter(([key,p])=>key!==self&&p.venue===id);}
  };
  setInterval(publish,240);
})();
