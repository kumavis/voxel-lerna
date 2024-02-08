"use strict"

const THREE = require('three')
const makeView = require('voxel-view')
const skin = require('minecraft-skin')
const kb = require('kb-controls')
const makeControls = require('voxel-control')
const makePhysical = require('voxel-physical')
const collisions = require('collide-3d-tilemap')
const walk = require('voxel-walk');
const interact = require('interact')
const makeChunkerController = require('./chunk-controller')
const makeChunkView = require('./chunk-view')
const makeTerrainGenerator = require('./terrain')
const { pointsInside3D, findFloor } = require('./voxel-util')

document.body.parentElement.style.height = '100%'
document.body.style.margin = 0
document.body.style.overflow = 'hidden'
document.body.style.height = '100%'

const container = document.createElement('div')
container.style.width = '100%'
container.style.height = '100%'
document.body.appendChild(container)

globalThis.THREE = THREE

const scene = new THREE.Scene()
globalThis.scene = scene

const view = makeView(THREE)
globalThis.view = view
view.bindToScene(scene)
view.appendTo(container)
onWindowResize()
const camera = view.camera
globalThis.camera = camera
camera.position.y = 15
camera.position.x = 0 * 15
camera.position.z = 1 * 15
camera.lookAt(scene.position)

// const ambientLight = new THREE.AmbientLight(0xffffff)
// scene.add(ambientLight)
// const directionalLight  = new THREE.DirectionalLight( 0xffffff )
// scene.add(directionalLight)

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

chunkController.setVoxelAtPosition([0, 3, 0], 1)

const avatar = skin(null, 'assets/debug-skin.png', {
  // ignore lighting
  materialClass: THREE.MeshBasicMaterial,
})
globalThis.avatar = avatar
scene.add(avatar.mesh)
const avatarStartPos = findFloor(
  [0,0,0],
  (pos) => chunkController.getVoxelAtPosition(pos),
  2
)
console.log('avatarStartPos', avatarStartPos)
avatar.mesh.position.set(...avatarStartPos)
// avatar.mesh.visible = false
/*
[voxel-player]
var player = playerSkin.mesh;
var physics = game.makePhysical(player);
  var obj = physical(target, ...)
    this.yaw =
    this.pitch =
    this.roll = avatar
game.scene.add(player);
game.addItem(physics);
  // calls tick() on physics
  // no mesh on physics
physics.yaw = player;
physics.pitch = player.head;
physics.subjectTo(game.gravity);
physics.blocksCreation = true;
game.control(physics); 
  this.controls.target(target) [voxel-control]
      this._target = target
      this._yaw_target = target.yaw || target
      this._pitch_target = target.pitch || target
      this._roll_target = target.roll || target
physics.move = function (x, y, z) {
physics.moveTo = function (x, y, z) {
*/

const buttons = kb(document.body, {
  'W': 'forward'
, 'A': 'left'
, 'S': 'backward'
, 'D': 'right'
, '<up>': 'forward'
, '<left>': 'left'
, '<down>': 'backward'
, '<right>': 'right'
, '<mouse 1>': 'fire'
, '<mouse 3>': 'firealt'
, '<space>': 'jump'
, '<shift>': 'crouch'
, '<control>': 'alt'
})
const controls = makeControls(buttons, {})

const getBlock = function (x, y, z) {
  return chunkController.getVoxelAtPosition([x,y,z])
}
// from game
const collideVoxels = collisions(
  getBlock,
  1,
  [Infinity, Infinity, Infinity],
  [-Infinity, -Infinity, -Infinity]
)
const collideTerrain = function(other, bbox, vec, resting) {
  const friction = 0.3
  var axes = ['x', 'y', 'z']
  var vec3 = [vec.x, vec.y, vec.z]
  collideVoxels(bbox, vec3, function hit(axis, tile, coords, dir, edge) {
    if (!tile) return
    if (Math.abs(vec3[axis]) < Math.abs(edge)) return
    vec3[axis] = vec[axes[axis]] = edge
    other.acceleration[axes[axis]] = 0
    resting[axes[axis]] = dir
    other.friction[axes[(axis + 1) % 3]] = other.friction[axes[(axis + 2) % 3]] = axis === 1 ? friction  : 1
    return true
  })
}

