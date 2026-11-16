'use strict';

// Stylized blocks sit over the aerial layer. Landmark coordinates remain in the map's geographic projection.
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
  const canvasMap=document.createElement('canvas');
  canvasMap.width=64;canvasMap.height=128;
  const pen=canvasMap.getContext('2d');
  pen.fillStyle='#283b51';pen.fillRect(0,0,64,128);
  for(let y=5;y<128;y+=14)for(let x=5;x<64;x+=13){
    pen.fillStyle=(x*19+y*23)%9<3?'#b68251':'#496378';
    pen.fillRect(x,y,6,5);
  }
  const facade=new T.CanvasTexture(canvasMap);
  facade.colorSpace=T.SRGBColorSpace;
  const walls=new T.MeshStandardMaterial({map:facade,roughness:.81,emissive:0x2c3140,emissiveIntensity:.22});
  const roof=new T.MeshStandardMaterial({color:0x657085,roughness:.9});
  const materials=[walls,walls,roof,roof,walls,walls];
  const instances=new T.Group();scene.add(instances);
  const unit=new T.BoxGeometry(1,1,1);
  // The roof offset exposes the side walls while maintaining exact 2D registration at ground level.
  const pos=unit.attributes.position;
  for(let i=0;i<pos.count;i++)if(pos.getY(i)>.1){pos.setX(i,pos.getX(i)+.3);pos.setZ(i,pos.getZ(i)-.3);}
  unit.computeVertexNormals();
  const hubs=[[33.7577,-84.3888],[33.7792,-84.3858],[33.7509,-84.3850]];
  const buildings=new T.InstancedMesh(unit,materials,162);
  const dummy=new T.Object3D();
  let count=0;
  hubs.forEach(([lat,lon],cluster)=>{
    const [cx,cz]=fieldPoint(lat,lon);
    for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){
      const seed=(row+4)*31+(col+4)*11+cluster*19;
      if(seed%7===0)continue;
      const h=.42+((seed*23)%29)/20+(Math.abs(row)+Math.abs(col)<3?.65:0);
      dummy.position.set(cx+col*1.36+(seed%3)*.09,h/2,cz+row*1.45);
      dummy.scale.set(.62+(seed%4)*.15,h,.56+(seed%5)*.14);
      dummy.updateMatrix();buildings.setMatrixAt(count++,dummy.matrix);
    }
  });
  buildings.count=count;instances.add(buildings);
  const pins=new T.Group();scene.add(pins);
  const halo=new T.RingGeometry(.88,1.09,32).rotateX(-Math.PI/2);
  const glow=new T.MeshBasicMaterial({color:0xffc78a,transparent:true,opacity:.55,depthTest:false});
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
    unit.dispose();halo.dispose();facade.dispose();walls.dispose();roof.dispose();glow.dispose();
    renderer.dispose();renderer.forceContextLoss();canvas.remove();
    if(disposeCityAtlas===dispose)disposeCityAtlas=null;
  }
  disposeCityAtlas=dispose;
  frame=requestAnimationFrame(paint);
  return {setDepth(value){instances.visible=value;}};
}
