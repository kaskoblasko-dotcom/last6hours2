'use strict';
/* THE LAST 6 HOURS 2: THE HOUSE — free-roam survival horror (Three.js r128) */
const $=i=>document.getElementById(i),R=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.random()*a.length|0];
const TAU=Math.PI*2,angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const coarse=matchMedia('(pointer:coarse)').matches;
const num=(k,d)=>{try{const v=localStorage.getItem(k);return v==null||isNaN(+v)?d:+v}catch(e){return d}};
let vol=num('l6h2_vol',.8),sens=num('l6h2_sens',1);
const HL=['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- state ---------- */
const S={t:0,running:false,over:true,paused:false,exitOpen:false,hr:0,dd:0,hint:{},amb:10,st:{batt:0,thrown:0,hides:0,notes:0},bright:clamp(num('l6h2_b',1),0,2),menu:true,threat:0,power:true,fixed:false,fuses:0,pulse:0,outF:0,lamp:1,flk:0,grab:null,snSafe:0,danger:0};
const P={x:18.5,z:29.5,yaw:0,pitch:0,hide:null,baseYaw:0,stam:1,tired:false,flash:false,bat:100,breath:1,holding:false,sprinting:false,moving:false,noise:0,bob:0,stepD:0,bottles:2,out:false,cy:0,stairCd:0};
const I={mx:0,mz:0,sprint:false,breath:false,act:false},K={};

/* ---------- audio ---------- */
let AC,OUT,REVS,drone,wind,hum,cric;
const mkIR=()=>{const n=AC.sampleRate*1.8|0,b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const a=b.getChannelData(c);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}return b};
const nbuf=d=>{const n=Math.max(1,AC.sampleRate*d|0),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return b};
function audio(){
 if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();const cp=AC.createDynamicsCompressor();cp.threshold.value=-14;cp.ratio.value=5;cp.connect(AC.destination);
  OUT=AC.createGain();OUT.gain.value=vol;OUT.connect(cp);const cv=AC.createConvolver();cv.buffer=mkIR();REVS=AC.createGain();REVS.gain.value=.2;REVS.connect(cv);cv.connect(OUT)}
 if(AC.state=='suspended')AC.resume();loadFiles();
 if(!drone){
  drone=AC.createGain();drone.gain.value=.03;drone.connect(OUT);
  [55,58.5,82.4,110.7].forEach((f,i)=>{const o=AC.createOscillator(),l=AC.createBiquadFilter();o.type=i%2?'sawtooth':'triangle';o.frequency.value=f;l.frequency.value=200;o.connect(l);l.connect(drone);o.start();const lf=AC.createOscillator(),lg=AC.createGain();lf.frequency.value=.07+i*.03;lg.gain.value=14;lf.connect(lg);lg.connect(o.detune);lf.start()});
  wind=AC.createGain();wind.gain.value=0;const ws=AC.createBufferSource();ws.buffer=nbuf(4);ws.loop=true;const wf=AC.createBiquadFilter();wf.type='bandpass';wf.frequency.value=380;wf.Q.value=.7;ws.connect(wf);wf.connect(wind);wind.connect(OUT);ws.start();
  const wl=AC.createOscillator(),wlg=AC.createGain();wl.frequency.value=.13;wlg.gain.value=220;wl.connect(wlg);wlg.connect(wf.frequency);wl.start();
  hum=AC.createGain();hum.gain.value=0;[60,120,180].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.value=[1,.5,.25][i];o.connect(g);g.connect(hum);o.start()});hum.connect(OUT);
  cric=AC.createGain();cric.gain.value=0;const co=AC.createOscillator(),cm=AC.createGain(),cl=AC.createOscillator(),clg=AC.createGain();co.frequency.value=4300;cm.gain.value=.5;cl.frequency.value=17;clg.gain.value=.5;cl.connect(clg);clg.connect(cm.gain);co.connect(cm);cm.connect(cric);cric.connect(OUT);co.start();cl.start()}}
const dest=pan=>{const g=AC.createGain();g.connect(OUT);g.connect(REVS);if(pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=clamp(pan,-1,1);p.connect(g);return p}return g};
const FILES={};let FILESLOADED=false;
/* Optional real audio: put files in audio/ and list them in audio/index.json, e.g. {"door_open":["door_open_1.ogg"],"step_wood":["w1.ogg","w2.ogg"]}. Missing files fall back to the synth. */
function loadFiles(){if(FILESLOADED||!AC)return;FILESLOADED=true;fetch('audio/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;for(const k in m){FILES[k]=[];for(const f of m[k])fetch('audio/'+f).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(buf=>FILES[k].push(buf)).catch(()=>{})}}).catch(()=>{})}
function playFile(k,v=1,pan=0){const a=FILES[k];if(!a||!a.length||!AC)return false;const sr=AC.createBufferSource(),g=AC.createGain();sr.buffer=a[Math.random()*a.length|0];sr.playbackRate.value=.94+Math.random()*.12;g.gain.value=v;sr.connect(g);g.connect(dest(pan));sr.start();return true}
function tone(f,d,ty='sine',v=.2,sl=0,dl=0,pan=0){if(!AC||v<.003)return;const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+dl;o.type=ty;o.frequency.setValueAtTime(f,t0);o.detune.value=(Math.random()-.5)*14;if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+sl),t0+d);g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(v,t0+Math.min(.006,d*.3));g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(g);g.connect(dest(pan));o.start(t0);o.stop(t0+d+.02)}
let NB=null;
let PNB=null;
const pinkbuf=d=>{const n=Math.max(1,AC.sampleRate*d|0),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;a[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}return b};
function noise(d,fq=800,v=.3,dl=0,pan=0,ty='lowpass',q=.7){if(!AC||v<.003)return;NB=NB||nbuf(2);PNB=PNB||pinkbuf(2);const sr=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),t0=AC.currentTime+dl;sr.buffer=ty=='highpass'?NB:PNB;sr.playbackRate.value=.9+Math.random()*.2;f.type=ty;f.frequency.value=fq*(.92+Math.random()*.16);f.Q.value=q;g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(v*(ty=='highpass'?1:2.2),t0+.004);g.gain.exponentialRampToValueAtTime(.001,t0+Math.min(d,1.9));sr.connect(f);f.connect(g);g.connect(dest(pan));sr.start(t0,Math.random());sr.stop(t0+Math.min(d,1.9)+.05)}
function whisper(pan=R(-.8,.8)){for(let i=0;i<5;i++){noise(.2,3000+R(0,900),.07,i*.2,pan,'bandpass',4)}}
function scream(){if(!AC)return;const d=AC.createWaveShaper(),c=new Float32Array(256);for(let i=0;i<256;i++)c[i]=Math.tanh((i/128-1)*6);d.curve=c;d.connect(OUT);
 [[420,1.6,'sawtooth',900],[437,1.6,'square',700],[210,1.6,'sawtooth',500],[880,1.2,'sawtooth',-300]].forEach(([f,du,ty,sl])=>{const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t0+.35);o.frequency.exponentialRampToValueAtTime(f*.6,t0+du);g.gain.setValueAtTime(.3,t0);g.gain.exponentialRampToValueAtTime(.001,t0+du);o.connect(g);g.connect(d);o.start(t0);o.stop(t0+du)});
 noise(1.5,6000,.8);tone(45,.9,'sine',.9,-15)}
const spat=(x,z)=>{const dx=x-P.x,dz=z-P.z,d=Math.hypot(dx,dz)||.01;return{v:1/(1+d*d*.05),pan:(dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/d}};
const click=()=>{tone(1800,.025,'square',.035);noise(.02,5000,.05,0,0,'highpass')};
const flClick=on=>{if(playFile('flashlight',.8))return;noise(.015,4500,.25,0,0,'highpass');tone(on?1500:1100,.03,'square',.05);noise(.04,1800,.1,.02,0,'bandpass',2)};
const gurgle=(x,z,k=1)=>{const sp=spat(x,z);for(let i=0;i<6;i++){const f=R(160,320);tone(f,.12,'sine',.13*sp.v*k,R(60,160),i*.09+R(0,.04),sp.pan)}noise(.6,520,.16*sp.v*k,0,sp.pan,'bandpass',1.2);noise(.3,1400,.06*sp.v*k,.15,sp.pan,'bandpass',2)};
const thud=(x,z,v=.5)=>{const sp=spat(x,z);if(playFile('thud',v*sp.v*1.5,sp.pan))return;noise(.16,180,v*sp.v,0,sp.pan);tone(R(60,75),.22,'sine',.35*v*sp.v,-25,0,sp.pan);noise(.05,1200,.15*v*sp.v,0,sp.pan)};
function step(k,v,pan=0){if(playFile('step_'+k,v*2.2,pan))return;
 if(k=='grass'){noise(.16,R(1500,2200),v*.4,0,pan,'bandpass',.7);noise(.1,R(450,600),v*.3,.02,pan)}
 else if(k=='water'){noise(.25,R(900,1300),v*.8,0,pan,'bandpass',.8);noise(.12,R(400,500),v*.45,.02,pan);for(let i=0;i<2;i++)tone(R(300,600),.06,'sine',v*.15,R(150,300),.05+i*.06,pan)}
 else if(k=='stone'){noise(.05,3500,v*.4,0,pan,'highpass',.5);noise(.1,R(220,300),v*.45,.005,pan);tone(R(130,160),.07,'triangle',v*.08,-40,0,pan);if(Math.random()<.3)noise(.03,6000,v*.12,.04,pan,'highpass')}
 else if(k=='tile'){noise(.04,R(4500,6000),v*.4,0,pan,'highpass');tone(R(900,1200),.05,'triangle',v*.06,-200,0,pan);noise(.1,350,v*.35,.01,pan)}
 else if(k=='carpet'){noise(.12,R(260,340),v*.55,0,pan);noise(.06,900,v*.12,.01,pan)}
 else{noise(.09,R(240,320),v*.9,0,pan);tone(R(85,110),.1,'sine',v*.4,-30,0,pan);noise(.03,R(1400,2200),v*.25,.005,pan,'bandpass',1.5);if(Math.random()<.12)tone(R(300,520),.2,'sawtooth',v*.05,-120,.05,pan)}}
const heavyStep=(v,pan)=>{noise(.14,160,.6*v,0,pan);tone(R(55,70),.22,'sine',.4*v,-20,0,pan);noise(.05,900,.15*v,.01,pan,'bandpass',1.5)};
const growl=(v,pan,d=.8,f=R(60,85))=>{if(!AC||v<.01)return;const t0=AC.currentTime,g=AC.createGain(),lp=AC.createBiquadFilter(),tr=AC.createOscillator(),tg=AC.createGain(),am=AC.createGain();lp.type='lowpass';lp.frequency.setValueAtTime(300,t0);lp.frequency.linearRampToValueAtTime(700,t0+d*.4);lp.frequency.linearRampToValueAtTime(200,t0+d);lp.Q.value=4;tr.frequency.value=R(22,34);tg.gain.value=.5;am.gain.value=.5;tr.connect(tg);tg.connect(am.gain);g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.22*v,t0+.12);g.gain.exponentialRampToValueAtTime(.001,t0+d);for(const m of[1,1.012,.5]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*m,t0);o.frequency.linearRampToValueAtTime(f*m*.8,t0+d);o.connect(lp);o.start(t0);o.stop(t0+d)}lp.connect(am);am.connect(g);g.connect(dest(pan));tr.start(t0);tr.stop(t0+d)};
const skitter=(v,pan,wet)=>{if(wet){noise(.15,R(800,1100),.3*v,0,pan,'bandpass',.9);return}for(let i=0;i<4;i++){noise(.02,R(3500,5500),.18*v,i*.04+R(0,.015),pan,'highpass');tone(R(1600,2400),.015,'square',.03*v,0,i*.04,pan)}};
const clickChirp=(v,pan)=>{for(let i=0;i<5;i++)tone(R(1800,2600),.03,'square',.05*v,0,i*.06,pan);tone(R(500,700),.3,'sawtooth',.03*v,-150,0,pan)};
const shatter=(v,pan,dl=0)=>{noise(.4,6000,.5*v,dl,pan,'highpass');noise(.5,3500,.3*v,dl+.03,pan,'bandpass',.8);for(let i=0;i<7;i++)tone(R(2500,5500),.08,'triangle',.05*v,-R(200,900),dl+i*.05+R(0,.04),pan)};
const sfxBat=()=>{if(playFile('pickup_battery',.9))return;tone(R(2200,2600),.12,'triangle',.08,-300);tone(3300,.08,'sine',.05);noise(.04,5000,.15,0,0,'highpass');tone(520,.12,'sine',.1,0,.08);tone(780,.18,'sine',.1,0,.13)};
const sfxFuse=()=>{if(playFile('pickup_fuse',.9))return;noise(.15,4500,.25,0,0,'highpass');tone(1000,.1,'square',.08);tone(1500,.3,'sine',.1,0,.1);tone(2000,.3,'sine',.06,0,.18)};
const sfxNote=()=>{if(playFile('pickup_note',.9))return;noise(.18,2500,.18,0,0,'bandpass',.6);noise(.12,4000,.12,.1,0,'bandpass',.8);noise(.15,3200,.1,.2,0,'bandpass',.7);tone(440,.4,'sine',.04,0,.1)};
const sfxBottle=()=>{if(playFile('pickup_bottle',.9))return;tone(R(2800,3200),.18,'triangle',.07,-400);tone(4200,.1,'sine',.04);noise(.03,6000,.1,0,0,'highpass');tone(1000,.12,'sine',.06,-200,.05)};
const heartbeat=d=>{tone(55,.12,'sine',.45*d,-15);noise(.08,150,.3*d);tone(48,.14,'sine',.32*d,-12,.17);noise(.07,130,.2*d,.17)};
function swell(){if(!AC)return;const t0=AC.currentTime,f=R(110,170),g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.05,t0+2.2);g.gain.exponentialRampToValueAtTime(.001,t0+5.5);for(const r of[1,1.0595,1.4142,.5]){const o=AC.createOscillator();o.type=r==.5?'sine':'sawtooth';o.frequency.setValueAtTime(f*r,t0);o.frequency.linearRampToValueAtTime(f*r*1.03,t0+5.5);o.detune.value=R(-8,8);o.connect(lp);o.start(t0);o.stop(t0+5.6)}lp.connect(g);g.connect(OUT);g.connect(REVS)}
const cellarAmb=(sp,q)=>{if(q<.5){tone(R(900,1500),.08,'sine',.12*sp.v+.03,-400,0,sp.pan);tone(R(500,800),.12,'sine',.06*sp.v+.01,-200,.03,sp.pan)}else if(q<.75){tone(R(180,260),.5,'triangle',.1*sp.v+.02,-20,0,sp.pan);noise(.05,2500,.15*sp.v,0,sp.pan,'bandpass',3)}else noise(1.4,90,.25*sp.v+.04,0,sp.pan)};
const thunder=()=>{noise(1.9,120,.55);noise(1.5,70,.5,.4);tone(40,1.8,'sine',.5,-12,.1);noise(.3,2500,.25,0,0,'highpass')};
const creak=(x,z,k=1)=>{if(!AC)return;const sp=spat(x,z);if(playFile('creak',.6*k,sp.pan))return;const t0=AC.currentTime,o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain(),lf=AC.createOscillator(),lg=AC.createGain(),d=R(.5,.9);o.type='sawtooth';o.frequency.setValueAtTime(R(95,140),t0);o.frequency.linearRampToValueAtTime(R(150,230),t0+d);lf.frequency.value=R(18,32);lg.gain.value=14;lf.connect(lg);lg.connect(o.frequency);f.type='bandpass';f.frequency.setValueAtTime(R(500,700),t0);f.frequency.linearRampToValueAtTime(R(900,1500),t0+d);f.Q.value=7;g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(.09*sp.v*k+.01,t0+.08);g.gain.linearRampToValueAtTime(.05*sp.v*k,t0+d*.7);g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(f);f.connect(g);g.connect(dest(sp.pan));lf.start(t0);o.start(t0);o.stop(t0+d);lf.stop(t0+d)};
const doorOpen=(x,z)=>{const sp=spat(x,z);if(playFile('door_open',.9,sp.pan))return;noise(.03,3000,.3*sp.v,0,sp.pan,'bandpass',2);tone(R(250,300),.03,'square',.05*sp.v,-100,.01,sp.pan);creak(x,z)};
const doorClose=(x,z)=>{const sp=spat(x,z);if(playFile('door_close',1,sp.pan))return;creak(x,z,.7);noise(.18,200,.5*sp.v,.35,sp.pan);tone(70,.25,'sine',.35*sp.v,-25,.35,sp.pan);noise(.03,3000,.25*sp.v,.38,sp.pan,'bandpass',2)};
const owl=()=>{tone(430,.4,'sine',.06,-70);tone(860,.4,'sine',.015,-140);tone(390,.6,'sine',.06,-60,.5);tone(780,.6,'sine',.012,-120,.5)};
const zap=()=>{noise(.25,6000,.3,0,0,'highpass');tone(90,.4,'sawtooth',.2,-40);tone(1500,.1,'square',.06);for(let i=0;i<6;i++)noise(.03,R(3000,7000),.2,.05+i*.05,0,'highpass')};
function snPulseSnd(d){const v=clamp(1.1-d/18,.3,1);tone(52,.4,'sine',.55*v,-18);tone(52,.35,'sine',.4*v,-18,.16);tone(2100,.5,'sine',.04*v,-1400);noise(.3,700,.15*v)}
function beds(){if(!AC||!drone)return;const t=AC.currentTime,o=S.outF,act=S.running&&!S.over;
 drone.gain.setTargetAtTime(.03+.08*S.dd+.05*S.danger,t,.2);wind.gain.setTargetAtTime(act?.012+.075*o+.02*S.dd:.01,t,.4);hum.gain.setTargetAtTime(act&&S.power?.012*(1-.85*o):0,t,.15);
 cric.gain.setTargetAtTime(act&&SN.st!='watch'&&SN.st!='rush'&&SN.st!='grab'?.016*o:0,t,.5)}

/*LAYOUT-START*/
const W=64,ZO=56,H=152,STX=45,STS=44,B0=ZO*2;const lvl=z=>z>=B0?2:z>=ZO?1:0;
const G=Array.from({length:H},()=>Array(W).fill('#'));
const rect=(c,x0,z0,x1,z1)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)G[z][x]=c};
const isOut=c=>c=='O'||c=='p'||c=='T';
const ROOMS=[],DOORS=[],FU=[],WRD=[],WPD=[],WINS=[],TREES=[],BUSH=[];
const NOCOL={rug:1,fusebox:1};
const room=(c,x0,z0,x1,z1)=>{rect(c,x0,z0,x1,z1);ROOMS.push({c,x0,z0,x1,z1})};
rect('O',2,2,61,53);rect('F',1,1,62,1);rect('F',1,54,62,54);rect('F',1,1,1,54);rect('F',62,1,62,54);
rect('X',29,54,30,54);rect('T',28,40,31,53);rect('p',28,38,31,39);rect('p',18,11,21,12);rect('#',15,13,48,37);
const plan=(o,A,hc,C)=>{for(const[c,a,b]of A)room(c,a,14+o,b,21+o);room(hc,16,23+o,46,24+o);for(const[c,a,b]of C)room(c,a,26+o,b,36+o)};
plan(0,[['k',16,23],['d',25,34],['v',36,47]],'h',[['b',16,23],['f',25,34],['l',36,47]]);
plan(ZO,[['m',16,25],['a',27,32],['n',34,47]],'H',[['g',16,23],['s',25,34],['u',36,47]]);
const dr=(x0,z0,x1,z1,o,c)=>{rect(c,x0,z0+o,x1,z1+o);DOORS.push({x0,z0:z0+o,x1,z1:z1+o})};
for(const[o,c,top,bot,ia]of[[0,'h',[[19,20],[29,30],[40,41]],[[19,20],[29,30],[40,41]],[24,35]],[ZO,'H',[[20,21],[29,30],[40,41]],[[19,20],[29,30],[40,41]],[26,33]]]){
 for(const[a,b]of top)dr(a,22,b,22,o,c);for(const[a,b]of bot)dr(a,25,b,25,o,c);
 for(const x of ia)dr(x,17,x,18,o,c);for(const x of[24,35])dr(x,30,x,31,o,c)}
