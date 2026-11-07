#!/usr/bin/env node
/* Update server for The Last 6 Hours 2 — zero dependencies (Node 18+).
 *  GET  /                 -> the game (../game by default)
 *  GET  /version.json     -> {version} hash of every game file; changes automatically when you edit/deploy files
 *  GET  /app.json         -> latest APK info {versionCode,url,notes,required}
 *  GET  /apk/<file>       -> APK download
 *  PUT  /admin/apk?versionCode=N[&notes=..][&required=1]   (Authorization: Bearer $ADMIN_TOKEN, body = APK)
 *  GET  /health
 * Env: PORT (8080), GAME_DIR, APK_DIR, ADMIN_TOKEN */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const PORT=+process.env.PORT||8080,
 GAME=path.resolve(process.env.GAME_DIR||path.join(__dirname,'..','game')),
 APK=path.resolve(process.env.APK_DIR||path.join(__dirname,'apk')),
 TOKEN=process.env.ADMIN_TOKEN||'';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.woff2':'font/woff2','.apk':'application/vnd.android.package-archive','.ico':'image/x-icon'};
const ZIPPABLE=/^(text\/|application\/json|image\/svg)|javascript/;
fs.mkdirSync(APK,{recursive:true});

function listFiles(dir,base=''){let out=[];for(const n of fs.readdirSync(dir)){if(n.startsWith('.'))continue;const abs=path.join(dir,n),rel=base+n,st=fs.statSync(abs);
 if(st.isDirectory())out=out.concat(listFiles(abs,rel+'/'));else out.push({rel,abs,size:st.size,m:st.mtimeMs})}return out}
let vc={sig:'',version:'0',files:[]};
function version(){const files=listFiles(GAME),sig=files.map(f=>f.rel+f.size+f.m).join('|');
 if(sig!==vc.sig){const h=crypto.createHash('sha1');for(const f of files){h.update(f.rel);h.update(fs.readFileSync(f.abs))}vc={sig,version:h.digest('hex').slice(0,10),files:files.map(f=>f.rel)}}return vc}

const send=(res,code,body,type='application/json',extra={})=>{res.writeHead(code,Object.assign({'Content-Type':type,'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'},extra));res.end(body)};
const json=(res,code,o)=>send(res,code,JSON.stringify(o));
const gz={};
function serveFile(req,res,file,extra={}){let st;try{st=fs.statSync(file)}catch(e){return json(res,404,{error:'not found'})}if(!st.isFile())return json(res,404,{error:'not found'});
 const type=MIME[path.extname(file).toLowerCase()]||'application/octet-stream',h=Object.assign({'Content-Type':type,'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'},extra);
 if(ZIPPABLE.test(type)&&/\bgzip\b/.test(req.headers['accept-encoding']||'')){const k=file+st.mtimeMs;if(!gz[k])gz[k]=zlib.gzipSync(fs.readFileSync(file));h['Content-Encoding']='gzip';h['Content-Length']=gz[k].length;res.writeHead(200,h);return res.end(gz[k])}
 h['Content-Length']=st.size;res.writeHead(200,h);fs.createReadStream(file).pipe(res)}
const inside=(root,p)=>{const f=path.resolve(root,'.'+path.sep+p);return f.startsWith(root+path.sep)||f===root?f:null};
const appInfo=req=>{let a={versionCode:0};try{a=JSON.parse(fs.readFileSync(path.join(APK,'app.json'),'utf8'))}catch(e){}
 if(a.url&&a.url.startsWith('/')){const proto=req.headers['x-forwarded-proto']||'http';a.url=proto+'://'+req.headers.host+a.url}return a};

http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x'),p=decodeURIComponent(u.pathname);
 if(req.method==='OPTIONS')return send(res,204,'','text/plain',{'Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'});
 if(p==='/health')return json(res,200,{ok:true});
 if(p==='/version.json'){const v=version();return json(res,200,{version:v.version,files:v.files,time:Date.now()})}
 if(p==='/app.json')return json(res,200,appInfo(req));
 if(p.startsWith('/apk/')){const f=inside(APK,p.slice(5));return f?serveFile(req,res,f,{'Content-Disposition':'attachment'}):json(res,400,{error:'bad path'})}
 if(p==='/admin/apk'&&req.method==='PUT'){
  const ok=TOKEN&&(req.headers.authorization||'')==='Bearer '+TOKEN;if(!ok)return json(res,401,{error:'unauthorized (set ADMIN_TOKEN on the server)'});
  const vcode=parseInt(u.searchParams.get('versionCode'),10);if(!(vcode>0))return json(res,400,{error:'versionCode required'});
  const tmp=path.join(APK,'.upload'),ws=fs.createWriteStream(tmp);let size=0;
  req.on('data',c=>{size+=c.length;if(size>300e6){ws.destroy();req.destroy()}});req.pipe(ws);
  ws.on('finish',()=>{fs.renameSync(tmp,path.join(APK,'last6hours2.apk'));
   const info={versionCode:vcode,url:'/apk/last6hours2.apk',notes:u.searchParams.get('notes')||'',required:u.searchParams.get('required')==='1',size,time:Date.now()};
   fs.writeFileSync(path.join(APK,'app.json'),JSON.stringify(info));json(res,200,info);console.log('APK uploaded v'+vcode,size+'B')});
  ws.on('error',e=>json(res,500,{error:String(e)}));return}
 const f=inside(GAME,p==='/'?'index.html':p);return f?serveFile(req,res,f):json(res,400,{error:'bad path'});
}).listen(PORT,()=>console.log(`Last 6 Hours 2 server on :${PORT}  game=${GAME}  apk=${APK}  admin=${TOKEN?'enabled':'disabled (set ADMIN_TOKEN)'}`));
