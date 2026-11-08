// Headless logic test: node test/sim.js  (stubs DOM + THREE, drives the real game.js)
const fs=require('fs'),vm=require('vm'),path=require('path');
const mk=()=>new Proxy(function(){},{get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='then')return undefined;return mk()},apply(){return mk()},construct(){return mk()},set(){return true}});
const el=()=>mk();
const ctx={process,console,Math,Date,Int16Array,Uint8Array,Object,Array,JSON,Number,String,Promise,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,
 matchMedia:()=>({matches:false}),innerWidth:800,innerHeight:600,devicePixelRatio:1,performance:{now:()=>0},
 requestAnimationFrame(){},addEventListener(){},navigator:{},location:{protocol:'file:',hostname:'',port:''},fetch:()=>Promise.reject(),
 localStorage:{getItem:()=>null,setItem(){}},THREE:new Proxy({},{get:()=>mk()}),
 document:{getElementById:()=>el(),createElement:()=>mk(),body:mk(),documentElement:mk(),addEventListener(){},exitPointerLock(){}}};
ctx.window=ctx;vm.createContext(ctx);
const game=fs.readFileSync(path.join(__dirname,'..','game','game.js'),'utf8');
const tests=`
;(function(){
 const fail=m=>{console.log('FAIL:',m);process.exitCode=1};
 // 1. map sanity
 let walk=0;for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(!solid(x,z))walk++;
 const f=flow(3,5);let reach=0;for(let i=0;i<W*H;i++)if(f[i]>=0)reach++;
 console.log('walkable tiles',walk,'reachable from bathroom',reach);if(reach!==walk){const o=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(!solid(x,z)&&f[z*W+x]<0)o.push(x+','+z+':'+G[z][x]);console.log('UNREACHABLE',o.join(' '))}
 if(reach!==walk)fail('map not fully connected ('+reach+'/'+walk+')');
 for(const w of WARD)if(solid(w.tileX,w.tileZ)||f[w.tileZ*W+w.tileX]<0)fail('ward front blocked '+w.x+','+w.z);
 for(const b of BAT)if(solid(b.x|0,b.z|0))fail('battery in solid');
 if(solid(3,5)||blockedAt(P.x,P.z,.28))fail('player spawn blocked');
 S.exitOpen=true;if(flow(62,26)[26*W+63]<0)fail('exit unreachable when open');S.exitOpen=false;
 console.log('wardrobes',WARD.length,'water points',WP.length,'batteries',BAT.length);
 // 2. full-night simulation with a wandering bot
 const pick=a=>a[Math.random()*a.length|0];const stats={};let deaths=[];
 const realDie=die;const why={};die=function(w){why[w]=(why[w]||0)+1;return realDie(w)};
 for(let run=0;run<30;run++){
  reset();let t=0,bot={dir:0,t:0};const seen={};
  while(S.running&&t<400){
   const dt=1/30;t+=dt;
   // bot: wander; if creature hunting nearby, try to hide
   bot.t-=dt;if(bot.t<=0){bot.dir=Math.random()*TAU;bot.t=R(.5,2.5)}
   if(!P.hide){P.yaw=bot.dir;I.mz=1;I.mx=0;I.sprint=C.st=='hunt';
    if(Math.random()<dt*.5){const n=nearest();if(n&&n.t=='hide'&&Math.random()<.5)enterHide(n.w)}
    if(S.exitOpen){// run for the door
      P.yaw=Math.atan2(-(EX.x-P.x),-(EX.z-P.z)); }
   }else{I.breath=C.st=='queue';if(Math.random()<dt*.15)exitHide()}
   tick(dt);syncCreature(dt);syncFish();
   seen[C.st]=1;seen['fish_'+FS.ph]=1;
  }
  const res=S.over?(S.exitOpen&&P.x>W-.7?'win':'dead'):'timeout';
  deaths.push(res+'@'+t.toFixed(0));
  Object.keys(seen).forEach(k=>stats[k]=(stats[k]||0)+1);
 }
 console.log('results',deaths.join(' '));
 console.log('states seen over runs',JSON.stringify(stats));
 for(const k of ['patrol','investigate','hunt','queue','fish_stir','fish_rise','fish_lunge','fish_retreat'])if(!stats[k])console.log('NOTE: never reached',k);
 // 3. hide + search + breath deterministic check
 reset();S.t=30;const w=WARD[5];P.x=w.fxx;P.z=w.fzz;P.yaw=Math.atan2(-(w.cx-P.x),-(w.cz-P.z));
 if(!nearest()||nearest().t!=='hide')fail('cannot target closet in front of it');
 enterHide(w);if(!P.hide||solid(Math.floor(P.x),Math.floor(P.z))===false)fail('hide state');
 exitHide();if(solid(Math.floor(P.x),Math.floor(P.z)))fail('exit placed player in solid');
 // 4. escape
 reset();S.t=361;S.exitOpen=true;P.x=W-1.5;P.z=27;let won=false;const rw=win;

 // 5. queue logic: creature loses sight, player hides unseen -> search -> outcomes
 let outcomes={dead:0,survived:0,skipped:0};
 for(let i=0;i<300;i++){
  reset();S.t=60;const w=WARD[i%WARD.length];
  // place creature somewhere with no line of sight to the closet
  let tries=0;do{const r=pick(RK),t=pick(RT[r]);C.x=t[0]+.5;C.z=t[1]+.5;tries++}while((los(C.x,C.z,w.fxx,w.fzz)||Math.hypot(C.x-w.fxx,C.z-w.fzz)<4)&&tries<200);
  C.st='hunt';C.ls={x:w.fxx,z:w.fzz};C.lostT=0;C.tx=-1;
  P.x=w.fxx;P.z=w.fzz;P.yaw=Math.atan2(-(w.cx-P.x),-(w.cz-P.z));
  enterHide(w);
  let t=0;while(S.running&&t<90){t+=1/30;I.breath=Math.hypot(C.x-P.x,C.z-P.z)<4.5;tick(1/30);}
  outcomes[S.over?'dead':'survived']++;
 }
 console.log('death reasons',JSON.stringify(why));
 console.log('hidden-unseen-after-chase outcomes (breath held when close):',JSON.stringify(outcomes));
 // 6. seen-hiding is lethal
 reset();S.t=60;{const w=WARD[3];C.x=w.fxx;C.z=w.fzz+0.0;C.st='hunt';C.face=0;P.x=w.fxx;P.z=w.fzz;C.x=Math.min(W-2,w.fxx+3);if(solid(Math.floor(C.x),Math.floor(C.z)))C.x=w.fxx;enterHide(w);console.log('state after hide in sight:',C.st,C.q.length&&C.q[0].sure)}
 console.log('ALL DONE');
})();
`;
try{vm.runInContext(game+tests,ctx,{timeout:60000})}catch(e){console.log('EXCEPTION',e.stack);process.exitCode=1}
