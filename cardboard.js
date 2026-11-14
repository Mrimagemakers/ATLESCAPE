'use strict';

window.createCardboardView = function(renderer, surface) {
  const pose=new THREE.Quaternion(), correction=new THREE.Quaternion();
  const screenAxis=new THREE.Vector3(0,0,1);
  const upright=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  const angles=new THREE.Euler(0,0,0,'YXZ');
  const stereo=new THREE.StereoCamera();
  stereo.aspect=.5;
  const forward=new THREE.Vector3();
  let reading=null, heading=null;
  const listen=e=>{
    if([e.alpha,e.beta,e.gamma].every(Number.isFinite)) reading=e;
  };
  function orientation(camera) {
    if(!reading) return false;
    const rad=Math.PI/180;
    const screenAngle=screen.orientation?.angle ?? window.orientation ?? 0;
    angles.set(reading.beta*rad,reading.alpha*rad,-reading.gamma*rad,'YXZ');
    pose.setFromEuler(angles).multiply(upright).multiply(correction.setFromAxisAngle(screenAxis,-screenAngle*rad));
    forward.set(0,0,-1).applyQuaternion(pose);
    heading ??= Math.atan2(forward.x,-forward.z);
    camera.quaternion.copy(pose).premultiply(correction.setFromAxisAngle(new THREE.Vector3(0,1,0),heading));
    return true;
  }
  return {
    async start(){
      const sensor=window.DeviceOrientationEvent;
      if(!window.isSecureContext || !sensor) throw new Error('Open this page over HTTPS on a phone with motion sensors.');
      if(typeof sensor.requestPermission==='function' && await sensor.requestPermission()!=='granted') {
        throw new Error('Allow motion access to use Cardboard head tracking.');
      }
      window.addEventListener('deviceorientation',listen);
      for(let attempt=0;!reading && attempt<20;attempt++){
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      if(!reading){
        window.removeEventListener('deviceorientation',listen);
        throw new Error('No motion data received. Check your phone browser’s motion settings and try again.');
      }
      surface.classList.add('cardboard-active');
    },
    stop(){
      window.removeEventListener('deviceorientation',listen);
      surface.classList.remove('cardboard-active');
      reading=heading=null;
    },
    recenter(){heading=null;},
    orientation,
    render(scene,camera){
      const size=renderer.getSize(new THREE.Vector2());
      const half=Math.floor(size.x/2);
      camera.aspect=size.x/size.y;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      stereo.update(camera);
      renderer.setScissorTest(true);
      try {
        for(const [eye,x,width] of [[stereo.cameraL,0,half],[stereo.cameraR,half,size.x-half]]){
          renderer.setViewport(x,0,width,size.y);
          renderer.setScissor(x,0,width,size.y);
          renderer.render(scene,eye);
        }
      }finally{
        renderer.setScissorTest(false);
        renderer.setViewport(0,0,size.x,size.y);
        renderer.setScissor(0,0,size.x,size.y);
      }
    }
  };
};
