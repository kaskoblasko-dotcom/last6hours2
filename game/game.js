'use strict';
/* THE LAST 6 HOURS 2: THE HOUSE — free-roam survival horror (Three.js r128) */
const $=i=>document.getElementById(i),R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.random()*a.length|0];
const TAU=Math.PI*2,angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const coarse=matchMedia('(pointer:coarse)').matches;
const HL=['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- state ---------- */
const S={t:0,running:false,over:true,paused:false,exitOpen:false,hr:0,dd:0,hint:{},amb:10,bright:clamp(+store.get('l6h2_b')||1,0,2)};
const P={x:3.5,z:5.5,yaw:Math.PI,pitch:0,hide:null,baseYaw:0,stam:1,tired:false,flash:false,bat:100,breath:1,holding:false,sprinting:false,moving:false,noise:0,bob:0,stepD:0};
const I={mx:0,mz:0,sprint:false,breath:false},K={};

/* ---------- audio ---------- */
let AC,drone;
function audio(){if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state=='suspended')AC.resume();
 if(!drone){drone=AC.createGain();drone.gain.value=.03;drone.connect(AC.destination);[55,58.5,110.7].forEach(f=>{const o=AC.createOscillator(),l=AC.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;l.frequency.value=180;o.connect(l).connect(drone);o.start()})}}
const dest=pan=>{if(!pan||!AC.createStereoPanner)return AC.destination;const p=AC.createStereoPanner();p.pan.value=clamp(pan,-1,1);p.connect(AC.destination);return p};
function tone(f,d,ty='sine',v=.2,sl=0,dl=0,pan=0){if(!AC||v<.003)return;const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+dl;o.type=ty;o.frequency.setValueAtTime(f,t0);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+sl),t0+d);g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(g);g.connect(dest(pan));o.start(t0);o.stop(t0+d)}
function noise(d,fq=800,v=.3,dl=0,pan=0){if(!AC||v<.003)return;const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),t0=AC.currentTime+dl;s.buffer=b;f.type='lowpass';f.frequency.value=fq;g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);s.connect(f);f.connect(g);g.connect(dest(pan));s.start(t0)}
const spat=(x,z)=>{const dx=x-P.x,dz=z-P.z,d=Math.hypot(dx,dz)||.01;return{v:1/(1+d*d*.05),pan:(dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/d}};
const click=()=>tone(1200,.04,'square',.06);
const gurgle=(x,z,k=1)=>{const s=spat(x,z);for(let i=0;i<4;i++)tone(R(150,260),.14,'sine',.16*s.v*k,-60,i*.1,s.pan);noise(.5,500,.14*s.v*k,0,s.pan)};
const thud=(x,z,v=.5)=>{const s=spat(x,z);noise(.12,260,v*s.v,0,s.pan);tone(80,.14,'square',.15*s.v,0,0,s.pan)};

/* ---------- map ---------- */
const W=30,H=20,G=Array.from({length:H},()=>Array(W).fill('#'));
const rect=(c,x0,z0,x1,z1)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)G[z][x]=c};
rect('b',1,1,5,6);rect('1',7,1,12,6);rect('m',14,1,21,6);rect('l',23,1,28,6);
rect('h',1,8,28,9);rect('k',1,11,9,18);rect('v',11,11,22,18);rect('s',24,11,28,18);
rect('h',3,7,3,7);rect('h',9,7,10,7);rect('h',16,7,17,7);rect('h',24,7,25,7);
rect('h',5,10,6,10);rect('h',15,10,17,10);rect('h',26,10,27,10);rect('h',10,14,10,15);rect('h',23,14,23,15);
rect('X',29,8,29,9);
const NAMES={b:'BATHROOM','1':'BEDROOM',m:'MASTER BEDROOM',l:'LAUNDRY ROOM',h:'HALLWAY',k:'KITCHEN',v:'LIVING ROOM',s:"KID'S ROOM",X:'FRONT DOOR'};
const TINT={b:0xaab8b4,'1':0x7a5f6a,m:0x6a5a7a,l:0x8a8f8a,h:0x6e6a5e,k:0x9a9a88,v:0x6a5848,s:0x5a6e7a,X:0x6e6a5e};
const PB=new Uint8Array(W*H);
const solid=(x,z)=>{if(x<0||z<0||x>=W||z>=H)return true;const c=G[z][x];return c=='#'||(c=='X'&&!S.exitOpen)||PB[z*W+x]==1};
const wallAt=(x,z)=>x<0||z<0||x>=W||z>=H||G[z][x]=='#'||(G[z][x]=='X'&&!S.exitOpen);
const blockedAt=(x,z,r)=>{for(let j=Math.floor(z-r);j<=Math.floor(z+r);j++)for(let i=Math.floor(x-r);i<=Math.floor(x+r);i++)if(solid(i,j))return true;return false};
function los(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.3);for(let i=1;i<n;i++){const k=i/n;if(wallAt(Math.floor(ax+(bx-ax)*k),Math.floor(az+(bz-az)*k)))return false}return true}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function flow(tx,tz){const d=new Int16Array(W*H).fill(-1),q=[tz*W+tx];d[q[0]]=0;
 for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cz=c/W|0;for(const[dx,dz]of DIRS){const nx=cx+dx,nz=cz+dz;if(solid(nx,nz)||d[nz*W+nx]>=0)continue;if(dx&&dz&&(solid(cx+dx,cz)||solid(cx,cz+dz)))continue;d[nz*W+nx]=d[c]+1;q.push(nz*W+nx)}}return d}

