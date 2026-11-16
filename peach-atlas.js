'use strict';
let atlantaFootprintData;
function atlantaFootprints(){
  return atlantaFootprintData??=fetch('assets/atlanta-footprints.json').then(r=>{
    if(!r.ok)throw Error('Atlanta footprints unavailable');
    return r.json();
  }).catch(e=>{atlantaFootprintData=null;throw e;});
}
function makeAtlantaFootprints(T,polygons,shear=0){
  const vertices=[];
  for(const rings of polygons){
    const points=rings.map(ring=>ring.slice(0,-1).map(([lon,lat])=>{
      const [x,z]=fieldPoint(lat,lon);
      return new T.Vector2(x,-z);
    }));
    if(points[0].length<3)continue;
    const shape=new T.Shape(points[0]);
    shape.holes=points.slice(1).filter(r=>r.length>=3).map(r=>new T.Path(r));
    const height=T.MathUtils.clamp(Math.sqrt(Math.abs(T.ShapeUtils.area(points[0])))*.36,.09,1.05);
    const geometry=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}).rotateX(-Math.PI/2);
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const y=p.getY(i);
      vertices.push(p.getX(i)+y*shear,y,p.getZ(i)-y*shear);
    }
    geometry.dispose();
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  return geometry;
}


// Building footprints and landmarks share the aerial map projection.
let disposeCityAtlas;
function mountCityAtlas(board) {
  disposeCityAtlas?.();
  if(!window.THREE) return null;
  const T=window.THREE;
  let renderer;
  try { renderer=new T.WebGLRenderer({alpha:true,antialias:true}); }
  catch { return null; }
  const canvas=renderer.domElement;
  canvas.className='city-atlas-canvas';
  canvas.setAttribute('aria-hidden','true');
  board.append(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setClearColor(0,0);
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(0,100,100,0,.1,140);
  camera.position.set(0,90,100);
  camera.up.set(0,0,-1);
  camera.lookAt(0,0,100);
  const ambient=new T.HemisphereLight(0xc9e2ef,0x2e283f,1.85);
  const key=new T.DirectionalLight(0xffce9b,2.2);
  key.position.set(-50,80,55);
  scene.add(ambient,key);
  const instances=new T.Group();scene.add(instances);
  const buildings=new T.MeshStandardMaterial({color:0x62acc9,emissive:0x103e52,emissiveIntensity:.46,roughness:.75,transparent:true,opacity:.84});
  let footprints;
  atlantaFootprints().then(data=>{
    if(!active)return;
    footprints=makeAtlantaFootprints(T,data,.71);
    instances.add(new T.Mesh(footprints,buildings));
  }).catch(error=>console.warn('City building layer unavailable',error));
  const pins=new T.Group();scene.add(pins);
  const halo=new T.RingGeometry(.88,1.09,32).rotateX(-Math.PI/2);
  const glow=new T.MeshBasicMaterial({color:0xffc78a,transparent:true,opacity:.68,depthTest:false});
  fieldSites.forEach(([,lat,lon])=>{
    const [x,z]=fieldPoint(lat,lon);
    const ring=new T.Mesh(halo,glow);ring.position.set(x,3,z);pins.add(ring);
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,active=true;
  const resize=()=>renderer.setSize(Math.max(1,board.clientWidth),Math.max(1,board.clientHeight),false);
  const observer=new ResizeObserver(resize);
  resize();observer.observe(board);
  function paint(time){
    if(!board.isConnected){dispose();return;}
    glow.opacity=reduced.matches?.55:.46+.17*Math.sin(time*.0024);
    renderer.render(scene,camera);
    frame=requestAnimationFrame(paint);
  }
  function dispose(){
    if(!active)return;
    active=false;cancelAnimationFrame(frame);observer.disconnect();
    footprints?.dispose();buildings.dispose();halo.dispose();glow.dispose();
    renderer.dispose();renderer.forceContextLoss();canvas.remove();
    if(disposeCityAtlas===dispose)disposeCityAtlas=null;
  }
  disposeCityAtlas=dispose;
  frame=requestAnimationFrame(paint);
  return {setDepth(value){instances.visible=value;}};
}
