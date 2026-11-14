'use strict';

const file=document.querySelector('#videoFile');
const watch=document.querySelector('#watch');
const status=document.querySelector('#videoStatus');
const surface=document.querySelector('#videoView');
let cleanup=null;
file.addEventListener('change',()=>{watch.disabled=!file.files.length;status.textContent='';});
watch.onclick=async()=>{
  if(cleanup || !file.files.length) return;
  watch.disabled=true;
  let renderer,viewer,video,url,texture,geometry,material;
  const resize=()=>renderer.setSize(innerWidth,innerHeight,false);
  cleanup=()=>{
    window.removeEventListener('resize',resize);
    viewer?.stop();
    renderer?.setAnimationLoop(null);
    renderer?.dispose();
    video?.pause();
    if(video){video.removeAttribute('src');video.load();}
    texture?.dispose();
    geometry?.dispose();
    material?.dispose();
    if(url) URL.revokeObjectURL(url);
    surface.hidden=true;
    watch.disabled=false;
    cleanup=null;
  };
  try {
    renderer=new THREE.WebGLRenderer({canvas:surface.querySelector('canvas')});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    viewer=createCardboardView(renderer,surface);
    video=document.createElement('video');
    url=URL.createObjectURL(file.files[0]);
    video.src=url;
    video.playsInline=true;
    const motion=viewer.start();
    const playback=video.play().then(()=>null,error=>error);
    await motion;
    const playbackError=await playback;
    if(playbackError) throw playbackError;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(76,1,.05,60);
    texture=new THREE.VideoTexture(video);
    texture.colorSpace=THREE.SRGBColorSpace;
    geometry=new THREE.SphereGeometry(30,48,32);
    geometry.scale(-1,1,1);
    material=new THREE.MeshBasicMaterial({map:texture});
    scene.add(new THREE.Mesh(geometry,material));
    surface.hidden=false;
    resize();
    window.addEventListener('resize',resize);
    document.querySelector('#centerVideo').onclick=()=>viewer.recenter();
    renderer.setAnimationLoop(()=>{viewer.orientation(camera);viewer.render(scene,camera);});
    video.addEventListener('ended',()=>cleanup?.(),{once:true});
  }catch(error){
    cleanup?.();
    status.textContent=error.message || 'This video could not be played.';
  }
};
document.querySelector('#closeVideo').onclick=()=>cleanup?.();
window.addEventListener('keydown',e=>{if(e.key==='Escape')cleanup?.();});