/* ---------- three.js ---------- */
const ren=new THREE.WebGLRenderer({antialias:!coarse});ren.setSize(innerWidth,innerHeight);ren.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:2));ren.domElement.id='gl';document.body.prepend(ren.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.fog=new THREE.FogExp2(0,.08);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,40);camera.rotation.order='YXZ';scene.add(camera);
const BR=[.16,.3,.55],amb=new THREE.AmbientLight(0x556677,BR[S.bright]);scene.add(amb);
const fl=new THREE.SpotLight(0xfff2d0,0,18,.45,.5,1.1);fl.position.set(.12,-.1,0);camera.add(fl);
const tg=new THREE.Object3D();tg.position.set(0,0,-1);camera.add(tg);fl.target=tg;
camera.add(new THREE.PointLight(0x8899aa,.5,6,1.4));
const exitL=new THREE.PointLight(0xff3322,.9,6,1.5);exitL.position.set(28.4,2.2,9);scene.add(exitL);

function ctex(draw){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');draw(g);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
const floorT=ctex(g=>{g.fillStyle='#bbb';g.fillRect(0,0,128,128);for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.14})`;g.fillRect(Math.random()*128,Math.random()*128,2,2)}g.strokeStyle='#0005';g.lineWidth=3;g.strokeRect(0,0,128,128)});
const wallT=ctex(g=>{g.fillStyle='#d0d0d0';g.fillRect(0,0,128,128);g.fillStyle='#0002';for(let x=0;x<128;x+=16)g.fillRect(x,0,6,128);for(let i=0;i<300;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.1})`;g.fillRect(Math.random()*128,Math.random()*128,3,3)}});
const slatT=ctex(g=>{g.fillStyle='#8a6a48';g.fillRect(0,0,128,128);g.fillStyle='#1a0f08';for(let y=14;y<128;y+=10)g.fillRect(14,y,100,4)});
const mats={},L=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));

/* floors + walls (instanced) */
{const fl_=[],wl=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)(G[z][x]=='#'?(()=>{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=G[z+j]&&G[z+j][x+i];if(a&&a!='#'){wl.push([x,z]);return}}})():fl_.push([x,z]));
 const dm=new THREE.Object3D(),col=new THREE.Color();
 const fm=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:floorT}),fl_.length);
 fl_.forEach(([x,z],i)=>{dm.position.set(x+.5,0,z+.5);dm.updateMatrix();fm.setMatrixAt(i,dm.matrix);col.setHex(TINT[G[z][x]]);fm.setColorAt(i,col)});fm.instanceColor.needsUpdate=true;scene.add(fm);
 const wm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,2.8,1),new THREE.MeshLambertMaterial({map:wallT}),wl.length);
 wl.forEach(([x,z],i)=>{let c='h';out:for(const[dx,dz]of DIRS){const a=G[z+dz]&&G[z+dz][x+dx];if(a&&a!='#'){c=a;break out}}dm.position.set(x+.5,1.4,z+.5);dm.updateMatrix();wm.setMatrixAt(i,dm.matrix);col.setHex(TINT[c]).multiplyScalar(1.2);wm.setColorAt(i,col)});wm.instanceColor.needsUpdate=true;scene.add(wm);
 const ce=new THREE.Mesh(new THREE.PlaneGeometry(W,H).rotateX(Math.PI/2),L(0x1a1a1a));ce.position.set(W/2,2.8,H/2);scene.add(ce);
 const ed=new THREE.Mesh(new THREE.BoxGeometry(.1,2.2,2),new THREE.MeshLambertMaterial({color:0x5a1a10}));ed.position.set(29.95,1.1,9);scene.add(ed);
}
/* furniture, closets, water */
function Fu(x,z,w,d,h,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w-.14,h,d-.14),L(c));m.position.set(x+w/2,h/2,z+d/2);scene.add(m);for(let j=0;j<d;j++)for(let i=0;i<w;i++)PB[(z+j)*W+x+i]=1;return m}
const FACE={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]},WARD=[];
function ward(x,z,f){const[fx,fz]=FACE[f],g=new THREE.Group();g.position.set(x+.5,0,z+.5);scene.add(g);
 const b=new THREE.Mesh(new THREE.BoxGeometry(.92,2.3,.92),L(0x3a2a1c));b.position.y=1.15;g.add(b);
 const d=new THREE.Mesh(new THREE.PlaneGeometry(.8,2.05),new THREE.MeshLambertMaterial({map:slatT}));d.position.set(fx*.47,1.15,fz*.47);d.rotation.y=Math.atan2(fx,fz);g.add(d);
 PB[z*W+x]=1;WARD.push({x,z,fx,fz,cx:x+.5,cz:z+.5,tileX:x+fx,tileZ:z+fz,fxx:x+.5+fx,fzz:z+.5+fz})}
