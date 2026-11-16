'use strict';
function peachIcon(name){
  const paths={
    map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15',
    markets:'M3 9l3-5h12l3 5M4 10v10h16V10M9 20v-6h6v6M3 9h18',
    challenges:'M12 2l2 7h7l-6 4 2 7-5-4-5 4 2-7-6-4h7z',
    hunt:'M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13zM12 6v6m-3-3h6',
    trail:'M5 21L9 3m6 18 4-18M11 6h4m-5 6h4m-5 6h4',
    city:'M3 21v-9h6v9m0 0V4h7v17m0 0v-9h5v9M12 8h1m-1 4h1',
    tours:'M2 6h20v12h-6l-4-3-4 3H2zM5 11h4m6 0h4',
    videos:'M4 5h16v14H4zM10 9l5 3-5 3z',
    vault:'M4 4h16v16H4zM8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z',
    arcade:'M6 7h12l4 10-4 2-4-4h-4l-4 4-4-2zM7 9v5m-2-2h4m7-1h1m1 2h1',
    coach:'M4 4h16v12H9l-5 4zM8 9h8m-8 4h5',
    quests:'M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5',
    profile:'M8 8a4 4 0 1 1 8 0 4 4 0 1 1-8 0zM4 21a8 8 0 0 1 16 0'
  };
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
  for(const [k,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linejoin':'round','stroke-linecap':'round','aria-hidden':'true',class:'peach-icon'}))svg.setAttribute(k,v);
  path.setAttribute('d',paths[name]||paths.map);svg.append(path);return svg;
}
document.querySelectorAll('[data-tab],[data-peach-icon]').forEach(node=>node.prepend(peachIcon(node.dataset.tab||node.dataset.peachIcon)));
document.querySelectorAll('[data-open-tab]').forEach(node=>node.onclick=()=>{
  document.querySelector('#tabs [data-tab="'+node.dataset.openTab+'"]')?.click();
  document.querySelector('#quest').scrollIntoView({block:'start'});
});
(function(){
  const canvas=document.querySelector('#peachHeroArt'),T=window.THREE;
  if(!canvas||!T)return;
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,30);camera.position.z=7;
  scene.add(new T.HemisphereLight(0xd7f5ff,0x592c50,2.5));
  const key=new T.DirectionalLight(0xffdfba,2.9);key.position.set(-2,3,4);scene.add(key);
  const fruit=new T.Group();
  const peach=new T.Mesh(new T.IcosahedronGeometry(.66,2),new T.MeshStandardMaterial({color:0xff925f,metalness:.26,roughness:.32,flatShading:true}));
  const leaf=new T.Mesh(new T.SphereGeometry(.3,14,8),new T.MeshStandardMaterial({color:0x62cba1,metalness:.28,roughness:.37}));
  leaf.scale.set(1,.23,.38);leaf.position.set(.23,.68,.02);leaf.rotation.z=.45;fruit.add(peach,leaf);scene.add(fruit);
  const rings=new T.Group(),wire=new T.MeshBasicMaterial({color:0x61dff6,transparent:true,opacity:.55});
  for(const r of [1.02,1.48]){
    const ring=new T.Mesh(new T.TorusGeometry(r,.009,7,60),wire);ring.scale.y=.58;ring.rotation.z=r>1.2?-.33:.38;rings.add(ring);
  }
  scene.add(rings);
  const satellites=Array.from({length:3},(_,i)=>{
    const item=new T.Mesh(new T.OctahedronGeometry(.115+i*.033),new T.MeshStandardMaterial({color:i===1?0xf9b678:0x70e9f8,metalness:.4,roughness:.25}));
    scene.add(item);return item;
  });
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=true,pending=false;
  function update(){
    if(pending||!visible||document.hidden)return;
    pending=true;requestAnimationFrame(ms=>{
      pending=false;
      const t=motion.matches?0:ms/1000;
      fruit.position.y=Math.sin(t*1.2)*.12;fruit.rotation.set(.13,Math.sin(t*.7)*.36,t*.24);
      rings.rotation.set(.25,.18,Math.sin(t*.45)*.17);
      satellites.forEach((item,i)=>{
        const angle=i*2.09+t*(.36+i*.08);item.position.set(Math.cos(angle)*1.43,Math.sin(angle)*.84,.1);item.rotation.y=t*.7+i;
      });
      renderer.render(scene,camera);if(!motion.matches)update();
    });
  }
  new ResizeObserver(()=>{const {clientWidth:w,clientHeight:h}=canvas;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=w/h<1.2?9.6:7;camera.updateProjectionMatrix();update();}).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();}).observe(canvas);
  motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);update();
})();