dr(29,37,30,37,0,'h');dr(19,13,20,13,0,'h');
/* ---- basement (level 3, offset B0) ---- */
rect('B',16,23+B0,46,24+B0);
for(const[c,a,b]of[['B',16,26],['Q',28,38],['R',40,46]])rect(c,a,14+B0,b,21+B0);
for(const[c,a,b]of[['B',16,26],['Q',28,37],['R',39,46]])rect(c,a,26+B0,b,36+B0);
for(const[a,b]of[[20,21],[32,33],[42,43]])dr(a,22,b,22,B0,'B');
for(const[a,b]of[[20,21],[31,32],[42,43]])dr(a,25,b,25,B0,'B');
dr(27,17,27,18,B0,'B');dr(39,17,39,18,B0,'B');dr(27,30,27,31,B0,'B');dr(38,30,38,31,B0,'B');
/* vent tunnels (crawl only) */
rect('y',18,B0+12,44,B0+12);rect('y',18,B0+13,18,B0+13);rect('y',33,B0+13,33,B0+13);rect('y',44,B0+13,44,B0+13);
rect('y',18,B0+38,44,B0+38);rect('y',18,B0+37,18,B0+37);rect('y',32,B0+37,32,B0+37);rect('y',44,B0+37,44,B0+37);
const SPART={},STP={};
for(const z of[23,24]){G[z][STS]='S';G[z+ZO][STS]='S';const a=z*W+STS,b=(z+ZO)*W+STS;SPART[a]=b;SPART[b]=a;STP[a]={dir:1,lx:STS-.5,lz:z+ZO+.5};STP[b]={dir:-1,lx:STS-.5,lz:z+.5}}
{const a=20*W+19,b=(B0+23)*W+17;SPART[a]=b;SPART[b]=a}
const UPS=(x,z)=>x>=STX&&x<=STX+1&&((z>=23&&z<=24)||(z>=ZO+23&&z<=ZO+24));
const fu=(k,x,z,w=1,d=1,f='s',o={})=>FU.push({k,x,z,w,d,f,o});
const wd=(x,z,f)=>WRD.push([x,z,f]);
const Z=ZO;
/* kitchen */fu('fridge',16,14,1,1,'e');fu('counter',17,14,2,1);fu('stove',21,14);fu('counter',22,14,2,1);fu('sinkc',16,16,1,2,'e');fu('counter',16,18,1,2,'e');fu('table',19,17,3,2,'s',{c:0x6a4a2e,cloth:0xb8a890});fu('rug',18,16,5,4,'s',{c:0x8a5a3a});wd(23,21,'w');
/* dining */fu('table',28,16,4,3,'s',{c:0x4a2e1c,cloth:0x8a2a2a,dec:1});fu('chair',28,15);fu('chair',31,15);fu('chair',28,19,1,1,'n');fu('chair',31,19,1,1,'n');fu('cabinet',26,14,2,1);fu('cabinet',32,14,2,1);fu('lamp',34,14);fu('rug',26,15,8,6,'s',{c:0x7a2a2a});wd(25,21,'e');
/* living */fu('tvstand',40,14,3,1);fu('fireplace',47,17,1,2,'w');fu('sofa',39,19,4,1,'n',{c:0x5a3a2a});fu('table',40,17,2,1,'s',{h:.45,c:0x3a2a1a});fu('armchair',37,18,1,1,'e',{c:0x4a5a3a});fu('armchair',44,18,1,1,'w',{c:0x4a5a3a});fu('bookshelf',47,14,1,2,'w');fu('planter',44,14,2,1);fu('plant',36,14);fu('lamp',36,21);fu('rug',38,16,7,5,'s',{c:0x3a5a4a});wd(47,21,'w');
/* hall */fu('clock',16,23);fu('console',23,24,2,1,'n');fu('plant',37,24);wd(16,24,'e');wd(34,23,'s');
/* bedroom */fu('bed',16,32,3,2,'e',{c:0x4a3322,bc:0x3a4a6a});fu('nightstand',16,31,1,1,'e');fu('nightstand',16,34,1,1,'e');fu('wardrobe',21,26,3,1);fu('dresser',23,33,1,2,'w');fu('desk',19,36,2,1,'n');fu('chair',19,35);fu('rug',18,28,5,3,'s',{c:0x5a4a6a});wd(16,26,'e');
/* foyer */fu('column',27,29);fu('column',32,29);fu('rtable',29,32,2,2);fu('bench',26,36,2,1,'n');fu('coatrack',33,36);fu('plant',25,28);fu('plant',34,28);fu('rug',27,27,6,9,'s',{c:0x6a2a2a});wd(25,26,'e');wd(34,26,'w');wd(25,36,'n');
/* library */fu('bookshelf',37,26,3,1);fu('bookshelf',42,26,4,1);fu('bookshelf',47,27,1,3,'w');fu('bookshelf',47,32,1,4,'w');fu('bookshelf',37,36,4,1,'n');fu('bookshelf',43,36,4,1,'n');fu('table',40,31,4,2,'s',{c:0x3a2616});fu('chair',40,30);fu('chair',43,30);fu('chair',40,33,1,1,'n');fu('chair',43,33,1,1,'n');fu('armchair',37,33,1,1,'e',{c:0x6a2a2a});fu('armchair',37,28,1,1,'e',{c:0x6a2a2a});fu('globe',45,30);fu('rug',38,29,8,6,'s',{c:0x4a2a2a});wd(36,26,'s');wd(47,31,'w');
/* master */fu('bed',19,14+Z,3,3,'s',{c:0x3a2a1c,nb:1});fu('nightstand',18,14+Z);fu('nightstand',22,14+Z);fu('vanity',16,14+Z,2,1);fu('wardrobe',16,17+Z,1,3,'e');fu('dresser',23,21+Z,2,1,'n');fu('armchair',24,16+Z,1,1,'w',{c:0x5a3a5a});fu('rug',18,17+Z,5,3,'s',{c:0x6a3a5a});wd(25,14+Z,'w');
/* bath */fu('tub',27,14+Z,4,2);fu('toilet',31,14+Z);fu('basin',32,14+Z);fu('cabinet',27,21+Z,1,1,'e',{h:1.1});fu('rug',29,17+Z,2,3,'s',{c:0x4a6a7a});wd(32,21+Z,'w');
/* nursery */fu('crib',37,14+Z,2,2);fu('dresser',41,14+Z,2,1);fu('toychest',44,14+Z,2,1);fu('bookshelf',47,15+Z,1,5,'w',{h:1.5});fu('rockhorse',45,20+Z,1,1,'w');fu('blocks',44,18+Z);fu('rocker',39,17+Z);fu('rug',38,16+Z,6,4,'s',{c:0x6a8aa0});wd(34,21+Z,'e');wd(47,21+Z,'w');
/* upstairs hall */fu('clock',16,23+Z);fu('console',23,24+Z,2,1,'n');fu('plant',37,24+Z);wd(16,24+Z,'e');wd(34,23+Z,'s');
/* guest */fu('bed',16,28+Z,3,2,'e',{c:0x5a4a3a,bc:0x5a7a5a});fu('bed',16,32+Z,3,2,'e',{c:0x5a4a3a,bc:0x7a5a5a});fu('nightstand',16,30+Z,1,1,'e');fu('wardrobe',21,26+Z,3,1);fu('desk',21,36+Z,2,1,'n');fu('chair',21,35+Z);fu('rug',19,28+Z,4,5,'s',{c:0x5a6a4a});wd(16,26+Z,'e');
/* sitting */fu('piano',26,35+Z,3,2,'n');fu('stool',27,34+Z);fu('sofa',31,35+Z,3,1,'n',{c:0x6a5a3a});fu('table',31,33+Z,2,1,'s',{h:.45,c:0x3a2a1a});fu('armchair',33,28+Z,1,1,'w',{c:0x3a5a5a});fu('cabinet',26,26+Z,2,1);fu('cabinet',32,26+Z,2,1);fu('plant',34,27+Z);fu('plant',25,28+Z);fu('rug',27,29+Z,6,5,'s',{c:0x5a3a3a});wd(34,36+Z,'w');wd(25,26+Z,'s');
/* attic study */fu('bookshelf',37,26+Z,3,1);fu('bookshelf',44,26+Z,3,1);fu('bookshelf',47,28+Z,1,6,'w');fu('desk',42,33+Z,3,2,'s');fu('chair',43,35+Z,1,1,'n');fu('chest',37,35+Z,2,1,'e');fu('telescope',45,35+Z);fu('globe',40,34+Z);fu('rug',39,29+Z,6,4,'s',{c:0x5a4a2a});wd(36,36+Z,'e');wd(47,35+Z,'w');
/* outside */fu('shed',4,6,4,4);fu('well',56,8,2,2);fu('car',50,43,5,3,'e');fu('bin',23,12);fu('bench',36,44,2,1,'n');fu('mailbox',27,51,1,1,'e');fu('woodpile',44,9,3,2);fu('barrel',3,10);fu('crate',9,6);fu('post',28,39);fu('post',31,39);fu('fusebox',48,16,1,1,'e');
for(const[x,z]of[[5,40],[7,42],[9,40],[5,44],[8,46],[11,43]])fu('grave',x,z);
/* basement dressing */
fu('crate',17,B0+15);fu('crate',18,B0+15);fu('barrel',17,B0+18);fu('bookshelf',21,B0+14,3,1,'s',{h:1.8});wd(26,B0+20,'w');
fu('barrel',30,B0+15);fu('crate',36,B0+19);fu('barrel',37,B0+15);
fu('crate',45,B0+15,2,1);fu('barrel',42,B0+19);wd(40,B0+15,'e');
fu('crate',17,B0+27);fu('barrel',25,B0+34);fu('bookshelf',18,B0+36,3,1,'n',{h:1.8});wd(16,B0+30,'e');
fu('crate',45,B0+27,2,1);fu('barrel',40,B0+35);wd(46,B0+34,'w');fu('barrel',46,B0+24);
WPD.push([33.5,B0+17.5,.2,'pool',.8],[32.5,B0+31.5,.2,'pool',.8],[30.5,B0+34.5,.2,'pool',.7],[35.5,B0+17.5,.2,'pool',.7]);
WPD.push([16.5,17,.95,'sink',.22],[29,15+Z,.64,'tub',.45],[31.5,14.5+Z,.5,'toilet',.18],[32.5,14.5+Z,.9,'sink',.2]);
/* windows: [x,z,dx,dz] two cells wide, (dx,dz)=inward normal */
for(const[o,N,Wt,Sx,E]of[[0,[17,21,26,31,38,43],[16,28,33],[17,21,26,32,38,44],[19,28,33]],[Z,[17,22,29,37,43],[16,28,33],[17,21,27,31,38,44],[18,28,33]]]){
 for(const x of N)WINS.push([x,13+o,0,1]);for(const z of Wt)WINS.push([15,z+o,1,0]);for(const x of Sx)WINS.push([x,37+o,0,-1]);for(const z of E)WINS.push([48,z+o,-1,0])}
/* items */
const BSP=[[22.5,20.5],[26.5,20.5],[33.5,19.5],[37.5,15.5],[45.5,20.5],[20.5,24.5],[30.5,23.5],[18.5,35.5],[22.5,28.5],[31.5,28.5],[27.5,34.5],[38.5,29.5],[44.5,34.5],[18.5,18.5+Z],[23.5,19.5+Z],[29.5,19.5+Z],[38.5,18.5+Z],[45.5,17.5+Z],[30.5,23.5+Z],[20.5,30.5+Z],[29.5,30.5+Z],[39.5,29.5+Z],[44.5,30.5+Z],[10.5,12.5],[20.5,8.5],[40.5,6.5],[56.5,20.5],[58.5,45.5],[35.5,47.5],[12.5,30.5],[6.5,28.5],[52.5,30.5],[24.5,44.5],[45.5,50.5],[8.5,50.5]];
const BOP=[[23.5,19.5],[27.5,20.5],[38.5,20.5],[26.5,23.5],[36.5,23.5],[17.5,27.5],[26.5,33.5],[45.5,28.5],[38.5,34.5],[24.5,19.5+Z],[28.5,20.5+Z],[43.5,20.5+Z],[18.5,34.5+Z],[28.5,32.5+Z],[38.5,33.5+Z],[27.5,24.5+Z],[12.5,18.5],[12.5,34.5],[4.5,14.5],[52.5,14.5],[58.5,30.5],[40.5,41.5],[20.5,44.5],[5.5,49.5]];
const FUSP=[[9.5,9.5],[54.5,10.5],[49.5,47.5]];
BSP.push([17.5,B0+16.5],[24.5,B0+14.5],[43.5,B0+16.5],[20.5,B0+28.5],[44.5,B0+32.5],[41.5,B0+20.5],[20.5,B0+23.5],[30.5,B0+23.5]);BOP.push([18.5,B0+18.5],[36.5,B0+16.5],[30.5,B0+32.5],[42.5,B0+29.5],[26.5,B0+23.5]);
const PB=new Uint8Array(W*H),DB=new Uint8Array(W*H);
for(const u of FU)if(!NOCOL[u.k])for(let j=0;j<u.d;j++)for(let i=0;i<u.w;i++)PB[(u.z+j)*W+u.x+i]=1;
for(const[x,z]of WRD)PB[z*W+x]=1;
for(const z of[23,24])for(const x of[STX,STX+1]){PB[z*W+x]=1;PB[(z+ZO)*W+x]=1}
let _s=1337;const rnd=()=>{_s|=0;_s=_s+0x6D2B79F5|0;let t=Math.imul(_s^_s>>>15,1|_s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const NOTREE=[[9.5,9.5],[54.5,10.5],[49.5,47.5],[23.5,12.5],[49.5,16.5],[30,52],[30,3]];
for(let n=0;n<1500&&TREES.length<40;n++){const x=2+(rnd()*59|0),z=2+(rnd()*51|0);if(x>=12&&x<=51&&z>=10&&z<=40)continue;if(G[z][x]!='O')continue;let ok=true;for(let j=-1;j<=1&&ok;j++)for(let i=-1;i<=1;i++)if(G[z+j][x+i]!='O'||PB[(z+j)*W+x+i]){ok=false;break}
 if(!ok)continue;for(const t of TREES)if(Math.hypot(t.x-x,t.z-z)<3.5)ok=false;for(const[a,b]of NOTREE)if(Math.hypot(a-x-.5,b-z-.5)<2.5)ok=false;if(!ok)continue;TREES.push({x,z,dead:rnd()<.4,s:.8+rnd()*.6,r:rnd()*TAU});PB[z*W+x]=1}
for(let x=22;x<=46;x+=3)if(G[12][x]=='O'&&!PB[12*W+x]&&Math.abs(x-23)>1)BUSH.push([x+.5,12.55]);for(let x=16;x<=47;x+=3)if(G[38][x]=='O'&&!PB[38*W+x]&&(x<27||x>32))BUSH.push([x+.5,38.45]);for(let z=15;z<=36;z+=3)if(G[z][14]=='O')BUSH.push([14.5,z+.5]);for(let z=19;z<=36;z+=3)if(G[z][49]=='O')BUSH.push([49.55,z+.5]);
/*LAYOUT-END*/

const solid=(x,z,nd)=>{if(x<0||z<0||x>=W||z>=H)return true;const c=G[z][x];return c=='#'||c=='F'||(c=='X'&&!S.exitOpen)||PB[z*W+x]==1||(!nd&&DB[z*W+x]==1)};
const wallAt=(x,z)=>x<0||z<0||x>=W||z>=H||G[z][x]=='#'||G[z][x]=='F'||(G[z][x]=='X'&&!S.exitOpen)||DB[z*W+x]==1;
const csolid=(x,z)=>solid(x,z,1)||isOut(G[z][x])||G[z][x]=='y';
const osolid=(x,z)=>solid(x,z,1)||!isOut(G[z][x]);
const blockedAt=(x,z,r)=>{for(let j=Math.floor(z-r);j<=Math.floor(z+r);j++)for(let i=Math.floor(x-r);i<=Math.floor(x+r);i++)if(solid(i,j)||(G[j][i]=='y'&&P.pose!=2))return true;return false};
function los(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.3);for(let i=1;i<n;i++){const k=i/n;if(wallAt(Math.floor(ax+(bx-ax)*k),Math.floor(az+(bz-az)*k)))return false}return true}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function flow(tx,tz,sol=solid){const d=new Int16Array(W*H).fill(-1),q=[tz*W+tx];d[q[0]]=0;
 for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cz=c/W|0;for(const[dx,dz]of DIRS){const nx=cx+dx,nz=cz+dz;if(sol(nx,nz)||d[nz*W+nx]>=0)continue;if(dx&&dz&&(sol(cx+dx,cz)||sol(cx,cz+dz)))continue;d[nz*W+nx]=d[c]+1;q.push(nz*W+nx)}const pr=SPART[c];if(pr!==undefined&&d[pr]<0){d[pr]=d[c]+1;q.push(pr)}}return d}
const NAMES={k:'KITCHEN',d:'DINING ROOM',v:'LIVING ROOM',h:'HALLWAY',b:'BEDROOM',f:'FOYER',l:'LIBRARY',m:'MASTER BEDROOM',a:'BATHROOM',n:'NURSERY',H:'UPSTAIRS HALL',g:'GUEST ROOM',s:'SITTING ROOM',u:'ATTIC STUDY',S:'STAIRS',p:'PORCH',O:'THE YARD',T:'GARDEN PATH',X:'GATE',B:'BASEMENT',Q:'FLOODED CELLAR',R:'STORAGE',y:'VENT'};
const EX={x:30,z:54.5};
const RT={};for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];if(c!='#'&&c!='F'&&c!='X'&&c!='S'&&!solid(x,z))(RT[c]=RT[c]||[]).push([x,z])}
const RK=Object.keys(RT),IRK=RK.filter(c=>!isOut(c)&&!'BQRy'.includes(c)),ROT=(RT.O||[]).concat(RT.T||[]);

/* ---------- three.js ---------- */
const ren=new THREE.WebGLRenderer({antialias:!coarse});ren.setSize(innerWidth,innerHeight);ren.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:2));ren.domElement.id='gl';document.body.prepend(ren.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.fog=new THREE.FogExp2(0,.08);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,110);camera.rotation.order='YXZ';scene.add(camera);
const BR=[.16,.3,.55],OBR=[.32,.5,.8],PWR=[.6,.9,1.25],amb=new THREE.AmbientLight(0x556677,BR[S.bright]);scene.add(amb);
const fl=new THREE.SpotLight(0xfff2d0,0,18,.45,.5,1.1);fl.position.set(.12,-.1,0);camera.add(fl);
const tg=new THREE.Object3D();tg.position.set(0,0,-1);camera.add(tg);fl.target=tg;
camera.add(new THREE.PointLight(0x8899aa,.5,6,1.4));
const exitL=new THREE.PointLight(0xff3322,1.4,12,1.5);exitL.position.set(30,2.4,52.8);scene.add(exitL);
const porchL=new THREE.PointLight(0xffc97a,1.1,10,1.5);porchL.position.set(30,2.5,38.6);scene.add(porchL);
const backL=new THREE.PointLight(0xffc97a,1,9,1.5);backL.position.set(19.5,2.5,11.6);scene.add(backL);

function ctex(draw,w=128,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
const rn=(g,w,h,n,a,col='0,0,0',s=2)=>{for(let i=0;i<n;i++){g.fillStyle=`rgba(${col},${Math.random()*a})`;g.fillRect(Math.random()*w,Math.random()*h,s,s)}};
const woodT=ctex((g,w,h)=>{g.fillStyle='#8a6a48';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){const t=R(-14,14)|0;g.fillStyle=`rgb(${138+t},${106+t},${72+t})`;g.fillRect(0,y,w,31);g.strokeStyle='rgba(40,25,10,.55)';g.lineWidth=2;g.beginPath();g.moveTo(0,y+.5);g.lineTo(w,y+.5);g.stroke();for(let k=0;k<5;k++){g.strokeStyle=`rgba(60,38,18,${R(.08,.2)})`;g.lineWidth=1;g.beginPath();const yy=y+R(3,28);g.moveTo(0,yy);g.lineTo(w,yy+R(-2,2));g.stroke()}g.fillStyle='rgba(30,18,8,.6)';g.fillRect(R(10,118),y,2,31)}rn(g,w,h,300,.1)});
const tileT=ctex((g,w,h)=>{g.fillStyle='#d8d4c8';g.fillRect(0,0,w,h);for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle=(x+y)%2?'#b8b4a8':'#e6e2d6';g.fillRect(x*64+1,y*64+1,62,62)}g.strokeStyle='#6a665c';g.lineWidth=2;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(64,0);g.lineTo(64,h);g.moveTo(0,64);g.lineTo(w,64);g.stroke();rn(g,w,h,250,.08)});
const marbleT=ctex((g,w,h)=>{for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle=(x+y)%2?'#26262c':'#ece8e0';g.fillRect(x*64,y*64,64,64)}g.strokeStyle='rgba(120,120,130,.35)';for(let i=0;i<14;i++){g.beginPath();g.moveTo(R(0,w),R(0,h));g.lineTo(R(0,w),R(0,h));g.stroke()}rn(g,w,h,200,.07)});
const carpetT=ctex((g,w,h)=>{g.fillStyle='#a89a9a';g.fillRect(0,0,w,h);rn(g,w,h,1400,.22,'0,0,0',2);rn(g,w,h,900,.2,'255,255,255',2)});
const grassT=ctex((g,w,h)=>{g.fillStyle='#38602c';g.fillRect(0,0,w,h);rn(g,w,h,900,.5,'20,50,16',3);rn(g,w,h,500,.4,'90,130,60',2);g.strokeStyle='rgba(20,40,14,.5)';for(let i=0;i<60;i++){const x=R(0,w),y=R(0,h);g.beginPath();g.moveTo(x,y);g.lineTo(x+R(-3,3),y-R(4,9));g.stroke()}});
const stoneT=ctex((g,w,h)=>{g.fillStyle='#55534e';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32)for(let x=((y/32)%2)*20;x<w;x+=40){const t=R(-12,12)|0;g.fillStyle=`rgb(${128+t},${126+t},${120+t})`;g.fillRect(x+2,y+2,36,28)}rn(g,w,h,500,.18)});
const sidingT=ctex((g,w,h)=>{g.fillStyle='#8a909a';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,y,w,2);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,y+2,w,3)}rn(g,w,h,300,.12)});
const wallT=ctex((g,w,h)=>{g.fillStyle='#ddd7cd';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#cbc4b8';g.fillRect(x,0,8,150)}g.fillStyle='rgba(120,100,80,.18)';for(let y=14;y<140;y+=28)for(let x=8;x<w;x+=16){g.beginPath();g.arc(x,y,3,0,7);g.fill()}
 g.fillStyle='#4a3a2a';g.fillRect(0,0,w,10);g.fillStyle='#8a7a68';g.fillRect(0,150,w,8);g.fillStyle='#b4a48c';g.fillRect(0,158,w,98);g.strokeStyle='#6a5a46';g.lineWidth=2;for(let x=0;x<w;x+=64)g.strokeRect(x+8,172,48,64);g.fillStyle='#2e2218';g.fillRect(0,240,w,16);rn(g,w,h,500,.1)},128,256);
wallT.wrapT=THREE.ClampToEdgeWrapping;
const fenceT=ctex((g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#16161a';for(let x=4;x<w;x+=16){g.fillRect(x,22,4,h-22);g.beginPath();g.moveTo(x-2,22);g.lineTo(x+2,2);g.lineTo(x+6,22);g.fill()}g.fillRect(0,40,w,5);g.fillRect(0,h-30,w,5)});
const roofT=ctex((g,w,h)=>{g.fillStyle='#2e2a30';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=((y/16)%2)*16;x<w;x+=32){const t=R(-8,8)|0;g.fillStyle=`rgb(${52+t},${46+t},${54+t})`;g.fillRect(x+1,y+1,30,14)}});
const slatT=ctex(g=>{g.fillStyle='#8a6a48';g.fillRect(0,0,128,128);g.fillStyle='#1a0f08';for(let y=14;y<128;y+=10)g.fillRect(14,y,100,4)});
const shelfT=ctex((g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=26){g.fillStyle='#000a';g.fillRect(0,y,w,4);for(let x=2;x<w-2;){const bw=R(4,10);g.fillStyle=`hsl(${R(0,360)|0},30%,${R(25,50)|0}%)`;g.fillRect(x,y+R(5,9),bw-1,19);x+=bw}}});
const rugT=ctex((g,w,h)=>{g.fillStyle='#e8e4dc';g.fillRect(0,0,w,h);g.strokeStyle='#8a8478';g.lineWidth=6;g.strokeRect(6,6,w-12,h-12);g.lineWidth=2;g.strokeRect(16,16,w-32,h-32);g.fillStyle='#b8b0a0';g.beginPath();g.moveTo(w/2,26);g.lineTo(w-26,h/2);g.lineTo(w/2,h-26);g.lineTo(26,h/2);g.fill();g.fillStyle='#e8e4dc';g.beginPath();g.moveTo(w/2,50);g.lineTo(w-50,h/2);g.lineTo(w/2,h-50);g.lineTo(50,h/2);g.fill();rn(g,w,h,600,.14)});
const grainT=ctex((g,w,h)=>{g.fillStyle='#d0d0d0';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.strokeStyle=`rgba(0,0,0,${R(.05,.18)})`;g.beginPath();const y=R(0,h);g.moveTo(0,y);g.lineTo(w,y+R(-4,4));g.stroke()}});
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const SM=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o));
const mats={},L=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));