const WP=[];
function wpoint(x,z,y,kind,r){const m=new THREE.Mesh(new THREE.CircleGeometry(r,18),new THREE.MeshLambertMaterial({color:0x06121a}));m.rotation.x=-Math.PI/2;m.position.set(x,y+.01,z);scene.add(m);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.1,.14,24),new THREE.MeshBasicMaterial({color:0x66ffaa,transparent:true,opacity:0}));ring.rotation.x=-Math.PI/2;ring.position.set(x,y+.02,z);scene.add(ring);WP.push({x,z,y,kind,ring})}
/* bathroom */ Fu(1,2,1,3,.6,0xc8c8c0);wpoint(1.5,3.5,.62,'tub',.4);Fu(5,1,1,1,.42,0xe0e0e0);wpoint(5.5,1.5,.43,'toilet',.16);Fu(3,1,1,1,.85,0xb9b0a0);wpoint(3.5,1.5,.86,'sink',.16);ward(5,6,'w');
/* bedroom */ Fu(8,1,2,2,.5,0x6a4a5a);Fu(7,4,1,2,.8,0x4a3a2a);Fu(7,1,1,1,.5,0x4a3a2a);ward(12,1,'w');
/* master */ Fu(16,1,3,3,.5,0x5a4a6a);Fu(21,4,1,2,.9,0x4a3a2a);ward(14,1,'e');ward(21,1,'w');
/* laundry */ Fu(23,1,1,1,.95,0xdddddd);wpoint(23.5,1.5,.96,'drain',.2);Fu(24,1,1,1,.95,0xcccccc);Fu(27,1,2,1,.9,0x8a8f8a);wpoint(28,1.5,.91,'sink',.2);Fu(28,3,1,3,1.6,0x3a3a30);ward(23,5,'e');
/* hall */ ward(1,8,'e');ward(20,8,'s');
/* kitchen */ Fu(1,12,1,5,.9,0x8a7a62);wpoint(1.5,13.5,.91,'sink',.22);Fu(1,17,1,1,1.8,0xdddddd);Fu(5,14,2,2,.78,0x6a4a2a);ward(9,18,'n');
/* living */ Fu(14,16,4,1,.8,0x4a3a3a);Fu(15,14,2,1,.4,0x3a2a1a);Fu(14,18,4,1,.7,0x151515);Fu(22,11,1,3,1.8,0x3a2a1a);Fu(20,15,1,1,.8,0x4a4a3a);ward(11,11,'e');ward(22,18,'w');
/* kid's room */ Fu(27,17,2,2,.5,0x4a5a6a);Fu(24,12,1,2,.8,0x4a3a2a);Fu(24,17,1,1,.5,0x6a3a3a);ward(28,11,'s');
const RT={};for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];if(c!='#'&&c!='X'&&!solid(x,z))(RT[c]=RT[c]||[]).push([x,z])}
const RK=Object.keys(RT);

/* batteries */
const BAT=[];{const spots=[[4.5,5.5],[11.5,5.5],[19.5,5.5],[26.5,5.5],[12.5,8.5],[22.5,9.5],[4.5,12.5],[8.5,17.5],[19.5,17.5],[13.5,12.5],[25.5,16.5]].filter(([x,z])=>!solid(x|0,z|0));
 const geo=new THREE.CylinderGeometry(.05,.05,.17,8),mat=new THREE.MeshBasicMaterial({color:0xffcc33});
 spots.sort(()=>Math.random()-.5).slice(0,8).forEach(([x,z])=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,.1,z);m.rotation.z=1.57;scene.add(m);BAT.push({x,z,m,got:false})})}

/* monsters */
function mkCreature(){const g=new THREE.Group(),b=new THREE.MeshLambertMaterial({color:0x050505});
 const add=(geo,x,y,z,p=g)=>{const m=new THREE.Mesh(geo,b);m.position.set(x,y,z);p.add(m);return m};
 add(new THREE.CylinderGeometry(.2,.28,1,8),0,1.15,0);add(new THREE.SphereGeometry(.19,12,10),0,1.8,0).scale.y=1.3;
 const arm=x=>{const a=new THREE.Group();a.position.set(x,1.6,0);g.add(a);add(new THREE.CylinderGeometry(.05,.04,1.3,6),0,-.6,0,a);return a},leg=x=>{const a=new THREE.Group();a.position.set(x,.7,0);g.add(a);add(new THREE.CylinderGeometry(.08,.06,.75,6),0,-.37,0,a);return a};
 const em=new THREE.MeshBasicMaterial({color:0xffffff,fog:false});for(const x of[-.07,.07]){const e=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),em);e.position.set(x,1.82,.17);e.scale.y=1.4;g.add(e)}
 g.userData={aL:arm(-.34),aR:arm(.34),lL:leg(-.12),lR:leg(.12)};g.visible=false;scene.add(g);return g}
function mkFish(){const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:0x1c3a2a});
 const add=(geo,x,y,z,p=g)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o};
 add(new THREE.CylinderGeometry(.1,.14,1.1,8),0,.55,0);add(new THREE.BoxGeometry(.34,.22,.6),0,1.12,.15);
 const jaw=new THREE.Group();jaw.position.set(0,1.02,-.1);g.add(jaw);add(new THREE.BoxGeometry(.3,.07,.5),0,0,.28,jaw);
 const tm=new THREE.MeshBasicMaterial({color:0xeeeedd});for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(.02,.07,.02),tm);t.position.set(-.12+i*.06,.05,.5);jaw.add(t)}
 const em=new THREE.MeshBasicMaterial({color:0xe8ffb0,fog:false});for(const x of[-.1,.1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),em);e.position.set(x,1.2,.35);g.add(e)}
 g.userData={jaw};g.visible=false;scene.add(g);return g}
const cm=mkCreature(),fm=mkFish();

