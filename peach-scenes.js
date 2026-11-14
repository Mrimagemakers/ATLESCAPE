'use strict';

// Coordinates are local to the playable scene, in meters.
function buildPeachLandmark(index, {box,mesh}) {
  const palette = [0x9eb9c4,0xa6bdc4,0x444451,0xacc7cf,0x9bb4bc,0xa3bacb,0xb2c4c6,0x494454];
  const floor = [0x333d45,0x3c5240,0x33343d,0x445344,0x42563f,0x405844,0x466044,0x392c32];
  const blocked = [];
  const solid = (x,y,z,w,h,d,color) => {
    const object=box(x,y,z,w,h,d,color);
    blocked.push({x,z,w,d,object});
    return object;
  };
  const cylinder=(x,y,z,top,bottom,height,color,segments=10)=>
    mesh(new THREE.CylinderGeometry(top,bottom,height,segments),color,x,y,z);
  const tree=(x,z,size=1)=>{
    cylinder(x,.8*size,z,.11*size,.19*size,1.6*size,0x54413c,7);
    for(let k=0;k<6;k++){
      const a=k*2.4, spread=k===0?0:.61;
      const crown=mesh(new THREE.IcosahedronGeometry((k===0?.9:.65)*size,1),
        [0x304a2d,0x45613a,0x527747][k%3],x+Math.cos(a)*spread*size,(2.15+k%3*.35)*size,z+Math.sin(a)*spread*size);
      crown.scale.set(1,.85,1);
    }
  };
  const path=(x,z,w,d,color=0x8b8581)=>box(x,.012,z,w,.024,d,color);
  const lamp=(x,z)=>{
    cylinder(x,1.26,z,.038,.06,2.52,0x314855,6);
    box(x,2.55,z,.26,.16,.26,0xffcb86);
  };
  const skyline=(z)=>{
    for(let j=0;j<15;j++){
      const x=(j-7)*2.8, h=2.8+(j*13)%8*.82;
      box(x,h/2,z+(j%3)*.75,2.4,h,2.15,j%2?0x304b5e:0x41586a);
      for(let k=1;k<h;k+=.8) box(x,k,z+1.12+(j%3)*.75,1.55,.06,.026,0x6b8a92);
    }
    cylinder(2,7.6,z+2,0,.19,2.7,0xc9ae89,6);
  };
  const brickWall=(x,z,w,h,d)=>{
    solid(x,h/2,z,w,h,d,0x88504b);
    for(let y=.42;y<h;y+=.42) box(x,y,z+d/2+.013,w,.028,.025,0x6b4144);
  };
  const arch=(x,z,r,color)=>{
    const shape=new THREE.TorusGeometry(r,.26,6,20,Math.PI);
    mesh(shape,color,x,1.3,z);
    for(const direction of [-1,1]) solid(x+direction*r,.65,z,.48,1.3,.65,color);
  };
  const bench=(x,z)=>{
    box(x,.48,z,1.6,.14,.48,0xa17a56);
    box(x,.84,z-.19,1.6,.22,.1,0xa17a56);
    for(const dx of [-.58,.58]) box(x+dx,.24,z,.14,.48,.37,0x394654);
  };
  box(0,-.10,-8,34,.2,31,floor[index]);
  if([1,3,4,5,6].includes(index)){
    for(let k=0;k<12;k++){
      const x=(k%2?-1:1)*(10+(k%3)*1.4), z=-3-k*1.65;
      tree(x,z,.7+(k%4)*.13);
    }
  }
  if(index===0){
    path(0,-10,11,20,0x817471);
    brickWall(0,-19,19,5.3,3.2);
    brickWall(0,-20.5,4.4,9,2);
    for(let j=-7;j<=7;j+=2)for(const y of [1.1,2.5,3.9]){
      box(j,y,-17.36,1.12,.86,.07,0x303e49);
      box(j,y,-17.3,.04,.83,.06,0x9d8571);
    }
    for(const x of [-5,5]){lamp(x,-8);lamp(x,-14);}
    for(const [x,z] of [[-5,-10],[-6,-11],[-5,-13],[5,-15]]) solid(x,.5,z,1.04,1,.9,0x8f6644);
  }else if(index===1){
    path(0,-8,3.7,18);
    const pond=mesh(new THREE.CircleGeometry(4.2,40),0x365d68,-5,.04,-12);
    pond.rotation.x=-Math.PI/2;
    blocked.push({x:-5,z:-12,w:5.6,d:5.6,object:null});
    for(let j=0;j<8;j++)tree(-8+(j*4)%16,-5-j*1.8,.66);
    solid(4,.36,-11,2.6,.72,.45,0x9ca098);
    for(let j=0;j<7;j++)box(-5+(j%3)*.7,.05,-14+j*.55,.9,.012,.035,0x618d93);
    bench(3,-8);
  }else if(index===2){
    path(0,-10,9,22,0x575d62);
    const paints=[0x26aeb0,0xcb606b,0xf3bc69,0x765db7,0x97b8b7];
    for(const x of [-5.5,5.5]){
      solid(x,1.6,-11,.42,3.2,16,0x636b75);
      for(let j=0;j<7;j++)for(let k=0;k<4;k++){
        const panel=box(x-Math.sign(x)*.24,.72+k*.38,-4-j*2.05,.035,.25,1.35,paints[(j+k*2)%paints.length]);
        panel.rotation.x=(j%3-1)*.22;
      }
    }
    box(0,3.4,-11,11.5,.35,16,0x49525d);
    for(let j=0;j<5;j++)box(0,3.17,-4-j*3,3.3,.08,.11,0x9ad6d6);
  }else if(index===3){
    const track=mesh(new THREE.RingGeometry(4.2,5.2,48),0xa66559,0,.023,-11);
    track.rotation.x=-Math.PI/2;
    path(0,-11,.045,10,0xe1bda1);
    for(const x of [-8,8])for(const z of [-5,-10,-15,-19])tree(x,z,.87);
    for(const x of [-2.6,2.6]) cylinder(x,1.2,-15,.06,.06,2.4,0xe6cab2,8);
    box(0,2.35,-15,5.2,.11,.11,0xe6cab2);
    bench(6,-12);
  }else if(index===4){
    path(-1,-9,2.7,16,0x9c8c77);
    const pond=mesh(new THREE.CircleGeometry(3,36),0x38656c,4,.035,-13);
    pond.rotation.x=-Math.PI/2;
    blocked.push({x:4,z:-13,w:4.2,d:4.2,object:null});
    arch(-4,-11,1.28,0x9b9e83);
    for(let j=0;j<9;j++)tree(j%2 ? -7 : 7,-5-j*1.5,.62+(j%3)*.19);
    for(const x of [-8,8]){solid(x,1.25,-19,3,2.5,2.8,0xa7917c);mesh(new THREE.ConeGeometry(2.6,1.4,4),0x615d6c,x,3.1,-19).rotation.y=Math.PI/4;}
  }else if(index===5){
    skyline(-27);
    const lake=mesh(new THREE.CircleGeometry(5.1,44),0x395d72,-4,.039,-15);
    lake.rotation.x=-Math.PI/2;
    blocked.push({x:-4,z:-15,w:7,d:7,object:null});
    path(3,-10,2,19,0x8d8880);
    for(const [x,z] of [[-8,-6],[-5,-8],[7,-8],[7,-12],[8,-18],[-8,-19]]) tree(x,z,1.1);
    for(const x of [-6,-2]) lamp(x,-9);
    bench(5,-14);
  }else if(index===6){
    path(0,-9,2.25,18,0x9f9584);
    path(0,-12,17,1.2,0x9f9584);
    for(let j=0;j<8;j++)tree(j%2?-8:8,-4-j*2,.91);
    const sculpture=solid(-4,1.5,-12,1.2,3,.64,0xb17766);
    sculpture.rotation.z=-.22;
    for(const x of [-6,6]){bench(x,-9);lamp(x,-15);}
    skyline(-31);
  }else{
    path(0,-10,10,24,0x6d4c4e);
    brickWall(-9,-16,4,6.5,6);
    brickWall(9,-16,4,6.5,6);
    for(let j=0;j<4;j++)arch(0,-8-j*3.2,4.5,0x956b66);
    for(const x of [-.82,.82])box(x,.045,-12,.09,.085,18,0xc6ae9a);
    for(let j=0;j<13;j++)box(0,.028,-5-j*1.15,2.05,.05,.14,0x4d373e);
    for(const x of [-6,6]){lamp(x,-7);lamp(x,-14);}
    // An original railcar on a side track keeps the relic and portal path clear.
    const carX=-4, carZ=-12;
    for(const x of [carX-.58,carX+.58]) box(x,.04,carZ,.08,.08,14,0x9baab1);
    for(let z=-18;z<=-6;z+=.6) box(carX,.025,z,1.7,.05,.12,0x393943);
    box(carX,-.025,carZ,2,.05,8.4,0x353c46);
    box(carX,2.75,carZ,2.04,.18,8.4,0x9fa9ae);
    box(carX+.95,2.56,carZ,.11,.28,2.06,0xaeb9bf);
    solid(carX-.95,1.38,carZ,.1,2.55,8.4,0xb7bec3);
    for(const z of [carZ-4.1,carZ+4.1]){
      solid(carX,1.38,z,2,2.55,.15,0xadb7bf);
      box(carX,2.04,z+Math.sign(z-carZ)*.081,1.35,.55,.02,0x263947);
      for(const x of [carX-.65,carX+.65])box(x,.94,z+Math.sign(z-carZ)*.09,.25,.13,.03,0xffdb99);
    }
    for(const z of [carZ-2.58,carZ+2.58]){
      solid(carX+.95,1.38,z,.11,2.55,3.1,0xaeb9bf);
      box(carX+1.013,1.94,z,.018,.59,1.98,0x293e4c);
      for(const [index,color] of [0xffa642,0xe9674b,0x48add2].entries()){
        box(carX+1.016,1.25-index*.10,z,.02,.072,3.06,color);
      }
    }
    box(carX-.64,.48,carZ-.26,.48,.16,5.6,0x476887);
    box(carX,2.62,carZ,1.35,.04,6.8,0xe7f5ff);
    box(-2.2,.035,carZ,.09,.07,10,0xeab65d);
    bench(2,-9);

  }
  return {sky:palette[index],blocked,relicAt:[[-5,-12],[4,-10],[-4,-14],[5,-16],[-5.8,-12],[4,-15],[-4,-13],[5,-15]][index]};
}
