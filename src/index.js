import { createScene, createStats } from './lib/create.js'

console.log('Try runing toggleControls()')

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


const noiseTexture = (time) => {
  const noise = new Noise(Math.random())

  const noiseSize = 256
  const size = noiseSize * noiseSize
  const data = new Uint8Array( 4 * size )

  let j = 0
  for (let x = 0; x < noiseSize; x++) {
    for (let y = 0; y < noiseSize; y++) {
      for (let i = 0; i < 4; i++) {
        // data[j] = Math.abs(noise.simplex2(x / 100, y / 100)) * 255 | 0
        // data[j] = Math.abs(noise.perlin3(x / 50, y / 50, time)) * 255 | 0
        // data[j] = noise.simplex2(x / 100, y / 100) * 255 | 0
        data[j] = Math.random() * 255 | 0
        j++
      }
    }
  }

  const dt = new THREE.DataTexture(data, noiseSize, noiseSize, THREE.RGBAFormat)
  dt.wrapS = THREE.RepeatWrapping
  dt.wrapT = THREE.RepeatWrapping
  dt.needsUpdate = true

  dt.minFilter = THREE.LinearMipMapLinearFilter
  dt.magFilter = THREE.LinearMipMapLinearFilter

  return dt
}

const params = function() {
  this.frequency = 0.22
  this.octaves = 10
  this.amplitude = 0.5
  this.lacunarity = 2.0
  this.gain = 0.5
  this.timeFactor = 0.01
}

const p = new params()

let showing = false
const guiContainer = document.createElement('div')
guiContainer.style.position = 'fixed'
guiContainer.style.top = '0'
// guiContainer.style.right = '10px'
document.body.appendChild(guiContainer)

window.toggleControls = function() {
  if (showing) {
    guiContainer.style.right = '10px'
    showing = false
  } else {
    guiContainer.style.right = '9001px'
    showing = true
  }
}
window.toggleControls()


const gui = new dat.GUI({ autoPlace: false })
guiContainer.appendChild(gui.domElement)
gui.add(p, 'frequency', -10, 10)
gui.add(p, 'octaves', 1, 100)
gui.add(p, 'amplitude', -10, 10)
gui.add(p, 'lacunarity', -10, 10)
gui.add(p, 'gain', -10, 10)
gui.add(p, 'timeFactor', 0, 0.5)

const cloudsMaterial = new THREE.ShaderMaterial({
  uniforms: Object.assign({}, THREE.ShaderLib.lambert.uniforms, {
    time: { type: 'f', value: 0.0, step: 0.03 },
    diffuse: { value: new THREE.Color(0x673D4D) },
    noise: { type: 't', value: noiseTexture() },
    frequency: { type: 'f', value: p.frequency },
    octaves: { type: 'i', value: p.octaves },
    amplitude: { type: 'f', value: p.amplitude },
    lacunarity: { type: 'f', value: p.lacunarity },
    gain: { type: 'f', value: p.gain },
    timeFactor: { type: 'f', value: p.timeFactor }
  }),
  vertexShader: glslify('./shaders/cmo-vert.glsl'),
  fragmentShader: glslify('./shaders/moon-frag.glsl'),
  lights: true,
  transparent: true,
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
  clouds.rotation.y += delta * 0.025 * Math.PI
  cloudsMaterial.uniforms.time.value += cloudsMaterial.uniforms.time.step
  cloudsMaterial.uniforms.frequency.value = p.frequency
  cloudsMaterial.uniforms.octaves.value = p.octaves
  cloudsMaterial.uniforms.lacunarity.value = p.lacunarity
  cloudsMaterial.uniforms.amplitude.value = p.amplitude
  cloudsMaterial.uniforms.gain.value = p.gain
  cloudsMaterial.uniforms.timeFactor.value = p.timeFactor
}

// === LABEL ===

const label = document.createElement('div')
label.id = 'label'
label.innerHTML = '<b>CASPIAN</b> WAKING SEASON'
label.style.position = 'absolute'
// label.style.bottom = '100px'
document.body.appendChild(label)

function toScreenPosition(obj, camera) {
    camera.updateMatrixWorld()
    var vector = new THREE.Vector3()

    var widthHalf = 0.5 * renderer.context.canvas.width
    var heightHalf = 0.5 * renderer.context.canvas.height

    obj.updateMatrixWorld()
    vector.setFromMatrixPosition(obj.matrixWorld)
    // console.log(camera)
    vector.project(camera)

    // console.log(vector)

    vector.x = ( vector.x * widthHalf ) + widthHalf
    vector.y = - ( vector.y * heightHalf ) + heightHalf

    return {
        x: vector.x,
        y: vector.y
    }
}

const divObj = new THREE.Object3D()
divObj.position.set(0, -6, 0)

const updateDivPosition = () => {
  const label = document.getElementById('label')
  const coords = toScreenPosition(divObj, camera)

  label.style.left = coords.x - Math.floor(label.offsetWidth / 2) + 'px'
  label.style.top = coords.y + 'px'
}
updateDivPosition()

// console.log(coords)

// === RENDER ===

const clock = new THREE.Clock()
// const stats = createStats()
const render = (ts) => {
  // stats.begin()

  renderer.render(scene, camera)
  update(ts, clock.getDelta())
  updateDivPosition()
  // need GPU for this...
  // cloudsMaterial.alphaMap = noiseTexture(ts)

  // stats.end()

  requestAnimationFrame(render)
}

render()