/* ---------- creature AI ---------- */
const C={x:26.5,z:4.5,face:Math.PI,st:'patrol',alert:0,tx:-1,tz:-1,fl:null,wx:null,wz:null,ls:null,lostT:0,q:[],waiting:0,opening:false,room:'l',ping:20,noiseCd:0,moved:0,stepD:0,ph:0,nx:0,nz:0};
function setTarget(tx,tz){if(tx!=C.tx||tz!=C.tz){C.tx=tx;C.tz=tz;C.fl=flow(tx,tz);C.wx=null}}
function turn(dx,dz,dt){C.face+=angDiff(C.face,Math.atan2(dx,dz))*Math.min(1,dt*8)}
function walk(dt,speed){const cx=Math.floor(C.x),cz=Math.floor(C.z),d=C.fl[cz*W+cx];
 if(d===0){const dx=cx+.5-C.x,dz=cz+.5-C.z,dist=Math.hypot(dx,dz);if(dist<.1)return true;const s=Math.min(dist,speed*dt);C.x+=dx/dist*s;C.z+=dz/dist*s;turn(dx,dz,dt);return false}
 if(d<0)return true;
 if(C.wx===null||Math.hypot(C.wx-C.x,C.wz-C.z)<.15){let best=d,bx=-1,bz=-1;for(const[dx,dz]of DIRS){const nx=cx+dx,nz=cz+dz;if(solid(nx,nz))continue;if(dx&&dz&&(solid(cx+dx,cz)||solid(cx,cz+dz)))continue;const nd=C.fl[nz*W+nx];if(nd>=0&&nd<best){best=nd;bx=nx;bz=nz}}if(bx<0)return true;C.wx=bx+.5;C.wz=bz+.5}
 const dx=C.wx-C.x,dz=C.wz-C.z,dist=Math.hypot(dx,dz)||1,s=Math.min(speed*dt,dist);C.x+=dx/dist*s;C.z+=dz/dist*s;turn(dx,dz,dt);return false}
function newPatrol(){const row=G[Math.floor(P.z)],pr=row&&row[Math.floor(P.x)];let c;
 if(C.ping<=0&&pr&&RT[pr]){c=pr;C.ping=R(16,26)*(1-.55*S.dd)}else{do c=pick(RK);while(c==C.room&&RK.length>1)}
 C.room=c;const t=pick(RT[c]);setTarget(t[0],t[1])}
function searchQueue(at){const q=[{go:[Math.floor(at.x),Math.floor(at.z)]}];
 WARD.map(w=>({w,d:Math.hypot(w.cx-at.x,w.cz-at.z)})).filter(o=>o.d<11).sort((a,b)=>a.d-b.d).slice(0,3).sort(()=>Math.random()-.5).slice(0,2).forEach(o=>q.push({ward:o.w}));return q}
function startHunt(){C.st='hunt';C.lostT=0;C.alert=1;C.ls={x:P.x,z:P.z};C.tx=-1;
 tone(900,.5,'sawtooth',.25,-700);noise(.4,3000,.3);tone(70,1,'sawtooth',.25,-30);
 if(!S.hint.h){S.hint.h=1;msg('It saw you! Break its line of sight and hide in a closet.',6000)}}
function openWard(q){const w=q.ward;thud(w.cx,w.cz,.5);if(P.hide!==w)return;
 if(!q.sure&&P.holding&&P.breath>.05&&Math.random()<.7){msg('It listened at the door... and moved on.',3500);return}
 die('closet')}
function creatureTick(dt){const ox=C.x,oz=C.z,dd=S.dd,dx=P.x-C.x,dz=P.z-C.z,dist=Math.hypot(dx,dz);
 C.ping-=dt;C.noiseCd-=dt;
 let sees=false;const vr=8+(P.flash?6:0)+4*dd;
 if(!P.hide){const fx=Math.sin(C.face),fz=Math.cos(C.face),dot=(dx*fx+dz*fz)/(dist||1);if(dist<vr&&(dot>.45||dist<1.8)&&los(C.x,C.z,P.x,P.z))sees=true;if(S.exitOpen&&dist<30)sees=true}
 if(sees)C.alert=Math.min(1,C.alert+dt*(.45+(1-dist/vr)*1.6+(P.sprinting?.5:0)+(P.flash?.4:0)));else C.alert=Math.max(0,C.alert-dt*.3);
 if(C.alert>=1&&C.st!='hunt'&&!P.hide)startHunt();
 if(!P.hide&&C.noiseCd<=0&&(C.st=='patrol'||C.st=='queue')&&dist<P.noise){C.st='investigate';C.nx=P.x;C.nz=P.z;setTarget(Math.floor(P.x),Math.floor(P.z));C.waiting=0;C.noiseCd=1.5}
 switch(C.st){
 case 'patrol':
  if(C.waiting>0){C.waiting-=dt;C.face+=Math.sin(S.t*1.7)*dt*.8;break}
  if(C.tx<0)newPatrol();
  if(walk(dt,1.5+.7*dd)){C.waiting=R(1.2,3);C.tx=-1}
  break;
 case 'investigate':
  if(C.waiting>0){C.waiting-=dt;C.face+=Math.sin(S.t*2.5)*dt*1.4;if(C.waiting<=0){C.st='queue';C.q=searchQueue({x:C.nx,z:C.nz});C.tx=-1}break}
  if(walk(dt,2.1+.9*dd))C.waiting=1.8;
  break;
 case 'hunt':{
  if(sees){C.lostT=0;C.ls={x:P.x,z:P.z}}else C.lostT+=dt;
  setTarget(Math.floor(C.ls.x),Math.floor(C.ls.z));
  const arrived=walk(dt,2.7+1.5*dd+(S.exitOpen?.5:0));
  if(!P.hide&&dist<.9){die('creature');return}
  if(!sees&&(arrived||C.lostT>3.5)&&!S.exitOpen){C.st='queue';C.q=searchQueue(C.ls);C.tx=-1}
  break}
 case 'queue':{const q=C.q[0];
  if(!q){C.st='patrol';C.tx=-1;C.alert=0;break}
  if(C.waiting>0){C.waiting-=dt;if(C.opening)C.face+=angDiff(C.face,Math.atan2(-q.ward.fx,-q.ward.fz))*Math.min(1,dt*6);else C.face+=Math.sin(S.t*2.2)*dt*1.1;
   if(C.waiting<=0){if(C.opening)openWard(q);if(S.over)return;C.opening=false;C.q.shift();C.tx=-1}break}
  if(q.ward)setTarget(q.ward.tileX,q.ward.tileZ);else setTarget(q.go[0],q.go[1]);
  if(walk(dt,2+.9*dd)){C.waiting=q.ward?1.7:1.3;C.opening=!!q.ward}
  break}}
 C.moved=Math.hypot(C.x-ox,C.z-oz);C.stepD+=C.moved;
 if(C.stepD>1.1){C.stepD=0;const s=spat(C.x,C.z);noise(.1,260,.5*s.v*(C.st=='hunt'?1.3:1),0,s.pan)}
 if(C.st=='hunt'&&Math.random()<dt*.35){const s=spat(C.x,C.z);tone(R(60,90),.5,'sawtooth',.18*s.v,-25,0,s.pan)}}
