import {useEffect, useRef, useState} from 'react'
import {Pause, Play} from 'lucide-react'
import {BrandMark} from './Brand'
import type {Group, Object3D, Material, Mesh, Texture, MeshBasicMaterial, MeshStandardMaterial} from 'three'

export function Logo3D() {
  const host = useRef<HTMLDivElement>(null), motion = useRef(true)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [moving, setMoving] = useState(true), [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const redraw = useRef<(() => void) | null>(null)
  useEffect(() => {motion.current = moving && !reduced; redraw.current?.()}, [moving, reduced])
  useEffect(() => {
    const container = host.current
    if (!container) return
    let disposed = false, cleanup = () => {}
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', changed)
    void Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js')]).then(([THREE, {GLTFLoader}]) => {
      if (disposed) return
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'})} catch {setStatus('fallback'); return}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15
      renderer.domElement.setAttribute('aria-hidden', 'true')
      container.append(renderer.domElement)
      const scene = new THREE.Scene(), pivot = new THREE.Group()
      const darkUniform = {value: document.documentElement.dataset.theme === 'dark' ? 1 : 0}
      const inks: {material: MeshStandardMaterial; color: InstanceType<typeof THREE.Color>}[] = []
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
      scene.add(pivot, new THREE.HemisphereLight(0xffffff, 0x8a96c7, 2.6))
      const key = new THREE.DirectionalLight(0xffffff, 3.3); key.position.set(3, 5, 5); scene.add(key)
      const rim = new THREE.DirectionalLight(0x99bbff, 2); rim.position.set(-4, 1, -2); scene.add(rim)
      let model: Group | null = null, frame = 0, visible = true
      const pages: Object3D[] = []
      let cover: Object3D | undefined
      let pointerX = 0, pointerY = 0, previousTime = 0, elapsed = 0
      function poseBook(opening: number) {
        // The GLB has real spine hinges: keep the pages ordered between the covers.
        pages.forEach((page, index) => {page.rotation.z = opening * Math.PI * (0.44 + index * 0.084)})
        if (cover) {cover.rotation.z = opening * Math.PI; cover.position.y = 0.18 - opening * 0.055}
      }
      function release(object: Group) {
        const materials = new Set<Material>(), textures = new Set<Texture>()
        object.traverse(child => {if ((child as Mesh).isMesh) {const mesh = child as Mesh; mesh.geometry.dispose(); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material)}})
        for (const material of materials) {for (const value of Object.values(material)) if (value && typeof value === 'object' && value.isTexture) textures.add(value); material.dispose()}
        for (const texture of textures) {texture.dispose(); if (texture.image instanceof ImageBitmap) texture.image.close()}
      }
      function render(time = performance.now()) {
        frame = 0
        if (disposed || !visible || document.hidden) {previousTime = 0; return}
        if (motion.current && model) {
          elapsed += previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0
          pivot.rotation.y = elapsed * Math.PI * 2 / 18 + pointerX * 0.12
          pivot.rotation.x = Math.sin(elapsed * 0.4) * 0.025 + pointerY * 0.06
          pivot.position.y = Math.sin(elapsed * 1.05) * 0.06
          const opening = (1 + Math.cos(elapsed * Math.PI * 2 / 9)) / 2
          poseBook(opening * opening * (3 - 2 * opening))
        } else if (query.matches) {pivot.rotation.set(0, 0, 0); pivot.position.y = 0; poseBook(1)}
        previousTime = time; renderer.render(scene, camera)
        if (motion.current && model) frame = requestAnimationFrame(render)
      }
      function refresh() {if (frame) cancelAnimationFrame(frame); frame = 0; previousTime = 0; render()}
      redraw.current = refresh
      const resize = new ResizeObserver(() => {
        const {width, height} = container.getBoundingClientRect()
        if (!width || !height) return
        camera.aspect = width / height; camera.position.set(0.25, 1.3, (camera.aspect < 1 ? 5.6 : 5.2) / Math.min(camera.aspect, 1)); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix()
        renderer.setSize(width, height, false); refresh()
      }); resize.observe(container)
      const intersection = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; refresh()}); intersection.observe(container)
      const move = (event: PointerEvent) => {const bounds = container.getBoundingClientRect(); pointerX = (event.clientX - bounds.left) / bounds.width - 0.5; pointerY = (event.clientY - bounds.top) / bounds.height - 0.5}
      const leave = () => {pointerX = 0; pointerY = 0}
      container.addEventListener('pointermove', move); container.addEventListener('pointerleave', leave)
      document.addEventListener('visibilitychange', refresh)
      const contextLost = (event: Event) => {event.preventDefault(); if (frame) cancelAnimationFrame(frame); setStatus('fallback')}
      renderer.domElement.addEventListener('webglcontextlost', contextLost)
      const updateTheme = () => {
        darkUniform.value = document.documentElement.dataset.theme === 'dark' ? 1 : 0
        for (const ink of inks) {if (darkUniform.value) ink.material.color.set(ink.material.name === 'ink' ? '#526ce6' : '#34499f'); else ink.material.color.copy(ink.color)}
        refresh()
      }
      const themeObserver = new MutationObserver(updateTheme); themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})
      cleanup = () => {
        redraw.current = null; if (frame) cancelAnimationFrame(frame)
        resize.disconnect(); intersection.disconnect(); themeObserver.disconnect()
        container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave)
        document.removeEventListener('visibilitychange', refresh)
        renderer.domElement.removeEventListener('webglcontextlost', contextLost)
        if (model) release(model)
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
      }
      new GLTFLoader().load('/kampuskit-logo.glb', gltf => {
        if (disposed) {release(gltf.scene); return}
        model = gltf.scene
        for (let index = 0; index < 6; index++) {const page = model.getObjectByName(`leaf_${index}_hinge`); if (page) pages.push(page)}
        cover = model.getObjectByName('cover_front_hinge')
        poseBook(1)
        const themed = new Set<Material>()
        model.traverse(child => {
          if (!(child as Mesh).isMesh) return
          const material = (child as Mesh).material
          for (const item of Array.isArray(material) ? material : [material]) {
            if (themed.has(item)) continue
            themed.add(item)
            if (item.name === 'tagline') {
              // Preserve texture alpha; brighten just the lettering in dark mode.
              const text = item as MeshBasicMaterial
              text.onBeforeCompile = shader => {
                shader.uniforms.logoDark = darkUniform
                shader.fragmentShader = 'uniform float logoDark;\n' + shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.91, 1.0), logoDark);')
              }
            } else if (item.name === 'ink' || item.name === 'ink_dark') {const ink = item as MeshStandardMaterial; inks.push({material: ink, color: ink.color.clone()})}
          }
        })
        const bounds = new THREE.Box3().setFromObject(model), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3())
        const scale = 3.2 / Math.max(size.x, size.y, size.z)
        model.scale.multiplyScalar(scale); model.position.sub(center.multiplyScalar(scale))
        pivot.add(model); setStatus('ready'); updateTheme()
      }, undefined, () => {if (!disposed) {setStatus('fallback'); cleanup()}})
    }).catch(() => {if (!disposed) {setStatus('fallback'); cleanup()}})
    return () => {disposed = true; query.removeEventListener('change', changed); cleanup()}
  }, [])
  return <figure className="logo-showcase">
    <span className="logo-orbit orbit-one" aria-hidden="true"/><span className="logo-orbit orbit-two" aria-hidden="true"/>
    <div ref={host} className="logo-canvas" role="img" aria-label="KampüsKit'in sayfaları açılıp kapanan, 360 derece dönen üç boyutlu kitap logosu" data-model-status={status}>
      {status !== 'ready' && <div className="logo-fallback" aria-hidden="true"><BrandMark/><span>{status === 'loading' ? 'KampüsKit' : 'Bir kampüs. Bin ihtimal.'}</span></div>}
    </div>
    <figcaption><span className="logo-caption-dot"/>Öğrenci hayatının bütün parçaları.</figcaption>
    {status === 'ready' && !reduced && <button className="logo-motion" onClick={() => setMoving(value => !value)} aria-label={moving ? 'Logo animasyonunu duraklat' : 'Logo animasyonunu başlat'}>{moving ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}</button>}
  </figure>
}