/* floors */
const FK={k:'tile',a:'tile',f:'marble',h:'wood',H:'wood',d:'wood',v:'carpet',b:'carpet',m:'carpet',n:'carpet',g:'carpet',s:'wood',u:'wood',l:'wood',p:'wood',O:'grass',T:'stone',S:'wood',X:'stone',B:'stone',Q:'stone',R:'stone',y:'stone'};
const FTX={wood:woodT,tile:tileT,marble:marbleT,carpet:carpetT,grass:grassT,stone:stoneT};
const FT={k:0xe6e0d0,a:0xcfe0e0,f:0xffffff,h:0xc8a880,H:0xc8a880,d:0xb89068,v:0x7a8a6a,b:0x7a8aa2,m:0x8a6a8a,n:0xc89aa8,g:0x8aa27a,s:0xd0a878,u:0x9a7a58,l:0x8a6848,p:0x8a6a48,O:0x8aaa70,T:0xb0aca4,S:0xa88a68,X:0x9a9890,B:0x7a7a78,Q:0x506068,R:0x6a6258,y:0x606060};
const WT={k:0xe6dcb0,d:0xb06a62,v:0x8a9a70,h:0xcbbf9e,b:0xaebcc8,f:0xb8b0a0,l:0x7a5a44,m:0x9a8aaa,a:0xb8d0cc,n:0xe0c8d0,H:0xcbbf9e,g:0xb8c8a8,s:0xc4a878,u:0x7a6a5a,S:0xcbbf9e,B:0x8a8a86,Q:0x6a7a7c,R:0x7a7266,y:0x707070};
const dm=new THREE.Object3D(),col=new THREE.Color();
{const lists={};for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];if(c=='#'||c=='F'||UPS(x,z))continue;(lists[FK[c]]=lists[FK[c]]||[]).push([x,z])}
 for(const k in lists){const a=lists[k],m=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:FTX[k]}),a.length);a.forEach(([x,z],i)=>{dm.position.set(x+.5,0,z+.5);dm.updateMatrix();m.setMatrixAt(i,dm.matrix);col.setHex(FT[G[z][x]]||0xffffff).multiplyScalar(k=='grass'?R(.8,1.1):1);m.setColorAt(i,col)});m.instanceColor.needsUpdate=true;scene.add(m)}
 const cl=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];if(c!='#'&&c!='F'&&c!='X'&&!isOut(c))cl.push([x,z])}
 const cm=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(Math.PI/2),new THREE.MeshLambertMaterial({color:0xb0a898}),cl.length);cl.forEach(([x,z],i)=>{dm.position.set(x+.5,G[z][x]=='y'?1:2.8,z+.5);dm.updateMatrix();cm.setMatrixAt(i,dm.matrix)});scene.add(cm)}

/* walls: per-face quads (interior wallpaper, exterior siding, fence) */
{const sets={bs:{p:[],n:[],u:[],c:[]},in:{p:[],n:[],u:[],c:[]},ex:{p:[],n:[],u:[],c:[]},fn:{p:[],n:[],u:[],c:[]}};
 const quad=(s,x,z,dx,dz,h,uh,hex,y0=0)=>{let v;if(dx){const px=x+(dx>0?1:0);v=[[px,y0,z],[px,y0,z+1],[px,h,z+1],[px,h,z]]}else{const pz=z+(dz>0?1:0);v=[[x,y0,pz],[x+1,y0,pz],[x+1,h,pz],[x,h,pz]]}
  const e1=[v[1][0]-v[0][0],v[1][1]-v[0][1],v[1][2]-v[0][2]],e2=[v[2][0]-v[0][0],v[2][1]-v[0][1],v[2][2]-v[0][2]],nx=e1[1]*e2[2]-e1[2]*e2[1],nz=e1[0]*e2[1]-e1[1]*e2[0];if(nx*dx+nz*dz<0)v.reverse();
  const c=new THREE.Color(hex);for(const i of[0,1,2,0,2,3]){const p=v[i];s.p.push(p[0],p[1],p[2]);s.n.push(dx,0,dz);s.u.push(dx?p[2]:p[0],p[1]/uh);s.c.push(c.r,c.g,c.b)}};
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=G[z][x];if(c!='#'&&c!='F')continue;
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=G[z+dz]&&G[z+dz][x+dx];if(!n||n=='#'||n=='F')continue;
   if(c=='F'){if(n=='O'||n=='T'||n=='X')quad(sets.fn,x,z,dx,dz,2.1,2.1,0xffffff)}
   else if(n=='X')continue;else if(isOut(n))quad(sets.ex,x,z,dx,dz,2.8,1.4,0xb4bcc8);else quad('BQRy'.includes(n)?sets.bs:sets.in,x,z,dx,dz,n=='y'?1:2.8,2.8,WT[n]||0xaaaaaa)}}
 for(let z=1;z<H-1;z++)for(let x=1;x<W-1;x++)if(G[z][x]=='y')for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=G[z+dz][x+dx];if(n&&n!='#'&&n!='y'&&n!='F')quad('BQRy'.includes(n)?sets.bs:sets.in,x,z,dx,dz,2.8,2.8,WT[n]||0xaaaaaa,1)}
 const mk=(s,m)=>{if(!s.p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(s.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(s.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(s.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(s.c,3));scene.add(new THREE.Mesh(g,m))};
 mk(sets.in,new THREE.MeshLambertMaterial({map:wallT,vertexColors:true}));mk(sets.bs,new THREE.MeshLambertMaterial({map:stoneT,vertexColors:true}));mk(sets.ex,new THREE.MeshLambertMaterial({map:sidingT,vertexColors:true}));mk(sets.fn,new THREE.MeshLambertMaterial({map:fenceT,vertexColors:true,transparent:true,alphaTest:.5,side:THREE.DoubleSide}))}

/* ---------- merged static geometry ---------- */
const MB={},FR=new THREE.Matrix4(),_m=new THREE.Matrix4(),_v=new THREE.Vector3(),_nm=new THREE.Matrix3(),_c=new THREE.Color(),_e=new THREE.Euler(),_q=new THREE.Quaternion(),_o1=new THREE.Vector3(),_o2=new THREE.Vector3(1,1,1);
const bucket=map=>{const k=map?map.id:0;return MB[k]||(MB[k]={map,p:[],n:[],u:[],c:[]})};
function addGeo(geo,lm,hex,map){const b=bucket(map);_m.multiplyMatrices(FR,lm);_nm.getNormalMatrix(_m);_c.set(hex);const Pp=geo.attributes.position,N=geo.attributes.normal,U=geo.attributes.uv,Ix=geo.index;
 const push=i=>{_v.fromBufferAttribute(Pp,i).applyMatrix4(_m);b.p.push(_v.x,_v.y,_v.z);_v.fromBufferAttribute(N,i).applyNormalMatrix(_nm);b.n.push(_v.x,_v.y,_v.z);b.u.push(U.getX(i),U.getY(i));b.c.push(_c.r,_c.g,_c.b)};
 if(Ix)for(let i=0;i<Ix.count;i++)push(Ix.getX(i));else for(let i=0;i<Pp.count;i++)push(i);geo.dispose()}
const mtx=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(_o1.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_o2.set(sx,sy,sz));
const bb=(w,h,d,x,y,z,c,map,rx=0,ry=0,rz=0)=>addGeo(new THREE.BoxGeometry(w,h,d),mtx(x,y+h/2,z,rx,ry,rz),c,map);
const cy=(r1,r2,h,x,y,z,c,seg=10,map,rx=0,ry=0,rz=0)=>addGeo(new THREE.CylinderGeometry(r1,r2,h,seg),mtx(x,y+h/2,z,rx,ry,rz),c,map);
const sp=(r,x,y,z,c,sx=1,sy=1,sz=1)=>addGeo(new THREE.SphereGeometry(r,10,8),mtx(x,y,z,0,0,0,sx,sy,sz),c);
const setFrame=(x,z,ry)=>{FR.makeRotationY(ry);FR.setPosition(x,0,z)};
const YAW={s:0,n:Math.PI,e:Math.PI/2,w:-Math.PI/2},FACE={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};
function flushBuckets(){for(const k in MB){const b=MB[k];if(!b.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,map:b.map||null})))}}
/* dynamic lights */
const BULB=new THREE.MeshBasicMaterial({color:0xfff0c0,fog:false}),BULBG=new THREE.SphereGeometry(.07,8,6),GLOWM=new THREE.SpriteMaterial({map:glowTex,color:0xffd890,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:.55}),WINM=new THREE.MeshBasicMaterial({color:0xe8b860,side:THREE.DoubleSide,fog:false});
const _w=new THREE.Vector3();
function bulbAt(lx,ly,lz,r=.07){_w.set(lx,ly,lz).applyMatrix4(FR);const m=new THREE.Mesh(BULBG,BULB);m.position.copy(_w);m.scale.setScalar(r/.07);scene.add(m);const s=new THREE.Sprite(GLOWM);s.position.copy(_w);s.scale.set(r*14,r*14,1);scene.add(s)}
const WG=grainT;
const MODELS={
counter:(w,d,h,o)=>{bb(w-.03,h-.05,d-.03,0,0,0,o.c||0x7a6246,WG);bb(w+.03,.06,d+.03,0,h-.06,0,0xd2cec2);for(let i=0;i<Math.round(w);i++){const x=-w/2+.5+i;bb(.86,.62,.02,x,.14,d/2,0x5a4430,WG);bb(.1,.02,.03,x,.62,d/2+.02,0xc8b070)}},
sinkc:(w,d,h,o)=>{MODELS.counter(w,d,h,o);bb(.62,.03,d-.3,0,h-.02,0,0x1e2428);cy(.02,.02,.3,0,h,-d/2+.2,0xccc,6);bb(.03,.03,.22,0,h+.28,-d/2+.3,0xccc)},
stove:(w,d,h)=>{bb(w-.03,h-.08,d-.03,0,0,0,0xd0d0d0);bb(w,.06,d,0,h-.08,0,0x1a1a1a);for(const sx of[-1,1])for(const sz of[-1,1])cy(.11,.11,.012,sx*.22,h-.02,sz*.2,0x3a3a3a,12);bb(.6,.34,.02,0,.28,d/2,0x111);bb(.6,.03,.04,0,.64,d/2+.03,0xaaaaaa);for(let i=0;i<4;i++)bb(.05,.05,.03,-.3+i*.2,.75,d/2,0x999)},
fridge:(w,d,h)=>{bb(w-.05,h,d-.05,0,0,0,0xdcdcdc);bb(w,.02,.02,0,1.2,d/2-.02,0x777);bb(.04,.4,.04,w/2-.12,1.25,d/2,0x999);bb(.04,.7,.04,w/2-.12,.4,d/2,0x999)},
table:(w,d,h,o)=>{const c=o.c||0x5a4028;bb(w-.1,.07,d-.1,0,h-.07,0,c,WG);if(o.cloth)bb(w-.05,.02,d-.05,0,h,0,o.cloth);for(const sx of[-1,1])for(const sz of[-1,1])bb(.09,h-.07,.09,sx*(w/2-.12),0,sz*(d/2-.12),c,WG);
 if(o.dec){for(let i=0;i<4;i++){const x=-w/2+.6+i*(w-1.2)/3;for(const sz of[-1,1])cy(.13,.13,.015,x,h+.02,sz*.6,0xeee8d8,12)}for(const sx of[-.5,.5]){cy(.025,.025,.25,sx,h,0,0xe8e0c0,6);sp(.03,sx,h+.28,0,0xffe9a0)}}},
rtable:(w,d,h)=>{cy(.95,.95,.06,0,h-.06,0,0x4a3322,16,WG);cy(.12,.2,h-.06,0,0,0,0x3a281a,8);cy(.4,.4,.04,0,0,0,0x3a281a,10);cy(.07,.1,.3,0,h,0,0x6a8aa8,8);for(let i=0;i<5;i++)sp(.1,Math.sin(i*1.26)*.1,h+.38+i%2*.06,Math.cos(i*1.26)*.1,[0xd84a5a,0xe8e0d0,0xd8a040][i%3])},
chair:(w,d,h)=>{const c=0x4a3422;bb(.5,.06,.5,0,.44,0,c,WG);for(const sx of[-1,1])for(const sz of[-1,1])bb(.05,.44,.05,sx*.22,0,sz*.22,c,WG);bb(.5,.5,.05,0,.5,-.23,c,WG);bb(.04,.4,.04,-.15,.52,-.23,0x6a4a30);bb(.04,.4,.04,.15,.52,-.23,0x6a4a30)},
stool:()=>{cy(.2,.2,.06,0,.42,0,0x3a2a1a,10);for(let i=0;i<4;i++)bb(.04,.42,.04,Math.cos(i*1.57)*.14,0,Math.sin(i*1.57)*.14,0x2a1c10)},
cabinet:(w,d,h,o)=>{bb(w-.06,h,d-.06,0,0,0,0x4a3424,WG);bb(w,.06,d,0,h-.06,0,0x3a281a);for(let i=0;i<Math.round(w);i++){const x=-w/2+.5+i;bb(.8,h*.42,.02,x,.1,d/2-.02,0x3a281a,WG);bb(.8,h*.38,.02,x,h*.54,d/2-.02,0x8aa0a8);bb(.04,.1,.03,x+.3,h*.38,d/2,0xc8b070)}},
dresser:(w,d,h,o)=>{const c=o.c||0x5a4028;bb(w-.04,h,d-.04,0,0,0,c,WG);bb(w+.02,.05,d+.02,0,h,0,0x7a5a3a);for(let i=0;i<3;i++){bb(w-.16,.22,.02,0,.1+i*.29,d/2-.01,0x6a4a30,WG);bb(.07,.03,.03,0,.2+i*.29,d/2+.02,0xc8b070)}},
bookshelf:(w,d,h)=>{bb(w-.02,h,d-.02,0,0,0,0x2f2218,WG);for(let i=0;i<Math.round(w);i++)addGeo(new THREE.PlaneGeometry(.96,h-.12),mtx(-w/2+.5+i,h/2,d/2+.006),0xffffff,shelfT)},
wardrobe:(w,d,h)=>{bb(w-.04,h,d-.04,0,0,0,0x4a3220,WG);bb(w+.04,.12,d+.04,0,h-.06,0,0x3a2616);for(const s of[-1,1]){bb(w/2-.08,h-.3,.03,s*w/4,.12,d/2,0x5a3e28,WG);bb(.05,.12,.03,s*.1,1.0,d/2+.02,0xc8b070)}},
bed:(w,d,h,o)=>{const c=o.c||0x4a3322;bb(w,.22,d,0,.12,0,c,WG);bb(w-.08,.24,d-.08,0,.34,0,0xe8e2d6);for(let i=0;i<(w>2.4?2:1);i++)bb(.6,.14,.38,w>2.4?(i?.7:-.7):0,.58,-d/2+.35,0xf4f0e8);bb(w,.95,.1,0,.12,-d/2+.05,c,WG);bb(w,.4,.08,0,.12,d/2-.04,c,WG);if(!o.nb)bb(w-.12,.07,d*.58,0,.58,d/2-.1-d*.29,o.bc||0x6a3a4a)},
nightstand:()=>{bb(.62,.55,.55,0,0,0,0x4a3322,WG);bb(.5,.2,.02,0,.3,.28,0x5a4030);bb(.06,.03,.03,0,.38,.3,0xc8b070);cy(.08,.1,.04,0,.55,0,0x2a2a2a,8);cy(.1,.16,.2,0,.62,0,0xe8d8a8,8);bulbAt(0,.75,0,.05)},
sofa:(w,d,h,o)=>{const c=o.c||0x6a3a3a,n=Math.max(1,Math.round(w/.95));bb(w,.3,d,0,.08,0,0x2a1c14,WG);for(let i=0;i<n;i++){const x=-w/2+w/n*(i+.5);bb(w/n-.1,.2,d-.3,x,.38,.1,c);bb(w/n-.14,.4,.14,x,.5,-d/2+.3,c)}bb(w,.55,.26,0,.38,-d/2+.13,c);for(const s of[-1,1])bb(.2,.3,d,s*(w/2-.1),.38,0,c)},
armchair:(w,d,h,o)=>MODELS.sofa(w,d,h,o),
tvstand:(w,d,h)=>{bb(w-.1,.5,d-.15,0,0,0,0x2a2018,WG);bb(w-.6,.62,.06,0,.62,0,0x0a0a0c);bb(w-.5,.68,.03,0,.59,-.04,0x1a1a1c);bb(.14,.3,.14,-w/2+.2,.5,0,0x1a1a1a);bb(.14,.3,.14,w/2-.2,.5,0,0x1a1a1a)},
fireplace:(w,d,h)=>{bb(w,1.2,d,0,0,0,0x6a6258);bb(w-.6,.7,.08,0,.1,d/2-.02,0x0a0806);bb(w+.3,.1,d+.2,0,1.2,0,0x5a5248);bb(w-.5,1.4,d-.4,0,1.3,-.1,0x5a5248);bb(.6,.1,.3,0,.1,.1,0xff5a1a);cy(.07,.07,.5,-.2,.18,.1,0x3a2616,6,undefined,0,0,1.4);cy(.07,.07,.5,.2,.18,.1,0x3a2616,6,undefined,0,0,1.4)},
piano:(w,d,h)=>{bb(w,1.15,.6,0,0,-d/2+.3,0x111114);bb(w-.2,.08,.38,0,.74,-d/2+.8,0xf2f2ea);bb(w,.1,.5,0,.66,-d/2+.8,0x111114);for(let i=0;i<8;i++)bb(.05,.06,.2,-w/2+.35+i*.35,.82,-d/2+.9,0x111);bb(w,.04,.62,0,1.15,-d/2+.3,0x1a1a1e);for(const s of[-1,1])bb(.08,.66,.08,s*(w/2-.1),0,-d/2+.85,0x111114);bb(.5,.35,.04,0,1.2,-d/2+.45,0x222)},
tub:(w,d,h)=>{bb(w,h,d,0,.08,0,0xe8e8e4);bb(w-.3,.02,d-.3,0,h+.08,0,0x1a2c34);for(const sx of[-1,1])for(const sz of[-1,1])cy(.06,.04,.08,sx*(w/2-.15),0,sz*(d/2-.15),0xb8a050,6);cy(.03,.03,.3,-w/2+.4,h+.08,-d/2+.1,0xccc,6);bb(.03,.03,.2,-w/2+.4,h+.36,-d/2+.2,0xccc)},
toilet:()=>{cy(.18,.14,.38,0,0,.05,0xf0f0ee,10);bb(.34,.06,.42,0,.4,.07,0xe8e8e4);bb(.4,.4,.16,0,.28,-.28,0xeeeeee);bb(.42,.03,.18,0,.68,-.28,0xe0e0dc);bb(.06,.04,.04,.12,.72,-.28,0xaaa)},
basin:()=>{cy(.08,.1,.55,0,0,-.05,0xeeeeea,8);bb(.5,.14,.4,0,.8,-.05,0xf0f0ee);bb(.4,.02,.3,0,.93,-.05,0x1e2a30);cy(.02,.02,.2,0,.9,-.22,0xccc,6);bb(.7,.8,.03,0,1.15,-.46,0x8ba0aa)},
plant:()=>{cy(.2,.14,.3,0,0,0,0xb06a40,10);cy(.17,.17,.02,0,.28,0,0x2a1c10,8);for(let i=0;i<6;i++){const a=i*1.05;sp(.2,Math.cos(a)*.12,.55+i%3*.17,Math.sin(a)*.12,0x2f6a3a,1,.55,1)}},
planter:(w,d)=>{bb(w-.1,.35,d-.1,0,0,0,0x5a3e28,WG);bb(w-.2,.02,d-.2,0,.35,0,0x2a1c10)},
lamp:()=>{cy(.15,.15,.04,0,0,0,0x222,8);cy(.02,.02,1.4,0,.04,0,0x222,6);cy(.14,.24,.3,0,1.3,0,0xe8d8a8,10);bulbAt(0,1.4,0,.07)},
clock:()=>{bb(.5,2.1,.34,0,0,0,0x3a2616,WG);cy(.16,.16,.02,0,1.6,.18,0xe6dfc8,16,undefined,Math.PI/2);bb(.2,.6,.02,0,.7,.18,0x1a1208);cy(.02,.02,.5,0,.7,.19,0xc8a840,6);sp(.06,0,.55,.19,0xd8b848)},
console:(w,d,h)=>{bb(w-.1,.07,d-.1,0,h-.07,0,0x4a3322,WG);for(const sx of[-1,1])bb(.07,h-.07,d-.12,sx*(w/2-.1),0,0,0x4a3322,WG);bb(w-.4,.2,d-.14,0,h-.28,0,0x5a4030);cy(.06,.09,.3,-w/2+.4,h,0,0x6a8aa8,8);sp(.1,-w/2+.4,h+.4,0,0xd84a5a)},
column:(w,d,h)=>{cy(.4,.46,.25,0,0,0,0xd8d4c8,14);cy(.34,.36,h-.5,0,.25,0,0xd8d4c8,14);cy(.46,.4,.25,0,h-.25,0,0xd8d4c8,14)},
globe:()=>{cy(.2,.25,.06,0,0,0,0x2a1c10,10);cy(.03,.03,.7,0,.06,0,0x6a5a30,6);sp(.32,0,1.1,0,0x3a6a8a);sp(.33,0,1.1,0,0x4a8a4a,1,.3,1)},
crib:(w,d,h)=>{bb(w-.2,.05,d-.2,0,.4,0,0xe8e0d0);for(const sx of[-1,1])for(const sz of[-1,1])bb(.08,h,.08,sx*(w/2-.08),0,sz*(d/2-.08),0xefe6d0);for(let i=0;i<9;i++){const x=-w/2+.15+i*(w-.3)/8;for(const sz of[-1,1])bb(.025,.55,.025,x,.42,sz*(d/2-.08),0xefe6d0)}for(let i=0;i<9;i++){const z=-d/2+.15+i*(d-.3)/8;for(const sx of[-1,1])bb(.025,.55,.025,sx*(w/2-.08),.42,z,0xefe6d0)}bb(w-.25,.08,d-.25,0,.45,0,0xf4f0e8)},
toychest:(w,d)=>{bb(w-.1,.5,d-.1,0,0,0,0x8a4a2a,WG);bb(w-.06,.08,d-.06,0,.5,0,0x6a3a1a);for(const s of[-1,1])bb(.08,.52,d-.08,s*(w/2-.3),0,0,0x8a8a7a)},
blocks:()=>{bb(.3,.3,.3,-.15,0,0,0xd84a4a,undefined,0,.3);bb(.3,.3,.3,.18,0,.05,0x4a6ad8,undefined,0,-.2);bb(.28,.28,.28,0,.3,0,0xd8c040,undefined,0,.7)},
rockhorse:()=>{sp(.28,0,.55,0,0x8a5a3a,.7,.6,1.3);sp(.16,0,.85,.35,0x8a5a3a,.9,1,1.2);for(const s of[-1,1]){bb(.05,.4,.05,s*.2,.1,.35,0x5a3a20);bb(.05,.4,.05,s*.2,.1,-.35,0x5a3a20);bb(.04,.04,1.0,s*.22,.02,0,0x5a3a20,undefined,0,0,0)}},
rocker:()=>{MODELS.chair();for(const s of[-1,1])bb(.04,.04,.9,s*.26,.02,0,0x3a2616)},
vanity:(w,d,h)=>{MODELS.console(w,d,.8,{});bb(.8,.9,.03,0,1.0,-d/2+.04,0x8ba0aa);bb(.9,.08,.05,0,1.9,-d/2+.04,0x5a3e28)},
desk:(w,d,h)=>{bb(w,.06,d,0,h-.06,0,0x4a3322,WG);bb(.5,h-.06,d-.1,w/2-.3,0,0,0x3a281a,WG);bb(.06,h-.06,d-.1,-w/2+.08,0,0,0x3a281a,WG);bb(.3,.02,.4,-.3,h,0,0xe8e0c0);cy(.06,.08,.3,w/2-.5,h,-d/2+.2,0x2a2a2a,8);cy(.1,.16,.18,w/2-.5,h+.3,-d/2+.2,0xe8d8a8,8)},
chest:(w,d)=>{bb(w-.1,.45,d-.1,0,0,0,0x5a3e22,WG);bb(w-.06,.14,d-.06,0,.45,0,0x4a321a,WG);for(const s of[-.7,.7])bb(.07,.62,d-.04,s*(w/2-.3),0,0,0x8a8a7a)},
telescope:()=>{for(let i=0;i<3;i++){const a=i*2.09;bb(.04,1.0,.04,Math.cos(a)*.2,0,Math.sin(a)*.2,0x3a2a1a,undefined,Math.sin(a)*.2,0,-Math.cos(a)*.2)}cy(.07,.05,1.0,0,1.0,0,0x8a7a30,8,undefined,.8)},
coatrack:()=>{cy(.2,.25,.05,0,0,0,0x2a1c10,10);cy(.03,.03,1.7,0,.05,0,0x2a1c10,6);for(let i=0;i<4;i++)bb(.18,.03,.03,Math.cos(i*1.57)*.1,1.7,Math.sin(i*1.57)*.1,0x6a5a30,undefined,0,-i*1.57);bb(.4,.8,.1,.12,.9,.05,0x3a3a4a)},
bench:(w,d)=>{bb(w,.08,d,0,.45,0,0x5a4028,WG);for(const s of[-1,1])bb(.08,.45,d-.06,s*(w/2-.15),0,0,0x3a2a1a);bb(w,.4,.06,0,.5,-d/2+.04,0x5a4028,WG)},
bin:()=>{cy(.34,.3,.9,0,0,0,0x2e4a34,12);cy(.38,.38,.05,0,.9,0,0x264030,12);bb(.5,.04,.04,0,.5,.32,0x1a2a1e)},
shed:(w,d)=>{bb(w-.3,2.1,d-.3,0,0,0,0x5a4636,WG);bb(1,1.9,.08,0,0,(d-.3)/2,0x2a1c14,WG);bb(.9,.7,.04,1,1.0,(d-.3)/2+.02,0x1a2438);for(const s of[-1,1])bb(w+.4,.12,d/2+.4,0,2.05+.35,s*(d/4),0x2e2a30,undefined,s*-.42,0,0);bb(.1,.1,d,0,2.65,0,0x1a1a1a)},
well:()=>{cy(.85,.9,.9,0,0,0,0x6a6860,14);cy(.62,.62,.02,0,.9,0,0x080e14,14);for(const s of[-1,1])bb(.12,1.7,.12,s*.8,.9,0,0x3a2a1a);bb(1.9,.1,.12,0,2.5,0,0x3a2a1a);for(const s of[-1,1])bb(1.2,.06,1.4,s*.5,2.7,0,0x2e2a30,undefined,0,0,s*.5);cy(.15,.12,.2,0,1.5,0,0x5a4a2a,8)},
car:(w,d)=>{bb(2.0,.55,4.6,0,.3,0,0x6a2a22);bb(1.7,.6,2.3,0,.85,-.2,0x5a241e);bb(1.72,.4,2.0,0,.95,-.2,0x1a2228);for(const sx of[-1,1])for(const sz of[-1.5,1.5])cy(.38,.38,.28,sx*1.0,.02,sz,0x111,10,undefined,0,0,Math.PI/2);for(const s of[-.6,.6])bb(.3,.15,.05,s,.55,2.32,0xd8d0a0);bb(2.1,.15,.1,0,.3,2.3,0x6a6a6a);bb(2.1,.15,.1,0,.3,-2.3,0x6a6a6a)},
grave:()=>{bb(.7,.9,.15,0,0,-.2,0x7a7a74);cy(.35,.35,.15,0,.9,-.2,0x7a7a74,10,undefined,Math.PI/2);bb(.8,.12,1.6,0,0,.5,0x3a3426);bb(.4,.04,.04,0,.55,-.1,0x4a4a46)},
mailbox:()=>{bb(.1,1.0,.1,0,0,0,0x3a2a1a);bb(.3,.25,.5,0,1.0,0,0x2a2a30);bb(.04,.3,.04,.2,1.1,0,0xb02a2a)},
barrel:()=>{cy(.4,.35,.9,0,0,0,0x5a3c24,10,WG);for(const y of[.2,.65])cy(.42,.42,.04,0,y,0,0x2a2a2a,10)},
crate:()=>{bb(.9,.7,.9,0,0,0,0x7a5a3a,WG);for(const s of[-1,1])bb(.06,.72,.92,s*.4,0,0,0x5a3e22)},
woodpile:(w,d)=>{for(let r=0;r<4;r++)for(let i=0;i<Math.floor(w*2.6)-(r%2);i++)cy(.15,.15,d-.2,-w/2+.2+i*.38+(r%2)*.19,.15+r*.28,0,0x6a4a2a,6,undefined,Math.PI/2)},
post:()=>{bb(.18,2.8,.18,0,0,0,0xd8d2c4)},
fusebox:()=>{bb(.6,.8,.14,0,1.0,.57,0x4a4e52);bb(.5,.7,.03,0,1.05,.66,0x30363a)},
rug:(w,d,h,o)=>addGeo(new THREE.PlaneGeometry(w-.2,d-.2).rotateX(-Math.PI/2),mtx(0,.014,0),o.c||0x7a2a2a,rugT)
};
const FH={counter:.9,sinkc:.9,fridge:1.95,stove:.9,table:.76,cabinet:1.7,dresser:.95,bookshelf:2.1,wardrobe:2.1,bed:.6,sofa:.85,armchair:.9,tvstand:.55,fireplace:1.3,tub:.6,plant:1.1,lamp:1.6,column:2.8,crib:1,desk:.78,console:.85,bench:.5};
for(const u of FU){const[lw,ld]=(u.f=='e'||u.f=='w')?[u.d,u.w]:[u.w,u.d];setFrame(u.x+u.w/2,u.z+u.d/2,YAW[u.f]);(MODELS[u.k]||MODELS.crate)(lw,ld,u.o.h||FH[u.k]||1,u.o)}
const WARD=[];
for(const[x,z,f]of WRD){const[fx,fz]=FACE[f];setFrame(x+.5,z+.5,YAW[f]);bb(.92,2.3,.92,0,0,0,0x3a2a1c,WG);addGeo(new THREE.PlaneGeometry(.8,2.05),mtx(0,1.15,.465),0xffffff,slatT);sp(.035,.3,1.1,.49,0xb09050);bb(1,.12,1,0,2.3,0,0x2a1c10);bb(.06,2.05,.02,-.42,.1,.47,0x2a1c10);bb(.06,2.05,.02,.42,.1,.47,0x2a1c10);
 WARD.push({x,z,fx,fz,cx:x+.5,cz:z+.5,tileX:x+fx,tileZ:z+fz,fxx:x+.5+fx,fzz:z+.5+fz})}
