'use strict';

(() => {
  const venues={
    club:{name:'Nightclub',position:[0,1.7,4],npc:'Security',line:'I check IDs, watch the room and keep everybody safe.',job:'door'},
    rooftop:{name:'Rooftop Lounge',position:[0,1.7,5.8],npc:'Server',line:'Remember names and people remember you. Tips follow.',job:'service'},
    concert:{name:'Hip-Hop Concert',position:[0,1.7,3],npc:'DJ',line:'Read the room, then take it one notch higher.',job:'promo'}
  };
  const canvas=document.querySelector('#venueScene');
  const controls=document.querySelector('#venueControls');
  const feedback=document.querySelector('#venueStatus');
  const talk=document.querySelector('#venueTalk');
  const buttons=document.querySelector('#venueChoices');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let renderer,scene,camera,world,current,person,shiftButton,drag=null,last=0;
  function clearScene(){
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
    if(!reduced.matches)world.update(last?Math.min((now-last)/1000,.05):0,now/1000);
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
      clearScene();
      scene=new THREE.Scene();
      scene.background=new THREE.Color(0x100a1b);
      person=null;
      world=createTurnUpVenue(scene,id,npc=>{person=npc;});
      camera=new THREE.PerspectiveCamera(65,1,.05,220);
      camera.rotation.order='YXZ';
      camera.position.set(...venue.position);
      camera.lookAt(0,1.4,-6);
      current=id;
      last=0;
      canvas.hidden=controls.hidden=false;
      talk.textContent='Talk to '+venue.npc;
      shiftButton?.remove();
      feedback.textContent='Drag to look around or use the arrow buttons.';
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
  talk.onclick=()=>{
    const venue=venues[current];
    if(person){
      const focus=person.position.clone();
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
  };
  document.querySelector('#venueLeft').onclick=()=>{camera.rotation.y+=.32;};
  document.querySelector('#venueRight').onclick=()=>{camera.rotation.y-=.32;};
  canvas.addEventListener('pointerdown',event=>{
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
