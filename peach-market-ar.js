'use strict';

async function openPeachMarketAR(){
  const overlay=document.querySelector('#xr-tools'),exit=document.querySelector('#exit-xr');
  const hint=add(overlay,'p','Scan a level surface and tap to place the market map.');
  hint.className='market-ar-hint';
  let session,renderer,hit,scene;
  try{
    session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test'],optionalFeatures:['dom-overlay'],domOverlay:{root:overlay}});
    session.addEventListener('end',()=>{
      hit?.cancel();renderer?.setAnimationLoop(null);
      const resources=new Set();
      scene?.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){if(o.material.map)resources.add(o.material.map);resources.add(o.material);}});
      for(const item of resources)item.dispose();
      renderer?.dispose();overlay.hidden=true;hint.remove();exit.onclick=null;
    },{once:true});
    renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#xr'),alpha:true,antialias:true});
    renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');await renderer.xr.setSession(session);
    const viewer=await session.requestReferenceSpace('viewer');
    hit=await session.requestHitTestSource({space:viewer});
    scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera();
    scene.add(new THREE.HemisphereLight(0xf1f6ff,0x485364,2.5));
    const root=new THREE.Group();root.visible=false;scene.add(root);
    const mini=new THREE.Group();mini.scale.setScalar(.0075);mini.position.set(-.375,0,-.375);root.add(mini);
    const base=new THREE.Mesh(new THREE.BoxGeometry(100,.7,100),new THREE.MeshStandardMaterial({color:0x17394f}));
    base.position.set(50,-.35,50);mini.add(base);
    atlantaFootprints().then(data=>{if(renderer.xr.getSession()===session)mini.add(new THREE.Mesh(makeAtlantaFootprints(THREE,data),new THREE.MeshStandardMaterial({color:0x7eaabf})));}).catch(()=>{});
    for(const [name,lat,lon,trail] of peachMarkets){
      const [x,z]=fieldPoint(lat,lon);
      const pin=new THREE.Mesh(new THREE.CylinderGeometry(.83,1.25,3,16),new THREE.MeshBasicMaterial({color:0xffad73}));
      pin.position.set(x,1.5,z);mini.add(pin);
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;const c=canvas.getContext('2d');
      c.fillStyle='#12253b';c.fillRect(0,0,512,112);c.fillStyle='#f7fbff';c.font='bold 32px sans-serif';c.fillText(name,18,43,475);
      c.fillStyle='#ffb681';c.font='24px sans-serif';c.fillText(trail,18,79,475);
      const material=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false});
      material.map.colorSpace=THREE.SRGBColorSpace;
      const label=new THREE.Sprite(material);label.position.set(x,8,z);label.scale.set(22,4.8,1);mini.add(label);
    }
    const reticle=new THREE.Mesh(new THREE.RingGeometry(.045,.06,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffbc82}));
    reticle.visible=false;scene.add(reticle);
    session.addEventListener('select',()=>{
      if(!reticle.visible)return;
      root.position.copy(reticle.position);root.visible=true;
      hint.textContent='Market map placed. Tap another detected surface to move it.';
    });
    exit.onclick=()=>session.end().catch(()=>{});overlay.hidden=false;
    renderer.setAnimationLoop((time,frame)=>{
      if(frame){const ref=renderer.xr.getReferenceSpace(),pose=ref&&frame.getHitTestResults(hit)[0]?.getPose(ref);
        reticle.visible=!!pose;if(pose)reticle.position.copy(pose.transform.position);
      }
      renderer.render(scene,camera);
    });
  }catch(error){
    if(session)await session.end().catch(()=>{});
    else hint.remove();
    throw error;
  }
}