/* trees, bushes */
FR.identity();
for(const[x,z]of BUSH)sp(.5,x,.4,z,0x1f3a1c,1,.8,1);
flushBuckets();
{const pines=TREES.filter(t=>!t.dead),dead=TREES.filter(t=>t.dead),tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.3,3.4,6),new THREE.MeshLambertMaterial({color:0x2a1e16}),TREES.length);
 TREES.forEach((t,i)=>{dm.position.set(t.x+.5,1.7*t.s,t.z+.5);dm.rotation.set(0,t.r,0);dm.scale.set(t.s,t.s,t.s);dm.updateMatrix();tr.setMatrixAt(i,dm.matrix)});scene.add(tr);
 for(let k=0;k<3;k++){const cn=new THREE.InstancedMesh(new THREE.ConeGeometry(1.7-k*.4,2.2,7),new THREE.MeshLambertMaterial({color:[0x14301c,0x183a20,0x1c4424][k]}),Math.max(1,pines.length));pines.forEach((t,i)=>{dm.position.set(t.x+.5,(2.2+k*1.3)*t.s,t.z+.5);dm.rotation.set(0,t.r,0);dm.scale.set(t.s,t.s,t.s);dm.updateMatrix();cn.setMatrixAt(i,dm.matrix)});cn.count=pines.length;scene.add(cn)}
 const br=new THREE.InstancedMesh(new THREE.BoxGeometry(.08,1.6,.08),new THREE.MeshLambertMaterial({color:0x241a14}),Math.max(1,dead.length*5));let bi=0;dead.forEach(t=>{for(let j=0;j<5;j++){dm.position.set(t.x+.5+Math.cos(j*1.3+t.r)*.35*t.s,(2.4+j*.3)*t.s,t.z+.5+Math.sin(j*1.3+t.r)*.35*t.s);dm.rotation.set(Math.sin(j*1.3+t.r)*.9,0,Math.cos(j*1.3+t.r)*.9);dm.scale.set(t.s,t.s,t.s);dm.updateMatrix();br.setMatrixAt(bi++,dm.matrix)}});br.count=bi;scene.add(br);dm.rotation.set(0,0,0);dm.scale.set(1,1,1)}
/* roof, chimney, porch roof */
{const cx=32,cz=25.5,hs=13.7,rise=4.2,th=Math.atan(rise/hs),len=Math.hypot(hs,rise)+.2,rm=new THREE.MeshLambertMaterial({map:roofT,color:0x9a9aa0});
 for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(37,.25,len),rm);m.position.set(cx,2.8+rise/2+.1,cz+s*hs/2);m.rotation.x=s*th;scene.add(m)}
 const gm=new THREE.MeshLambertMaterial({map:sidingT,color:0x8a909a,side:THREE.DoubleSide}),sh=new THREE.Shape();sh.moveTo(-12.6,0);sh.lineTo(12.6,0);sh.lineTo(0,rise-.1);sh.lineTo(-12.6,0);
 for(const x of[14.9,49.1]){const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),gm);m.rotation.y=Math.PI/2;m.position.set(x,2.8,cz);scene.add(m)}
 const ch=new THREE.Mesh(new THREE.BoxGeometry(1.4,3,1.4),L(0x4a3a34));ch.position.set(40,5,cz-4);scene.add(ch);const pr=new THREE.Mesh(new THREE.BoxGeometry(5.4,.15,3.6),L(0x3a2c24));pr.position.set(30,2.95,38.8);scene.add(pr)}
/* windows */
const winCells=new Set();
{const pg=new THREE.PlaneGeometry(1.7,1.1);FR.identity();
 for(const[x,z,dx,dz]of WINS){const along=dx?[0,1]:[1,0];for(let i=0;i<2;i++)winCells.add((z+along[1]*i)+','+(x+along[0]*i));
  const cxx=dx?x+.5:x+1,czz=dx?z+1:z+.5,fi=dx?(dx>0?x+1:x):cxx,fz=dx?czz:(dz>0?z+1:z);
  for(const side of[1,-1]){const m=new THREE.Mesh(pg,WINM);const nx=dx*side,nz=dz*side;m.position.set(dx?fi+(dx>0?1:-1)*(side>0?0:-1)+nx*.012:cxx,1.6,dx?czz:fz+(dz>0?(side>0?0:-1):(side>0?0:1))*(dz>0?1:-1)+nz*.012);if(dx)m.rotation.y=Math.PI/2;scene.add(m);
   const px=m.position.x,pz=m.position.z;bb(1.8,.07,.07,px,1.05,pz,0x2a1c10);bb(1.8,.07,.07,px,2.1,pz,0x2a1c10);if(dx){bb(.07,1.1,1.8,px,1.05,pz,0x2a1c10)}else{bb(.07,1.1,.07,px-.85,1.05,pz,0x2a1c10);bb(.07,1.1,.07,px+.85,1.05,pz,0x2a1c10)}}}
 flushBuckets()}
for(const k in MB){MB[k].p.length=MB[k].n.length=MB[k].u.length=MB[k].c.length=0}
/* ceiling lamps, door trim, porch lights, gate */
FR.identity();
for(const r of ROOMS){const hall=r.c=='h'||r.c=='H',pts=[];if(hall)for(let x=r.x0+3;x<=r.x1-3;x+=8)pts.push([x+.5,(r.z0+r.z1+1)/2]);else pts.push([(r.x0+r.x1+1)/2,(r.z0+r.z1+1)/2]);
 for(const[x,z]of pts){cy(.28,.28,.05,x,2.75,z,0x2a2218,10);cy(.02,.02,.12,x,2.63,z,0x2a2218,4);cy(.18,.1,.12,x,2.5,z,0x7a6a4a,10);bulbAt(x,2.5,z,.09)}}
for(const d of DOORS){const row=d.z0==d.z1&&d.x1>d.x0,c=0x2a1c10;if(!row){const cx=d.x0+.5,len=d.z1-d.z0+1;bb(1,.5,len,cx,2.3,(d.z0+d.z1+1)/2,c);bb(1,2.3,.1,cx,0,d.z0+.05,c);bb(1,2.3,.1,cx,0,d.z1+.95,c)}else{const cz=d.z0+.5,len=d.x1-d.x0+1;bb(len,.5,1,(d.x0+d.x1+1)/2,2.3,cz,c);bb(.1,2.3,1,d.x0+.05,0,cz,c);bb(.1,2.3,1,d.x1+.95,0,cz,c)}}
for(const[x,z]of[[29.5,38.1],[30.5,38.1],[19.5,12.9],[20.5,12.9]]){cy(.08,.08,.2,x+(x%1?0:0),2.4,z,0x2a2218,6);bulbAt(x,2.35,z,.08)}
for(const x of[28.5,31.5]){bb(.8,2.6,.8,x,0,54.5,0x6a6a66);bb(.95,.15,.95,x,2.6,54.5,0x55554f);bulbAt(x,2.95,54.5,.1)}
const gateL=new THREE.Group();{const gm=new THREE.MeshLambertMaterial({map:fenceT,transparent:true,alphaTest:.5,side:THREE.DoubleSide});for(const s of[0,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,2.1),gm);m.position.set(29.5+s,1.05,54.5);gateL.add(m)}scene.add(gateL)}
const exitSign=new THREE.Mesh(new THREE.BoxGeometry(2,.3,.1),new THREE.MeshBasicMaterial({color:0xff3322,fog:false}));exitSign.position.set(30,2.55,54.5);scene.add(exitSign);
FR.identity();
/* cellar hatch (kitchen) + ladder (basement) */
bb(2,.05,1,20,0,20.5,0x4a3220);bb(1.86,.02,.86,20,.05,20.5,0x362414);bb(.34,.04,.07,20.6,.06,20.5,0x8a8a90);bb(.05,.03,.9,19.1,.05,20.5,0x2a2a2e);bb(.05,.03,.9,20.9,.05,20.5,0x2a2a2e);
for(const x of[16.2]){bb(.05,2.8,.05,x,0,135.2,0x5a3a22);bb(.05,2.8,.05,x,0,135.8,0x5a3a22);for(let i=0;i<9;i++)bb(.04,.04,.64,x,.28+i*.3,135.5,0x6a4a2a);bb(.9,.02,1.2,17.1,.01,135.5,0x3a3a3a)}
/* vent mouth frames */
for(const[x,zb]of[[18,126],[33,126],[44,126],[18,149],[32,149],[44,149]]){bb(1.1,.08,.1,x+.5,.96,zb,0x2a2a2a);bb(.08,1,.1,x+.02,0,zb,0x2a2a2a);bb(.08,1,.1,x+.98,0,zb,0x2a2a2a);for(let i=1;i<5;i++)bb(.025,.9,.03,x+i*.2,.04,zb,0x3a3a3a)}
/* dim cellar bulbs */
for(const[x,z]of[[22.5,135.5],[34.5,135.5],[44.5,135.5],[21.5,130],[43,130],[33,130],[21,143],[43,143]]){cy(.01,.01,.35,x,2.45,z,0x222222,4);bulbAt(x,2.45,z,.07)}
flushBuckets();
/* opaque shell so the 2nd floor can't be seen from the yard (faces cull from inside) */
{const sh2=new THREE.Mesh(new THREE.BoxGeometry(33.94,2.8,24.94),new THREE.MeshLambertMaterial({map:sidingT,color:0x8a909a}));sh2.position.set(32,1.4,81.5);scene.add(sh2);
 const sh3=new THREE.Mesh(new THREE.BoxGeometry(32,2.8,27.2),new THREE.MeshLambertMaterial({map:sidingT,color:0x707478}));sh3.position.set(31.5,1.4,137.5);scene.add(sh3);
 /* cellar water */
 const q=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(G[z][x]=='Q')q.push([x,z]);const wm=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x1a3a40,transparent:true,opacity:.62,emissive:0x0a2228}),q.length);q.forEach(([x,z],i)=>{dm.position.set(x+.5,.2,z+.5);dm.updateMatrix();wm.setMatrixAt(i,dm.matrix)});scene.add(wm)}
/* sky */
const stars=(()=>{const n=600,p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*TAU,e=Math.acos(R(.12,1)),r=90;p[i*3]=r*Math.sin(e)*Math.cos(a);p[i*3+1]=r*Math.cos(e);p[i*3+2]=r*Math.sin(e)*Math.sin(a)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const s=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:.85}));s.frustumCulled=false;scene.add(s);return s})();
const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xd8e4ff,fog:false,depthWrite:false,transparent:true}));moon.scale.set(14,14,1);moon.position.set(-40,45,-52);scene.add(moon);
function setLampVis(v){BULB.color.setRGB(.08+.92*v,.075+.84*v,.06+.7*v);GLOWM.opacity=.55*v;WINM.color.setRGB(.08+.8*v,.12+.62*v,.2+.2*v-.2*v*.6);porchL.intensity=1.1*v;backL.intensity=1*v}

/* ---------- openable doors, hatch ---------- */
const DOORO=[];{const wood=L(0x5a3c24),knobM=L(0xb89850);
 for(const d of DOORS){const col=d.x0==d.x1&&d.z1>d.z0,len=col?d.z1-d.z0+1:d.x1-d.x0+1,cx=(d.x0+d.x1+1)/2,cz=(d.z0+d.z1+1)/2,cells=[];for(let z=d.z0;z<=d.z1;z++)for(let x=d.x0;x<=d.x1;x++)cells.push([x,z]);
  const o={d,col,cx,cz,len,cells,a:0,t:0,init:0,leaves:[]};
  for(const sd of[0,1]){const piv=new THREE.Group(),w=len/2-.04,leaf=new THREE.Mesh(new THREE.BoxGeometry(col?.07:w,2.28,col?w:.07),wood),kn=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),knobM),sg=sd?-1:1;
   if(col){piv.position.set(cx,0,sd?d.z1+1:d.z0);leaf.position.set(0,1.14,sg*(w/2+.02));kn.position.set(.07,1.0,sg*(w-.12))}else{piv.position.set(sd?d.x1+1:d.x0,0,cz);leaf.position.set(sg*(w/2+.02),1.14,0);kn.position.set(sg*(w-.12),1.0,.07)}
   piv.add(leaf,kn);scene.add(piv);o.leaves.push({piv,s:sd})}
  o.init=Math.random()<.3?1:0;DOORO.push(o)}}
function applyDoor(o){const e=o.a*o.a*(3-2*o.a),ph=e*1.5;for(const l of o.leaves)l.piv.rotation.y=o.col?(l.s?-ph:ph):(l.s?ph:-ph)}
function setDB(o,v){for(const[x,z]of o.cells)DB[z*W+x]=v}
function resetDoors(){for(const o of DOORO){o.t=o.a=o.init;setDB(o,o.init?0:1);applyDoor(o)}}
resetDoors();
function doorsTick(dt){for(const o of DOORO){
  if(o.a!==o.t){o.a+=(o.t-o.a)*Math.min(1,dt*7);if(Math.abs(o.t-o.a)<.01)o.a=o.t;applyDoor(o)}
  if(o.t==0){if(o.a<.12&&!DB[o.cells[0][1]*W+o.cells[0][0]]&&!o.cells.some(([x,z])=>Math.hypot(P.x-(x+.5),P.z-(z+.5))<.8))setDB(o,1)}else setDB(o,0);
  if(o.t==0)for(const E of[C,CR])if(Math.hypot(E.x-o.cx,E.z-o.cz)<1.7){o.t=1;doorOpen(o.cx,o.cz)}}}
function toggleDoor(o){if(o.t==1){if(o.cells.some(([x,z])=>Math.hypot(P.x-(x+.5),P.z-(z+.5))<1)){msg('Something is in the way.',1500);return}o.t=0;doorClose(o.cx,o.cz)}else{o.t=1;doorOpen(o.cx,o.cz)}P.nbv=4;P.nbt=.7}
const LK2=[{x:20,z:20.5,r:1.55,dir:-1,lx:17.9,lz:B0+23.5,yaw:-Math.PI/2,txt:'Open the cellar hatch'},{x:16.9,z:B0+23.5,r:1.5,dir:1,lx:21.5,lz:20.5,yaw:Math.PI,txt:'Climb the ladder'}];
function crossCell(a,b){if(a==2)return[17,B0+23];if(a==1)return[STS,23+ZO];return b==2?[19,20]:[STS,23]}

/* ---------- chores ---------- */
const TK=[],bm_=c=>new THREE.MeshBasicMaterial({color:c,fog:false}),grp=f=>{const g=new THREE.Group();scene.add(g);f(g);return g},
 bx=(g,w,h,d,x,y,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c=='object'?c:L(c));m.position.set(x,y,z);g.add(m);return m},
 cyd=(g,r,h,x,y,z,c,r2)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r2||r,h,12),L(c));m.position.set(x,y,z);g.add(m);return m};