function syncCreature(dt){const u=cm.userData,sw=Math.min(1,C.moved/(dt||1)/2);cm.position.set(C.x,0,C.z);cm.rotation.y=C.face;C.ph+=C.moved*4;
 u.lL.rotation.x=Math.sin(C.ph)*.6*sw;u.lR.rotation.x=-Math.sin(C.ph)*.6*sw;u.aL.rotation.x=-Math.sin(C.ph)*.4*sw;u.aR.rotation.x=Math.sin(C.ph)*.4*sw;cm.position.y=Math.abs(Math.sin(C.ph))*.05*sw}

/* ---------- fish monster ---------- */
const FS={at:0,ph:'dorm',t:0,r:0,r0:0,cool:18,reloc:20,stirT:0,gT:0};
const flashAt=wp=>{if(!P.flash||P.bat<=0||P.hide)return false;const dx=wp.x-P.x,dz=wp.z-P.z,d=Math.hypot(dx,dz);return d<5.5&&((dx*-Math.sin(P.yaw)+dz*-Math.cos(P.yaw))/(d||1))>.86};
function fishRetreat(){FS.ph='retreat';FS.t=0;FS.r0=FS.r;FS.cool=12;const wp=WP[FS.at],s=spat(wp.x,wp.z);tone(400,.4,'sawtooth',.2*s.v,-250,0,s.pan);noise(.3,2500,.2*s.v,0,s.pan);if(!S.hint.fl){S.hint.fl=1;msg('It flinched away from the light.',3000)}}
function fishTick(dt){const wp=WP[FS.at],dist=Math.hypot(P.x-wp.x,P.z-wp.z),near=!P.hide&&dist<3.6,dd=S.dd;FS.cool-=dt;
 switch(FS.ph){
 case 'dorm':FS.reloc-=dt;
  if(FS.reloc<=0){const o=WP.map((w,i)=>({i,d:Math.hypot(P.x-w.x,P.z-w.z)})).filter(o=>o.i!=FS.at).sort((a,b)=>a.d-b.d);FS.at=pick(o.slice(0,3)).i;FS.reloc=R(14,26)*(1-.5*dd);const n=WP[FS.at];gurgle(n.x,n.z,1.3);break}
  if(FS.cool<=0&&near&&S.t>24){FS.ph='stir';FS.stirT=Math.max(1.5,3.8-2.2*dd);FS.gT=0;if(!S.hint.f){S.hint.f=1;msg('Gurgling from the pipes! Back away from the water, or hit it with your flashlight.',6000)}}
  break;
 case 'stir':if(!near||dist>4.6){FS.ph='dorm';break}
  FS.gT-=dt;if(FS.gT<=0){gurgle(wp.x,wp.z,1.4);FS.gT=R(.7,1.1)}
  if(flashAt(wp)){fishRetreat();break}
  FS.stirT-=dt;if(FS.stirT<=0){FS.ph='rise';FS.t=0;noise(.3,900,.3);tone(180,.4,'sawtooth',.2,-90)}
  break;
 case 'rise':FS.t+=dt;FS.r=Math.min(1,FS.t/.45);if(flashAt(wp)){fishRetreat();break}if(FS.t>=.6){FS.ph='lunge';FS.t=0;tone(300,.35,'sawtooth',.3,500);noise(.3,3500,.4)}break;
 case 'lunge':FS.t+=dt;if(FS.t>=.35){if(!P.hide&&Math.hypot(P.x-wp.x,P.z-wp.z)<2.3){die('fish');return}FS.ph='retreat';FS.t=0;FS.r0=FS.r;FS.cool=9}break;
 case 'retreat':FS.t+=dt;FS.r=Math.max(0,FS.r0*(1-FS.t/.5));if(FS.t>=.5){FS.ph='dorm';FS.r=0;FS.reloc=R(8,14)}break}}
