"use strict"

const THREE = require('three')
const makeView = require('voxel-view')
const voxelUtil = require('voxel')
const Mesh = require('voxel-mesh')
const raycast = require('voxel-raycast')

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
view.camera.position.z = 5

const chunkSize = 4
const chunker = new voxelUtil.Chunker({
  chunkSize,
  // cubeSize is weird
  cubeSize: 1,
  generateVoxelChunk: (low, high) => makeRandomChunk(low, high, 0.5)
})
globalThis.chunker = chunker

const chunkMeshes = {}

showChunk(0, 0, 0)
showChunk(1, 0, 0)
showChunk(0, 1, 0)
showChunk(0, 0, 1)

window.addEventListener('resize', onWindowResize, false)

let paused = false

render()

setInterval(raycastFromCamera, 100)

function render () {
  window.requestAnimationFrame(render)
  
  if (!paused) {
    // voxelMeshWrapper.rotation.y += 0.02
    view.camera.position.y = Math.sin(Date.now() * 0.0003) * 15
    view.camera.position.x = Math.sin(Date.now() * 0.001) * 15
    view.camera.position.z = Math.cos(Date.now() * 0.001) * 15
    view.camera.lookAt(scene.position)
  }
  
  view.render(scene)
}

function onWindowResize () {
  const width = container.clientWidth
  const height = container.clientHeight
  view.resizeWindow(width, height)
}

function showChunk (x, y, z) {
  const chunkId = `${x}|${y}|${z}`
  let chunk = chunker.chunks[chunkId]
  if (!chunk) {
    console.log('generating chunk', x, y, z)
    chunk = chunker.generateChunk(x, y, z)
  }
  if (chunkMeshes[chunkId]) {
    console.log('removing chunk', chunkId)
    scene.remove(chunkMeshes[chunkId])
  }
  const chunkMesh = makeVoxelMesh(chunk)
  chunkMeshes[chunkId] = chunkMesh
  const bounds = chunker.getBounds(...chunk.position)
  chunkMesh.position.set(bounds[0][0], bounds[0][1], bounds[0][2])
  scene.add(chunkMesh)
}

function makeRandomChunk (low, high, probability = 0.5) {
  const chunk = voxelUtil.generate(
    low,
    high,
    () => Math.random() > probability ? 0 : 1
  )
  // Schema patch for voxel-mesh which expects (voxel@^0.3.0)
  if (chunk.data && chunk.shape) {
    chunk.voxels = chunk.data
    chunk.dims = chunk.shape
  }
  return chunk
}

function makeVoxelMesh (chunk) {
  var scale = new THREE.Vector3(1, 1, 1)
  var mesh = new Mesh(chunk, voxelUtil.meshers.culled, scale, THREE)
  const newChunkMesh = mesh.createSurfaceMesh()
  // const bounds = chunker.getBounds(...chunk.position)
  // newChunkMesh.position.set(bounds[0][0], bounds[0][1], bounds[0][2])
  return newChunkMesh
}

function raycastFromCamera () {
  const epilson = 1e-8
  const hitNormal = [0, 0, 0]
  const hitPosition = [0, 0, 0]
  const cp = view.cameraPosition()
  const cv = view.cameraVector()
  const getBlock = (x, y, z) => {
    // console.log('getBlock', x, y, z)
    return chunker.voxelAtPosition([x,y,z])
  }
  // console.log('raycast', cp, cv)
  const distance = 200.0
  const hitBlock = raycast({ getBlock }, cp, cv, distance, hitPosition, hitNormal, epilson)
  console.log('hitBlock', hitBlock)
  if (hitBlock) {
    console.log('hitPosition', hitPosition)
    console.log('hitNormal', hitNormal)
    
    var positionA = new THREE.Vector3();
    view.camera.getWorldPosition(positionA)
    const distance = positionA.distanceTo(new THREE.Vector3(...hitPosition))
    console.log('distance', distance)
    
    // this sets the value
    chunker.voxelAtPosition(hitPosition, 0)
    const chunkPos = chunker.chunkAtPosition(hitPosition)
    const chunk = chunker.chunks[chunkPos.join('|')]
    console.log('chunk', chunk)
    showChunk(...chunkPos)
    // create sphere at hitPosition
    const geometry = new THREE.SphereGeometry(0.1, 32, 32)
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(...hitPosition)
    scene.add(sphere)
    // paused = true
  }
}
