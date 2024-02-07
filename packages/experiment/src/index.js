"use strict"

const THREE = require('three')
const makeView = require('voxel-view')
const ndarray = require('ndarray')
const makeChunkerController = require('./chunk-controller')
const makeChunkView = require('./chunk-view')
const makeTerrainGenerator = require('./terrain')

document.body.parentElement.style.height = '100%'
document.body.style.margin = 0
document.body.style.overflow = 'hidden'
document.body.style.height = '100%'

const container = document.createElement('div')
container.style.width = '100%'
container.style.height = '100%'
document.body.appendChild(container)

const scene = new THREE.Scene()
globalThis.scene = scene

const view = makeView(THREE)
view.bindToScene(scene)
view.appendTo(container)
onWindowResize()
const camera = view.camera
globalThis.camera = camera
camera.position.y = 15
camera.position.x = 0 * 15
camera.position.z = 1 * 15
camera.lookAt(scene.position)

const raycaster = new THREE.Raycaster();

const chunkSize = 32
const chunkController = makeChunkerController({ chunkSize })
globalThis.chunkController = chunkController

const chunkView = makeChunkView({ chunkController })
globalThis.chunkView = chunkView
scene.add(chunkView.chunkContainer)

const chunkGenerator = makeTerrainGenerator('foo', chunkSize, 0, 5)

for (let location of pointsInside3D([-1, 0, -1], [1, 0, 1])) {
  loadChunk(location)
}

window.addEventListener('resize', onWindowResize, false)
window.addEventListener('click', raycastFromMouse, false)

let paused = false

render()


function render () {
  window.requestAnimationFrame(render)
  
  if (!paused) {
    // voxelMeshWrapper.rotation.y += 0.02
    // camera.position.y = Math.sin(Date.now() * 0.0003) * 15
    // camera.position.x = Math.sin(Date.now() * 0.0003) * 15
    // camera.position.z = Math.cos(Date.now() * 0.0003) * 15
    camera.lookAt(scene.position)
  }
  
  view.render(scene)
}

function onWindowResize () {
  const width = container.clientWidth
  const height = container.clientHeight
  view.resizeWindow(width, height)
}

function loadChunk (chunkLocation) {
  const chunk = chunkController.getChunkAtLocation(chunkLocation)
  if (!chunk) {
    // console.log('generating chunk', chunkLocation)
    populateChunk(chunkLocation)
  }
}

function populateChunk (chunkLocation) {
  const chunk = chunkGenerator(chunkLocation)
  chunkController.setChunkAtLocation(chunkLocation, chunk)
  return chunk
}

function raycastFromCamera () {
  const cameraPos = view.cameraPosition()
  const cameraVec = view.cameraVector()
  const hitStats = chunkController.raycastVoxel(cameraPos, cameraVec, 200)
  if (hitStats === undefined) {
    return
  }
  // console.log('hit', hitStats)

  const hitPosition = hitStats.position
  chunkController.setVoxelAtPosition(hitPosition, 0)
  // create sphere at hitPosition
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(...hitPosition)
  scene.add(sphere)
  // paused = true
}

function raycastFromMouse (mouseEvent) {
  const mouse = new THREE.Vector2();
  mouse.x = (mouseEvent.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (mouseEvent.clientY / window.innerHeight) * 2 + 1;
  
  const cameraPos = view.cameraPosition()
  raycaster.setFromCamera(mouse, camera);
  const clickdirection = raycaster.ray.direction
  const clickVector = [clickdirection.x, clickdirection.y, clickdirection.z]
  // console.log('direction', vector, view.cameraVector())

  const hitStats = chunkController.raycastVoxel(cameraPos, clickVector, 200)
  if (hitStats === undefined) {
    return
  }
  // console.log('hit', hitStats)

  const hitPosition = hitStats.position
  chunkController.setVoxelAtPosition(hitPosition, 0)
  // create sphere at hitPosition
  showMarker(hitPosition)
}

// low inclusive, high exclusive
function generateChunkByVoxel(low, high, getVoxelValueForPos) {
  const [lowX, lowY, lowZ] = low
  const [highX, highY, highZ] = high
  const dims = [highX-lowX, highY-lowY, highZ-lowZ]
  const elementCount = dims[0] * dims[1] * dims[2]
  const data = ndarray(new Uint16Array(elementCount), dims)
  for (let z = lowZ; z < highZ; z++)
    for (let y = lowY; y < highY; y++)
      for(let x = lowX; x < highX; x++) {
        data.set(x-lowX, y-lowY, z-lowZ, getVoxelValueForPos(x, y, z))
      }
  return data
}

function showMarker (position, color = 0xff0000) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshBasicMaterial({ color })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(...position)
  scene.add(sphere)
}

// low and high inclusive
function* pointsInside3D(low, high) {
  const [lowX, lowY, lowZ] = low
  const highX = high[0] + 1
  const highY = high[1] + 1
  const highZ = high[2] + 1
  for (let z = lowZ; z < highZ; z++) {
    for (let y = lowY; y < highY; y++) {
      for (let x = lowX; x < highX; x++) {
        yield [x, y, z]
      }
    }
  }
}