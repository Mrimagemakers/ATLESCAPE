import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

import {bindGuest,danceJoints,createVenueDancer} from './nightlife-dance.js?v=grounded-dancers';

window.THREE = THREE;
window.createVenueDancer=createVenueDancer;
THREE.Cache.enabled=true;
const loader = new GLTFLoader();
const models=new Map();
window.loadNightlifeFurniture=async function(name,width,height,depth){
  const {scene}=await loader.loadAsync(new URL('assets/furniture/'+name+'.glb',import.meta.url).href);
  const bounds=new THREE.Box3().setFromObject(scene,true);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(!size.toArray().every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid furniture bounds');
  const wrapper=new THREE.Group();
  wrapper.add(scene);
  const scale=new THREE.Vector3(width/size.x,height/size.y,depth/size.z);
  scene.scale.multiply(scale);
  scene.position.set(-center.x*scale.x,-bounds.min.y*scale.y,-center.z*scale.z);
  scene.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
  return wrapper;
};
function loadModel(name){
  if(!models.has(name))models.set(name,loader.loadAsync(new URL("assets/npcs/"+name+".glb",import.meta.url).href).then(model=>{bindGuest(model.scene);return model;}).catch(error=>{models.delete(name);throw error;}));
  return models.get(name);
}
window.loadAtlantaNPC = async function(anchor, name, height) {
  const source=await loadModel(name);
  const scene=cloneSkeleton(source.scene),{animations}=source;
  let head,spine;
  scene.traverse(node=>{
    if(node.isBone){
      if(/(?:[:_]|^)Head$/i.test(node.name))head=node;
      if(/(?:[:_]|^)Spine2$/i.test(node.name))spine=node;
    }
    if(!node.isMesh)return;
    node.userData.sharedNPCGeometry=true;
    node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();
  });
  const wrap = new THREE.Group();
  wrap.add(scene);
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene, true);
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = height / (bounds.max.y - bounds.min.y);
  if(!Number.isFinite(scale) || scale <= 0) throw new Error('Invalid NPC height');
  wrap.scale.setScalar(scale);
  wrap.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  const actor = new THREE.Group();
  actor.add(wrap);
  const mixer = new THREE.AnimationMixer(scene);
  const walk = THREE.AnimationClip.findByName(animations,'Walking')?.clone();
  if(walk){
    for(const track of walk.tracks){
      if(!/hips.*\.position$/i.test(track.name)) continue;
      for(let i=0;i<track.values.length;i+=3){
        track.values[i]=track.values[0];
        track.values[i+2]=track.values[2];
      }
    }
  }
  return {actor,mixer,walk,head,spine,joints:danceJoints(scene)};
};

await import('./nightlife-worlds.js?v=meshy-furniture');
await import('./nightlife-xr.js?v=dance-xr');
await import('./nightlife-venues.js?v=dashboard');
