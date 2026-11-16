import * as T from 'three';

const roles=['Hips','Spine2','Head','LeftArm','LeftForeArm','RightArm','RightForeArm','LeftUpLeg','LeftLeg','RightUpLeg','RightLeg'];
export function danceJoints(root){
  const joints={};
  root.traverse(node=>{
    if(!node.isBone)return;
    const role=node.name.replace(/^mixamorig[:_]?/i,'');
    if(roles.includes(role))joints[role]=node;
  });
  return joints;
}

// Bind the six single-mesh A-pose guests once, then clone their skeletons per venue.
export function bindGuest(scene){
  let source;
  scene.traverse(node=>{if(node.isMesh&&!source)source=node;});
  if(!source||source.isSkinnedMesh)return;
  const geometry=source.geometry.clone(),pos=geometry.attributes.position;
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox,h=max.y-min.y,half=(max.x-min.x)/2,cx=(max.x+min.x)/2,cz=(max.z+min.z)/2;
  const at=(x,y,z=0)=>new T.Vector3(cx+x*half,min.y+y*h,cz+z*h);
  const bones=[],points=[];
  function bone(name,point,parent=-1){
    const item=new T.Bone();item.name=name;item.position.copy(point);
    if(parent>=0){item.position.sub(points[parent]);bones[parent].add(item);}
    points.push(point);bones.push(item);return bones.length-1;
  }
  const hip=bone('Hips',at(0,.51)),spine=bone('Spine2',at(0,.68),hip),head=bone('Head',at(0,.83),spine);
  const limbs=[-1,1].map(side=>{
    const label=side===1?'Left':'Right';
    const arm=bone(label+'Arm',at(side*.38,.76),spine);
    const elbow=bone(label+'ForeArm',at(side*.64,.62),arm);
    const leg=bone(label+'UpLeg',at(side*.19,.49),hip);
    const knee=bone(label+'Leg',at(side*.22,.27),leg);
    return {arm,elbow,leg,knee};
  });
  const ix=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
  const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
  for(let i=0;i<pos.count;i++){
    const x=(pos.getX(i)-cx)/half,y=(pos.getY(i)-min.y)/h,abs=Math.abs(x);
    const limb=limbs[x>=0?1:0];
    const a=smooth(abs,.38,.55)*smooth(y,.43,.51)*(1-smooth(y,.78,.83));
    const l=(1-smooth(y,.43,.53))*(1-a);
    const r=1-a-l;
    const elbow=smooth(abs,.53,.74),knee=1-smooth(y,.22,.31),neck=smooth(y,.78,.86),torso=smooth(y,.53,.68);
    const candidates=[[limb.arm,a*(1-elbow)],[limb.elbow,a*elbow],[limb.leg,l*(1-knee)],[limb.knee,l*knee],
      [head,r*neck],[spine,r*(1-neck)*torso],[hip,r*(1-neck)*(1-torso)]].sort((a,b)=>b[1]-a[1]).slice(0,4);
    const sum=candidates.reduce((n,entry)=>n+entry[1],0);
    candidates.forEach(([index,weight],j)=>{ix[i*4+j]=index;weights[i*4+j]=weight/sum;});
  }
  geometry.setAttribute('skinIndex',new T.BufferAttribute(ix,4));
  geometry.setAttribute('skinWeight',new T.BufferAttribute(weights,4));
  const mesh=new T.SkinnedMesh(geometry,source.material);
  mesh.name=source.name;
  mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);
  const parent=source.parent;
  parent.remove(source);parent.add(mesh);mesh.add(bones[0]);
  scene.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton(bones));
  mesh.frustumCulled=false;
}

const axes={x:new T.Vector3(1,0,0),y:new T.Vector3(0,1,0),z:new T.Vector3(0,0,1)};
export function createVenueDancer(joints,style,phase){
  const base=Object.fromEntries(Object.entries(joints).map(([name,bone])=>[name,bone.quaternion.clone()]));
  const offset=new T.Quaternion();
  function joint(name,x,y,z){
    const bone=joints[name];
    if(!bone)return;
    bone.quaternion.copy(base[name]);
    for(const [axis,angle] of [['x',x],['y',y],['z',z]])if(angle)bone.quaternion.premultiply(offset.setFromAxisAngle(axes[axis],angle));
  }
  return time=>{
    const t=time*(style===2?3.4:style===3?2.5:3.05)+phase;
    const a=Math.sin(t),b=Math.cos(t),beat=Math.sin(2*t);
    const arm=style===0?.27:style===1?.4:style===2?.59:.22;
    joint('Hips',.038*beat,.14*a,.075*b);
    joint('Spine2',.075*b,-.18*a,-.12*b);
    joint('Head',.1*beat,.08*b,.05*a);
    for(const [side,label] of [[1,'Left'],[-1,'Right']]){
      const swing=side===1?a:b;
      joint(label+'Arm',arm*swing,.12*swing,side*(style===2?.27+.22*b:style===1?.15+.14*swing:-.14+.16*swing));
      joint(label+'ForeArm',-.28-.31*(.5+.5*swing),side*.1*b,side*.14*beat);
      joint(label+'UpLeg',.13*swing,0,side*(.06+.05*b));
      joint(label+'Leg',-.17*Math.max(0,swing),0,0);
    }
  };
}
