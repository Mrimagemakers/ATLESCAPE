'use strict';

async function enterPeachHunt(onFind, onZone) {
  const session = await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
  const overlay = document.querySelector('#xr-tools');
  const exit = document.querySelector('#exit-xr');
  let renderer;
  let objects;
  let activeZone = -1;
  const scene = new THREE.Scene();
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
  let eyeHeight = 0;
  let labelTexture, labelCanvas, labelState = '';
  let lastZoneChange = 0;

  function clearZone() {
    if (!objects) return;
    objects.traverse(node=>{
      node.geometry?.dispose();
      node.material?.map?.dispose();
      node.material?.dispose();
    });
    objects.removeFromParent();
    objects=null;
  }
  function mesh(geometry,color,x,y,z) {
    const item = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color}));
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
    box(0,-.1,-8,34,.2,31,0x35494a);
    for(let j=-14;j<=14;j+=2) box(j,.008,-8,.024,.012,30,0x4b6160);
    const board=sign(0,2.8,-3,3.5,1.15);
    labelCanvas=board.canvas;
    labelTexture=board.texture;
    labelState='';
    if(i===-1) {
      fieldSites.forEach(([name],j)=>portal((j%4-1.5)*2.55,-6-Math.floor(j/4)*5,
        String(j+1).padStart(2,'0')+' · '+name,'Enter landmark',()=>loadZone(j)));
      return;
    }
    const color=new THREE.Color(importedZones[i].color);
    portal(-3,-2.8,'Atlanta map','Return to landmark hub',()=>loadZone(-1));
    for(let j=0;j<5;j++) {
      const x=(j%2 ? -1 : 1)*(2.6+j%3), z=-6-j*2.1;
      if(i===4 || i===5) {
        mesh(new THREE.CylinderGeometry(.16,.25,2,7),0x84604c,x,1,z);
        mesh(new THREE.ConeGeometry(.8,1.5,7),color,x,2.5,z);
      } else {
        const width=[1.35,2.7,2.9,.7,1,1,1.7,.85][i];
        box(x,.72,z,width,1.44,.85,color);
        box(x,1.47,z,width*.89,.05,.81,0xe4bc8b);
      }
    }
    const at=[[-5,-12],[4,-10],[-4,-14],[5,-16],[-5,-11],[4,-15],[-4,-13],[5,-15]][i];
    if(i===7 || i===3) for(const x of [-.7,.7]) box(x,.04,-10,.13,.08,15,0xc2a393);
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
    if (target && target.distance <= 14) {target.object.userData.action();return;}
    if (ray.ray.intersectPlane(floor,landing) && landing.distanceTo(origin)<14 &&
      Math.abs(landing.x)<15 && landing.z>-22 && landing.z<3) {
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
      renderer?.dispose();
    });
  },{once:true});
  try {
    renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#xr'),antialias:true});
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
    loadZone(-1);
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