function task(name,x,z,dur,loud,pend,fin,sfx,after,gate){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffcc55,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.scale.set(.5,.5,1);s.position.set(x,1.5,z);scene.add(s);fin.visible=false;TK.push({name,x,z,dur,loud,p:0,done:false,pend,fin,sfx,sp:s,after,gate})}
const plates=(g,x,z,c)=>{for(let i=0;i<6;i++)cyd(g,.13,.025,x+R(-.03,.03),.92+i*.03,z+R(-.03,.03),c);cyd(g,.05,.1,x+.2,.95,z-.2,c)};
task('Wash the dishes (kitchen)',16.5,17,5,7,grp(g=>plates(g,16.5,16.5,0x5a5a2a)),grp(g=>plates(g,16.5,18.6,0xf0f0e8)),()=>{noise(.3,2500,.12);tone(2200+R(0,400),.05,'triangle',.06)});
task('Take out the trash (back yard)',23.5,12.5,4,9,grp(g=>{for(const[x,z]of[[0,0],[.15,.1]]){const b=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),L(0x0a0a0a));b.position.set(23.5+x,1.1,12.5+z);g.add(b)}bx(g,.12,.12,.12,24.1,.07,12.9,0x2a2a20)}),grp(g=>cyd(g,.4,.05,23.5,.97,12.5,0x3a4a3a)),()=>noise(.25,700,.2));
task('Make the bed (master bedroom)',20.5,16.2+ZO,4,3,grp(g=>{for(const[x,z,r]of[[20,15.2,.4],[21,16,-.5]]){const m=bx(g,1.2,.12,1,x,.66,z+ZO,0x3a4a3a);m.rotation.y=r}}),grp(g=>{bx(g,2.8,.08,1.9,20.5,.66,15.9+ZO,0x8a3a4a);bx(g,.8,.16,.45,19.8,.7,14.5+ZO,0xf4f0e8);bx(g,.8,.16,.45,21.2,.7,14.5+ZO,0xf4f0e8)}),()=>noise(.3,900,.06));
task('Water the plants (living room)',45,14.5,5,5,grp(g=>{for(const x of[44.4,45,45.6])cyd(g,.02,.35,x,.9,14.5,0x5a4a22,.1)}),grp(g=>{for(const x of[44.4,45,45.6]){cyd(g,.03,.5,x,.95,14.5,0x2f8f3a,.15);const l=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),L(0x2f9a3a));l.position.set(x,1.3,14.5);g.add(l)}}),()=>noise(.4,3500,.1));
task('Wind the music box (nursery)',42,14.5+ZO,4,6,grp(g=>bx(g,.28,.16,.22,42,1.03,14.5+ZO,0x6a4a2a)),grp(g=>{bx(g,.28,.16,.22,42,1.03,14.5+ZO,0x6a4a2a);const l=bx(g,.28,.03,.22,42,1.17,14.4+ZO,0x8a6a3a);l.rotation.x=-.9;cyd(g,.02,.12,42,1.15,14.5+ZO,0xffd060)}),()=>tone([523,659,784,659][(Math.random()*4)|0],.4,'sine',.1),()=>[523,659,784,659,523].forEach((f,i)=>tone(f,.4,'sine',.12,0,i*.35)));
const mkLed=(g,c,y)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),bm_(c));m.position.set(49.17,y,16.25);g.add(m)};
task('Restore the power (fuse box, outside)',49.2,16.5,5,9,grp(g=>{mkLed(g,0xff2a1a,1.35);for(const z of[16.25,16.5,16.75])bx(g,.04,.12,.06,49.16,1.05,z,0x111)}),grp(g=>{mkLed(g,0x33ff66,1.35);for(const z of[16.25,16.5,16.75])cyd(g,.03,.12,49.18,1.05,z,0xe8c030)}),()=>{tone(R(90,130),.2,'sawtooth',.06);noise(.1,5000,.1)},()=>{powerOn()},()=>S.power?'The power is still on.':S.fuses<3?'Need 3 fuses ('+S.fuses+'/3). Search the yard.':null);
const tasksDone=()=>TK.every(t=>t.done);
const nearTask=()=>{const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let b=null,bd=1e9;for(const t of TK){if(t.done)continue;const dx=t.x-P.x,dz=t.z-P.z,d=Math.hypot(dx,dz);if(d<1.8&&(dx*fx+dz*fz)/(d||1)>.4&&d<bd){bd=d;b=t}}return b};
function drawTasks(){$('tasks').innerHTML='<b>CHORES</b><br>'+TK.map(t=>`<span style="${t.done?'color:#7f7;text-decoration:line-through':''}">${t.done?'☑':'☐'} ${t.name}</span>`).join('<br>')}
function resetTasks(){TK.forEach(t=>{t.p=0;t.done=false;t.pend.visible=true;t.fin.visible=false;t.sp.visible=true});drawTasks()}
function finishTask(t){t.done=true;t.pend.visible=false;t.fin.visible=true;t.sp.visible=false;tone(660,.15,'sine',.12);tone(880,.25,'sine',.1,0,.12);drawTasks();
 const n=TK.filter(k=>k.done).length;msg(n==TK.length?(S.t>=360?'All chores done. The gate is open!':'All chores done. Survive until 6 AM, then leave through the front gate.'):'Done: '+t.name+' ('+n+'/'+TK.length+')',4500);if(t.after)t.after()}
function taskTick(dt){const n=S.climb||P.hide||S.grab?null:nearTask();S.doing=null;S.taskMsg=null;
 if(n){const gm=n.gate&&n.gate();if(gm)S.taskMsg=gm;else if((K.KeyE||I.act)&&!P.moving){S.doing=n;n.p=Math.min(1,n.p+dt/n.dur);P.noise=Math.max(P.noise,n.loud);n.cd=(n.cd||0)-dt;if(n.cd<=0){n.cd=.45;n.sfx()}if(n.p>=1)finishTask(n)}}
 for(const t of TK)if(!t.done)t.sp.material.opacity=.5+.4*Math.sin(S.t*3+t.x)}
function powerOff(){S.power=false;S.flk=0;thunder();noise(.5,300,.4);msg('The power just died. The fuse box is outside, on the east wall. Find 3 fuses.',8000)}
function powerOn(){S.power=true;S.fixed=true;S.flk=1.6;zap();msg('Power restored.',4000)}
function startClimb(s){S.climb={t:0,dir:s.dir,lx:s.lx,lz:s.lz,x0:P.x,link:s.link,yaw:s.yaw};P.sprinting=false;P.moving=false;P.pose=0;tone(180,.15,'square',.05);
}
function followHunt(lx,lz){if(C.st=='hunt'&&lvl(C.z)==lvl(P.z)&&Math.hypot(P.x-C.x,P.z-C.z)<20){C.ls={x:lx,z:lz};C.lostT=0;C.tx=-1}
 if(CR.st=='hunt'&&lvl(CR.z)==lvl(P.z)&&Math.hypot(P.x-CR.x,P.z-CR.z)<16){CR.ls={x:lx,z:lz};CR.lostT=0;CR.tx=-1}}
function climbTick(dt){const c=S.climb;c.t+=dt;const k=Math.min(1,c.t/1.3),e=k*k*(3-2*k);if(!c.link)P.x=c.x0+(STX+1.2-c.x0)*e;P.cy=c.dir*(c.link?1.7:2.5)*e;
 if(((c.t*5)|0)!=(((c.t-dt)*5)|0)){noise(.07,300,.15);tone(90,.05,'square',.05)}
 $('fade').style.opacity=k>.55?Math.min(1,(k-.55)/.4):0;
 if(c.t>=1.45){followHunt(c.lx,c.lz);P.x=c.lx;P.z=c.lz;P.cy=0;P.yaw=c.link?c.yaw:Math.PI/2;P.stairCd=2;S.climb=null;S.fi=.7}}
/* stairs */
for(const z0 of[23,23+ZO]){const up=z0==23;for(let i=0;i<8;i++){const top=up?.35*(i+1):-.35*(i+1),hh=up?top:2.8+top,m=new THREE.Mesh(new THREE.BoxGeometry(.25,hh,1.94),L(i%2?0x4a3828:0x56402c));m.position.set(STX+.125+i*.25,up?hh/2:-2.8+hh/2,z0+1);scene.add(m)}
 for(const s2 of[.03,1.97]){const r2=new THREE.Mesh(new THREE.BoxGeometry(3.44,.05,.05),L(0x2a1c10));r2.position.set(STX+1,up?2.3:-.5,z0+s2);r2.rotation.z=up?.95:-.95;scene.add(r2)}}
/* pickups */
/* ---- pickup visuals: real models, glow, spin+bob, magnet pull, burst ---- */
const pkMB=(c,o={})=>new THREE.MeshBasicMaterial(Object.assign({color:c},o));
const glowSpr=(col,sz,op=.9)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op,fog:false}));s.scale.set(sz,sz,1);return s};
const mkBattery=()=>{const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.3,16),pkMB(0x2a2a30)),w=new THREE.Mesh(new THREE.CylinderGeometry(.078,.078,.12,16),pkMB(0xffc830)),cap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.035,16),pkMB(0xd8d8e0)),nub=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.04,12),pkMB(0xf0f0f8));cap.position.y=.168;nub.position.y=.205;w.position.y=.02;g.add(b,w,cap,nub);g.rotation.z=Math.PI/2;g.userData={y:.08,spin:0,col:0xffd040};return g};
const mkBottle=()=>{const g=new THREE.Group(),m=pkMB(0x55ee99,{transparent:true,opacity:.75}),b=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,.26,16),m),sh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.09,.08,16),m),nk=new THREE.Mesh(new THREE.CylinderGeometry(.04,.045,.1,12),m),cap=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.04,12),pkMB(0xd0b070)),lq=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.17,16),pkMB(0xc8ffe0));sh.position.y=.17;nk.position.y=.26;cap.position.y=.33;lq.position.y=-.03;g.add(b,sh,nk,cap,lq);g.rotation.z=1.5;g.userData={y:.1,spin:0,col:0x66ffaa};return g};
const mkFuse=()=>{const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.22,16),pkMB(0xeadfc8)),c1=new THREE.Mesh(new THREE.CylinderGeometry(.068,.068,.05,16),pkMB(0xcfa040)),c2=c1.clone(),fl=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.2,6),pkMB(0xffe080));c1.position.y=.135;c2.position.y=-.135;g.add(b,c1,c2,fl);g.rotation.z=.5;const w=new THREE.Group();w.add(g);w.userData={y:.08,spin:0,col:0xffc040,s:{visible:true}};return w};
const noteTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=88;const g=c.getContext('2d');g.fillStyle='#eadfb8';g.fillRect(0,0,64,88);g.fillStyle='#00000018';for(let i=0;i<30;i++)g.fillRect(Math.random()*64,Math.random()*88,5,4);g.strokeStyle='#4a3a2088';g.lineWidth=2;for(let y=14;y<80;y+=8){g.beginPath();g.moveTo(8,y);g.lineTo(8+Math.random()*30+20,y);g.stroke()}g.strokeStyle='#8a1c1c';g.beginPath();g.moveTo(8,8);g.lineTo(26,8);g.stroke();const t=new THREE.CanvasTexture(c);return t})();
const mkNote=()=>{const g=new THREE.Group(),p=new THREE.Mesh(new THREE.PlaneGeometry(.3,.41),pkMB(0xffffff,{map:noteTex,side:THREE.DoubleSide}));p.rotation.x=-Math.PI/2;g.add(p);g.userData={y:.03,spin:0,col:0xfff0c0};return g};
const FXP=[];for(let i=0;i<64;i++){const s=glowSpr(0xffffff,.22,1);s.visible=false;scene.add(s);FXP.push({s,l:0,L:1,vx:0,vy:0,vz:0})}
let fxi=0;
function burst(x,y,z,col,n=18){for(let i=0;i<n;i++){const p=FXP[fxi++%FXP.length],a=Math.random()*6.283,u=1+Math.random()*2.2;p.l=p.L=.55+Math.random()*.4;p.vx=Math.cos(a)*u;p.vz=Math.sin(a)*u;p.vy=1+Math.random()*2.6;p.s.material.color.setHex(col);p.s.position.set(x,y,z);p.s.visible=true}}
function itemFx(dt){const t=performance.now()/1000;
 for(const p of FXP)if(p.s.visible){p.l-=dt;if(p.l<=0){p.s.visible=false;continue}p.vy-=5*dt;p.s.position.x+=p.vx*dt;p.s.position.y=Math.max(.05,p.s.position.y+p.vy*dt);p.s.position.z+=p.vz*dt;const k=p.l/p.L;p.s.material.opacity=k;p.s.scale.setScalar(.06+.2*k)}
 for(const arr of[BAT,BOT,FUS,NOTES])for(const it of arr){if(it.got||!it.m.visible)continue;const m=it.m,u=m.userData,ph=it.x*1.7+it.z*2.3,d=Math.hypot(it.x-P.x,it.z-P.z);it.d=d;
  const k=Math.max(0,Math.min(1,(2.8-d)/1.7)),pull=k*k*.75;
  m.position.set(it.x+(P.x-it.x)*pull,u.y+(1.05-u.y)*pull,it.z+(P.z-it.z)*pull);
  m.rotation.y+=dt*u.spin*(1+k*3);
  m.scale.setScalar(1);
  if(u.pulse){u.pulse.material.opacity=.6+.35*Math.sin(t*5+ph);u.pulse.scale.setScalar(3+.5*Math.sin(t*5+ph))}}}
const BAT=[];{BSP.filter(([x,z])=>!solid(x|0,z|0)).sort(()=>Math.random()-.5).slice(0,22).forEach(([x,z])=>{const m=mkBattery();m.position.set(x,m.userData.y,z);m.rotation.y=Math.random()*6.28;scene.add(m);BAT.push({x,z,m,got:false,d:99})})}
const BOT=[];{BOP.filter(([x,z])=>!solid(x|0,z|0)).forEach(([x,z])=>{const m=mkBottle();m.position.set(x,m.userData.y,z);m.rotation.y=Math.random()*6.28;scene.add(m);BOT.push({x,z,m,got:false,d:99})})}
const FUS=[];{FUSP.forEach(([x,z])=>{const m=mkFuse();m.position.set(x,m.userData.y,z);scene.add(m);FUS.push({x,z,m,s:m.userData.s,got:false,d:99})})}
/* notes */
const NOTE_TXT=['Day 1. Moved in. The bathroom door was locked from the inside. Nobody was home.','Day 2. The pipes knock at night. The landlord swears the water is shut off.','Day 3. I saw it standing in the hallway. So tall. It just watched me.','Day 4. It listens. Do not run if you can help it. Hide, and hold your breath.','Day 5. Outside there is another one. When the screen pulses, STOP. Do not move. If it grabs you, fight.','Day 6. The power dies at 1 AM. Fuses are scattered in the yard. The gate opens at 6 AM.'];
const NOTES=[];{NOTE_TXT.forEach((t,i)=>{const m=mkNote();m.visible=false;scene.add(m);NOTES.push({i,x:0,z:0,m,got:false,d:99})})}
function placeNotes(){const rooms=IRK.slice().sort(()=>Math.random()-.5);NOTES.forEach((n,i)=>{const c=i==3?'R':i<4?rooms[i%rooms.length]:'O',t=pick(RT[c]);n.x=t[0]+.5+R(-.25,.25);n.z=t[1]+.5+R(-.25,.25);n.got=false;n.m.visible=true;n.m.position.set(n.x,.03,n.z);n.m.rotation.y=R(0,TAU)})}
/* ---------- wall dressing ---------- */
const TC={};
function decal(w,h,draw,x,y,z,ry,key){let t=TC[key];if(!t){const W2=256,H2=Math.round(256*h/w),c=document.createElement('canvas');c.width=W2;c.height=H2;draw(c.getContext('2d'),W2,H2);t=TC[key]=new THREE.CanvasTexture(c)}
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:t,transparent:true,depthWrite:false,emissive:0x110000}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m)}
{const WORDS=["DON'T SLEEP",'IT SEES YOU','6 AM','LEAVE','IT IS HERE',"DON'T LOOK",'NOT ALONE','HELP ME','STAY AWAKE','FREEZE','THE POWER DIES'],faces=[],bad=new Set();
 for(const d of DOORS)for(let z=d.z0-2;z<=d.z1+2;z++)for(let x=d.x0-2;x<=d.x1+2;x++)bad.add(z+','+x);
 for(const k of winCells){const[z,x]=k.split(',').map(Number);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)bad.add((z+j)+','+(x+i))}
 for(let z=1;z<H-1;z++)for(let x=1;x<W-1;x++)if(G[z][x]=='#'&&!bad.has(z+','+x))for(const[nx,nz]of[[1,0],[-1,0],[0,1],[0,-1]]){const r=G[z+nz]&&G[z+nz][x+nx];if(r&&r!='#'&&r!='F'&&r!='X'&&!isOut(r)&&r!='S'&&r!='y'&&!PB[(z+nz)*W+x+nx])faces.push([x,z,nx,nz,r])}
 faces.sort(()=>Math.random()-.5);const used=[],usedF=[];
 const draws=[
  (g,w,h)=>{g.fillStyle='rgba(120,12,12,.9)';g.font=`bold ${w*.15|0}px 'Special Elite','Courier New',monospace`;g.fillText(pick(WORDS),w*.03,h*.4);g.strokeStyle='rgba(120,12,12,.8)';g.lineWidth=w*.012;for(let i=0;i<9;i++){const x=w*.05+i*w*.1;g.beginPath();g.moveTo(x,h*.45);g.lineTo(x+R(-3,3),h*.45+R(h*.05,h*.5));g.stroke()}},
  (g,w,h)=>{g.fillStyle='rgba(110,10,10,.85)';g.beginPath();g.ellipse(w/2,h*.62,w*.2,h*.22,0,0,7);g.fill();for(let i=0;i<5;i++){const a=-1.2+i*.6;g.save();g.translate(w/2+Math.sin(a)*w*.16,h*.5-Math.cos(a)*h*.12);g.rotate(a);g.beginPath();g.ellipse(0,-h*.16,w*.045,h*.2,0,0,7);g.fill();g.restore()}for(let i=0;i<4;i++)g.fillRect(w/2-w*.18+i*w*.1,h*.8,3,R(h*.05,h*.2))},
  (g,w,h)=>{g.strokeStyle='rgba(10,10,10,.8)';g.lineWidth=w*.014;for(let i=0;i<5;i++){g.beginPath();g.moveTo(w*.12+i*w*.14,h*.04);g.lineTo(w*.2+i*w*.14+R(-6,6),h*.96);g.stroke()}},
  (g,w,h)=>{g.fillStyle='#17110c';g.fillRect(0,0,w,h);g.fillStyle='#6d665a';g.fillRect(w*.05,h*.05,w*.9,h*.9);g.fillStyle='#2a2622';for(let i=0;i<3;i++){const x=w*(.25+.25*i);g.beginPath();g.arc(x,h*.4,w*.07,0,7);g.fill();g.fillRect(x-w*.09,h*.5,w*.18,h*.4)}g.strokeStyle='rgba(140,12,12,.9)';g.lineWidth=w*.025;const k=w*.5;g.beginPath();g.moveTo(k-w*.1,h*.28);g.lineTo(k+w*.1,h*.52);g.moveTo(k+w*.1,h*.28);g.lineTo(k-w*.1,h*.52);g.stroke()},
  (g,w,h)=>{g.fillStyle='#b8943c';g.fillRect(0,0,w,h);g.fillStyle='#8a6a22';g.fillRect(8,8,w-16,h-16);g.fillStyle='#3a342a';g.fillRect(16,16,w-32,h-32);g.fillStyle='#2a2620';g.beginPath();g.arc(w/2,h*.4,w*.14,0,7);g.fill();g.fillRect(w/2-w*.2,h*.55,w*.4,h*.4)}];
 const dims=[[1.7,.55],[.8,.8],[.9,.9],[.6,.75],[.7,.9]];
 for(const[x,z,nx,nz]of faces){let k,pool,lim,sp_;const r=Math.random();if(r<.4&&used.length<26){k=r<.1?3:r<.2?1:r<.3?2:0;pool=used;lim=6}else if(usedF.length<44){k=4;pool=usedF;lim=3.5}else continue;if(pool.some(u=>Math.hypot(u[0]-x,u[1]-z)<lim)||used.concat(usedF).some(u=>Math.hypot(u[0]-x,u[1]-z)<1.8))continue;pool.push([x,z]);
  const[dw,dh]=dims[k],y=k==3||k==4?1.6:k==0?R(1.2,1.7):R(.9,1.5);decal(dw,dh,draws[k],x+.5+nx*.505,y,z+.5+nz*.505,Math.atan2(nx,nz),k+':'+(Math.random()*3|0))}}
/* ---------- monsters (unchanged) ---------- */
function mkNess(par){const g=new THREE.Group(),sk=SM(0x16301f,{roughness:.22,metalness:.1}),bl=SM(0x586a48,{roughness:.4}),tm=new THREE.MeshBasicMaterial({color:0xd8d4b8}),V=(x,y,z)=>new THREE.Vector3(x,y,z);
 g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0,-.2,0),V(-.12,.5,0),V(.05,.95,0),V(.02,1.25,0),V(.2,1.42,0)]),24,.1,10),sk));
 const head=new THREE.Group();head.position.set(.2,1.42,0);g.add(head);
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.15,14,10),sk);skull.scale.set(1.7,.8,.9);skull.position.set(.1,.03,0);head.add(skull);
 const jaw=new THREE.Group();jaw.position.set(-.02,-.09,0);head.add(jaw);
 const jw=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),bl);jw.scale.set(1.7,.35,.7);jw.position.set(.12,-.01,0);jaw.add(jw);
 for(let i=0;i<7;i++)for(const s of[-1,1]){const u=new THREE.Mesh(new THREE.ConeGeometry(.011,.05,5),tm);u.position.set(.05+i*.04,-.085,s*.07);u.rotation.z=Math.PI;head.add(u);const l=new THREE.Mesh(new THREE.ConeGeometry(.011,.05,5),tm);l.position.set(.05+i*.04,.03,s*.065);jaw.add(l)}
 for(const z of[-.1,.1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.028,8,8),new THREE.MeshBasicMaterial({color:0xe8ff90,fog:false}));e.scale.set(.6,1,.6);e.position.set(.14,.08,z);head.add(e);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xc8ff70,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.scale.set(.2,.14,1);sp.position.set(.14,.08,z);head.add(sp)}
 g.userData.jaw=jaw;par.add(g);return g}
function mkCreature(par=scene){
 const g=new THREE.Group(),b=SM(0x020202,{roughness:.55,metalness:.1,emissive:0x040508});
 const cyl=(r1,r2,h,x,y,z,pa=g)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,8),b);m.position.set(x,y,z);pa.add(m);return m};
 cyl(.12,.1,.2,0,.95,0);cyl(.17,.12,.85,0,1.3,0).rotation.x=.1;cyl(.05,.06,.2,0,1.75,.05);
 const head=new THREE.Group();head.position.set(0,1.9,.07);g.add(head);
 const sk=new THREE.Mesh(new THREE.SphereGeometry(.15,14,12),b);sk.scale.set(.85,1.35,.95);head.add(sk);
 const em=new THREE.MeshBasicMaterial({color:0xffffff,fog:false}),eyes=new THREE.Group();
 for(const x of[-.065,.065]){const e=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),em);e.scale.set(1.5,.55,.4);e.position.set(x,.05,.13);e.rotation.z=x>0?-.2:.2;eyes.add(e);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.scale.set(.22,.16,1);sp.position.set(x,.05,.14);eyes.add(sp)}
 head.add(eyes);
 const mouth=new THREE.Group();mouth.visible=false;mouth.position.set(0,-.07,.143);head.add(mouth);
 mouth.add(new THREE.Mesh(new THREE.PlaneGeometry(.11,.26),new THREE.MeshBasicMaterial({color:0})));
 const tm=new THREE.MeshBasicMaterial({color:0xe6e2cc});
 for(let i=0;i<9;i++)for(const s of[-1,1]){const t=new THREE.Mesh(new THREE.ConeGeometry(.008,.035,4),tm);t.position.set(s*.055,-.12+i*.03,.002);t.rotation.z=s>0?Math.PI/2:-Math.PI/2;mouth.add(t)}
 const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.23,1.6,0);g.add(a);cyl(.035,.03,.5,0,-.25,0,a);
  const f=new THREE.Group();f.position.set(0,-.5,0);a.add(f);cyl(.03,.02,.55,0,-.27,0,f);for(let k=-1;k<=1;k++)cyl(.008,.004,.22,k*.018,-.62,.005,f).rotation.z=k*.12;a.rotation.z=s*.12;return a});
 const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(s*.09,.9,0);g.add(l);cyl(.05,.04,.45,0,-.22,0,l);const k=new THREE.Group();k.position.set(0,-.45,0);k.rotation.x=.12;l.add(k);cyl(.04,.03,.45,0,-.22,0,k);return l});
 g.userData={eyes,head,arms,mouth,legs};g.visible=false;par.add(g);return g}
