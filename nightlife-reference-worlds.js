'use strict';
window.atlReferenceVenues={
  aquarium:{model:'camila-reyes',name:'Aquarium Night',district:'Centennial Park District',npc:'Zora James',job:'service',line:'The best view is along the main glass. VIP service starts at the benches.',width:24,depth:15},
  penthouse:{model:'nia-wallace',name:'Penthouse Loft',district:'Midtown',npc:'Avery Sloan',job:'service',line:'Take the right-hand staircase for the mezzanine, or head left to the pool terrace.',width:22,depth:20},
  escape:{model:'evan-mckay',name:'The Escape Room',district:'Sweet Auburn',npc:'Morgan Price',job:null,line:'Check the switching lamps, the framed map, and the cipher board before opening the vault.',width:13,depth:13}
};
window.buildAtlReference=function(id,{T,Tex,Props,Lounge,replaceFixture}){
  const group=new T.Group(),blocks=[];
  const config=window.atlReferenceVenues[id];
  const {width:w,depth:d}=config,back=4-d;
  const solid=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.63,...extra});
  const lit=color=>new T.MeshBasicMaterial({color});
  const box=(x,y,z,a,b,c,mat)=>{
    const m=new T.Mesh(new T.BoxGeometry(a,b,c),mat);m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;
  };
  const block=(x,z,w,d)=>blocks.push([x-w/2-.22,x+w/2+.22,z-d/2-.22,z+d/2+.22]);
  const plate=(lines,x,y,z,width,height)=>{
    const [canvas,ctx]=Tex.canvas(768,320);
    ctx.fillStyle='#1b1522';ctx.fillRect(0,0,768,320);
    ctx.strokeStyle='#f5be72';ctx.lineWidth=9;ctx.strokeRect(8,8,752,304);
    ctx.textAlign='center';ctx.fillStyle='#ffe2af';
    lines.forEach((line,i)=>{ctx.font=(i===0?'bold 61':'37')+'px Georgia';ctx.fillText(line,384,94+i*73,710);});
    const panel=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:Tex.make(canvas)}));
    panel.position.set(x,y,z);group.add(panel);return panel;
  };
  const walnut=solid(0x7c593c,{map:Tex.make(Tex.wood(),{repeat:[3,2]})});
  const stone=solid(0x575565,{map:Tex.make(Tex.marble(),{repeat:[3,3]}),roughness:.35});
  const brass=solid(0xc89b55,{metalness:.63,roughness:.37});
  const ink=solid(0x262130);
  const light=(c,i,x,y,z,r)=>{const o=new T.PointLight(c,i,r,2);o.position.set(x,y,z);group.add(o);};
  const roofHeight=id==='penthouse'?7.1:id==='aquarium'?6.2:3.8;
  box(0,-.12,4-d/2,w,.24,d,id==='escape'?walnut:stone);
  for(const side of [-1,1])box(side*w/2,roofHeight/2,4-d/2,.24,roofHeight,d,ink);
  box(0,roofHeight,4-d/2,w,.22,d,ink);
  box(0,roofHeight/2,4,w,roofHeight,.24,ink);
  let update=()=>{},unlock,floorAt=()=>0;
  if(id==='aquarium'){
    const glass=solid(0x7ed5ff,{transparent:true,opacity:.16,metalness:.36,side:T.DoubleSide,depthWrite:false});
    const water=lit(0x09394f),sand=solid(0x667a6b);
    const windowZ=back+3.25;
    box(0,2.95,windowZ,w-1.2,5.15,.06,glass);
    box(0,2.8,back+.04,w,5.6,.14,water);
    box(0,.05,back+1.6,w-1.3,.3,3.2,sand);
    box(0,.24,windowZ,w-.9,.4,.22,brass);
    box(0,5.55,windowZ,w-.9,.12,.22,brass);
    for(const x of [-11,-5.5,0,5.5,11])box(x,2.9,windowZ,.065,5.25,.12,brass);
    block(0,back+1.6,w,3.5);
    for(let i=0;i<23;i++){
      const coral=new T.Mesh(new T.IcosahedronGeometry(.31+(i%4)*.12,1),solid([0x287f81,0x796da1,0xc67e81][i%3]));
      coral.scale.set(.63,1.1+(i%3)*.3,.69);coral.position.set(-10+i*.91,.3,back+1+(i%3)*.36);group.add(coral);
    }
    const fish=[];
    for(let i=0;i<25;i++){
      const animal=new T.Group(),large=i===0;
      const bodyMat=solid(large?0x57758a:[0x62c5dd,0xe6ba76,0x7497c4][i%3]);
      const body=new T.Mesh(new T.SphereGeometry(1,16,10),bodyMat);
      body.scale.set(large?1.65:.2,large?.43:.075,large?.46:.09);animal.add(body);
      const tail=new T.Mesh(new T.ConeGeometry(large?.46:.08,large?.74:.17,5),bodyMat);
      tail.rotation.z=-Math.PI/2;tail.position.x=large?-1.61:-.24;animal.add(tail);
      if(large)for(let k=0;k<36;k++){
        const dot=new T.Mesh(new T.SphereGeometry(.034,6,4),lit(0xc4dce3));
        const x=(k%12-5.5)*.205,a=Math.floor(k/12)*.64+.36;
        const r=Math.sqrt(1-(x/1.65)**2);
        dot.position.set(x,.45*Math.cos(a)*r,.46*Math.sin(a)*r);animal.add(dot);
      }
      fish.push([animal,tail]);group.add(animal);
    }
    plate(['AQUARIUM NIGHT','Centennial Park District'],0,5.96,windowZ+.2,6.7,1);
    for(const x of [-6,6]){
      box(x,.3,1.25,4.2,.58,.78,walnut);box(x,.67,1.55,4.2,.48,.14,ink);block(x,1.25,4.2,.78);
    }
    light(0x42c9ff,137,0,4,windowZ+1,22);light(0xffbc83,59,3,3,1,13);
    update=time=>fish.forEach(([animal,tail],i)=>{
      const t=time*(i===0?.18:.36)+(i*1.34);
      animal.position.set(Math.sin(t)*(i===0?7.8:10),i===0?3.25:1+(i%7)*.55,back+1.5+Math.cos(t)*.8);
      animal.rotation.y=Math.cos(t)>=0?0:Math.PI;
      tail.rotation.y=Math.sin(time*7+i)*.25;
    });
  }else if(id==='penthouse'){
    const skyline=new T.Mesh(new T.CylinderGeometry(42,42,23,60,1,true),new T.MeshBasicMaterial({map:Tex.make(Tex.skyline()),transparent:true,side:T.BackSide,fog:false}));
    skyline.position.y=-4;group.add(skyline);
    const glass=solid(0x86b6d8,{transparent:true,opacity:.17,depthWrite:false});
    box(0,3.36,back,w,6.7,.12,glass);
    for(let x=-10;x<=10;x+=2)box(x,3.36,back+.12,.061,6.7,.12,brass);
    box(5.75,2.56,-10.65,10.25,.28,7.1,walnut);
    box(5.75,3.23,-7.05,10.25,1.05,.085,glass);
    box(5.75,3.79,-7.05,10.25,.055,.11,brass);
    const stairX=7.72,near=-1.5,far=-7.1,steps=14,run=(near-far)/steps;
    for(let i=0;i<steps;i++){
      const h=(i+1)*2.7/steps;
      box(stairX,h/2,near-(i+.5)*run,2.15,h,run+.01,stone);
    }
    floorAt=(x,z)=>x>6.6&&x<8.83&&z<near&&z>far?Math.min(2.7,Math.ceil((near-z)/run)*2.7/steps):
      x>.64&&z<=far&&z>=-14.2?2.7:0;
    for(const z of [-3.1,-5.4])box(6.55,1+(near-z)*.4,z,.06,1.27,.06,brass);
    const rail=box(6.55,2.3,-4.3,.064,.075,6.15,brass);rail.rotation.x=-.44;
    const pool=solid(0x0e859a,{roughness:.16,metalness:.38,emissive:0x175265,emissiveIntensity:.45});
    box(-8.2,.033,-7.25,4.1,.065,6.4,pool);block(-8.2,-7.25,4.1,6.4);
    for(const x of [-10.25,-6.15])box(x,.12,-7.25,.14,.24,6.55,brass);
    box(-8.2,.12,-4.02,4.25,.24,.14,brass);box(-8.2,.12,-10.48,4.25,.24,.14,brass);
    if(window.loadNightlifeFurniture){
      const base=box(-2.8,.27,-7.2,3.2,.54,.94,walnut);
      const cushion=box(-2.8,.56,-7.2,3.18,.19,.92,solid(0xd9c6a0));
      replaceFixture(group,[base,cushion],'rooftop-lounge-sofa',-2.8,-7.2,3.2,.9,.96,Math.PI);
    }else box(-2.8,.36,-7.2,3.2,.72,.95,walnut);
    block(-2.8,-7.2,3.2,.96);
    box(1.9,.54,-1.7,3.3,1.08,1.05,walnut);box(1.9,1.1,-1.7,3.46,.07,1.14,stone);block(1.9,-1.7,3.46,1.14);
    plate(['PEACHTREE PENTHOUSE','Midtown skyline terrace'],0,4.72,back+.21,6.3,1.2);
    light(0xffba79,125,-3,5,-4,25);light(0x60cbed,117,-8,3,-9,17);
    for(let i=0;i<14;i++){
      const bulb=new T.Mesh(new T.SphereGeometry(.075,8,6),lit(0xffc887));
      const a=i*Math.PI/7;bulb.position.set(Math.cos(a)*.97,5.6-(i%3)*.2,-4+Math.sin(a)*.97);group.add(bulb);
    }
  }else{
    box(0,1.9,back,w,3.8,.23,walnut);
    const clueZ=back+.25;
    plate(['SWEET AUBURN','The city’s area code: 404'],-3.5,2.37,clueZ,3.4,1.36);
    plate(['THE CIPHER','Q F B D I','Shift each letter back one'],3.25,2.3,clueZ,3.65,1.55);
    const colors=[0xffc45e,0xf04255,0x519afb];
    const lamps=colors.map((color,i)=>{
      const lamp=new T.Mesh(new T.SphereGeometry(.16,14,10),solid(color,{emissive:color,emissiveIntensity:.25}));
      lamp.position.set((i-1)*.55,1.53,back+.71);group.add(lamp);return lamp;
    });
    box(0,1.29,back+.68,2.02,.13,.47,walnut);
    for(const side of [-1,1]){
      const x=side*5.65;
      box(x,1.45,-4.2,.63,2.9,3.4,walnut);block(x,-4.2,.65,3.4);
      for(let row=0;row<5;row++)for(let i=0;i<12;i++){
        box(x-side*.36,.33+row*.51,-5.6+i*.248,.12,.28+(i%3)*.03,.18,solid([0x6b2d36,0x355b4e,0x976349][(i+row)%3]));
      }
    }
    box(-2.12,.77,-6.05,2.7,.14,1.07,walnut);block(-2.12,-6.05,2.7,1.07);
    for(const x of [-3.26,-1])box(x,.37,-6.05,.16,.74,.92,brass);
    const vault=new T.Group();vault.position.set(2.9,0,-5.45);group.add(vault);block(2.9,-5.45,1.95,.87);
    const leaf=new T.Mesh(new T.BoxGeometry(1.7,2.45,.19),solid(0x423f4a,{metalness:.68}));
    leaf.position.set(.85,1.24,0);const hinge=new T.Group();hinge.position.x=-.85;hinge.add(leaf);vault.add(hinge);
    const wheel=new T.Mesh(new T.TorusGeometry(.24,.036,8,24),brass);wheel.position.set(0,0,.12);leaf.add(wheel);
    plate(['ATL VAULT'],2.9,2.79,-5.32,2.05,.66);
    light(0xffbc76,110,0,3.1,-5.3,18);light(0x835cc2,31,4,2,1.1,12);
    update=time=>lamps.forEach((lamp,i)=>{lamp.material.emissiveIntensity=Math.floor(time*1.65)%5===i?3.1:.22;});
    unlock=()=>{hinge.rotation.y=1.17;};
  }
  const host=Lounge.person(group,1.9,0,1.35,-.22,'talk',{look:{jacket:id==='aquarium'?0x376079:0x6a4358}});
  if(id!=='escape')for(let i=0;i<6;i++)Lounge.guest(group,(i%2?1:-1)*(2.1+(i%3)*1.17),0,-.2-Math.floor(i/2)*1.25,.27,'dance');
  return {group,host,blocks,floorAt,update,unlock,fog:new T.FogExp2(id==='aquarium'?0x102e43:0x171222,.018)};
};