//
// make physical
//
let avatarPhysics
{
  const player = avatar.mesh
  // const potentialCollisionSet = []
  const potentialCollisionSet = [
    { collide: collideTerrain }
  ]
  // terminalVelocity
  const vel = [0.9, 0.1, 0.9]
  const envelope = [2/3, 1.5, 2/3]
  const physics = makePhysical(
    player,
    potentialCollisionSet,
    envelope,
    { x: vel[0], y: vel[1], z: vel[2] },
  )
  physics.yaw = player;
  physics.pitch = avatar.headGroup;
  physics.subjectTo([0, -0.0000036, 0]);
  physics.blocksCreation = true;

  // from control, used by voxel-rescue
  physics.move = function (x, y, z) {
    debugger
    const xyz = parseXYZ(x, y, z);
    physics.yaw.position.x += xyz.x;
    physics.yaw.position.y += xyz.y;
    physics.yaw.position.z += xyz.z;
  };
  physics.moveTo = function (x, y, z) {
    debugger
    const xyz = parseXYZ(x, y, z);
    physics.yaw.position.x = xyz.x;
    physics.yaw.position.y = xyz.y;
    physics.yaw.position.z = xyz.z;
  }
  // physics.position = physics.yaw.position;

  avatarPhysics = physics
  globalThis.avatarPhysics = avatarPhysics
}

//
// game.control
//
controls.target(avatarPhysics)

//
// player.possess
//
avatar.mesh.cameraInside.add(camera)
// avatar.mesh.cameraOutside.add(camera)
camera.position.set(0, 0, 0)
camera.rotation.set(0, 0, 0)

const markerScale = 1/avatar.scale
console.log('markerScale', markerScale)
const markerInside = showMarker([0, 0, 0], 0x00ff00)
markerInside.scale.set(markerScale, markerScale, markerScale)
avatar.mesh.cameraInside.add(markerInside)
const markerOutside = showMarker([0, 0, 0], 0x0000ff)
markerOutside.scale.set(markerScale, markerScale, markerScale)
avatar.mesh.cameraOutside.add(markerOutside)

// from voxel-engine
const onControlChange = (gained, controlStream) => {
  console.log('onControlChange <-----')

  paused = false

  if (!gained) {
    buttons.disable()
    return
  }

  buttons.enable()
  console.log('buttons enable')
  controlStream.pipe(controls.createWriteRotationStream())
}
// from voxel-engine
interact(view.element)
    .on('attain', controlStream => onControlChange(true, controlStream))
    .on('release', controlStream => onControlChange(false, controlStream))

window.addEventListener('resize', onWindowResize, false)
// window.addEventListener('click', raycastFromMouse, false)
window.addEventListener('click', raycastFromCamera, false)

let paused = false
let lastTime = Date.now()

let timeAccumulator = 0
const fixedTimeStep = 1000 / 60

requestAnimationFrame(mainLoop)

function tick(deltaTime) {
  chunkView.update()

  // normally handled via game.items.push
  controls.tick(deltaTime)
  // normally handled via game.addItem
  avatarPhysics.tick(deltaTime)

  // walk animation
  walk.render(avatar, deltaTime)
  var vx = Math.abs(avatarPhysics.velocity.x)
  var vz = Math.abs(avatarPhysics.velocity.z)
  if (vx > 0.001 || vz > 0.001) walk.stopWalking()
  else walk.startWalking()
}

function update () {
  const previousTime = lastTime
  lastTime = Date.now()
  // exit if paused
  if (paused) {
    timeAccumulator = 0
    return
  }
  // add time passed to accumulator
  const dt = lastTime - previousTime
  timeAccumulator += dt
  // not enough time has passed to update
  if (timeAccumulator < fixedTimeStep) {
    return
  }
  const simulationDelta = timeAccumulator
  timeAccumulator = 0
  tick(simulationDelta)
}


function mainLoop () {
  update()
  render()
  requestAnimationFrame(mainLoop)
}

function render () {
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

function showMarker (position = [0,0,0], color = 0xff0000) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32)
  const material = new THREE.MeshBasicMaterial({ color })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(...position)
  scene.add(sphere)
  return sphere
}
