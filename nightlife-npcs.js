import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

window.THREE = THREE;
THREE.Cache.enabled=true;
const loader = new GLTFLoader();
window.loadAtlantaNPC = async function(anchor, name, height) {
  const {scene, animations} = await loader.loadAsync(new URL('assets/npcs/'+name+'.glb', import.meta.url).href);
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
  return {actor,mixer,walk};
};

await import('./nightlife-worlds.js?v=venue-cast');
await import('./nightlife-venues.js?v=venue-cast');