function animMon(g,now,k){const u=g.userData;u.tw=(u.tw||0)*.9;if(Math.random()<.01)u.tw=(Math.random()-.5)*.8;u.head.rotation.z=Math.sin(now/900+k)*.1+u.tw;u.head.rotation.x=Math.sin(now/1300+k)*.05;u.arms.forEach((a,i)=>a.rotation.x=Math.sin(now/1100+k+i)*.08)}
function mkFish(){const w=new THREE.Group(),n=mkNess(w);n.rotation.y=-Math.PI/2;w.userData={jaw:n.userData.jaw,body:n};w.visible=false;scene.add(w);return w}
/* THE SNATCHER: hunched, sack-headed, arms to the ground, rusted claws */
function mkSnatcher(par=scene){
 const g=new THREE.Group(),cl=SM(0x1c140e,{roughness:1}),sk=SM(0x6a5638,{roughness:1}),mt=SM(0x7a4a30,{roughness:.5,metalness:.6}),dk=SM(0x0a0806,{roughness:1}),
 cyl=(m,r1,r2,h,x,y,z,pa=g)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,8),m);o.position.set(x,y,z);pa.add(o);return o};
 const torso=cyl(cl,.26,.18,1.0,0,1.35,-.08);torso.rotation.x=.3;cyl(cl,.2,.24,.3,0,.95,0);
 const sack=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),sk);sack.scale.set(1,1.2,.8);sack.position.set(0,1.5,-.4);g.add(sack);
 for(let i=0;i<9;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(.05,.5+(i%3)*.15,.015),cl);const a=i*.7;r.position.set(Math.cos(a)*.22,.62,Math.sin(a)*.2);g.add(r)}
 const head=new THREE.Group();head.position.set(0,1.95,.18);g.add(head);
 const hs=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),sk);hs.scale.set(.9,1.25,1);head.add(hs);
 const knot=new THREE.Mesh(new THREE.ConeGeometry(.07,.18,6),sk);knot.position.set(0,.27,0);head.add(knot);
 for(let i=0;i<7;i++){const st=new THREE.Mesh(new THREE.BoxGeometry(.012,.07,.012),dk);st.position.set(-.09+i*.03,-.1,.18);head.add(st)}
 const mouthLine=new THREE.Mesh(new THREE.BoxGeometry(.2,.012,.012),dk);mouthLine.position.set(0,-.1,.185);head.add(mouthLine);
 const eyes=new THREE.Group();for(const x of[-.07,.07]){const e=new THREE.Mesh(new THREE.SphereGeometry(.026,8,8),new THREE.MeshBasicMaterial({color:0xffb030,fog:false}));e.scale.set(1.3,.7,.6);e.position.set(x,.06,.18);eyes.add(e);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff9a20,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.scale.set(.26,.18,1);s.position.set(x,.06,.19);eyes.add(s)}head.add(eyes);
 const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*.3,1.75,0);g.add(a);cyl(cl,.05,.04,.85,0,-.42,0,a);const f=new THREE.Group();f.position.set(0,-.85,0);a.add(f);cyl(cl,.04,.028,.95,0,-.47,0,f);
  for(let k=-1;k<=1;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.014,.3,5),mt);c.position.set(k*.03,-1.05,.02);c.rotation.x=.5;f.add(c)}a.rotation.z=s*.1;return a});
 const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(s*.12,.9,0);g.add(l);cyl(cl,.07,.05,.5,0,-.25,0,l);const k=new THREE.Group();k.position.set(0,-.5,0);k.rotation.x=.2;l.add(k);cyl(cl,.05,.04,.5,0,-.25,0,k);return l});
 g.userData={eyes,head,arms,legs};g.visible=false;par.add(g);return g}
function animSN(g,now,k){const u=g.userData;u.tw=(u.tw||0)*.9;if(Math.random()<.02)u.tw=(Math.random()-.5)*.7;u.head.rotation.z=Math.sin(now/700+k)*.08+u.tw;u.head.rotation.x=Math.sin(now/1100+k)*.06;u.arms.forEach((a,i)=>a.rotation.x=Math.sin(now/900+k+i)*.1)}
const cm=mkCreature(),fm=mkFish(),sn=mkSnatcher();
let J=null,ghostT=0,ghostCd=30,blk=0;
const jmon=mkCreature(camera),jnes=mkNess(camera),jsn=mkSnatcher(camera),jl=new THREE.PointLight(0xff5a40,0,5);camera.add(jl);jnes.rotation.y=-Math.PI/2;jnes.visible=false;
const ghost=new THREE.Group();[-.1,.1].forEach(x=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.set(.1,.07,1);sp.position.x=x;ghost.add(sp)});ghost.visible=false;scene.add(ghost);
const _f=new THREE.Vector3(),_d=new THREE.Vector3();
/* ---------- walking AI ---------- */
const C={x:44.5,z:34.5,face:Math.PI,st:'patrol',alert:0,tx:-1,tz:-1,fl:null,wx:null,wz:null,ls:null,lostT:0,q:[],waiting:0,opening:false,room:'l',ping:14,noiseCd:0,moved:0,stepD:0,ph:0,nx:0,nz:0,sol:csolid};
const SN={x:50.5,z:48.5,face:Math.PI,st:'roam',t:0,cd:0,tx:-1,tz:-1,fl:null,wx:null,wz:null,moved:0,ph:0,grace:0,beat:0,rt:0,lost:0,w:0,wl:0,sol:osolid};
function setTarget(E,tx,tz){if(tx!=E.tx||tz!=E.tz){E.tx=tx;E.tz=tz;E.fl=flow(tx,tz,E.sol);E.wx=null}}
function turn(E,dx,dz,dt){E.face+=angDiff(E.face,Math.atan2(dx,dz))*Math.min(1,dt*8)}
function walk(E,dt,speed){const cx=Math.floor(E.x),cz=Math.floor(E.z),d=E.fl[cz*W+cx];
 if(d===0){const dx=cx+.5-E.x,dz=cz+.5-E.z,dist=Math.hypot(dx,dz);if(dist<.1)return true;const s=Math.min(dist,speed*dt);E.x+=dx/dist*s;E.z+=dz/dist*s;turn(E,dx,dz,dt);return false}
 if(d<0)return true;
 if(E===C||E===CR){const pt=SPART[cz*W+cx];if(pt!==undefined&&E.fl[pt]>=0&&E.fl[pt]<d){E.x=pt%W+.5;E.z=(pt/W|0)+.5;E.wx=null;E.moved=0;return false}}
 if(E.wx===null||Math.hypot(E.wx-E.x,E.wz-E.z)<.15){let best=d,bx=-1,bz=-1;for(const[dx,dz]of DIRS){const nx=cx+dx,nz=cz+dz;if(E.sol(nx,nz))continue;if(dx&&dz&&(E.sol(cx+dx,cz)||E.sol(cx,cz+dz)))continue;const nd=E.fl[nz*W+nx];if(nd>=0&&nd<best){best=nd;bx=nx;bz=nz}}if(bx<0)return true;E.wx=bx+.5;E.wz=bz+.5}
 const dx=E.wx-E.x,dz=E.wz-E.z,dist=Math.hypot(dx,dz)||1,s=Math.min(speed*dt,dist);E.x+=dx/dist*s;E.z+=dz/dist*s;turn(E,dx,dz,dt);return false}
function newPatrol(){const row=G[Math.floor(P.z)],pr=row&&row[Math.floor(P.x)];let c;
 if(C.ping<=0&&pr&&RT[pr]&&!isOut(pr)&&pr!='y'){c=pr;C.ping=R(9,17)*(1-.55*S.dd)}else{do c=pick(IRK);while(c==C.room&&IRK.length>1)}
 C.room=c;const t=pick(RT[c]);setTarget(C,t[0],t[1])}
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
 let sees=false;const vr=(8+(P.flash?6:0)+4*dd)*[1,.75,.55][P.pose|0];
 if(!P.hide&&(!P.out||dist<4)){const fx=Math.sin(C.face),fz=Math.cos(C.face),dot=(dx*fx+dz*fz)/(dist||1);if(dist<vr&&(dot>.45||dist<1.8)&&los(C.x,C.z,P.x,P.z))sees=true}
 if(sees)C.alert=Math.min(1,C.alert+dt*(.45+(1-dist/vr)*1.6+(P.sprinting?.5:0)+(P.flash?.4:0)));else C.alert=Math.max(0,C.alert-dt*.3);
 if(C.alert>=1&&C.st!='hunt'&&!P.hide)startHunt();
 if(!P.hide&&!P.out&&C.noiseCd<=0&&(C.st=='patrol'||C.st=='queue')&&dist<P.noise){C.st='investigate';C.nx=P.x;C.nz=P.z;setTarget(C,Math.floor(P.x),Math.floor(P.z));C.waiting=0;C.noiseCd=1.5}
 if(!P.hide&&!P.out&&C.noiseCd<=0&&(C.st=='patrol'||C.st=='queue')&&lvl(P.z)!=lvl(C.z)&&P.noise>=4){const pc=crossCell(lvl(P.z),lvl(C.z)),eff=Math.hypot(P.x-(pc[0]+.5),P.z-(pc[1]+.5))+5;if(eff<P.noise){C.st='investigate';C.nx=pc[0]+.5;C.nz=pc[1]+.5;setTarget(C,pc[0],pc[1]);C.waiting=0;C.noiseCd=2.5;C.q=[]}}
 switch(C.st){
 case 'patrol':
  if(C.waiting>0){C.waiting-=dt;C.face+=Math.sin(S.t*1.7)*dt*.8;break}
  if(C.tx<0)newPatrol();
  if(walk(C,dt,1.5+.7*dd)){C.waiting=R(1.2,3);C.tx=-1}
  break;
 case 'investigate':
  if(C.waiting>0){C.waiting-=dt;C.face+=Math.sin(S.t*2.5)*dt*1.4;if(C.waiting<=0){C.st='queue';C.q=searchQueue({x:C.nx,z:C.nz});C.tx=-1}break}
  if(walk(C,dt,2.1+.9*dd))C.waiting=1.8;
  break;
 case 'hunt':{
  if(sees){C.lostT=0;C.ls={x:P.x,z:P.z}}else C.lostT+=dt;
  setTarget(C,Math.floor(C.ls.x),Math.floor(C.ls.z));
  const arrived=walk(C,dt,2.7+1.5*dd+(S.exitOpen?.5:0));
  if(!P.hide&&dist<.9&&!P.out){die('creature');return}
  if(!sees&&(arrived||C.lostT>3.5)){C.st='queue';C.q=searchQueue(C.ls);C.tx=-1}
  break}
 case 'queue':{const q=C.q[0];
  if(!q){C.st='patrol';C.tx=-1;C.alert=0;break}
  if(C.waiting>0){C.waiting-=dt;if(C.opening)C.face+=angDiff(C.face,Math.atan2(-q.ward.fx,-q.ward.fz))*Math.min(1,dt*6);else C.face+=Math.sin(S.t*2.2)*dt*1.1;
   if(C.waiting<=0){if(C.opening)openWard(q);if(S.over)return;C.opening=false;C.q.shift();C.tx=-1}break}
  if(q.ward)setTarget(C,q.ward.tileX,q.ward.tileZ);else setTarget(C,q.go[0],q.go[1]);
  if(walk(C,dt,2+.9*dd)){C.waiting=q.ward?1.7:1.3;C.opening=!!q.ward}
  break}}
 C.moved=Math.hypot(C.x-ox,C.z-oz);C.stepD+=C.moved;
 if(C.stepD>1.1){C.stepD=0;const s=spat(C.x,C.z);heavyStep(s.v*(C.st=='hunt'?1.3:1),s.pan)}
 if(C.st=='hunt'&&Math.random()<dt*.35){const s=spat(C.x,C.z);growl(s.v,s.pan)}
 C.br=(C.br||0)-dt;if(C.br<=0&&dist<8&&!P.hide){C.br=R(1.3,2);const s=spat(C.x,C.z);noise(.7,420,.2*s.v+.05,0,s.pan);tone(R(70,95),.6,'sawtooth',.05*s.v,-12,.05,s.pan)}}
function syncCreature(dt){const u=cm.userData,sw=Math.min(1,C.moved/(dt||1)/2),now=S.t*1000;cm.position.set(C.x,0,C.z);cm.rotation.y=C.face;C.ph+=C.moved*4;
 animMon(cm,now,0);const sg=Math.sin(C.ph),h=C.st=='hunt',dn=Math.hypot(P.x-C.x,P.z-C.z);
 u.legs[0].rotation.x=sg*.6*sw;u.legs[1].rotation.x=-sg*.6*sw;u.arms[0].rotation.x=-sg*.35*sw-(h?.7:0);u.arms[1].rotation.x=sg*.35*sw-(h?.7:0);
 const want=!P.hide&&dn<13?clamp(angDiff(C.face,Math.atan2(P.x-C.x,P.z-C.z)),-1.1,1.1):0;u.head.rotation.y+=(want-u.head.rotation.y)*Math.min(1,dt*5);
 u.mouth.visible=h&&dn<4&&!P.hide;u.eyes.visible=true;cm.position.y=Math.abs(sg)*.04*sw}
/* ---------- fish monster (unchanged) ---------- */
const WP=[];for(const[x,z,y,kind,r]of WPD){const m=new THREE.Mesh(new THREE.CircleGeometry(r,18),new THREE.MeshLambertMaterial({color:0x06121a}));m.rotation.x=-Math.PI/2;m.position.set(x,y+.01,z);scene.add(m);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.1,.14,24),new THREE.MeshBasicMaterial({color:0x66ffaa,transparent:true,opacity:0}));ring.rotation.x=-Math.PI/2;ring.position.set(x,y+.02,z);scene.add(ring);WP.push({x,z,y,kind,ring})}
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
function syncFish(){const wp=WP[FS.at],a=Math.atan2(P.x-wp.x,P.z-wp.z),u=fm.userData,t=S.t;fm.visible=FS.r>.02;fm.position.set(wp.x,wp.y-.45-1.75*(1-FS.r),wp.z);fm.rotation.y=a;let jaw=.3+.12*Math.sin(t*4),tilt=0;
 if(FS.ph=='lunge'){const d=Math.max(0,Math.min(1.5,Math.hypot(P.x-wp.x,P.z-wp.z)-.5)),k=Math.min(1,FS.t/.3);fm.position.x+=Math.sin(a)*d*k;fm.position.z+=Math.cos(a)*d*k;jaw=1.15*k;tilt=.5*k}
 u.body.rotation.set(tilt,-Math.PI/2+Math.sin(t*1.4)*.12,0);u.jaw.rotation.z=-jaw;
 WP.forEach((w,i)=>{const on=i==FS.at&&(FS.ph=='stir'||FS.ph=='rise');if(on){const k=(S.t*1.5)%1;w.ring.scale.setScalar(1+k*3);w.ring.material.opacity=.5*(1-k)}else w.ring.material.opacity=0})}
/* ---------- THE CRAWLER (lives in the cellar, uses the vents) ---------- */
function mkCrawler(){const g=new THREE.Group(),sk=SM(0xb9b4a6,{roughness:.7}),dk=new THREE.MeshBasicMaterial({color:0x050505});
 const body=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),sk);body.scale.set(1,.55,1.7);body.position.set(0,.42,0);g.add(body);
 const head=new THREE.Group();head.position.set(0,.5,.58);const hm=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),sk);hm.scale.set(1,.9,1.15);head.add(hm);
 for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0xff2a1a,fog:false}));e.position.set(sx*.075,.03,.13);head.add(e)}
 const jaw=new THREE.Mesh(new THREE.BoxGeometry(.18,.04,.14),dk);jaw.position.set(0,-.1,.12);head.add(jaw);g.add(head);
 const limbs=[];for(const[sx,sz]of[[-1,.35],[1,.35],[-1,-.35],[1,-.35]]){const p=new THREE.Group();p.position.set(sx*.26,.42,sz);const up=new THREE.Mesh(new THREE.CylinderGeometry(.04,.03,.5,6),sk);up.position.set(sx*.12,-.1,0);up.rotation.z=sx*.9;const lo=new THREE.Mesh(new THREE.CylinderGeometry(.03,.02,.5,6),sk);lo.position.set(sx*.3,-.28,0);lo.rotation.z=-sx*.25;p.add(up,lo);g.add(p);limbs.push(p)}
 g.userData={head,limbs,jaw};g.scale.setScalar(1.15);g.visible=false;scene.add(g);return g}
const crm=mkCrawler();
const CR={x:43.5,z:B0+17.5,face:Math.PI,st:'lurk',tx:-1,tz:-1,fl:null,wx:null,wz:null,moved:0,ph:0,waiting:0,alert:0,ls:null,lostT:0,nx:0,nz:0,noiseCd:0,stepD:0,sol:(x,z)=>solid(x,z,1)};
const RTB=[];for(const c of['B','Q','R'])for(const t of(RT[c]||[]))RTB.push(t);
function crawlerTick(dt){const ox=CR.x,oz=CR.z,same=lvl(P.z)==lvl(CR.z),dx=P.x-CR.x,dz=P.z-CR.z,dist=same?Math.hypot(dx,dz):99;CR.noiseCd-=dt;
 let sees=false;const vr=9*[1,.75,.5][P.pose|0]+(P.flash?4:0);
 if(same&&!P.hide&&dist<vr){const fx=Math.sin(CR.face),fz=Math.cos(CR.face),dot=(dx*fx+dz*fz)/(dist||1);if((dot>.35||dist<2)&&los(CR.x,CR.z,P.x,P.z))sees=true}
 if(sees)CR.alert=Math.min(1,CR.alert+dt*(.9+(1-dist/vr)*1.5));else CR.alert=Math.max(0,CR.alert-dt*.25);
 if(CR.alert>=1&&CR.st!='hunt'&&!P.hide){CR.st='hunt';CR.lostT=0;CR.ls={x:P.x,z:P.z};CR.tx=-1;const s=spat(CR.x,CR.z);tone(1400,.5,'sawtooth',.2*s.v+.05,-900,0,s.pan);noise(.4,3500,.25*s.v+.05,0,s.pan);if(!S.hint.cr){S.hint.cr=1;msg('It is fast. Hide, or lose it in the vents.',5000)}}
 if(CR.noiseCd<=0&&!P.hide&&(CR.st=='lurk'||CR.st=='investigate')&&P.noise>0){let heard=false,tx=0,tz=0;
  if(same){if(dist<P.noise*1.25){heard=true;tx=P.x;tz=P.z}}
  else if(P.noise>=6){const pc=crossCell(lvl(P.z),lvl(CR.z)),eff=Math.hypot(P.x-(pc[0]+.5),P.z-(pc[1]+.5))+3;if(eff<P.noise){heard=true;tx=pc[0]+.5;tz=pc[1]+.5}}
  if(heard){CR.st='investigate';CR.nx=tx;CR.nz=tz;setTarget(CR,Math.floor(tx),Math.floor(tz));CR.waiting=0;CR.noiseCd=1.2}}
 switch(CR.st){
 case 'lurk':
  if(CR.waiting>0){CR.waiting-=dt;CR.face+=Math.sin(S.t*2.3)*dt*.7;break}
  if(CR.tx<0){const t=pick(RTB);setTarget(CR,t[0],t[1])}
  if(walk(CR,dt,1.5)){CR.waiting=R(1.5,4);CR.tx=-1}
  break;
 case 'investigate':
  if(CR.waiting>0){CR.waiting-=dt;CR.face+=Math.sin(S.t*3)*dt*1.5;if(CR.waiting<=0){CR.st='lurk';CR.tx=-1}break}
  if(walk(CR,dt,2.4))CR.waiting=2.2;
  break;
 case 'hunt':{
  if(sees){CR.lostT=0;CR.ls={x:P.x,z:P.z}}else CR.lostT+=dt;
  setTarget(CR,Math.floor(CR.ls.x),Math.floor(CR.ls.z));
  const arrived=walk(CR,dt,3.5+S.dd*.8);
  if(!P.hide&&dist<.95){die('crawler');return}
  if(P.hide&&dist<2.3&&!P.holding){die('crawler');return}
  if(!sees&&(arrived||CR.lostT>4)){CR.st='investigate';CR.nx=CR.ls.x;CR.nz=CR.ls.z;CR.waiting=2.5;CR.tx=-1}
  break}}
 CR.moved=Math.hypot(CR.x-ox,CR.z-oz);CR.stepD+=CR.moved;
 if(CR.stepD>.55){CR.stepD=0;const s=spat(CR.x,CR.z),wet=G[Math.floor(CR.z)]&&G[Math.floor(CR.z)][Math.floor(CR.x)]=='Q';skitter(s.v,s.pan,wet)}
 CR.br=(CR.br||0)-dt;if(CR.br<=0&&same&&dist<10){CR.br=R(1.8,3.2);const s=spat(CR.x,CR.z);clickChirp(s.v,s.pan)}}
function syncCrawler(dt){const u=crm.userData,sw=Math.min(1,CR.moved/(dt||1)/2.5),h=CR.st=='hunt';crm.position.set(CR.x,0,CR.z);crm.rotation.y=CR.face;CR.ph+=CR.moved*8;
 u.limbs.forEach((l,i)=>{l.rotation.x=Math.sin(CR.ph+(i==1||i==2?Math.PI:0))*.7*sw});
 const want=!P.hide&&lvl(P.z)==lvl(CR.z)&&Math.hypot(P.x-CR.x,P.z-CR.z)<12?clamp(angDiff(CR.face,Math.atan2(P.x-CR.x,P.z-CR.z)),-1,1):0;u.head.rotation.y+=(want-u.head.rotation.y)*Math.min(1,dt*6);
 u.jaw.position.y=-.1-(h?.07:0);crm.position.y=Math.abs(Math.sin(CR.ph))*.03*sw}

