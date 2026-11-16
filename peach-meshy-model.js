import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
if(window.installMeshyPeach){
  new GLTFLoader().loadAsync(new URL('assets/georgia-peach.glb',import.meta.url).href)
    .then(({scene})=>window.installMeshyPeach(scene))
    .catch(error=>console.warn('Georgia peach unavailable',error));
}
