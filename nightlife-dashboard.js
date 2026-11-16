import * as T from 'three';

const canvas=document.querySelector('#mogulHero');
if(canvas){
  try{ mount(canvas); }
  catch(error){console.warn('Dashboard 3D preview unavailable',error);}
}
function mount(canvas){
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.32;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,40);
  camera.position.set(0,.3,10.5);
  scene.add(new T.HemisphereLight(0xa7dfff,0x372750,2.3));
  const key=new T.DirectionalLight(0xffb77b,2.8),warm=new T.PointLight(0xff9b60,60,15);
  key.position.set(-3,4,5);warm.position.set(3,-2,4);scene.add(key,warm);
  const cyan=new T.MeshStandardMaterial({color:0xe43b48,emissive:0x921c29,emissiveIntensity:.65,metalness:.55,roughness:.25});
  const gold=new T.MeshStandardMaterial({color:0xf2ab5e,metalness:.53,roughness:.27});
  const vinyl=new T.MeshStandardMaterial({color:0x141928,metalness:.36,roughness:.34});
  const line=new T.MeshBasicMaterial({color:0xffcc71,transparent:true,opacity:.48});
  const ring=(radius,width,material)=>new T.Mesh(new T.TorusGeometry(radius,width,8,64),material);
  const record=new T.Group();
  const disc=new T.Mesh(new T.CylinderGeometry(1.08,1.08,.075,64),vinyl);
  disc.rotation.x=Math.PI/2;record.add(disc);
  for(const radius of [.32,.44,.55,.66,.77,.88,.98,1.065]){
    const groove=ring(radius,radius>1?.016:.006,radius>1?cyan:line);groove.position.z=.044;record.add(groove);
  }
  const label=new T.Mesh(new T.CircleGeometry(.258,40),gold);label.position.z=.046;record.add(label);
  const spindle=new T.Mesh(new T.CircleGeometry(.046,20),vinyl);spindle.position.z=.049;record.add(spindle);
  const phones=new T.Group();
  const band=new T.Mesh(new T.TorusGeometry(.72,.073,10,44,Math.PI),gold);phones.add(band);
  for(const side of [-1,1]){
    const cup=new T.Mesh(new T.SphereGeometry(1,20,12),cyan);
    cup.scale.set(.19,.34,.21);cup.position.set(side*.68,-.18,0);phones.add(cup);
    const pad=new T.Mesh(new T.SphereGeometry(1,16,10),vinyl);
    pad.scale.set(.12,.29,.2);pad.position.set(side*.54,-.18,0);phones.add(pad);
  }
  const peach=new T.Group();
  const fruit=new T.Mesh(new T.IcosahedronGeometry(.27,1),gold);peach.add(fruit);
  const leaf=new T.Mesh(new T.SphereGeometry(1,12,8),cyan);leaf.scale.set(.21,.065,.09);leaf.position.set(.09,.27,0);leaf.rotation.z=.45;peach.add(leaf);
  const orbit=ring(1.23,.008,line);orbit.scale.y=.36;orbit.rotation.z=-.39;
  orbit.position.set(.05,-.36,-.45);
  const outer=ring(1.71,.009,line);outer.scale.y=.7;outer.rotation.z=.38;outer.position.set(.12,.18,-1.15);
  scene.add(record,phones,peach,orbit,outer);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let inView=true,frame=0;
  function draw(ms){
    const seconds=reduced.matches?0:ms/1000;
    record.position.set(-.55,.02+Math.sin(seconds*1.2)*.13,0);
    record.rotation.set(.21,-.33+Math.sin(seconds*.73)*.18,seconds*.34);
    phones.position.set(.98,.08+Math.sin(seconds*1.36+1)*.12,.4);
    phones.rotation.set(.18,Math.sin(seconds*.85)*.29,-.23);
    peach.position.set(1.56,-.78+Math.sin(seconds*1.8)*.13,0);
    peach.rotation.y=seconds*.95;
    renderer.render(scene,camera);
  }
  function update(){
    if(frame||!inView||document.hidden)return;
    frame=requestAnimationFrame(t=>{frame=0;draw(t);if(!reduced.matches)update();});
  }
  const resize=new ResizeObserver(()=>{
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1.35?13:10.5;camera.updateProjectionMatrix();update();}
  });
  resize.observe(canvas);
  const visibility=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update();});
  visibility.observe(canvas);
  reduced.addEventListener('change',update);
  document.addEventListener('visibilitychange',update);
  update();
}