/* ---------- THE SNATCHER (outside) ---------- */
const QK=['A','W','S','D','F','G'];
function snRoamTarget(){const near=Math.random()<.55&&P.out;let c=null;for(let n=0;n<40;n++){const t=pick(ROT);if(!near||Math.hypot(t[0]-P.x,t[1]-P.z)<20){c=t;break}}setTarget(SN,(c||pick(ROT))[0],(c||pick(ROT))[1])}
function snToRoam(cd){SN.st='roam';SN.cd=cd;SN.tx=-1;SN.lost=0;SN.w=1}
function snStartWatch(){SN.st='watch';SN.t=0;SN.beat=0;SN.grace=.8;SN.lost=0;SN.wl=R(0,3);if(!S.hint.sn){S.hint.sn=1;msg('The Snatcher is watching. The screen pulses: STAND STILL until it looks away.',6500)}}
function snStartRush(){SN.st='rush';SN.rt=0;SN.lost=0;tone(300,.5,'sawtooth',.3,400);noise(.4,3000,.4);S.pulse=1;msg('It saw you move!',2000)}
function snStartGrab(){const n=4+(S.dd>.45?1:0)+(S.dd>.8?1:0);S.grab={seq:Array.from({length:n},()=>pick(QK)),i:0,t:0,lim:1.9-.6*S.dd};SN.st='grab';const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);SN.x=P.x+fx*.95;SN.z=P.z+fz*.95;SN.face=Math.atan2(-fx,-fz);P.sprinting=false;P.moving=false;scream();qteShow()}
function qteShow(){const g=S.grab;$('qte').style.display='flex';$('qk').textContent=g.seq[g.i];$('qd').textContent=g.seq.map((_,i)=>i<g.i?'●':'○').join(' ');document.body.classList.add('qte')}
function qteInput(L){const g=S.grab;if(!g||S.over)return;if(L==g.seq[g.i]){g.i++;g.t=0;tone(700+g.i*90,.08,'square',.1);noise(.1,3000,.2);if(g.i>=g.seq.length)grabEnd(true);else qteShow()}else{g.t+=.5;P.yaw+=R(-.08,.08);tone(120,.15,'sawtooth',.15,-50);noise(.15,600,.3);const q=$('qte');q.classList.add('bad');setTimeout(()=>q.classList.remove('bad'),120)}}
function grabEnd(ok){S.grab=null;$('qte').style.display='none';document.body.classList.remove('qte');if(ok){SN.st='stun';SN.t=0;S.snSafe=5;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);SN.x=P.x+fx*2.4;SN.z=P.z+fz*2.4;if(osolid(Math.floor(SN.x),Math.floor(SN.z))){SN.x=P.x;SN.z=P.z}msg('You tore free! RUN!',3500);tone(400,.4,'sawtooth',.3,-250);noise(.4,2500,.4)}}
function snTick(dt){
 if(S.t<30&&!S.grab)return;
 const dx=P.x-SN.x,dz=P.z-SN.z,dist=Math.hypot(dx,dz),ox=SN.x,oz=SN.z;SN.cd-=dt;S.snSafe-=dt;
 const seen=P.out&&!P.hide&&dist<17&&los(SN.x,SN.z,P.x,P.z);
 switch(SN.st){
 case 'roam':
  if(SN.w>0){SN.w-=dt;SN.face+=Math.sin(S.t*1.3)*dt*.6}else{if(SN.tx<0)snRoamTarget();if(walk(SN,dt,1.5+.5*S.dd)){SN.tx=-1;SN.w=R(1,3)}}
  if(seen&&SN.cd<=0&&S.snSafe<=0)snStartWatch();
  break;
 case 'watch':{SN.t+=dt;SN.face+=angDiff(SN.face,Math.atan2(dx,dz))*Math.min(1,dt*6);SN.beat-=dt;SN.grace-=dt;
  if(SN.beat<=0){SN.beat=1.2-.5*clamp(1-dist/17,0,1);S.pulse=1;snPulseSnd(dist)}
  if(dist>3.2){const nx=SN.x+dx/dist*.45*dt,nz=SN.z+dz/dist*.45*dt;if(!osolid(Math.floor(nx),Math.floor(nz))){SN.x=nx;SN.z=nz}}
  if(!seen){SN.lost+=dt;if(SN.lost>2.5)snToRoam(8)}else SN.lost=0;
  if(SN.grace<=0&&P.moving)snStartRush();else if(dist<2.4&&SN.t>1)snStartRush();else if(SN.t>5+SN.wl)snToRoam(10);
  break}
 case 'rush':
  SN.rt-=dt;if(SN.rt<=0){SN.rt=.3;if(P.out)setTarget(SN,Math.floor(P.x),Math.floor(P.z))}
  if(SN.fl)walk(SN,dt,5.2+1.3*S.dd);
  if(!P.out){SN.lost+=dt;if(SN.lost>1.2)snToRoam(8)}else SN.lost=0;
  if(dist<1.1&&P.out)snStartGrab();
  break;
 case 'grab':break;
 case 'stun':SN.t+=dt;if(SN.t>2.2){let b=null,bd=0;for(let n=0;n<30;n++){const t=pick(ROT),d=Math.hypot(t[0]-P.x,t[1]-P.z);if(d>bd){bd=d;b=t}}setTarget(SN,b[0],b[1]);SN.st='flee';SN.t=0}break;
 case 'flee':SN.t+=dt;if(walk(SN,dt,3.4)||SN.t>8)snToRoam(16);break}
 SN.moved=Math.hypot(SN.x-ox,SN.z-oz);SN.stepD=(SN.stepD||0)+SN.moved;if(SN.stepD>1.3){SN.stepD=0;const s=spat(SN.x,SN.z);step('grass',.5*s.v,s.pan)}}
function syncSN(dt){const u=sn.userData,sw=Math.min(1,SN.moved/(dt||1)/2.5),now=S.t*1000;sn.visible=S.running&&S.t>=30||SN.st=='grab';sn.position.set(SN.x,0,SN.z);sn.rotation.y=SN.face;SN.ph+=SN.moved*3.5;animSN(sn,now,1);const sg=Math.sin(SN.ph),reach=SN.st=='rush'||SN.st=='grab';
 u.legs[0].rotation.x=sg*.6*sw;u.legs[1].rotation.x=-sg*.6*sw;if(sw>.1||reach){u.arms[0].rotation.x=-sg*.3*sw-(reach?1.2:0);u.arms[1].rotation.x=sg*.3*sw-(reach?1.2:0)}
 if(SN.st=='watch'){u.head.rotation.z+=(Math.random()-.5)*.1}sn.position.y=Math.abs(sg)*.04*sw}
/* ---------- throwing ---------- */
function throwBottle(){if(!S.running||S.paused||P.hide||S.grab||P.bottles<=0)return;P.bottles--;S.st.thrown++;
 const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let lx=P.x,lz=P.z;
 for(let d=.4;d<=11;d+=.3){const x=P.x+fx*d,z=P.z+fz*d,tx=Math.floor(x),tz=Math.floor(z);if(wallAt(tx,tz)||PB[tz*W+tx]==1)break;lx=x;lz=z}
 noise(.15,1200,.15,0,0,'bandpass',.8);tone(320,.12,'sine',.05,-120);const s=spat(lx,lz),v=Math.max(.4,s.v);
 shatter(v,s.pan,.3);
 msg('Glass shatters somewhere ahead.',2200);const lc=G[Math.floor(lz)][Math.floor(lx)],lo=isOut(lc);
 if(!lo&&S.t>22&&Math.hypot(lx-C.x,lz-C.z)<26){
  if(C.st=='patrol'||C.st=='queue'||C.st=='investigate'){C.st='investigate';C.nx=lx;C.nz=lz;setTarget(C,Math.floor(lx),Math.floor(lz));C.waiting=0;C.noiseCd=2;C.opening=false;C.q=[]}
  else if(C.st=='hunt'&&C.lostT>.4){C.ls={x:lx,z:lz};C.lostT=0}}
 if(lo&&(SN.st=='roam'||SN.st=='watch')&&Math.hypot(lx-SN.x,lz-SN.z)<28&&!osolid(Math.floor(lx),Math.floor(lz))){snToRoam(7);setTarget(SN,Math.floor(lx),Math.floor(lz));SN.w=0;msg('The Snatcher turned toward the noise.',3000)}}
/* ---------- player ---------- */
function setFlash(v){if(v&&(P.bat<=0||P.hide||!S.running))return;P.flash=v;flClick(v)}
function nearest(){if(P.hide)return{t:'exit'};let best=null,bd=1e9;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
 for(const w of WARD){const dx=w.cx-P.x,dz=w.cz-P.z,d=Math.hypot(dx,dz);if(d>1.9||(dx*fx+dz*fz)/d<.55||-(dx*w.fx+dz*w.fz)/d<.1)continue;if(d<bd){bd=d;best={t:'hide',w}}}
 for(const o of DOORO){const dx=o.cx-P.x,dz=o.cz-P.z,d=Math.hypot(dx,dz);if(d>2.1||(dx*fx+dz*fz)/(d||1)<.5)continue;if(d<bd){bd=d;best={t:'door',o}}}
 for(const k of LK2){const dx=k.x-P.x,dz=k.z-P.z,d=Math.hypot(dx,dz);if(d>k.r)continue;if(d<bd){bd=d;best={t:'link',k}}}
 return best}
function interact(){if(!S.running||S.paused||S.climb||S.grab)return;const n=nearest();if(!n)return;if(n.t=='exit')exitHide();else if(n.t=='door')toggleDoor(n.o);else if(n.t=='link')startClimb({dir:n.k.dir,lx:n.k.lx,lz:n.k.lz,link:1,yaw:n.k.yaw});else enterHide(n.w)}
function enterHide(w){if((P.hideCd||0)>0){msg('Not yet. Something is watching the closets.',1500);return}S.st.hides++;const d=Math.hypot(P.x-C.x,P.z-C.z),saw=C.st=='hunt'&&d<18&&los(C.x,C.z,P.x,P.z),hot=C.st=='hunt'||C.alert>.4;
 P.hide=w;P.hideT=0;P.pose=0;P.baseYaw=Math.atan2(-w.fx,-w.fz);P.x=w.cx;P.z=w.cz;P.yaw=P.baseYaw;P.pitch=0;P.flash=false;P.holding=false;P.sprinting=false;P.noise=0;
 $('slats').style.display='block';$('bH').style.display=coarse?'flex':'none';tone(300,.1,'square',.08);noise(.1,400,.15);
 if(saw){C.st='queue';C.q=[{ward:w,sure:true}];C.tx=-1;C.waiting=0;C.opening=false;msg('It saw you hide...',3000)}
 else if(hot&&C.st!='queue'){C.st='queue';C.q=searchQueue({x:w.fxx,z:w.fzz});C.tx=-1;C.waiting=0;C.opening=false}
 if(!S.hint.c){S.hint.c=1;msg(coarse?'Hold BREATH when it is close. ACT to leave.':'Hold SPACE to hold your breath when it is close. E to leave.',6000)}}
function exitHide(){const w=P.hide;P.hide=null;P.x=w.fxx;P.z=w.fzz;$('slats').style.display='none';$('bH').style.display='none';tone(250,.1,'square',.08)}
function look(dx,dy,k){P.yaw-=dx*k;P.pitch=clamp(P.pitch-dy*k,-1.25,1.25);if(P.hide){P.yaw=clamp(P.yaw,P.baseYaw-.75,P.baseYaw+.75);P.pitch=clamp(P.pitch,-.5,.5)}}
const surf=c=>{if(c=='Q')return 'water';const k=FK[c];return k=='marble'?'tile':k||'wood'};
function setPose(p){if(!S.running||S.paused||P.hide||S.grab||S.climb)return;const r=G[Math.floor(P.z)],c=r&&r[Math.floor(P.x)];if(c=='y'&&p<2)p=2;if(p!=P.pose){P.pose=p;tone(p?150:200,.06,'sine',.04)}}
function playerTick(dt){P.hideCd=(P.hideCd||0)-dt;P.hh=(P.hh||0)+(([0,-.5,-1.0][P.pose|0]||0)-(P.hh||0))*Math.min(1,dt*9);if(S.climb){climbTick(dt);return}P.stairCd=(P.stairCd||0)-dt;
 const row=G[Math.floor(P.z)],cc=row&&row[Math.floor(P.x)];P.out=isOut(cc);
 if(S.grab){P.moving=false;P.sprinting=false;P.noise=0;return}
 if(P.hide){P.hideT=(P.hideT||0)+dt;if(P.hideT>13&&!P.hideW){P.hideW=1;msg('Something scratches at the closet door...',2500);tone(110,.5,'sawtooth',.08,-30)}
  if(P.hideT>20){const w=P.hide;P.hideW=0;exitHide();P.hideCd=4;P.nbv=8;P.nbt=1.5;msg('Something shoved the door open. You can\'t stay in here.',3500);thud(w.cx,w.cz,.7);noise(.3,500,.3);return}
  P.holding=I.breath&&P.breath>0;if(P.holding){P.breath-=dt*.13;if(P.breath<=0){P.breath=0;P.holding=false;noise(.3,1500,.25);tone(500,.3,'sine',.08,-200);if(C.st=='queue'&&C.q[0]&&C.q[0].ward)C.q[0].sure=Math.hypot(C.x-P.x,C.z-P.z)<5.5?true:C.q[0].sure}}else P.breath=Math.min(1,P.breath+dt*.3);P.noise=0;return}
 const kx=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),kz=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);
 let mx=clamp(I.mx+kx,-1,1),mz=clamp(I.mz+kz,-1,1);const raw=Math.hypot(mx,mz),len=Math.min(1,raw);if(raw>0){mx/=raw;mz/=raw}
 P.moving=len>.1;const want=(K.ShiftLeft||K.ShiftRight||I.sprint)&&P.moving;
 if(P.tired&&P.stam>.3)P.tired=false;P.sprinting=want&&!P.tired&&P.stam>0&&!P.pose;
 if(P.sprinting){P.stam=Math.max(0,P.stam-dt*.27);if(P.stam<=0)P.tired=true}else P.stam=Math.min(1,P.stam+dt*(P.moving?.1:.22));
 const sp=(P.sprinting?4.3:2.5)*[1,.62,.38][P.pose|0]*(cc=='Q'?.8:1),sy=Math.sin(P.yaw),cy=Math.cos(P.yaw),dx=(-sy*mz+cy*mx)*sp*len*dt,dz=(-cy*mz-sy*mx)*sp*len*dt;
 if(!blockedAt(P.x+dx,P.z,.28))P.x+=dx;if(!blockedAt(P.x,P.z+dz,.28))P.z+=dz;
 P.noise=P.moving?(P.sprinting?10:4)*[1,.5,.25][P.pose|0]+(cc=='Q'?3:0):0;P.nbt=(P.nbt||0)-dt;if(P.nbt>0)P.noise=Math.max(P.noise,P.nbv||0);if(!S.hint.bs&&P.z>=B0){S.hint.bs=1;msg('The cellar. Crouch (C) and crawl (X) to stay quiet. Watch the NOISE meter. The vents are crawl-only.',8000)}{const sc=STP[Math.floor(P.z)*W+Math.floor(P.x)];if(sc&&P.stairCd<=0)startClimb(sc)}
 if(P.moving){P.bob+=dt*(P.sprinting?11:7.5);P.stepD+=sp*len*dt;if(P.stepD>(P.sprinting?1.5:1.9)){P.stepD=0;step(surf(cc),(P.sprinting?.22:.1)*[1,.6,.3][P.pose|0])}}
 if(P.flash){P.bat-=dt*.55;if(P.bat<=0){P.bat=0;P.flash=false;msg('Flashlight died. Find batteries.',3500);tone(200,.5,'sine',.15,-100)}}
 itemFx(dt);
 for(const b of BAT)if(!b.got&&b.d<1.1){b.got=true;burst(b.m.position.x,b.m.position.y,b.m.position.z,0xffd040);b.m.visible=false;P.bat=Math.min(100,P.bat+35);sfxBat();S.st.batt++;msg('Battery found.',1800)}
 for(const f of FUS)if(!f.got&&f.d<1.2){f.got=true;burst(f.m.position.x,f.m.position.y,f.m.position.z,0xffc040,32);f.m.visible=false;f.s.visible=false;S.fuses++;sfxFuse();msg('Fuse '+S.fuses+'/3.'+(S.fuses>=3?' Bring them to the fuse box on the east wall.':''),3500)}
 for(const n of NOTES)if(!n.got&&n.d<1.1){n.got=true;burst(n.m.position.x,n.m.position.y,n.m.position.z,0xfff0c0,22);n.m.visible=false;S.st.notes++;sfxNote();msg('NOTE '+S.st.notes+'/6 — '+NOTE_TXT[n.i],9000);const k=(num('l6h2_notes',0))|(1<<n.i);store.set('l6h2_notes',k)}
 for(const b of BOT)if(!b.got&&b.d<1.1){b.got=true;burst(b.m.position.x,b.m.position.y,b.m.position.z,0x66ffaa);b.m.visible=false;P.bottles=Math.min(4,P.bottles+1);sfxBottle();msg('Bottle. Press '+(coarse?'THROW':'Q')+' to throw it and lure monsters away.',3000)}}
/* ---------- game flow ---------- */
function msg(s,ms=4500){const m=$('msg');m.textContent=s;m.style.opacity=1;clearTimeout(msg.h);msg.h=setTimeout(()=>m.style.opacity=0,ms)}
function lockPtr(){if(!coarse&&ren.domElement.requestPointerLock){try{const p=ren.domElement.requestPointerLock();p&&p.catch&&p.catch(()=>{})}catch(e){}}}
function goFull(){if(!coarse)return;const f=document.documentElement;try{f.requestFullscreen&&f.requestFullscreen().catch(()=>{});screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}try{window.Capacitor.Plugins.StatusBar.hide()}catch(e){}}
function show(a,b,c,sub,mm){const s=$('scr');s.className='scr';s.onclick=null;s.innerHTML=`<h1>${a}</h1>${sub?`<h2>${sub}</h2>`:''}<p>${b}</p><div class="row"><button id="go">${c}</button>${mm?'<button id="mm" class="alt">Main menu</button>':''}</div>`;$('go').onclick=()=>{audio();goFull();reset();lockPtr()};if(mm)$('mm').onclick=()=>menu()}
const BN=['Dark','Normal','Bright'];
function menu(view='main'){S.menu=true;S.running=false;document.body.classList.remove('jx');document.body.classList.add('inm');
 const s=$('scr'),best=num('l6h2_best',0),nk=num('l6h2_notes',0),nn=[0,1,2,3,4,5].filter(i=>nk&(1<<i)).length,wins=num('l6h2_wins',0),
 meta=best||wins?`Longest night: ${fmt(best)}${wins?' · Escapes: '+wins:''} · Notes found: ${nn}/6`:'No night survived yet.';
 const V={
  main:`<h1>The Last<br>6 Hours</h1><h4 class="part">PART 2 · THE HOUSE</h4><p class="tag">You survived the bathroom. Now the whole house is yours, and so is everything in it.</p><nav><button data-a="play">Start the night</button><button data-a="how">How to play</button><button data-a="set">Settings</button></nav><p class="meta">${meta}</p>`,
  how:`<h2>How to play</h2><dl><dt>Survive</dt><dd>Stay alive from 12 AM to 6 AM, finish six chores, then leave through the front gate at the end of the garden path.</dd><dt>The power</dt><dd>The lights die at 1 AM. Find 3 fuses in the yard and put them in the fuse box on the east wall.</dd><dt>The thing in the dark</dt><dd>It patrols the house, listens and hunts. Break line of sight and hide in a closet. Hold your breath when it is close.</dd><dt>The Snatcher</dt><dd>It lives outside. When your screen pulses, STOP MOVING. If you move it grabs you: press the shown keys (A W S D F G, or tap) to break free.</dd><dt>The plumbing</dt><dd>Stay away from sinks, toilets and tubs. If something stirs, back away or hit it with your flashlight.</dd><dt>Bottles</dt><dd>Throw one to pull monsters toward the noise. Find batteries and notes.</dd><dt>Controls</dt><dd>${coarse?'Left thumb moves, right thumb looks. Buttons for LIGHT, RUN, ACT, THROW and HOLD BREATH.':'WASD move, mouse look, Shift run, F flashlight, E hide / interact, Q throw a bottle, hold Space to hold your breath.'}</dd></dl><button class="bk" data-a="back">Back</button>`,
  set:`<h2>Settings</h2><label>Volume<br><input id="vol" type="range" min="0" max="100" value="${vol*100|0}"></label><p><label>Look sensitivity<br><input id="sens" type="range" min="30" max="200" value="${sens*100|0}"></label></p><p><button class="bk" data-a="bright">Brightness: ${BN[S.bright]}</button></p><p><button class="bk" data-a="clear">Clear records</button></p><button class="bk" data-a="back">Back</button>`};
 s.className='scr menu';s.innerHTML=V[view];
 s.onclick=e=>{const a=e.target.dataset.a;if(!a)return;audio();click();
  if(a=='play'){goFull();reset();lockPtr()}else if(a=='how'||a=='set')menu(a);else if(a=='back')menu();
  else if(a=='bright'){S.bright=(S.bright+1)%3;store.set('l6h2_b',S.bright);menu('set')}
  else if(a=='clear'){store.set('l6h2_best',0);store.set('l6h2_wins',0);store.set('l6h2_notes',0);menu('set')}};
 const v=$('vol');if(v)v.oninput=()=>{vol=v.value/100;store.set('l6h2_vol',vol);if(OUT)OUT.gain.value=vol};
 const q=$('sens');if(q)q.oninput=()=>{sens=q.value/100;store.set('l6h2_sens',sens)}}
function reset(){Object.assign(S,{t:0,running:true,over:false,paused:false,exitOpen:false,hr:0,dd:0,hint:{},amb:10,menu:false,threat:0,power:true,fixed:false,fuses:0,pulse:0,lamp:1,flk:0,grab:null,snSafe:0,danger:0,st:{batt:0,thrown:0,hides:0,notes:0}});
 Object.assign(P,{x:18.5,z:29.5,yaw:0,pitch:0,hide:null,stam:1,tired:false,flash:false,bat:100,breath:1,holding:false,sprinting:false,moving:false,noise:0,stepD:0,bottles:2,out:false});
 Object.assign(C,{x:44.5,z:34.5,face:Math.PI,st:'patrol',alert:0,tx:-1,fl:null,wx:null,ls:null,q:[],waiting:0,opening:false,room:'l',ping:14,noiseCd:0,moved:0});
 Object.assign(SN,{x:50.5,z:48.5,face:Math.PI,st:'roam',t:0,cd:0,tx:-1,fl:null,wx:null,moved:0,lost:0,w:1});
 Object.assign(FS,{at:0,ph:'dorm',t:0,r:0,cool:18,reloc:20});BAT.forEach(b=>{b.got=false;b.m.visible=true});BOT.forEach(b=>{b.got=false;b.m.visible=true});FUS.forEach(f=>{f.got=false;f.m.visible=true;f.s.visible=true});
 exitL.color.setHex(0xff3322);exitSign.material.color.setHex(0xff3322);gateL.visible=true;$('exitd').style.display='none';cm.visible=false;J=null;jmon.visible=false;jnes.visible=false;jsn.visible=false;jcr.visible=false;jl.intensity=0;camera.fov=72;camera.updateProjectionMatrix();ghostT=0;ghostCd=R(25,45);blk=0;ghost.visible=false;fm.visible=false;document.body.classList.remove('jx');document.body.classList.remove('inm');document.body.classList.remove('qte');$('qte').style.display='none';S.climb=null;S.fi=0;$('fade').style.opacity=0;P.cy=0;P.stairCd=0;P.hideT=0;P.hideW=0;P.hideCd=0;P.pose=0;P.hh=0;P.nbt=0;S.bsm=0;Object.assign(CR,{x:43.5,z:B0+17.5,face:Math.PI,st:'lurk',tx:-1,fl:null,wx:null,waiting:0,alert:0,ls:null,lostT:0,noiseCd:0,moved:0});resetDoors();placeNotes();resetTasks();$('slats').style.display='none';$('bH').style.display='none';$('scr').classList.add('hide');$('js').className='';$('js').style.background='';
 msg(coarse?'Left thumb: move. Right thumb: look. ACT near a closet to hide.':'WASD move · mouse look · Shift run · C crouch · X crawl · F flashlight · E interact (doors, closets, hatch) · Q throw bottle',6500)}
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function statLine(win){const best=num('l6h2_best',0);if(!win&&S.t>best)store.set('l6h2_best',S.t|0);let w=num('l6h2_wins',0);if(win){w++;store.set('l6h2_wins',w)}
 return `<small style="opacity:.6">${win?'Escaped':'Survived'} ${fmt(S.t)} · Longest night ${fmt(Math.max(best,win?360:S.t))} · Batteries ${S.st.batt} · Bottles thrown ${S.st.thrown} · Closets ${S.st.hides} · Notes ${S.st.notes}/6${w?' · Escapes '+w:''}</small>`}