function syncFish(){const wp=WP[FS.at],a=Math.atan2(P.x-wp.x,P.z-wp.z);fm.visible=FS.r>.02;fm.position.set(wp.x,wp.y-1.2*(1-FS.r),wp.z);fm.rotation.y=a;let jaw=0;
 if(FS.ph=='lunge'){const d=Math.max(0,Math.min(1.5,Math.hypot(P.x-wp.x,P.z-wp.z)-.5)),k=Math.min(1,FS.t/.3);fm.position.x+=Math.sin(a)*d*k;fm.position.z+=Math.cos(a)*d*k;jaw=.55*k}
 fm.userData.jaw.rotation.x=jaw;
 WP.forEach((w,i)=>{const on=i==FS.at&&(FS.ph=='stir'||FS.ph=='rise');if(on){const k=(S.t*1.5)%1;w.ring.scale.setScalar(1+k*3);w.ring.material.opacity=.5*(1-k)}else w.ring.material.opacity=0})}

/* ---------- player ---------- */
function setFlash(v){if(v&&(P.bat<=0||P.hide||!S.running))return;P.flash=v;click()}
function nearest(){if(P.hide)return{t:'exit'};let best=null,bd=1e9;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
 for(const w of WARD){const dx=w.cx-P.x,dz=w.cz-P.z,d=Math.hypot(dx,dz);if(d>1.9||(dx*fx+dz*fz)/d<.55||-(dx*w.fx+dz*w.fz)/d<.1)continue;if(d<bd){bd=d;best={t:'hide',w}}}return best}
function interact(){if(!S.running||S.paused)return;const n=nearest();if(!n)return;if(n.t=='exit')exitHide();else enterHide(n.w)}
function enterHide(w){const d=Math.hypot(P.x-C.x,P.z-C.z),saw=C.st=='hunt'&&d<18&&los(C.x,C.z,P.x,P.z),hot=C.st=='hunt'||C.alert>.4;
 P.hide=w;P.baseYaw=Math.atan2(-w.fx,-w.fz);P.x=w.cx;P.z=w.cz;P.yaw=P.baseYaw;P.pitch=0;P.flash=false;P.holding=false;P.sprinting=false;P.noise=0;
 $('slats').style.display='block';$('bH').style.display=coarse?'flex':'none';tone(300,.1,'square',.08);noise(.1,400,.15);
 if(saw){C.st='queue';C.q=[{ward:w,sure:true}];C.tx=-1;C.waiting=0;C.opening=false;msg('It saw you hide...',3000)}
 else if(hot&&C.st!='queue'){C.st='queue';C.q=searchQueue({x:w.fxx,z:w.fzz});C.tx=-1;C.waiting=0;C.opening=false}
 if(!S.hint.c){S.hint.c=1;msg(coarse?'Hold BREATH when it is close. ACT to leave.':'Hold SPACE to hold your breath when it is close. E to leave.',6000)}}
function exitHide(){const w=P.hide;P.hide=null;P.x=w.fxx;P.z=w.fzz;$('slats').style.display='none';$('bH').style.display='none';tone(250,.1,'square',.08)}
function look(dx,dy,k){P.yaw-=dx*k;P.pitch=clamp(P.pitch-dy*k,-1.25,1.25);if(P.hide){P.yaw=clamp(P.yaw,P.baseYaw-.75,P.baseYaw+.75);P.pitch=clamp(P.pitch,-.5,.5)}}
function playerTick(dt){
 if(P.hide){P.holding=I.breath&&P.breath>0;if(P.holding){P.breath-=dt*.13;if(P.breath<=0){P.breath=0;P.holding=false;noise(.3,1500,.25);tone(500,.3,'sine',.08,-200);if(C.st=='queue'&&C.q[0]&&C.q[0].ward)C.q[0].sure=Math.hypot(C.x-P.x,C.z-P.z)<5.5?true:C.q[0].sure}}else P.breath=Math.min(1,P.breath+dt*.3);P.noise=0;return}
 const kx=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),kz=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);
 let mx=clamp(I.mx+kx,-1,1),mz=clamp(I.mz+kz,-1,1);const raw=Math.hypot(mx,mz),len=Math.min(1,raw);if(raw>0){mx/=raw;mz/=raw}
 P.moving=len>.1;const want=(K.ShiftLeft||K.ShiftRight||I.sprint)&&P.moving;
 if(P.tired&&P.stam>.3)P.tired=false;P.sprinting=want&&!P.tired&&P.stam>0;
 if(P.sprinting){P.stam=Math.max(0,P.stam-dt*.27);if(P.stam<=0)P.tired=true}else P.stam=Math.min(1,P.stam+dt*(P.moving?.1:.22));
 const sp=P.sprinting?4.3:2.5,sy=Math.sin(P.yaw),cy=Math.cos(P.yaw),dx=(-sy*mz+cy*mx)*sp*len*dt,dz=(-cy*mz-sy*mx)*sp*len*dt;
 if(!blockedAt(P.x+dx,P.z,.28))P.x+=dx;if(!blockedAt(P.x,P.z+dz,.28))P.z+=dz;
 P.noise=P.moving?(P.sprinting?10:4):0;
 if(P.moving){P.bob+=dt*(P.sprinting?11:7.5);P.stepD+=sp*len*dt;if(P.stepD>(P.sprinting?1.5:1.9)){P.stepD=0;noise(.1,240,P.sprinting?.22:.1)}}
 if(P.flash){P.bat-=dt*.55;if(P.bat<=0){P.bat=0;P.flash=false;msg('Flashlight died. Find batteries.',3500);tone(200,.5,'sine',.15,-100)}}
 for(const b of BAT)if(!b.got&&Math.hypot(b.x-P.x,b.z-P.z)<.8){b.got=true;b.m.visible=false;P.bat=Math.min(100,P.bat+35);tone(900,.15,'sine',.12);tone(1300,.2,'sine',.1,0,.1);msg('Battery found.',1800)}}

