#!/usr/bin/env node
/* Prepares the Capacitor shell and builds the APK.
 *   node scripts/build.js web   -> writes www/config.js + capacitor.config.json, bundles ../game into www/game
 *   node scripts/build.js apk   -> web + (cap add android) + patch manifest/version + cap sync + gradle assembleDebug
 * Env: SERVER_URL (https://your.server, no trailing slash), APK_VERSION (integer, must increase each release) */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.join(__dirname,'..'),mode=process.argv[2]||'web';
const SERVER=(process.env.SERVER_URL||'').replace(/\/$/,''),VER=parseInt(process.env.APK_VERSION||'1',10)||1;
const run=(c,cwd=root)=>{console.log('> '+c);cp.execSync(c,{cwd,stdio:'inherit'})};

function web(){
 if(!SERVER)console.warn('WARNING: SERVER_URL not set — the APK will only run its bundled offline copy.');
 fs.writeFileSync(path.join(root,'www/config.js'),`window.L6H=${JSON.stringify({server:SERVER,apkVersion:VER})};\n`);
 const host=SERVER?new URL(SERVER).host:'';
 const cfg={appId:'com.last6hours.house',appName:'Last 6 Hours 2',webDir:'www',
  server:{androidScheme:'https',cleartext:true,allowNavigation:host?[...new Set([host.replace(/:\d+$/,''),host])]:[]},
  android:{allowMixedContent:true}};
 fs.writeFileSync(path.join(root,'capacitor.config.json'),JSON.stringify(cfg,null,2));
 const dst=path.join(root,'www/game');fs.rmSync(dst,{recursive:true,force:true});fs.cpSync(path.join(root,'..','game'),dst,{recursive:true});
 console.log('web ready: server=%s apkVersion=%d',SERVER||'(none)',VER);
}
function patchAndroid(){
 const man=path.join(root,'android/app/src/main/AndroidManifest.xml');let m=fs.readFileSync(man,'utf8');
 if(!/screenOrientation/.test(m))m=m.replace('<activity','<activity android:screenOrientation="sensorLandscape"');
 if(SERVER.startsWith('http://')&&!/usesCleartextTraffic/.test(m))m=m.replace('<application','<application android:usesCleartextTraffic="true"');
 fs.writeFileSync(man,m);
 const gr=path.join(root,'android/app/build.gradle');let g=fs.readFileSync(gr,'utf8');
 g=g.replace(/versionCode\s+\d+/,'versionCode '+VER).replace(/versionName\s+"[^"]*"/,'versionName "1.0.'+VER+'"');fs.writeFileSync(gr,g);
}
web();
if(mode==='apk'){
 if(!fs.existsSync(path.join(root,'android')))run('npx cap add android');
 patchAndroid();run('npx cap sync android');
 const win=process.platform==='win32';run(win?'gradlew.bat assembleDebug':'./gradlew assembleDebug',path.join(root,'android'));
 console.log('\nAPK: '+path.join(root,'android/app/build/outputs/apk/debug/app-debug.apk'));
}
