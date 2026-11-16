'use strict';

window.createNightlifeXR=function({getView,canLand,onStatus}){
  let state;
  const vr=document.querySelector('#venueVR'),ar=document.querySelector('#venueAR'),exit=document.querySelector('#venueExitXR');
  const modes=[[vr,'immersive-vr'],[ar,'immersive-ar']];
  const supported=new Map();
  for(const [button,mode] of modes){
    button.disabled=true;
    navigator.xr?.isSessionSupported(mode).then(ok=>{
      supported.set(mode,ok);
      if(!state)button.disabled=!ok;
    }).catch(()=>{});
    button.onclick=()=>start(mode);
  }
  exit.onclick=()=>state?.session?.end().catch(()=>{});
  function restore(view){
    const {renderer,scene,camera,session,rig,root,controller,marker,saved,hit,select}=view;
    hit?.cancel();
    controller?.removeEventListener('select',select);
    if(marker){
      marker.removeFromParent();marker.geometry.dispose();marker.material.dispose();
    }
    if(root){
      scene.add(...root.children.slice());
      root.removeFromParent();
    }
    if(rig){
      controller?.removeFromParent();
      scene.add(camera);rig.removeFromParent();
      camera.position.copy(saved.position);camera.quaternion.copy(saved.rotation);
    }
    scene.background=saved.background;
    if(state?.session===session)state=null;
    exit.hidden=true;
    for(const [button,mode] of modes)button.disabled=!supported.get(mode);
    onStatus('XR ended. You can continue exploring on this screen.');
  }
  async function start(mode){
    if(state)return;
    const view=getView();
    if(!view)return;
    const {renderer,scene,camera}=view;
    const isAR=mode==='immersive-ar';
    const current={...view,mode,saved:{background:scene.background,position:camera.position.clone(),rotation:camera.quaternion.clone()}};
    state=current;
    for(const [button] of modes)button.disabled=true;
    try{
      const session=await navigator.xr.requestSession(mode,{requiredFeatures:isAR?['hit-test']:['local-floor']});
      current.session=session;
      session.addEventListener('end',()=>restore(current),{once:true});
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType(isAR?'local':'local-floor');
      await renderer.xr.setSession(session);
      if(state!==current)return;
      const rig=current.rig=new THREE.Group();
      scene.add(rig);rig.add(camera);
      camera.position.set(0,0,0);camera.quaternion.identity();
      if(!isAR){
        rig.position.set(current.saved.position.x,current.saved.position.y-1.7,current.saved.position.z);
        rig.rotation.y=view.yaw;
      }
      const marker=current.marker=new THREE.Mesh(new THREE.RingGeometry(.17,.23,32).rotateX(-Math.PI/2),
        new THREE.MeshBasicMaterial({color:0xffcf78,side:THREE.DoubleSide,depthTest:false}));
      marker.visible=false;marker.renderOrder=20;scene.add(marker);
      const controller=current.controller=renderer.xr.getController(0);rig.add(controller);
      if(isAR){
        scene.background=null;
        const root=current.root=new THREE.Group();
        const contents=scene.children.filter(item=>item!==rig&&item!==marker);
        root.add(...contents);scene.add(root);
        root.scale.setScalar(.065);root.visible=false;
        const viewer=await session.requestReferenceSpace('viewer');
        current.hit=await session.requestHitTestSource({space:viewer});
        if(state!==current){current.hit.cancel();return;}
      }
      const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
      const landing=new THREE.Vector3(),head=new THREE.Vector3();
      current.aim=()=>{
        if(isAR)return;
        const origin=controller.getWorldPosition(new THREE.Vector3());
        ray.set(origin,new THREE.Vector3(0,0,-1).transformDirection(controller.matrixWorld));
        const impact=ray.ray.intersectPlane(floor,landing);
        marker.visible=!!impact&&landing.distanceTo(origin)<13&&canLand(landing.x,landing.z);
        if(marker.visible)marker.position.set(landing.x,.025,landing.z);
      };
      current.select=()=>{
        if(isAR){
          if(!marker.visible)return;
          current.root.position.copy(marker.position);
          current.root.visible=true;
        }else{
          current.aim();
          if(!marker.visible)return;
          head.setFromMatrixPosition(renderer.xr.getCamera().matrixWorld);
          rig.position.x+=landing.x-head.x;rig.position.z+=landing.z-head.z;
          rig.position.y=view.floorAt(landing.x,landing.z);
        }
      };
      controller.addEventListener('select',current.select);
      exit.hidden=false;
      onStatus(isAR?'Aim at a clear surface, then tap to place the venue.':'Aim at the floor and press the controller trigger to teleport.');
    }catch(error){
      if(current.session)await current.session.end().catch(()=>{});
      if(state===current)restore(current);
      onStatus('This browser could not start '+(isAR?'tabletop AR.':'headset VR.'));
      console.warn('Nightlife XR session failed',error);
    }
  }
  return {
    active:()=>!!state,
    frame(frame){
      if(!state||!frame)return;
      const {marker,hit,renderer,mode}=state;
      if(mode==='immersive-vr'){state.aim?.();return;}
      if(!marker||!hit)return;
      const ref=renderer.xr.getReferenceSpace();
      const pose=ref&&frame.getHitTestResults(hit)[0]?.getPose(ref);
      marker.visible=!!pose;
      if(pose)marker.position.copy(pose.transform.position);
    }
  };
};
