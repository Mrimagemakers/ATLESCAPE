'use strict';
window.addPeachXR = (parent, index, collect) => {
  if (!navigator.xr || !window.THREE) return;
  for (const [mode,label] of [['immersive-ar','Place relic in AR'],['immersive-vr','Enter VR relic scene']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.hidden = true;
    parent.append(button);
    navigator.xr.isSessionSupported(mode).then(supported=>{button.hidden=!supported;}).catch(()=>{});
    button.addEventListener('click',async ()=>{
      button.disabled = true;
      try { await openRelicSession(mode,index,collect); }
      catch { button.textContent = 'XR unavailable · Retry'; }
      finally { button.disabled = false; }
    });
  }
};

async function openRelicSession(mode,index,collect,onEnd) {
  const isAR = mode === 'immersive-ar';
  const overlay = document.querySelector('#xr-tools');
  const exit = document.querySelector('#exit-xr');
  const options = isAR
    ? {requiredFeatures:['hit-test'],optionalFeatures:['dom-overlay'],domOverlay:{root:overlay}}
    : {};
  const session = await navigator.xr.requestSession(mode,options);
  let renderer, geometry, material, hitSource, floor;
  let collected = false;
  session.addEventListener('end',()=>{
    hitSource?.cancel();
    overlay.hidden = true;
    exit.onclick = null;
    if (collected) collect();
    onEnd?.();
    queueMicrotask(()=>{
      renderer?.setAnimationLoop(null);
      renderer?.dispose();
      geometry?.dispose();
      material?.dispose(); floor?.geometry.dispose(); floor?.material.dispose();
    });
  },{once:true});
  try {
    renderer = new THREE.WebGLRenderer({canvas:document.querySelector('#xr'),alpha:true,antialias:true});
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    const scene = new THREE.Scene();
    if (!isAR) scene.background = new THREE.Color(0x191724);
    const camera = new THREE.PerspectiveCamera(60,1,.05,30);
    geometry = index === 7 ? new THREE.BoxGeometry(.2,.55,.2) : index === 5 ? new THREE.ConeGeometry(.22,.48,6) : new THREE.CylinderGeometry(.23,.23,.1,8 + index * 2);
    material = new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(.045+index*.06,.82,.62),wireframe:index !== 7});
    const relic = new THREE.Mesh(geometry,material);
    relic.position.set(0,-.12,-1.5);
    relic.visible = !isAR;
    scene.add(relic);
    if (!isAR) {
      floor = new THREE.GridHelper(12,24,0x3d5470,0x263347);
      floor.position.y = -1.45;
      scene.add(floor);
    }
    const ray = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    const target = new THREE.Vector3();
    let placed = !isAR;
    overlay.hidden = false;
    exit.onclick = ()=>session.end().catch(()=>{});
    await renderer.xr.setSession(session);
    if (isAR) hitSource = await session.requestHitTestSource({space:await session.requestReferenceSpace('viewer')});
    session.addEventListener('select',event=>{
      if (!placed && relic.visible) {
        placed = true;
        return;
      }
      if (!placed || collected) return;
      const pose = event.frame.getPose(event.inputSource.targetRaySpace,renderer.xr.getReferenceSpace());
      if (!pose) return;
      direction.set(0,0,-1).applyQuaternion(pose.transform.orientation);
      ray.set(pose.transform.position,direction);
      if (ray.intersectObject(relic).length) {
        collected = true;
        session.end().catch(()=>{});
      }
    });
    renderer.setAnimationLoop((time,frame)=>{
      if (isAR && frame && !placed) {
        const hit = frame.getHitTestResults(hitSource)[0];
        const pose = hit?.getPose(renderer.xr.getReferenceSpace());
        relic.visible = Boolean(pose);
        if (pose) {
          target.copy(pose.transform.position);
          target.y += .22;
          relic.position.copy(target);
        }
      }
      relic.rotation.y = time*.001;
      renderer.render(scene,camera);
    });
  } catch (error) {
    await session.end().catch(()=>{});
    throw error;
  }
}
