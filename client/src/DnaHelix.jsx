import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

// Interactive double helix: green glowing backbones, base pairs drawn as shuffling code glyphs
// (red to yellow), depth-of-field bokeh, bloom. Drag = twist (with inertia), hover = glyphs scatter,
// click/tap = a signal pulse travels along the strand.
const GLYPHS = 'ATGC0235789SFLZ1' // 4x4 atlas
const LENGTH = 34, RADIUS = 2.7, TWIST = 0.55 // world units, radians per unit along the axis

function glyphAtlas() {
  const c = Object.assign(document.createElement('canvas'), { width: 512, height: 512 })
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.font = 'bold 92px "JetBrains Mono", ui-monospace, monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  ;[...GLYPHS].forEach((ch, i) => g.fillText(ch, (i % 4) * 128 + 64, Math.floor(i / 4) * 128 + 68))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const strandPoint = (x, phase) => new THREE.Vector3(x, RADIUS * Math.cos(x * TWIST + phase), RADIUS * Math.sin(x * TWIST + phase))

const glyphVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aEdge;
  uniform float uTime, uPixelRatio, uFocus, uPulseX, uPulseT, uMotion;
  uniform vec2 uMouse;
  varying float vBlur, vGlyph, vHeat, vEdge;
  void main() {
    vec3 p = position;
    float age = uTime - uPulseT;
    float front = uPulseX + age * 14.0;
    float pulse = exp(-pow(p.x - front, 2.0) * 0.6) * exp(-age * 0.35) + exp(-pow(p.x - (uPulseX - age * 14.0), 2.0) * 0.6) * exp(-age * 0.35);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    float hover = smoothstep(0.22, 0.0, distance(ndc, uMouse));
    mv.xy += normalize(ndc - uMouse + 0.0001) * hover * 0.9;
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    vBlur = clamp(abs(depth - uFocus) / 5.0, 0.0, 1.0);
    vHeat = clamp(pulse + hover * 0.8, 0.0, 1.5);
    vEdge = aEdge;
    vGlyph = floor(mod(aSeed * 97.0 + floor(uTime * uMotion * (1.0 + aSeed * 4.0)), 16.0));
    gl_PointSize = (0.5 + vBlur * 0.7 + vHeat * 0.22) * uPixelRatio * 420.0 / depth;
  }`

const glyphFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uLight;
  varying float vBlur, vGlyph, vHeat, vEdge;
  void main() {
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    vec2 uv = vec2(cell.x + gl_PointCoord.x, 4.0 - cell.y - gl_PointCoord.y) / 4.0; // atlas is flipY'd
    float glyph = texture2D(uAtlas, uv).a;
    float disc = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * 0.3;
    float shape = mix(glyph, disc, smoothstep(0.25, 0.85, vBlur));
    vec3 red = vec3(1.0, 0.16, 0.06), orange = vec3(1.0, 0.45, 0.08), yellow = vec3(1.0, 0.85, 0.25);
    vec3 col = mix(red, orange, vEdge * 0.7);
    col = mix(col, yellow, smoothstep(0.75, 1.0, vEdge) + vHeat * 0.6);
    float alpha = shape * mix(1.0, 0.35, vBlur) * (0.75 + vHeat * 0.6);
    if (alpha < 0.01) discard;
    if (uLight > 0.5) { col = mix(vec3(0.75, 0.08, 0.06), vec3(0.8, 0.3, 0.02), vEdge * 0.8); alpha = min(alpha * 2.6, 1.0); }
    gl_FragColor = vec4(col * mix(1.25, 1.0, uLight), alpha); // >1 so bloom picks the glyphs up
  }`

export default function DnaHelix({ paused = false, light = false }) {
  const mount = useRef(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const el = mount.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.innerWidth < 700
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch {
      el.classList.add('dna-fallback') // no WebGL: CSS gradient stands in
      return
    }
    const pixelRatio = Math.min(window.devicePixelRatio, small ? 1.5 : 2)
    renderer.setPixelRatio(pixelRatio)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 15)

    // Outer group sets the diagonal pose; inner group spins around the helix axis.
    const pose = new THREE.Group()
    pose.rotation.set(0.35, -0.25, -0.62)
    const helix = new THREE.Group()
    pose.add(helix)
    scene.add(pose)

    // Backbones
    const strandMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(light ? '#15803d' : '#1ee874') })
    const beadMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(light ? '#16a34a' : '#5dffa0') })
    const beadGeo = new THREE.SphereGeometry(0.1, 12, 12)
    const beadStep = 0.42, beadsPer = Math.floor(LENGTH / beadStep)
    const beads = new THREE.InstancedMesh(beadGeo, beadMat, beadsPer * 2)
    const m = new THREE.Matrix4()
    const tubes = [0, Math.PI].map((phase, s) => {
      const pts = []
      for (let x = -LENGTH / 2; x <= LENGTH / 2; x += 0.25) pts.push(strandPoint(x, phase))
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.055, 8)
      for (let i = 0; i < beadsPer; i++) beads.setMatrixAt(s * beadsPer + i, m.makeTranslation(strandPoint(-LENGTH / 2 + i * beadStep, phase)))
      const mesh = new THREE.Mesh(geo, strandMat)
      helix.add(mesh)
      return geo
    })
    helix.add(beads)

    // Base pairs as glyph points
    const pairStep = small ? 0.22 : 0.15, perRung = small ? 12 : 17
    const pos = [], seed = [], edge = []
    for (let x = -LENGTH / 2; x <= LENGTH / 2; x += pairStep) {
      const a = strandPoint(x, 0), b = strandPoint(x, Math.PI)
      for (let j = 1; j < perRung; j++) {
        const t = j / perRung
        const p = a.clone().lerp(b, t)
        pos.push(p.x, p.y, p.z)
        seed.push(Math.random())
        edge.push(Math.pow(Math.abs(t - 0.5) * 2, 1.5) * 0.7 + Math.random() * 0.3)
      }
    }
    const glyphGeo = new THREE.BufferGeometry()
    glyphGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    glyphGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    glyphGeo.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1))
    const atlas = glyphAtlas()
    const uniforms = {
      uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uFocus: { value: 15 },
      uPulseX: { value: 0 }, uPulseT: { value: -100 }, uMouse: { value: new THREE.Vector2(9, 9) },
      uAtlas: { value: atlas }, uMotion: { value: reduced ? 0 : 1.6 }, uLight: { value: light ? 1 : 0 },
    }
    const glyphMat = new THREE.ShaderMaterial({
      uniforms, vertexShader: glyphVertex, fragmentShader: glyphFragment,
      transparent: true, depthWrite: false, blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    })
    helix.add(new THREE.Points(glyphGeo, glyphMat))

    // Drifting dust
    const dustCount = small ? 250 : 600
    const dustPos = new Float32Array(dustCount * 3).map((_, i) => (Math.random() - 0.5) * (i % 3 === 2 ? 20 : 40))
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({ color: light ? '#8a6d1f' : '#d9c25a', size: 0.06, transparent: true, opacity: 0.55, blending: light ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false })
    const dust = new THREE.Points(dustGeo, dustMat)
    scene.add(dust)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.4, 0.22)
    bloom.enabled = !light // glow only reads on a dark background
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    function resize() {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false)
      composer.setSize(w, h)
      camera.aspect = w / h
      // Portrait: lie the helix flatter across the top band, above the copy
      portrait = w / h < 1
      camera.position.z = portrait ? 21 : 15
      pose.rotation.z = portrait ? -0.35 : -0.62
      uniforms.uFocus.value = camera.position.z
      camera.updateProjectionMatrix()
    }
    let portrait = false
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Interaction
    let spin = 0, spinVel = reduced ? 0 : 0.0035, tilt = 0, dragging = false, lastX = 0, lastY = 0, moved = 0
    const mouse = new THREE.Vector2(9, 9), parallax = new THREE.Vector2()
    const ndc = e => {
      const r = el.getBoundingClientRect()
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    function pulseAt(p) {
      raycaster.setFromCamera(p, camera)
      const hit = raycaster.ray.intersectPlane(plane, new THREE.Vector3())
      if (!hit) return
      uniforms.uPulseX.value = helix.worldToLocal(hit).x
      uniforms.uPulseT.value = uniforms.uTime.value
    }
    const down = e => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY }
    const move = e => {
      const p = ndc(e)
      mouse.copy(p)
      parallax.set(p.x, p.y)
      if (!dragging) return
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      moved += Math.abs(dx) + Math.abs(dy)
      spinVel = dx * 0.004
      tilt = THREE.MathUtils.clamp(tilt + dy * 0.003, -0.6, 0.6)
      lastX = e.clientX; lastY = e.clientY
    }
    const up = e => {
      if (dragging && moved < 6) pulseAt(ndc(e))
      dragging = false
    }
    const leave = () => { mouse.set(9, 9); dragging = false }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)

    // Skip frames while hidden or scrolled away
    let visible = true
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    io.observe(el)

    const clock = new THREE.Clock()
    let raf
    function frame() {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!visible || document.hidden || pausedRef.current) return
      uniforms.uTime.value += dt
      const baseline = reduced ? 0 : 0.0035
      if (!dragging) spinVel += (baseline - spinVel) * 0.02 // inertia eases back to the idle spin
      spin += spinVel
      helix.rotation.x = spin
      const scroll = Math.min(window.scrollY / window.innerHeight, 1)
      pose.rotation.x = 0.35 + tilt + scroll * 0.6
      pose.position.y = (portrait ? 3.6 : 0) + scroll * 3
      uniforms.uMouse.value.lerp(mouse, 0.15)
      camera.position.x += (parallax.x * 0.8 - camera.position.x) * 0.04
      camera.position.y += (parallax.y * 0.5 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)
      if (!reduced) dust.rotation.y += dt * 0.01
      composer.render()
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
      ;[...tubes, beadGeo, glyphGeo, dustGeo].forEach(g => g.dispose())
      ;[strandMat, beadMat, glyphMat, dustMat].forEach(x => x.dispose())
      atlas.dispose(); composer.dispose(); renderer.dispose()
      renderer.domElement.remove()
    }
  }, [light])

  return <div ref={mount} className="dna" role="img"
    aria-label="Animated 3D DNA double helix. Drag to twist it, click to send a signal along the strand." />
}
