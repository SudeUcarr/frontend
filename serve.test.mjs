import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {mkdtemp,mkdir,writeFile,copyFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve,dirname} from 'node:path'
import {spawn} from 'node:child_process'

test('frontend publication preserves same-origin API bodies, redirect and HttpOnly session cookies',async t=>{
  const fixture=await mkdtemp(join(tmpdir(),'kampuskit-frontend-server-'))
  t.after(async()=>{
    if(dirname(resolve(fixture))!==resolve(tmpdir()))throw new Error('Fixture must stay inside temp directory')
    await rm(fixture,{recursive:true,force:true})
  })
  await mkdir(join(fixture,'scripts'));await mkdir(join(fixture,'dist'))
  await writeFile(join(fixture,'dist/index.html'),'<h1>KampüsKit</h1>')
  await writeFile(join(fixture,'dist/license.txt'),'CC BY-SA 4.0')
  await copyFile(new URL('./scripts/serve.mjs',import.meta.url),join(fixture,'scripts/serve.mjs'))
  const upstream=createServer(async(req,res)=>{
    assert.equal(req.headers.origin,'https://frontend.example.invalid')
    assert.equal(req.headers.cookie,'kk_access=access-secret; kk_refresh=refresh-secret')
    res.setHeader('Cache-Control','no-store')
    if(req.url==='/api/auth/callback?code=pkce-code'){
      res.writeHead(303,{Location:'https://frontend.example.invalid/#/app','Set-Cookie':[
        'kk_access=new-access; Path=/api; HttpOnly; SameSite=Lax; Secure',
        'kk_refresh=new-refresh; Path=/api; HttpOnly; SameSite=Lax; Secure']})
      res.end();return
    }
    const chunks=[];for await(const chunk of req)chunks.push(chunk)
    res.setHeader('Content-Type',req.headers['content-type']||'application/json')
    res.end(Buffer.concat(chunks))
  })
  await new Promise(done=>upstream.listen(0,'127.0.0.1',done))
  t.after(()=>new Promise(done=>{upstream.closeAllConnections();upstream.close(done)}))
  const child=spawn(process.execPath,[join(fixture,'scripts/serve.mjs')],{
    env:{...process.env,PORT:'0',HOST:'127.0.0.1',API_PROXY_TARGET:'http://127.0.0.1:'+upstream.address().port},stdio:['ignore','pipe','pipe']})
  t.after(async()=>{if(child.exitCode===null){child.kill();await new Promise(done=>child.once('exit',done))}})
  const address=await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Frontend startup timeout')),10000)
    let output=''
    child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/KampüsKit Frontend: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);done(match[1])}})
    child.once('exit',code=>{clearTimeout(timer);reject(new Error('Frontend exited: '+code))})
  })
  assert.match(await(await fetch(address)).text(),/KampüsKit/)
  assert.deepEqual(await(await fetch(address+'/healthz')).json(),{ready:true})
  assert.match((await fetch(address+'/license.txt')).headers.get('Content-Type'),/^text\/plain/)
  const headers={Origin:'https://frontend.example.invalid',Cookie:'kk_access=access-secret; kk_refresh=refresh-secret','Content-Type':'application/json'}
  const json=await fetch(address+'/api/occupancy/predict',{method:'POST',headers,body:'{"extraEntries":3}'})
  assert.equal(json.status,200);assert.deepEqual(await json.json(),{extraEntries:3})
  assert.equal(json.headers.get('Cache-Control'),'no-store')
  const bytes=Buffer.from([0,255,10,13,128,67])
  const upload=await fetch(address+'/api/files/notes',{method:'POST',headers:{...headers,'Content-Type':'application/pdf'},body:bytes})
  assert.deepEqual(Buffer.from(await upload.arrayBuffer()),bytes)
  const callback=await fetch(address+'/api/auth/callback?code=pkce-code',{headers,redirect:'manual'})
  assert.equal(callback.status,303)
  assert.equal(callback.headers.get('Location'),'https://frontend.example.invalid/#/app')
  assert.equal(callback.headers.getSetCookie().length,2)
  assert.match(callback.headers.getSetCookie()[0],/HttpOnly; SameSite=Lax; Secure/)
  assert.equal((await fetch(address+'/%2e%2e%2fpackage.json')).status,403)
  assert.equal((await fetch(address+'/scripts/serve.mjs')).status,404)
})
