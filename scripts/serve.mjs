import {createServer,request as httpRequest} from 'node:http'
import {request as httpsRequest} from 'node:https'
import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {resolve,extname,sep} from 'node:path'

const publicRoot=fileURLToPath(new URL('../dist/',import.meta.url))
if(!(await stat(resolve(publicRoot,'index.html'))).isFile())throw new Error('Build the frontend before starting the server.')
const backend=new URL(process.env.API_PROXY_TARGET||'http://127.0.0.1:3001')
if(!['http:','https:'].includes(backend.protocol)||backend.username||backend.password||backend.pathname!=='/'||backend.search||backend.hash)
  throw new Error('API_PROXY_TARGET must be a backend HTTP(S) origin.')
const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1')
const port=Number(process.env.PORT||3000)
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'}
function headersWithoutHops(headers) {
  const clean={...headers}
  const excluded=['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade',...(headers.connection||'').split(',').map(name=>name.trim().toLowerCase())]
  for(const name of excluded)delete clean[name]
  return clean
}
function proxy(incoming,outgoing,url) {
  const target=new URL(url.pathname+url.search,backend)
  const headers=headersWithoutHops(incoming.headers)
  headers.host=backend.host
  const upstream=(backend.protocol==='https:'?httpsRequest:httpRequest)(target,{method:incoming.method,headers},response=>{
    // Native streaming preserves binary uploads, redirects and separate Set-Cookie headers.
    outgoing.writeHead(response.statusCode||502,headersWithoutHops(response.headers))
    response.on('error',()=>outgoing.destroy())
    response.pipe(outgoing)
  })
  upstream.setTimeout(120000,()=>upstream.destroy(new Error('Backend timeout')))
  upstream.on('error',()=>{
    if(outgoing.headersSent){outgoing.destroy();return}
    outgoing.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'})
    outgoing.end(JSON.stringify({error:{code:'BACKEND_UNAVAILABLE',message:'Backend servisine ulaşılamadı. Lütfen yeniden dene.'}}))
  })
  incoming.on('aborted',()=>upstream.destroy())
  outgoing.on('close',()=>{if(!outgoing.writableFinished)upstream.destroy()})
  incoming.pipe(upstream)
}
const server=createServer(async(incoming,outgoing)=>{
  outgoing.setHeader('X-Content-Type-Options','nosniff')
  try {
    const url=new URL(incoming.url||'/',`http://${incoming.headers.host||'localhost'}`)
    if(url.pathname==='/api'||url.pathname.startsWith('/api/')){proxy(incoming,outgoing,url);return}
    if(!['GET','HEAD'].includes(incoming.method)){outgoing.writeHead(405,{Allow:'GET, HEAD'});outgoing.end();return}
    if(url.pathname==='/healthz'){outgoing.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});outgoing.end(incoming.method==='HEAD'?undefined:'{"ready":true}');return}
    let pathname
    try{pathname=decodeURIComponent(url.pathname)}catch{outgoing.writeHead(400);outgoing.end();return}
    const target=resolve(publicRoot,'.'+(pathname==='/'?'/index.html':pathname))
    if(!target.startsWith(publicRoot.endsWith(sep)?publicRoot:publicRoot+sep)){outgoing.writeHead(403);outgoing.end();return}
    let info
    try{info=await stat(target)}catch{outgoing.writeHead(404);outgoing.end('Not found');return}
    if(!info.isFile()){outgoing.writeHead(404);outgoing.end();return}
    outgoing.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Content-Length':info.size,
      'Cache-Control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'})
    if(incoming.method==='HEAD'){outgoing.end();return}
    const stream=createReadStream(target)
    stream.on('error',()=>outgoing.destroy())
    outgoing.on('close',()=>stream.destroy())
    stream.pipe(outgoing)
  }catch{if(outgoing.headersSent)outgoing.destroy();else{outgoing.writeHead(500);outgoing.end('Request could not be completed.')}}
})
server.requestTimeout=120000
server.listen(port,host,()=>console.log(`KampüsKit Frontend: http://${host}:${server.address().port}`))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
  server.close(()=>process.exit(0))
  server.closeIdleConnections()
  setTimeout(()=>process.exit(0),10000).unref()
})