function mkCrawlerJ(par){const g=new THREE.Group(),sk=SM(0x6e6a5e,{roughness:.8}),dk=new THREE.MeshBasicMaterial({color:0x080000}),red=new THREE.MeshBasicMaterial({color:0xff2a1a}),tooth=new THREE.MeshBasicMaterial({color:0xe8e2cc});
 const head=new THREE.Group(),skull=new THREE.Mesh(new THREE.SphereGeometry(.44,18,14),sk);skull.scale.set(1,.85,1.1);head.add(skull);
 for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),red);e.position.set(sx*.18,.12,.47);e.scale.set(1,1.4,.5);e.rotation.z=sx*.4;head.add(e)}
 const maw=new THREE.Mesh(new THREE.SphereGeometry(.26,14,10),dk);maw.position.set(0,-.16,.4);maw.scale.set(1.1,.7,.6);head.add(maw);
 for(let i=0;i<9;i++){const a=(i/8-.5)*2.1,t=new THREE.Mesh(new THREE.ConeGeometry(.024,.12,5),tooth);t.position.set(Math.sin(a)*.27,-.07,.4+Math.cos(a)*.1);t.rotation.x=Math.PI;head.add(t)}
 const jaw=new THREE.Group();jaw.position.set(0,-.2,.12);const jm=new THREE.Mesh(new THREE.BoxGeometry(.46,.07,.4),sk);jm.position.set(0,-.02,.2);jaw.add(jm);
 for(let i=0;i<8;i++){const t=new THREE.Mesh(new THREE.ConeGeometry(.022,.11,5),tooth);t.position.set((i/7-.5)*.4,.07,.36);jaw.add(t)}
 head.add(jaw);g.add(head);
 const arms=[];for(const sx of[-1,1]){const a=new THREE.Group();a.position.set(sx*.75,-.3,0);const up=new THREE.Mesh(new THREE.CylinderGeometry(.05,.035,1.1,8),sk);up.rotation.x=Math.PI/2;up.position.z=.55;a.add(up);
  for(let k=-1;k<=1;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.02,.28,5),tooth);c.rotation.x=Math.PI/2;c.position.set(k*.06,0,1.2);a.add(c)}g.add(a);arms.push(a)}
 g.visible=false;par.add(g);g.userData={head,jaw,arms};return g}
const jcr=mkCrawlerJ(camera);let JR=null;
function jscareSound(w){if(!AC)return;tone(45,.5,'sine',.5);
 if(w=='crawler'){tone(2400,.7,'sawtooth',.25,-1800);tone(1700,.5,'square',.12,-900,.05);noise(.5,4000,.35,0,0,'highpass');for(let i=0;i<7;i++)tone(900+Math.random()*300,.04,'square',.1,0,.12+i*.07)}
 else if(w=='fish'){noise(.9,500,.4);tone(90,.9,'sawtooth',.3,-40);for(let i=0;i<5;i++)tone(300+i*60,.1,'sine',.1,200,.1+i*.09)}
 else if(w=='snatcher'){tone(60,1,'sawtooth',.35,-20);noise(.5,220,.4);tone(520,.4,'square',.1,-300,.05)}
 else{tone(70,.8,'sawtooth',.3,-30);tone(1200,.3,'square',.15,-800);noise(.35,3000,.3,0,0,'highpass')}}
function die(why){if(S.over)return;S.over=true;S.running=false;P.hide=null;S.climb=null;P.cy=0;if(S.grab){S.grab=null;$('qte').style.display='none';document.body.classList.remove('qte')}$('fade').style.opacity=0;$('slats').style.display='none';document.exitPointerLock&&document.exitPointerLock();
 const fish=why=='fish',snt=why=='snatcher',crw=why=='crawler',stat=statLine(false);J={t:0,why};jmon.visible=!fish&&!snt&&!crw;jnes.visible=fish;jsn.visible=snt;jcr.visible=crw;jscareSound(why);cm.visible=false;fm.visible=false;sn.visible=false;ghost.visible=false;document.body.classList.add('jx');scream();
 setTimeout(()=>{J=null;jmon.visible=false;jnes.visible=false;jsn.visible=false;jcr.visible=false;jl.intensity=0;camera.fov=72;camera.updateProjectionMatrix();$('js').className='';$('js').style.background='';document.body.classList.remove('jx');
  show('YOU DIED',({creature:'The thing in the dark caught you.',closet:'It opened the closet door.',fish:'Something dragged you down into the plumbing.',snatcher:'The Snatcher dragged you into the dark.',crawler:'Something pale crawled out of the dark.'}[why]||'It got you.')+'<br><br>'+stat,'TRY AGAIN',null,1)},2400)}
function win(){S.running=false;S.over=true;document.exitPointerLock&&document.exitPointerLock();tone(880,2.2,'sine',.25);tone(1320,2.6,'sine',.15,0,.3);show('YOU ESCAPED','The gate clangs shut behind you. Morning light. Whatever lives in that house stays inside... for now.<br><br>'+statLine(true),'PLAY AGAIN',null,1)}
function tick(dt){
 S.t+=dt;S.dd=Math.min(1,S.t/360);const h=Math.min(6,S.t/60|0);
 if(h>S.hr){S.hr=h;if(h<6){tone(520,1.2,'sine',.15);msg(HL[h]+' — it is getting worse...',3500)}}
 if(!S.fixed&&S.power&&S.t>=60)powerOff();
 if(S.flk>0){S.flk-=dt;S.lamp=Math.random()<.5?1:.1}else if(S.power&&!S.fixed&&S.t>56&&S.t<60){S.lamp=Math.random()<.5?1:.15}else S.lamp+=((S.power?1:0)-S.lamp)*Math.min(1,dt*10);
 if(S.t>=360&&!S.hint.late&&!tasksDone()){S.hint.late=1;msg('6 AM. The gate stays locked until every chore is done.',8000)}
 if(S.t>=360&&!S.exitOpen&&tasksDone()){S.exitOpen=true;gateL.visible=false;exitL.color.setHex(0x33ff66);exitSign.material.color.setHex(0x33ff66);msg('6 AM — the front gate is open at the end of the garden path. GET OUT!',9000);tone(880,1.5,'sine',.25);tone(1100,1.5,'sine',.15,0,.2)}
 playerTick(dt);if(S.over)return;doorsTick(dt);taskTick(dt);if(S.fi>0){S.fi-=dt;$('fade').style.opacity=Math.max(0,S.fi/.7)}
 if(S.grab){S.grab.t+=dt;if(S.grab.t>=S.grab.lim){die('snatcher');return}}
 if(S.t>22){cm.visible=true;creatureTick(dt);if(S.over)return}
 crawlerTick(dt);if(S.over)return;
 snTick(dt);if(S.over)return;
 fishTick(dt);if(S.over)return;
 if(S.exitOpen&&!P.hide&&P.z>54.3&&P.z<55)return win();
 S.pulse=Math.max(0,S.pulse-dt*2.2);beds();
 S.amb-=dt;if(S.amb<=0){S.amb=R(9,22)*(1-.4*S.dd);const a=R(0,TAU),r=R(6,16),x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r,s=spat(x,z);const q=Math.random();if(S.t>40&&Math.random()<.18+.3*S.dd)swell();
  if(P.z>=B0)cellarAmb(s,q);else if(P.out){if(q<.25)owl();else if(q<.45)thunder();else if(q<.7)noise(.5,250,.3*s.v+.04,0,s.pan);else{noise(1.2,900,.1,0,s.pan,'bandpass',1.4)}}
  else if(q<.3)noise(.15,200,.4*s.v+.04,0,s.pan);else if(q<.5)creak(x,z);else if(q<.7)tone(R(180,260),.5,'sawtooth',.05*s.v+.01,-80,0,s.pan);else{tone(R(90,140),.9,'sawtooth',.06*s.v+.015,R(-40,40),0,s.pan);noise(.5,300,.05*s.v+.01,0,s.pan)}}
 ghostT-=dt;ghostCd-=dt;
 if(ghostCd<=0&&S.t>30&&!P.hide){ghostCd=R(25,55)*(1-.4*S.dd);const an=P.yaw+R(-.7,.7),r=R(4,9),gx=P.x-Math.sin(an)*r,gz=P.z-Math.cos(an)*r;if(!wallAt(Math.floor(gx),Math.floor(gz))&&los(P.x,P.z,gx,gz)){ghost.position.set(gx,Math.random()<.5?1.75:.35,gz);ghostT=R(1.2,2.4);whisper(spat(gx,gz).pan)}}
 if(S.t>90&&Math.random()<dt*(.012+.05*S.dd)){blk=R(.1,.4);tone(70,.4,'sawtooth',.05,-30)}
 if(!S.hint.q&&S.t>45){S.hint.q=1;msg(P.bottles?(coarse?'THROW a bottle to draw it away from you.':'Press Q to throw a bottle. The thing will go to the noise.'):'Find bottles. Throwing one draws it away.',6000)}
 if(!S.hint.a&&S.t>12){S.hint.a=1;msg('Find closets to hide in. Check the floor for batteries. Stay clear of sinks, toilets and tubs.',6500)}
 let d=Math.max(CR.st=='hunt'&&lvl(CR.z)==lvl(P.z)?clamp(1-Math.hypot(P.x-CR.x,P.z-CR.z)/12,.25,1):0,C.st=='hunt'?clamp(1-Math.hypot(P.x-C.x,P.z-C.z)/14,.25,1):0,C.alert*.35,(FS.ph=='stir'||FS.ph=='rise'||FS.ph=='lunge')?.7:0,SN.st=='rush'?.9:SN.st=='watch'?.5:0,S.grab?1:0);
 S.danger+=(d-S.danger)*Math.min(1,dt*3);
 if(S.danger>.12){S.hb=(S.hb||0)-dt;if(S.hb<=0){heartbeat(S.danger);S.hb=1.1-.6*S.danger}}}
function hud(){$('clock').textContent=HL[Math.min(6,S.t/60|0)];$('bat').firstChild.style.width=P.bat+'%';$('sta').firstChild.style.width=P.stam*100+'%';S.nzv=(S.nzv||0)+(Math.min(1,(P.noise||0)/10)-(S.nzv||0))*.25;{const nz=$('nz');nz.firstChild.style.width=(S.nzv*100)+'%';nz.firstChild.style.background=S.nzv>.7?'#d04a3a':S.nzv>.35?'#d0a03a':'#6aa86a';$('nzl').textContent='NOISE'+(P.pose==1?' · CROUCHING':P.pose==2?' · CRAWLING':'')}$('botl').textContent='BOTTLES: '+P.bottles;$('noteh').textContent='NOTES: '+S.st.notes+'/6';$('fusel').textContent='FUSES: '+S.fuses+'/3';
 $('h1').classList.toggle('on',!!P.flash);$('h1b').style.width=P.bat+'%';for(let i=2;i<=5;i++)$('h'+i).classList.toggle('full',P.bottles>=i-1);
 if(S.exitOpen){const tg0=P.z>=B0?{x:17.5,z:B0+23.5}:P.z>=ZO?{x:STS+.5,z:ZO+24}:EX,dx=tg0.x-P.x,dz=tg0.z-P.z,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw),e=$('exitd');e.style.display='block';e.innerHTML='<span style="display:inline-block;transform:rotate('+(Math.atan2(dx*rx+dz*rz,dx*fx+dz*fz)*57.3|0)+'deg)">▲</span> '+(P.z>=B0?'LADDER':P.z>=ZO?'STAIRS':'GATE')+' '+(Math.hypot(dx,dz)|0)+'m'}
 const row=G[Math.floor(P.z)],c=row&&row[Math.floor(P.x)];$('room').textContent=NAMES[c]||'';
 const n=S.running&&!S.climb&&!S.grab?nearest():null,tk=S.running&&!S.climb&&!n&&!S.grab?nearTask():null,p=$('prompt');if(n){p.textContent=(coarse?'':'[E] ')+(n.t=='exit'?'Leave closet':n.t=='door'?(n.o.t?'Close door':'Open door'):n.t=='link'?n.k.txt:'Hide');p.style.opacity=1}else if(tk){p.textContent=S.taskMsg||((coarse?'Hold ACT: ':'Hold [E]: ')+tk.name+(tk.p>0?' '+Math.round(tk.p*100)+'%':''));p.style.opacity=1}else p.style.opacity=0;
 $('red').style.opacity=Math.min(.75,S.danger*.8);$('pulse').style.opacity=Math.min(.8,S.pulse*.8);$('freeze').style.display=SN.st=='watch'&&S.running?'block':'none';
 if(S.grab){$('qb').firstChild.style.width=Math.max(0,100*(1-S.grab.t/S.grab.lim))+'%'}}
/* ---------- input ---------- */
const T={move:null,look:null},QMAP={KeyA:'A',KeyW:'W',KeyS:'S',KeyD:'D',KeyF:'F',KeyG:'G'};
addEventListener('keydown',e=>{if(S.grab){const L=QMAP[e.code];if(L&&!e.repeat)qteInput(L);e.preventDefault();return}K[e.code]=true;if(e.repeat||!S.running)return;if(e.code=='KeyF')setFlash(!P.flash);else if(e.code=='Digit1')setFlash(!P.flash);else if(/^Digit[2-5]$/.test(e.code)){if(P.bottles>=+e.code.slice(5)-1)throwBottle()}else if(e.code=='KeyE')interact();else if(e.code=='KeyQ')throwBottle();else if(e.code=='KeyC')setPose(P.pose==1?0:1);else if(e.code=='KeyX')setPose(P.pose==2?0:2);else if(e.code=='Space'){e.preventDefault();I.breath=true}});
addEventListener('keyup',e=>{K[e.code]=false;if(e.code=='Space')I.breath=false});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement&&S.running&&!S.paused)look(e.movementX,e.movementY,.0022*sens)});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&S.running&&!coarse){S.paused=true;I.mx=I.mz=0;show('PAUSED','Click to resume.','RESUME');$('go').onclick=()=>{$('scr').classList.add('hide');S.paused=false;lockPtr()}}});
ren.domElement.addEventListener('mousedown',e=>{if(!S.running||S.paused)return;if(!document.pointerLockElement&&!coarse)lockPtr();else interact()});
const joy=$('joy'),knob=$('knob');
addEventListener('pointerdown',e=>{if(e.pointerType=='mouse'||!S.running||S.paused||S.grab||(e.target.closest&&(e.target.closest('.b')||e.target.closest('#qte'))))return;
 if(!T.move&&e.clientX<innerWidth*.5){T.move={id:e.pointerId,x:e.clientX,y:e.clientY};joy.style.display='block';joy.style.left=e.clientX+'px';joy.style.top=e.clientY+'px';knob.style.left=knob.style.top='40px'}
 else if(!T.look)T.look={id:e.pointerId,x:e.clientX,y:e.clientY}});
addEventListener('pointermove',e=>{if(e.pointerType=='mouse')return;
 if(T.move&&e.pointerId==T.move.id){const dx=e.clientX-T.move.x,dy=e.clientY-T.move.y,r=55,l=Math.hypot(dx,dy),k=l>r?r/l:1;I.mx=dx*k/r;I.mz=-dy*k/r;knob.style.left=(40+dx*k)+'px';knob.style.top=(40+dy*k)+'px'}
 else if(T.look&&e.pointerId==T.look.id){look(e.clientX-T.look.x,e.clientY-T.look.y,.0052*sens);T.look.x=e.clientX;T.look.y=e.clientY}});
const up=e=>{if(T.move&&e.pointerId==T.move.id){T.move=null;I.mx=I.mz=0;joy.style.display='none'}if(T.look&&e.pointerId==T.look.id)T.look=null};
addEventListener('pointerup',up);addEventListener('pointercancel',up);
const hold=(id,k)=>{const b=$(id),u=()=>{I[k]=false;b.classList.remove('on')};b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();I[k]=true;b.classList.add('on')});b.addEventListener('pointerup',u);b.addEventListener('pointercancel',u);b.addEventListener('pointerleave',u)};
hold('bS','sprint');hold('bH','breath');hold('bA','act');
$('bF').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(S.running)setFlash(!P.flash)});
$('bC').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();setPose(((P.pose|0)+1)%3)});
$('h1').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();setFlash(!P.flash)});for(let i=2;i<=5;i++)$('h'+i).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(P.bottles>=i-1)throwBottle()});
$('bT').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();throwBottle()});
$('bA').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interact()});
document.querySelectorAll('#qkeys button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();qteInput(b.dataset.k)}));
if(coarse)document.body.classList.add('t');
addEventListener('resize',()=>{ren.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
/* ---------- environment + loop ---------- */
const cIn0=new THREE.Color(0x556677),cIn1=new THREE.Color(0xffdcae),cOut=new THREE.Color(0x7f95c4),cTmp=new THREE.Color(),fogOut=new THREE.Color(0x070b14);
function env(dt){S.bsm=(S.bsm||0)+((S.running&&P.z>=B0?1:0)-(S.bsm||0))*Math.min(1,dt*4);const to=S.running&&P.out?1:0;S.outF+=(to-S.outF)*Math.min(1,dt*3);const lamp=S.menu?0:S.lamp;
 cTmp.copy(cIn0).lerp(cIn1,lamp);cTmp.lerp(cOut,S.outF);amb.color.copy(cTmp);
 const inI=BR[S.bright]+(PWR[S.bright]-BR[S.bright])*lamp;amb.baseI=(inI+(OBR[S.bright]-inI)*S.outF)*(1-.5*S.bsm);
 scene.fog.density=.08+(.045-.08)*S.outF+.05*S.bsm;scene.fog.color.setRGB(fogOut.r*S.outF,fogOut.g*S.outF,fogOut.b*S.outF);scene.background.copy(scene.fog.color);setLampVis(lamp)}
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(S.running&&!S.paused){tick(dt);hud()}
 if(S.running){syncCreature(dt);syncFish();syncSN(dt);syncCrawler(dt)}
 crm.visible=!!S.running&&!S.menu;
 if(S.menu){P.x=17.5;P.z=23.5;P.yaw=-Math.PI/2;P.pitch=.02;P.hide=null;P.flash=false;P.bob=0;P.moving=false;P.out=false;S.t=now/1000;sn.visible=false;
  C.x=27.5;C.z=23.5;C.face=-Math.PI/2;C.st='patrol';C.moved=0;cm.visible=true;fm.visible=false;syncCreature(dt);cm.userData.eyes.visible=Math.sin(now/1700)>-.85;S.t=0}
 env(dt);
 const sh=J?.04+.05*Math.min(1,J.t):S.threat*.012+(S.grab?.03:0);
 camera.position.set(P.x+(Math.random()-.5)*sh,1.55+(P.cy||0)+(P.hh||0)+(P.hide?0:Math.sin(P.bob)*.035*(P.moving?1:0))+(Math.random()-.5)*sh,P.z+(Math.random()-.5)*sh*.5);camera.rotation.set(P.pitch,P.yaw,0);
 const fv=72-5*S.pulse;if(Math.abs(camera.fov-fv)>.05){camera.fov=fv;camera.updateProjectionMatrix()}
 stars.position.copy(camera.position);moon.position.set(camera.position.x-40,45,camera.position.z-52);
 S.threat=Math.max(S.threat*.9,S.danger||0);
 fl.intensity=P.flash&&P.bat>0?((P.bat<15&&Math.random()<.25)||(S.threat>.5&&Math.random()<.1)?.4:3.2):0;
 blk-=dt;const dark=blk>0;
 const cd=cm.visible&&!S.menu?Math.hypot(P.x-C.x,P.z-C.z):99;amb.intensity=dark?0:(amb.baseI||BR[S.bright])*(Math.random()<(.002+.02*S.dd+(cd<9?.07*(1-cd/9):0))*(S.lamp>.5&&S.outF<.5?.3:1)?.2:1);
 ghost.visible=ghostT>0&&Math.sin(now/90)>-.6;
 if(ghost.visible&&P.flash){camera.getWorldDirection(_f);ghost.getWorldPosition(_d);_d.sub(camera.position).normalize();if(_f.dot(_d)>.93){ghostT=0;tone(900,.1,'square',.05)}}
 if(J){J.t+=dt;const t=J.t,p=Math.min(1,t/.16),e=1-Math.pow(1-p,3),tw=p>=1?Math.sin(t*55):0,rj=()=>Math.random()-.5,hold=Math.min(1,Math.max(0,t-.16)/1.5);
  if(J.why=='fish'){const sc=1.3+.9*e+.04*tw;jnes.scale.setScalar(sc);jnes.position.set(rj()*.06*p,-.1-1.42*sc+.03*tw,-2.8+2.0*e);jnes.userData.jaw.rotation.z=-1.15*e-(p>=1?.15*(tw*.5+.5):0)}
  else if(J.why=='snatcher'){const sc=1+.9*e;jsn.scale.setScalar(sc);jsn.position.set(rj()*.06*p,-.05-2.0*sc,-3.6+2.9*e);jsn.userData.head.rotation.z=p>=1?rj()*.7:0;jsn.userData.arms.forEach(a=>a.rotation.x=-1.4*e-.2*tw)}
  else if(J.why=='crawler'){const u=jcr.userData,sc=1+.3*e+.02*tw;jcr.scale.setScalar(sc);jcr.position.set(rj()*.08*p,-.95+.8*e+(p<1?Math.abs(Math.sin(t*50))*.05:0),-4.4+3.05*e);u.head.rotation.z=p>=1?rj()*.5:0;u.head.rotation.x=p>=1?.12*tw:0;u.jaw.rotation.x=-.25-.7*e-(p>=1?.25*(tw*.5+.5):0);u.arms.forEach((a,i)=>{a.rotation.x=-.8*e-.15*tw;a.rotation.y=(i?-1:1)*(.5-.35*e)})}
  else{const sc=1+.9*e;jmon.scale.setScalar(sc);jmon.position.set(rj()*.06*p,-.05-1.94*sc,-3.6+2.9*e);jmon.userData.head.rotation.z=p>=1?rj()*.6:0;jmon.userData.mouth.visible=p>.5;jmon.userData.arms.forEach(a=>a.rotation.x=-1.4*e-.2*tw)}
  jl.intensity=1.8+(Math.random()<.3?1.6:0);$('js').className='on';
  const sh=p>=1?1-hold*.5:p;JR=[rj()*.06*sh,rj()*.06*sh,rj()*.14*sh];camera.position.x+=JR[0];camera.position.y+=JR[1];camera.rotation.z+=JR[2];
  camera.fov=72+24*e*(1-hold*.6);camera.updateProjectionMatrix();
  const fa=t<.07?.9:t>1.8?Math.min(1,(t-1.8)/.45):0,fc=t<.07?255:0;
  $('js').style.background=fa>0?`rgba(${fc},${fc},${fc},${fa})`:(t>.25&&Math.random()<.22?'rgba(150,0,0,.45)':'transparent')}
 else if(camera.fov!==72){camera.fov=72;camera.updateProjectionMatrix()}
 ren.render(scene,camera);if(JR){camera.position.x-=JR[0];camera.position.y-=JR[1];camera.rotation.z-=JR[2];JR=null}}
/* ---------- updates (served from the update server) ---------- */
let VER=null;const getVer=async()=>{if(location.protocol=='file:')return null;try{const r=await fetch('version.json',{cache:'no-store'});return r.ok?(await r.json()).version:null}catch(e){return null}};
getVer().then(v=>{VER=v;$('ver').textContent=v?'build '+v:'offline build'});
setInterval(async()=>{if(S.running&&!S.over)return;const v=await getVer();if(v&&VER&&v!==VER){$('ver').textContent='updating...';setTimeout(()=>location.reload(),500)}},30000);
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!(location.hostname=='localhost'&&!location.port))navigator.serviceWorker.register('sw.js').catch(()=>{});
requestAnimationFrame(loop);
menu();