/* ---------- game flow ---------- */
function msg(s,ms=4500){const m=$('msg');m.textContent=s;m.style.opacity=1;clearTimeout(msg.h);msg.h=setTimeout(()=>m.style.opacity=0,ms)}
function lockPtr(){if(!coarse&&ren.domElement.requestPointerLock){try{const p=ren.domElement.requestPointerLock();p&&p.catch&&p.catch(()=>{})}catch(e){}}}
function goFull(){if(!coarse)return;const f=document.documentElement;try{f.requestFullscreen&&f.requestFullscreen().catch(()=>{});screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}try{window.Capacitor.Plugins.StatusBar.hide()}catch(e){}}
function show(a,b,c,sub){const s=$('scr');s.classList.remove('hide');s.innerHTML=`<h1>${a}</h1>${sub?`<h2>${sub}</h2>`:''}<p>${b}</p><button id="go">${c}</button>`;$('go').onclick=()=>{audio();goFull();reset();lockPtr()}}
function reset(){Object.assign(S,{t:0,running:true,over:false,paused:false,exitOpen:false,hr:0,dd:0,hint:{},amb:10});
 Object.assign(P,{x:3.5,z:5.5,yaw:Math.PI,pitch:0,hide:null,stam:1,tired:false,flash:false,bat:100,breath:1,holding:false,sprinting:false,moving:false,noise:0,stepD:0});
 Object.assign(C,{x:26.5,z:4.5,face:Math.PI,st:'patrol',alert:0,tx:-1,fl:null,wx:null,ls:null,q:[],waiting:0,opening:false,room:'l',ping:20,noiseCd:0,moved:0});
 Object.assign(FS,{at:0,ph:'dorm',t:0,r:0,cool:18,reloc:20});BAT.forEach(b=>{b.got=false;b.m.visible=true});
 exitL.color.setHex(0xff3322);cm.visible=false;$('slats').style.display='none';$('bH').style.display='none';$('scr').classList.add('hide');$('js').className='';
 msg(coarse?'Left thumb: move. Right thumb: look. ACT near a closet to hide.':'WASD move · mouse look · Shift run · F flashlight · E interact',6500)}
function die(why){if(S.over)return;S.over=true;S.running=false;P.hide=null;$('slats').style.display='none';document.exitPointerLock&&document.exitPointerLock();
 const fish=why=='fish';$('js').className='on'+(fish?' fish':'');
 tone(300,1.3,'sawtooth',.4,900);tone(311,1.3,'sawtooth',.3,880);noise(1.3,4000,.6);
 setTimeout(()=>{$('js').className='';show('YOU DIED',{creature:'The thing in the dark caught you.',closet:'It opened the closet door.',fish:'Something dragged you down into the plumbing.'}[why]||'It got you.','TRY AGAIN')},1500)}
function win(){S.running=false;S.over=true;document.exitPointerLock&&document.exitPointerLock();tone(880,2.2,'sine',.25);tone(1320,2.6,'sine',.15,0,.3);show('YOU ESCAPED','The door slams shut behind you. Morning light. Whatever lives in that house stays inside... for now.','PLAY AGAIN')}
function tick(dt){
 S.t+=dt;S.dd=Math.min(1,S.t/360);const h=Math.min(6,S.t/60|0);
 if(h>S.hr){S.hr=h;if(h<6){tone(520,1.2,'sine',.15);msg(HL[h]+' — it is getting worse...',3500)}}
 if(S.t>=360&&!S.exitOpen){S.exitOpen=true;exitL.color.setHex(0x33ff66);msg('6 AM — the front door is unlocked at the end of the hall. GET OUT!',9000);tone(880,1.5,'sine',.25);tone(1100,1.5,'sine',.15,0,.2)}
 if(drone)drone.gain.value=.03+.08*S.dd;
 playerTick(dt);if(S.over)return;
 if(S.t>22){cm.visible=true;creatureTick(dt);if(S.over)return}
 fishTick(dt);if(S.over)return;
 if(S.exitOpen&&!P.hide&&P.x>29.3)return win();
 S.amb-=dt;if(S.amb<=0){S.amb=R(9,22)*(1-.4*S.dd);const a=R(0,TAU),r=R(6,16),x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r,s=spat(x,z);if(Math.random()<.5)noise(.15,200,.4*s.v+.04,0,s.pan);else tone(R(180,260),.5,'sawtooth',.05*s.v+.01,-80,0,s.pan)}
 if(!S.hint.a&&S.t>12){S.hint.a=1;msg('Find closets to hide in. Batteries glow faintly. Stay clear of sinks, toilets and tubs.',6500)}
 /* danger overlay + heartbeat */
 let d=Math.max(C.st=='hunt'?clamp(1-Math.hypot(P.x-C.x,P.z-C.z)/14,.25,1):0,C.alert*.35,(FS.ph=='stir'||FS.ph=='rise'||FS.ph=='lunge')?.7:0);
 S.danger=(S.danger||0)+(d-(S.danger||0))*Math.min(1,dt*3);
 if(S.danger>.12){S.hb=(S.hb||0)-dt;if(S.hb<=0){tone(60,.15,'sine',.35*S.danger,-20);tone(60,.15,'sine',.25*S.danger,-20,.18);S.hb=1.1-.6*S.danger}}}
