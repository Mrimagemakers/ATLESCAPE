'use strict';

(() => {
  const venues={
    club:{name:'Nightclub',position:[0,1.7,4],npc:'Marcus Reed',line:'I check IDs, watch the room and keep everybody safe.',job:'door'},
    rooftop:{name:'Rooftop Lounge',position:[0,1.7,5.8],npc:'Elena Rivera',line:'Remember names and people remember you. Tips follow.',job:'service'},
    concert:{name:'Hip-Hop Concert',position:[0,1.7,3],npc:'Minh Tran',line:'Read the room, then take it one notch higher.',job:'promo'}
  };
  const canvas=document.querySelector('#venueScene');
  const controls=document.querySelector('#venueControls');
  const feedback=document.querySelector('#venueStatus');
  const talk=document.querySelector('#venueTalk');
  const buttons=document.querySelector('#venueChoices');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let renderer,scene,camera,world,current,person,promoter,shiftButton,drag=null,last=0;
  const promoterTalk=document.querySelector('#venueTalkPromoter');
  const bindings={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  const keys=new Set(),touch=new Map();
  const bounds={club:[-10.6,10.6,-15.4,5.65],rooftop:[-6.6,6.6,-6.6,6.6],concert:[-12.3,12.3,-13.35,3.3]};
  const obstacles={club:[],rooftop:[[-1.3,1.3,-.12,1.02],[-6.45,-4.75,-5.55,-4.65],[4.75,6.45,-5.55,-4.65],[-6.45,-4.75,.85,1.75],[4.75,6.45,.85,1.75]],concert:[]};
  function clearMovement(){
    keys.clear();touch.clear();
    for(const button of controls.querySelectorAll('[data-walk]'))button.removeAttribute('data-held');
  }
  function walkable(x,z){
    const [west,east,north,south]=bounds[current];
    return x>=west&&x<=east&&z>=north&&z<=south&&
      !obstacles[current].some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d);
  }
  function walk(dt){
    const directions=new Set([...Array.from(keys,key=>bindings[key]),...touch.values()]);
    const forward=Number(directions.has('forward'))-Number(directions.has('back'));
    const sideways=Number(directions.has('right'))-Number(directions.has('left'));
    if(!forward&&!sideways)return;
    const step=2.55*dt/Math.hypot(forward,sideways);
    const yaw=camera.rotation.y,sin=Math.sin(yaw),cos=Math.cos(yaw);
    const pos=camera.position;
    const x=pos.x+(sideways*cos-forward*sin)*step;
    const z=pos.z-(forward*cos+sideways*sin)*step;
    if(walkable(x,pos.z))pos.x=x;
    if(walkable(pos.x,z))pos.z=z;
    const floor=current==='concert'&&(Math.abs(pos.x)>4.95||pos.z< -1.56)?-1:0;
    pos.y+=(floor+1.7-pos.y)*Math.min(1,dt*11);
  }
  document.addEventListener('keydown',event=>{
    if(!current||!bindings[event.code]||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.target!==canvas&&!controls.contains(event.target))return;
    event.preventDefault();keys.add(event.code);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',clearMovement);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovement();});
  canvas.addEventListener('blur',()=>keys.clear());
  controls.addEventListener('focusout',event=>{if(!controls.contains(event.relatedTarget))keys.clear();});
  for(const button of controls.querySelectorAll('[data-walk]')){
    button.addEventListener('pointerdown',event=>{
      if(!current||event.button!==0)return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touch.set(event.pointerId,button.dataset.walk);
      button.dataset.held='';
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{
      touch.delete(event.pointerId);
      if(![...touch.values()].includes(button.dataset.walk))button.removeAttribute('data-held');
    });
    button.addEventListener('click',event=>{
      if(event.detail!==0||!current)return;
      const key=Object.keys(bindings).find(key=>bindings[key]===button.dataset.walk);
      keys.add(key);walk(.1);keys.delete(key);
    });
  }
  function clearScene(){
    world?.dispose?.();
    if(!scene)return;
    const resources=new Set();
    scene.traverse(node=>{
      if(node.geometry)resources.add(node.geometry);
      for(const material of [].concat(node.material||[])){
        for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
        resources.add(material);
      }
    });
    for(const item of resources)item.dispose();
    scene=null;
  }
  function frame(now){
    const width=canvas.clientWidth,height=canvas.clientHeight;
    if(!width || !height)return;
    if(camera.aspect!==width/height || renderer.domElement.width!==Math.floor(width*renderer.getPixelRatio())){
      renderer.setSize(width,height,false);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    }
    const dt=last?Math.min((now-last)/1000,.05):0;
    walk(dt);
    if(!reduced.matches)world.update(dt,now/1000);
    last=now;
    renderer.render(scene,camera);
  }
  function openVenue(id){
    if(current===id)return;
    const venue=venues[id];
    try{
      renderer ||= new THREE.WebGLRenderer({canvas,antialias:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      renderer.setAnimationLoop(null);
      clearMovement();
      clearScene();
      scene=new THREE.Scene();
      scene.background=new THREE.Color(0x100a1b);
      person=null;
      world=createTurnUpVenue(scene,id,(npc,host)=>{person=npc;promoter=host;});
      promoterTalk.hidden=!promoter;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.18;
      camera=new THREE.PerspectiveCamera(65,1,.05,220);
      camera.rotation.order='YXZ';
      camera.position.set(...venue.position);
      if(person){
        const focus=person.position.clone();
        focus.y+=1.28;
        camera.lookAt(focus);
      }else camera.lookAt(0,1.4,-6);
      current=id;
      last=0;
      canvas.hidden=controls.hidden=false;
      talk.textContent='Talk to '+venue.npc;
      shiftButton?.remove();
      feedback.textContent='WASD or arrow keys to walk. Drag to look. On touch, hold a movement arrow.';
      canvas.focus({preventScroll:true});
      for(const button of buttons.children) button.setAttribute('aria-pressed',String(button.dataset.venue===id));
      renderer.setAnimationLoop(frame);
    }catch(error){
      current=null;
      canvas.hidden=controls.hidden=true;
      feedback.textContent='The 3D scene could not load. You can still play shifts below.';
      console.error('Venue failed to load',error);
    }
  }
  for(const [id,venue] of Object.entries(venues)){
    const button=document.createElement('button');
    button.type='button';
    button.dataset.venue=id;
    button.textContent=venue.name;
    button.setAttribute('aria-pressed','false');
    button.onclick=()=>openVenue(id);
    buttons.append(button);
  }
  function talkTo(venue, character){
    if(character){
      const focus=character.position.clone();
      focus.y+=1.35;
      camera.lookAt(focus);
    }
    feedback.textContent=venue.npc+' · '+venue.line;
    shiftButton?.remove();
    shiftButton=document.createElement('button');
    shiftButton.type='button';
    shiftButton.textContent='Work this shift';
    shiftButton.onclick=()=>{
      if(active){feedback.textContent='Finish your current shift first.';return;}
      const job=games[venue.job];
      if(profile.rep<job.unlock){feedback.textContent=job.title+' unlocks at '+job.unlock+' reputation.';return;}
      startShift(venue.job);
      shift.scrollIntoView({block:'nearest'});
    };
    feedback.after(shiftButton);
  }
  talk.onclick=()=>talkTo(venues[current],person);
  promoterTalk.onclick=()=>talkTo({npc:'Simone Brooks',line:'Start with the opener and the guest list. I need a lineup that brings the room together.',job:'promo'},promoter);
  document.querySelector('#venueLeft').onclick=()=>{camera.rotation.y+=.32;};
  document.querySelector('#venueRight').onclick=()=>{camera.rotation.y-=.32;};
  document.querySelector('#venueReset').onclick=()=>{
    clearMovement();
    camera.position.set(...venues[current].position);
    camera.lookAt(0,1.4,-6);
    canvas.focus({preventScroll:true});
  };
  canvas.addEventListener('pointerdown',event=>{
    canvas.focus({preventScroll:true});
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    camera.rotation.y-=(event.clientX-drag.x)*.008;
    camera.rotation.x=Math.max(-1.2,Math.min(1.2,camera.rotation.x-(event.clientY-drag.y)*.008));
    drag.x=event.clientX;drag.y=event.clientY;
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
})();
