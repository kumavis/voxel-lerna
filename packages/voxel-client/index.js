// dependencies
var url = require('url')
var websocket = require('websocket-stream')
var duplexEmitter = require('duplex-emitter')
var toolbar = require('toolbar')
// voxel dependencies
var skin = require('minecraft-skin')
var crunch = require('voxel-crunch')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var engine = require('voxel-engine')
// local dependencies
var randomName = require('./randomname')

module.exports = Client

function Client(opts) {
  var self = this
  // force instantiation via `new` keyword 
  if(!(this instanceof Client)) { return new Client(opts) }
  // allow module consumers to listen to ee2 events
  // set initial values
  self.playerID
  self.game
  self.texturePath = opts.texturePath || '/textures/'
  self.lastProcessedSeq = 0
  self.localInputs = []
  self.connected = false
  self.currentMaterial = 1
  self.lerpPercent = 0.1
  self.server = opts.server || 'ws://'+document.domain+':8000/'
  self.remoteClients = {}
  self.connect(self.server)
}

Client.prototype.connect = function(server) {
  var self = this
  var socket = websocket(server)
  socket.on('end', function() { self.connected = false })
  self.socket = socket
  self.bindEvents(socket)
}

Client.prototype.bindEvents = function(socket) {
  var self = this
  // setup two way communication with the server
  var emitter = self.emitter = duplexEmitter(socket)
  // expose emitter methods on client
  self.on = emitter.on.bind(emitter)
  self.emit = emitter.emit.bind(emitter)
  self.connected = true

  // receive id from server 
  self.on('id', function(id) {
    console.log('got id', id)
    self.playerID = id
  })
  
  // receive initial game settings
  self.on('settings', function(settings) {
    settings.texturePath = self.texturePath
    settings.generateChunks = false
    settings.controlsDisabled = false
    self.game = self.createGame(settings)
    // tell server we're ready
    self.emit('created')
  })

  // load in chunks from the server
  self.on('chunk', function(encoded, chunk) {
    var voxels = crunch.decode(encoded, chunk.length)
    chunk.voxels = voxels
    self.game.showChunk(chunk)
  })

  // fires when server sends us voxel edits
  self.on('set', function(pos, val) {
    self.emit('set', pos, val)
    self.game.setBlock(pos, val)
  })

}

Client.prototype.createGame = function(settings) {
  var self = this
  var emitter = self.emitter
  self.game = engine(settings)
  self.game.settings = settings

  // retrieve name from local storage
  var name = localStorage.getItem('name')
  // if no name, choose a random name
  if (!name) {
    name = randomName()
    localStorage.setItem('name', name)
  }

  // handle controls
  self.game.controls.on('data', function(state) {
    var interacting = false
    Object.keys(state).map(function(control) {
      if (state[control] > 0) interacting = true
    })
    if (interacting) sendState()
  })
    
  // handle server updates
  // delay is because three.js seems to throw errors if you add stuff too soon
  setTimeout(function() {
    emitter.on('update', serverUpdate)
  }, 1000)

  // handle removing clients that leave
  emitter.on('leave', removeClient)
  
  // return the game object
  return self.game

  // send player state to server, mostly avatar info (position, rotation, etc.)
  function sendState() {
    if (!self.connected) return
    var player = self.game.controls.target()
    var state = {
      position: player.yaw.position,
      rotation: {
        y: player.yaw.rotation.y,
        x: player.pitch.rotation.x
      }
    }
    emitter.emit('state', state)
  }

  // unregister a remote client
  function removeClient(id) {
    if (!self.remoteClients[id]) return
    self.game.scene.remove(self.remoteClients[id].mesh)
    delete self.remoteClients[id]
  }

  // process update from the server, mostly avatar info (position, rotation, etc.)
  function serverUpdate(updates) {      
    Object.keys(updates.positions).map(function(player) {
      var update = updates.positions[player]
      // local player
      if (player === self.playerID) {
        self.onServerUpdate(update)
      // other players
      } else {
        self.updatePlayerPosition(player, update)
      }
    })
  }

}

Client.prototype.onServerUpdate = function(update) {
  // todo use server sent location
}

Client.prototype.lerpMe = function(position) {
  var to = new this.game.THREE.Vector3()
  to.copy(position)
  var from = this.game.controls.target().yaw.position
  from.copy(from.lerp(to, this.lerpPercent))  
}

Client.prototype.updatePlayerPosition = function(id, update) {
  var self = this
  var pos = update.position
  var player = self.remoteClients[id]
  if (!player) {
    var playerSkin = skin(self.game.THREE, 'player.png', {
      scale: new self.game.THREE.Vector3(0.04, 0.04, 0.04)
    })
    var playerMesh = playerSkin.mesh
    self.remoteClients[id] = playerSkin
    playerMesh.children[0].position.y = 10
    self.game.scene.add(playerMesh)
  }
  var playerSkin = self.remoteClients[id]
  var playerMesh = playerSkin.mesh
  playerMesh.position.copy(playerMesh.position.lerp(pos, self.lerpPercent))
  playerMesh.children[0].rotation.y = update.rotation.y + (Math.PI / 2)
  playerSkin.head.rotation.z = scale(update.rotation.x, -1.5, 1.5, -0.75, 0.75)
}

function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}
