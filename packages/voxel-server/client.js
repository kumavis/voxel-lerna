var voxel = require('voxel')
var websocket = require('websocket-stream')
var createGame = require('voxel-engine')
var duplexEmitter = require('duplex-emitter')
var THREE = require('three')
var url = require('url')

window.socket = websocket('ws://' + url.parse(window.location.href).host)
window.emitter = duplexEmitter(socket)

var generator = function(low, high, x, y, z) {
  var chunkIndex = [x, y, z].join('|')
  var chunk = this.chunks[chunkIndex]
  var voxels
  if (chunk) voxels = chunk.voxels
  return voxel.generate(low, high, function(vx, vy, vz, n) {
    if (voxels) return voxels[n]
    return voxel.generator['Valley'](vx, vy, vz)
  })
}

window.game = createGame({
  generateVoxelChunk: generator,
  texturePath: '/textures/',
  cubeSize: 25,
  chunkSize: 32,
  chunkDistance: 2,
  startingPosition: new THREE.Vector3(35, 1024, 35),
  worldOrigin: new THREE.Vector3(0,0,0),
  renderCallback: animateHorses
})

game.appendTo('#container')

var loader = new THREE.JSONLoader( true )
loader.load( "/horse.js", function( geometry ) {
  window.horseGeometry = geometry
})

function animateHorses() {
  Object.keys(horses).map(function(horseID) {
    var horse = horses[horseID]
    if ( horse.mesh ) {
      horse.tick()
		}
  })
}

function Horse() {
  this.radius = 600
	this.theta = 0
	this.duration = 1000
	this.keyframes = 15
	this.interpolation = this.duration / this.keyframes
	this.lastKeyframe = 0
	this.currentKeyframe = 0
	this.lastPositionTime = Date.now()
	
  var mesh = new THREE.Mesh( horseGeometry, new THREE.MeshLambertMaterial( { color: 0x606060, morphTargets: true } ) )
	mesh.scale.set( 0.25, 0.25, 0.25 )
	game.scene.add( mesh )
	this.mesh = mesh
}

Horse.prototype.tick = function() {
  if (Date.now() - this.lastPositionTime > 150) return
  var time = Date.now() % this.duration
  var keyframe = Math.floor( time / this.interpolation )
  if ( keyframe != this.currentKeyframe ) {
    this.mesh.morphTargetInfluences[ this.lastKeyframe ] = 0
    this.mesh.morphTargetInfluences[ this.currentKeyframe ] = 1
    this.mesh.morphTargetInfluences[ keyframe ] = 0
    this.lastKeyframe = this.currentKeyframe
    this.currentKeyframe = keyframe
  }
  this.mesh.morphTargetInfluences[ keyframe ] = ( time % this.interpolation ) / this.interpolation
  this.mesh.morphTargetInfluences[ this.lastKeyframe ] = 1 - this.mesh.morphTargetInfluences[ keyframe ]
}

window.horses = {}

setInterval(function() {
  if (Object.keys(horses).length === 0) return
  emitter.emit('position', JSON.parse(JSON.stringify(game.controls.yawObject.position.clone())))
}, 10)

emitter.on('join', function(id) {
  console.log('new horse!', id)
  horses[id] = new Horse()
})

emitter.on('leave', function(id) {
  game.scene.remove(horses[id])
  delete horses[id]
})

emitter.on('position', function(id, pos) {
  var horse = horses[id]
  if (!horse) horses[id] = new Horse()
  var p = horses[id].mesh.position
  if (p.x === pos.x && p.y === pos.y && p.z === pos.z) return
  horses[id].lastPositionTime = Date.now()
  horses[id].mesh.position.copy(pos)
})

emitter.on('set', function (pos, val) {
  console.log(pos, '=', val)
  game.setBlock(new THREE.Vector3(pos.x, pos.y, pos.z), val)
  game.addMarker(pos)
})

emitter.on('create', function (pos, val) {
  console.log(pos, '=', val)
  game.createBlock(new THREE.Vector3(pos.x, pos.y, pos.z), 1)
  game.addMarker(pos)
})

game.on('mousedown', function (pos) {
  if (erase) {
    game.setBlock(pos, 0)
    emitter.emit('set', JSON.parse(JSON.stringify(pos)), 0)
  } else {
    game.createBlock(pos, 1)
    emitter.emit('create', JSON.parse(JSON.stringify(pos)), 1)
  }
})

var erase = true
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'X'.charCodeAt(0)) {
    erase = !erase
  }
})

game.requestPointerLock('#container')

