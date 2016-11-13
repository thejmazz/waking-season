import { createScene, createStats } from './lib/create.js'

const glslify = require('glslify')
const { Noise } = require('noisejs')

const loader = new THREE.OBJLoader()
const jsonLoader = new THREE.JSONLoader()
const textureLoader = new THREE.TextureLoader()

const { scene, camera, renderer } = createScene({
  clearColor: 0xDBB98C
})
// renderer.shadowMap.enabled = true
// renderer.shadowMap.type = THREE.PCFSoftShadowMap
window.scene = scene

camera.position.set(0,4,4)

const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.minDistance = 1.7
controls.maxDistance = 5

// === LIGHT ===

const ambient = new THREE.AmbientLight(0xA77C72, 0.3)
scene.add(ambient)

const light = new THREE.PointLight(0xffffff, 1, 1000)
light.position.set(5, 10, 5)
scene.add(light)

// const spotLight = new THREE.SpotLight(0xffffff)
// spotLight.position.set(10, 10, 10)

// spotLight.castShadow = true

// spotLight.shadow.mapSize.width = 1024
// spotLight.shadow.mapSize.height = 1024

// spotLight.shadow.camera.near = 1
// spotLight.shadow.camera.far = 10
// // spotLight.shadow.camera.fov = 30

// scene.add(spotLight)
// // scene.add(new THREE.SpotLightHelper(spotLight))

// === DIMENSIONS ===

const moonSize = 1
const cloudsSize = moonSize * 2

// === MOON ===

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(moonSize, 32, 32),
  new THREE.MeshPhongMaterial({
    color: 0xB28D7F,
    shininess: 0,
    map: textureLoader.load('textures/moon-diffuse.jpg'),
    normalMap: textureLoader.load('textures/moon-normal.jpg')
  })
)

// === CLOUDS ===

// const cloudsMaterial = new THREE.ShaderMaterial({
//   uniforms: Object.assign({}, THREE.ShaderLib.lambert.uniforms, {
//     // diffuse: [25, 25, 50],
//     time: { type: 'f', value: 0.0, step: 0.03 },
//     diffuse: { value: new THREE.Color(0x673D4D) },
//     opacity: { value: 0.8 }
//   }),
//   vertexShader: glslify('./shaders/cmo-vert.glsl'),
//   fragmentShader: glslify('./shaders/moon-frag.glsl'),
//   lights: true,
//   // opacity: 0.5,
//   transparent: true,
// })

const noiseTexture = (time) => {
  const noise = new Noise(Math.random())

  const noiseSize = 1024
  const size = noiseSize * noiseSize
  const data = new Uint8Array( 4 * size )

  let j = 0
  for (let x = 0; x < noiseSize; x++) {
    for (let y = 0; y < noiseSize; y++) {
      for (let i = 0; i < 4; i++) {
        // data[j] = Math.abs(noise.simplex2(x / 100, y / 100)) * 255 | 0
        data[j] = Math.abs(noise.perlin3(x / 50, y / 50, time)) * 255 | 0
        // data[j] = noise.simplex2(x / 100, y / 100) * 255 | 0
        j++
      }
    }
  }

  const dt = new THREE.DataTexture(data, noiseSize, noiseSize, THREE.RGBAFormat)
  dt.wrapS = THREE.RepeatWrapping
  dt.wrapT = THREE.RepeatWrapping
  dt.needsUpdate = true

  return dt
}

const cloudsMaterial = new THREE.MeshBasicMaterial({
  color: 0x673D4D,
  // alphaMap: textureLoader.load('textures/moon-diffuse.jpg'),
  alphaMap: noiseTexture(0),
  transparent: true,
  side: THREE.FrontSide
})

const blackMaterial = new THREE.MeshLambertMaterial({
  color: 0x000000,
  side: THREE.BackSide
})

const clouds = new THREE.SceneUtils.createMultiMaterialObject(
  new THREE.SphereGeometry(cloudsSize, 64, 64),
  [ cloudsMaterial, blackMaterial ]
)

// === SCENE GRAPH ===

scene.add(moon)
scene.add(clouds)

// === LOOP ===

const update = (ts, delta) => {
  moon.rotation.y += delta * 0.05 * Math.PI
}

// === RENDER ===

const clock = new THREE.Clock()
const stats = createStats()
const render = (ts) => {
  stats.begin()

  renderer.render(scene, camera)
  update(ts, clock.getDelta())
  // need GPU for this...
  // cloudsMaterial.alphaMap = noiseTexture(ts)

  stats.end()

  requestAnimationFrame(render)
}

render()