function hud(){$('clock').textContent=HL[Math.min(6,S.t/60|0)];$('bat').firstChild.style.width=P.bat+'%';$('sta').firstChild.style.width=P.stam*100+'%';
 const row=G[Math.floor(P.z)],c=row&&row[Math.floor(P.x)];$('room').textContent=NAMES[c]||'';
 const n=S.running?nearest():null,p=$('prompt');if(n){p.textContent=(coarse?'':'[E] ')+(n.t=='exit'?'Leave closet':'Hide');p.style.opacity=1}else p.style.opacity=0;
 $('red').style.opacity=Math.min(.75,(S.danger||0)*.8)}

/* ---------- input ---------- */
const T={move:null,look:null};
addEventListener('keydown',e=>{K[e.code]=true;if(e.repeat||!S.running)return;if(e.code=='KeyF')setFlash(!P.flash);else if(e.code=='KeyE')interact();else if(e.code=='Space'){e.preventDefault();I.breath=true}});
addEventListener('keyup',e=>{K[e.code]=false;if(e.code=='Space')I.breath=false});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement&&S.running&&!S.paused)look(e.movementX,e.movementY,.0022)});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&S.running&&!coarse){S.paused=true;I.mx=I.mz=0;show('PAUSED','Click to resume.','RESUME');$('go').onclick=()=>{$('scr').classList.add('hide');S.paused=false;lockPtr()}}});
ren.domElement.addEventListener('mousedown',e=>{if(!S.running||S.paused)return;if(!document.pointerLockElement&&!coarse)lockPtr();else interact()});
const joy=$('joy'),knob=$('knob');
addEventListener('pointerdown',e=>{if(e.pointerType=='mouse'||!S.running||S.paused||(e.target.closest&&e.target.closest('.b')))return;
 if(!T.move&&e.clientX<innerWidth*.5){T.move={id:e.pointerId,x:e.clientX,y:e.clientY};joy.style.display='block';joy.style.left=e.clientX+'px';joy.style.top=e.clientY+'px';knob.style.left=knob.style.top='40px'}
 else if(!T.look)T.look={id:e.pointerId,x:e.clientX,y:e.clientY}});
addEventListener('pointermove',e=>{if(e.pointerType=='mouse')return;
 if(T.move&&e.pointerId==T.move.id){const dx=e.clientX-T.move.x,dy=e.clientY-T.move.y,r=55,l=Math.hypot(dx,dy),k=l>r?r/l:1;I.mx=dx*k/r;I.mz=-dy*k/r;knob.style.left=(40+dx*k)+'px';knob.style.top=(40+dy*k)+'px'}
 else if(T.look&&e.pointerId==T.look.id){look(e.clientX-T.look.x,e.clientY-T.look.y,.0052);T.look.x=e.clientX;T.look.y=e.clientY}});
const up=e=>{if(T.move&&e.pointerId==T.move.id){T.move=null;I.mx=I.mz=0;joy.style.display='none'}if(T.look&&e.pointerId==T.look.id)T.look=null};
addEventListener('pointerup',up);addEventListener('pointercancel',up);
const hold=(id,k)=>{const b=$(id),u=()=>{I[k]=false;b.classList.remove('on')};b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();I[k]=true;b.classList.add('on')});b.addEventListener('pointerup',u);b.addEventListener('pointercancel',u);b.addEventListener('pointerleave',u)};
hold('bS','sprint');hold('bH','breath');
$('bF').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(S.running)setFlash(!P.flash)});
$('bA').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interact()});
if(coarse)document.body.classList.add('t');
addEventListener('resize',()=>{ren.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
const BN=['DARK','NORMAL','BRIGHT'],brb=$('brb');brb.textContent='BRIGHTNESS: '+BN[S.bright];
brb.onclick=()=>{S.bright=(S.bright+1)%3;store.set('l6h2_b',S.bright);brb.textContent='BRIGHTNESS: '+BN[S.bright]};

/* ---------- loop ---------- */
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(S.running&&!S.paused){tick(dt);hud()}
 if(S.running){syncCreature(dt);syncFish()}
 camera.position.set(P.x,1.55+(P.hide?0:Math.sin(P.bob)*.035*(P.moving?1:0)),P.z);camera.rotation.set(P.pitch,P.yaw,0);
 fl.intensity=P.flash&&P.bat>0?(P.bat<15&&Math.random()<.25?.4:3.2):0;
 amb.intensity=BR[S.bright]*(Math.random()<(.002+.02*S.dd)?.2:1);
 ren.render(scene,camera)}

/* ---------- updates (served from the update server) ---------- */
let VER=null;const getVer=async()=>{try{const r=await fetch('version.json',{cache:'no-store'});return r.ok?(await r.json()).version:null}catch(e){return null}};
getVer().then(v=>{VER=v;$('ver').textContent=v?'build '+v:'offline build'});
setInterval(async()=>{if(S.running&&!S.over)return;const v=await getVer();if(v&&VER&&v!==VER){$('ver').textContent='updating...';setTimeout(()=>location.reload(),500)}},30000);
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!(location.hostname=='localhost'&&!location.port))navigator.serviceWorker.register('sw.js').catch(()=>{});

requestAnimationFrame(loop);
show('THE LAST 6 HOURS','You survived the bathroom. Now the whole house is yours — and so is everything in it. Hide in closets when the thing in the dark comes looking. Stay away from sinks, toilets and tubs: something lives in the pipes. Survive until 6 AM, then reach the front door.','BEGIN','PART 2 · THE HOUSE');
