'use strict';

async function enterPeachHunt(onFind, onZone, startZone = -1) {
  const session = await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
  const overlay = document.querySelector('#xr-tools');
  const exit = document.querySelector('#exit-xr');
  let renderer;
  let objects;
  let activeZone = -1;
  const scene = new THREE.Scene();
  const ambient=new THREE.HemisphereLight(0xd8e9ff,0x695343,2.1);
  const sun=new THREE.DirectionalLight(0xffdfae,2.4);
  sun.position.set(-9,13,5);
  scene.add(ambient,sun);
  const textures=new Map(), materials=new Map();
  const loader=new THREE.TextureLoader();
  function texture(name,repeat){
    if(!textures.has(name)){
      const map=loader.load('assets/textures/'+name);
      map.colorSpace=THREE.SRGBColorSpace;
      map.wrapS=map.wrapT=THREE.RepeatWrapping;
      map.repeat.set(...repeat);
      map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      textures.set(name,map);
    }
    return textures.get(name);
  }
  function material(color) {
    if(materials.has(color)) return materials.get(color);
    const brick=[0x88504b,0x956b66,0x6b4c4e].includes(color);
    const paved=[0x817471,0x575d62,0x8b8581,0x8d8880,0x9c8c77,0x9f9584].includes(color);
    const water=[0x365d68,0x38656c,0x395d72].includes(color);
    const map=brick?texture('brick_red.webp',[2,2]):paved?texture('concrete_wet.webp',[3,6]):null;
    const result=new THREE.MeshStandardMaterial({color:map?0xbfb7ad:color,map,
      roughness:water?.27:paved?.72:.91,metalness:water?.12:0});
    materials.set(color,result);
    return result;
  }
  const rig = new THREE.Group();
  const camera = new THREE.PerspectiveCamera(65,1,.06,90);
  rig.add(camera);
  scene.add(rig);
  const ray = new THREE.Raycaster();
  const forward = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const floor = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const landing = new THREE.Vector3();
  const head = new THREE.Vector3();
  const interact = [];
  const avatars = [];
  let relic;
  let blockers = [];
  let occluders = [];
  let eyeHeight = 0;
  let labelTexture, labelCanvas, labelState = '';
  let lastZoneChange = 0;

  function clearZone() {
    if (!objects) return;
    objects.traverse(node=>{
      node.geometry?.dispose();
      if(node.material && ![...materials.values()].includes(node.material)){
        node.material.map?.dispose();
        node.material.dispose();
      }
    });
    objects.removeFromParent();
    objects=null;
  }
  function mesh(geometry,color,x,y,z) {
    const item = new THREE.Mesh(geometry,material(color));
    item.position.set(x,y,z);
    objects.add(item);
    return item;
  }
  function box(x,y,z,w,h,d,color) {
    return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z);
  }
  function sign(x,y,z,w,h) {
    const canvas=document.createElement('canvas');
    canvas.width=768; canvas.height=256;
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    sign.position.set(x,y,z);
    objects.add(sign);
    return {canvas,texture,sign};
  }
  function writeSign(canvas,texture,title,subtitle,detail='') {
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#102330';ctx.fillRect(0,0,768,256);
    ctx.strokeStyle='#efad76';ctx.lineWidth=7;ctx.strokeRect(8,8,752,240);
    ctx.textAlign='center';
    ctx.fillStyle='#ffd5af';ctx.font='bold 42px system-ui';ctx.fillText(title,384,75,720);
    ctx.fillStyle='#eefdfb';ctx.font='32px system-ui';ctx.fillText(subtitle,384,135,718);
    ctx.fillStyle='#94f2d8';ctx.fillText(detail,384,195,718);
    texture.needsUpdate=true;
  }
  function portal(x,z,title,subtitle,action) {
    const {canvas,texture,sign:panel}=sign(x,1.36,z,2.25,.85);
    writeSign(canvas,texture,title,subtitle,'Aim and press trigger');
    const base=box(x,.09,z,2.3,.18,.8,0xc87949);
    panel.userData.action=base.userData.action=action;
    interact.push(panel,base);
  }
  function loadZone(i) {
    lastZoneChange=performance.now();
    clearZone();
    interact.length=0;
    blockers=[];
    occluders=[];
    relic=null;
    activeZone=i;
    onZone(i,[0,0]);
    rig.position.set(0,eyeHeight,0);
    objects=new THREE.Group();
    scene.add(objects);
    avatars.length=0;
    for(let j=0;j<3;j++){
      const avatar=mesh(new THREE.CapsuleGeometry(.22,.72,4,8),0x76ffde,0,.86,0);
      avatar.visible=false;
      avatars.push(avatar);
    }
    scene.background=new THREE.Color(i===-1 ? 0x122635 : 0x263544);
    const board=sign(0,2.8,-3,3.5,1.15);
    labelCanvas=board.canvas;
    labelTexture=board.texture;
    labelState='';
    if(i===-1) {
      scene.fog=null;
      ambient.intensity=2.1;
      sun.intensity=2.4;
      box(0,-.1,-8,34,.2,31,0x35494a);
      for(let j=-14;j<=14;j+=2) box(j,.008,-8,.024,.012,30,0x4b6160);
      fieldSites.forEach(([name],j)=>portal((j%4-1.5)*2.55,-6-Math.floor(j/4)*5,
        String(j+1).padStart(2,'0')+' · '+name,'Enter landmark',()=>loadZone(j)));
      return;
    }
    const environment=buildPeachLandmark(i,{box,mesh});
    scene.background.set(environment.sky);
    scene.fog=new THREE.FogExp2(environment.sky,i===2 || i===7 ? .043 : .022);
    ambient.intensity=i===2 || i===7 ? 1.65 : 2.5;
    sun.intensity=i===2 || i===7 ? 1.05 : 2.65;
    blockers=environment.blocked;
    occluders=blockers.map(block=>block.object).filter(Boolean);
    portal(-3,-2.8,'Atlanta map','Return to landmark hub',()=>loadZone(-1));
    const at=environment.relicAt;
    relic=mesh(new THREE.IcosahedronGeometry(.27,0),0xffcd71,at[0],.78,at[1]);
    relic.userData.action=()=>{
      if (!relic.visible) return;
      onFind(i);
      relic.visible=false;
    };
    interact.push(relic);
    box(at[0],.09,at[1],.65,.18,.65,0x704731);
  }
  function found(i) {
    const room=questRoomSession;
    return room ? room.snapshot?.finds.some(([zone])=>zone===i) || room.pending.has('relic'+i) || room.pending.has('ar'+i) : done(i,'relic');
  }
  function select(controller) {
    if (performance.now()-lastZoneChange < 350) return;
    controller.getWorldPosition(origin);
    forward.set(0,0,-1).transformDirection(controller.matrixWorld);
    ray.set(origin,forward);
    const target=ray.intersectObjects(interact.filter(node=>node.visible))[0];
    const wall=ray.intersectObjects(occluders)[0];
    if (target && target.distance <= 14 && (!wall || wall.distance>target.distance)) {target.object.userData.action();return;}
    if (ray.ray.intersectPlane(floor,landing) && landing.distanceTo(origin)<14 &&
      Math.abs(landing.x)<15 && landing.z>-22 && landing.z<3 &&
      !blockers.some(({x,z,w,d})=>Math.abs(landing.x-x)<w/2+.22 && Math.abs(landing.z-z)<d/2+.22)) {
      head.setFromMatrixPosition(renderer.xr.getCamera().matrixWorld);
      rig.position.x += landing.x-head.x;
      rig.position.z += landing.z-head.z;
      onZone(activeZone,[landing.x,landing.z]);
    }
  }
  session.addEventListener('end',()=>{
    overlay.hidden=true;
    exit.onclick=null;
    onZone(null);
    queueMicrotask(()=>{
      renderer?.setAnimationLoop(null);
      clearZone();
      for(const map of textures.values()) map.dispose();
      for(const value of materials.values()) value.dispose();
      renderer?.dispose();
    });
  },{once:true});
  try {
    renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#xr'),antialias:true});
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.xr.setFramebufferScaleFactor(.9);
    renderer.xr.enabled=true;
    const localFloor=await session.requestReferenceSpace('local-floor').then(()=>true,()=>false);
    renderer.xr.setReferenceSpaceType(localFloor?'local-floor':'local');
    if(!localFloor) eyeHeight=1.6;
    for(let j=0;j<2;j++) {
      const controller=renderer.xr.getController(j);
      const pointer=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-4)]),
        new THREE.LineBasicMaterial({color:0x95fce1,transparent:true,opacity:.55}));
      controller.add(pointer);
      controller.addEventListener('select',()=>select(controller));
      session.addEventListener('end',()=>{pointer.geometry.dispose();pointer.material.dispose();},{once:true});
      rig.add(controller);
    }
    await renderer.xr.setSession(session);
    overlay.hidden=false;
    exit.onclick=()=>session.end().catch(()=>{});
    loadZone(Number.isInteger(startZone) && startZone >= 0 && startZone < fieldSites.length ? startZone : -1);
    renderer.setAnimationLoop(time=>{
      const room=questRoomSession;
      const count=room ? new Set([...(room.snapshot?.finds || []).map(([i])=>i),...[...room.pending.values()].map(a=>a.zone)]).size :
        fieldSites.filter((_,i)=>done(i,'relic')).length;
      const title=activeZone<0?'Peach City Quest':fieldSites[activeZone][0];
      const subtitle=activeZone<0?'Choose a landmark. Point at the floor to teleport.':
        found(activeZone)?'Relic recovered. Use the return portal.':fieldSites[activeZone][4];
      const detail=(room?'Team relics ':'Relics ')+count+' / 8';
      const state=title+subtitle+detail;
      if(state!==labelState){writeSign(labelCanvas,labelTexture,title,subtitle,detail);labelState=state;}
      if(relic){relic.visible=!found(activeZone);relic.rotation.y=time*.0014;}
      const peers=room?.snapshot?.players.filter(peer=>peer.name!==room.snapshot.self && peer.mode==='VR' &&
        peer.zone===activeZone && peer.position) || [];
      avatars.forEach((avatar,j)=>{
        const peer=peers[j];
        avatar.visible=!!peer;
        if(peer) avatar.position.set(peer.position[0],.86,peer.position[1]);
      });
      renderer.render(scene,camera);
    });
  } catch(error) {
    await session.end().catch(()=>{});
    throw error;
  }
}
