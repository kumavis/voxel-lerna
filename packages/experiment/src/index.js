"use strict"

const THREE = require('three')
const makeView = require('voxel-view')
const ndarray = require('ndarray')
const makeChunkerController = require('./chunk-controller')
const makeChunkView = require('./chunk-view')

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

const raycaster = new THREE.Raycaster();

const chunkSize = 4
const chunkController = makeChunkerController({ chunkSize })
globalThis.chunkController = chunkController

const chunkView = makeChunkView({ chunkController })
globalThis.chunkView = chunkView
scene.add(chunkView.chunkContainer)

loadChunk([0, 0, 0])
loadChunk([1, 0, 0])
loadChunk([0, 1, 0])
loadChunk([0, 0, 1])
loadChunk([-1, 0, 0])
loadChunk([0, -1, 0])
loadChunk([0, 0, -1])



chunkController.setVoxelAtPosition([1, 0, 0], 0)
// console.log('getVoxelAtPosition', chunkController.getVoxelAtPosition([1, 0, 0]))
// console.log('chunk.get', chunkController.getChunkAtLocation([0, 0, 0]).get(1, 0, 0))

showMarker([0,0,0], 0x00ff00)
showMarker([1,0,0], 0x0000ff)

window.addEventListener('resize', onWindowResize, false)

window.addEventListener('click', raycastFromMouse, false)
// setInterval(raycastFromCamera, 100)


let paused = false

render()


function render () {
  window.requestAnimationFrame(render)
  
  if (!paused) {
    // voxelMeshWrapper.rotation.y += 0.02
    camera.position.y = Math.sin(Date.now() * 0.0003) * 15
    camera.position.x = Math.sin(Date.now() * 0.0003) * 15
    camera.position.z = Math.cos(Date.now() * 0.0003) * 15
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
  const chunk = makeRandomChunk([0, 0, 0], [chunkSize, chunkSize, chunkSize], 1)
  chunkController.setChunkAtLocation(chunkLocation, chunk)
  return chunk
}

function makeRandomChunk (low, high, probability = 0.5) {
  const chunk = generateChunkByVoxel(
    low,
    high,
    () => Math.random() > probability ? 0 : 1
  )
  // // Schema patch for voxel-mesh which expects (voxel@^0.3.0)
  // if (chunk.data && chunk.shape) {
  //   chunk.voxels = chunk.data
  //   chunk.dims = chunk.shape
  // }
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