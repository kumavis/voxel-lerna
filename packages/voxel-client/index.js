// dependencies
var EventEmitter = require('events').EventEmitter
var DuplexEmitter = require('duplex-emitter')
var extend = require('extend')
// voxel dependencies
var skin = require('minecraft-skin')
var crunch = require('voxel-crunch')
var voxelPlayer = require('voxel-player')
var engine = require('voxel-engine')
// local dependencies
var randomName = require('./randomname.js')

module.exports = Client

function Client(opts) {
  // force instantiation via `new` keyword 
  if(!(this instanceof Client)) { return new Client(opts) }
  this.initialize(opts)
}

Client.prototype.initialize = function(opts) {
  var self = this
  // allow module consumers to listen to ee2 events
  // set initial values
  self.opts = opts
  self.playerID
  self.game
  self.texturePath = opts.texturePath || '/textures/'
  self.playerTexture = opts.playerTexture || 'player.png'
  self.lerpPercent = 0.1
  self.remoteClients = {}
  self.serverStream = opts.serverStream
  // expose emitter methods on client
  extend(self,new EventEmitter())

  // create 'connection' remote event emitter from duplex stream
  self.connection = DuplexEmitter(opts.serverStream)
  // setup server event handlers
  self.bindEvents(self.connection)
}

Client.prototype.bindEvents = function(connection) {
  var self = this

  // receive id from server 
  connection.on('id', function(id) {
    self.playerID = id
  })
  
  // receive initial game settings
  connection.on('settings', function(settings) {
    // set client-specific settings
    settings.isClient = true
    settings.texturePath = self.texturePath
    settings.generateChunks = false
    settings.controlsDisabled = false
    self.game = self.createGame(settings)
    // tell server we're ready
    connection.emit('created')
  })

  // load in chunks from the server
  connection.on('chunk', function(encoded, chunk) {
    // ensure `encoded` survived transmission as an array
    // JSON stringifies Uint8Arrays as objects
    if (encoded.length === undefined) {
      var lastIndex = Math.max.apply(null,Object.keys(encoded).map(Number))
      encoded.length = lastIndex+1
    }
    var voxels = crunch.decode(encoded, chunk.length)
    chunk.voxels = voxels
    self.game.showChunk(chunk)
  })

  // after all chunks loaded
  connection.on('noMoreChunks', function() {
    var game = self.game
    
    // if not capable, throw error
    if (game.notCapable()) {
      try{ throw 'game not capable' }
      catch(err) { self.emit('error',err) }
    }

    // create the player from a minecraft skin file and tell the
    // game to use it as the main player
    var createPlayer = voxelPlayer(game)
    var avatar = self.avatar = createPlayer(self.playerTexture)
    avatar.possess()
    var position = game.settings.avatarInitialPosition
    avatar.position.set(position[0],position[1],position[2])
    
    // tell modules consumers we're ready
    self.emit('loadComplete')
  })

  // fires when server sends us voxel edits
  connection.on('set', function(pos, val) {
    self.game.setBlock(pos, val)
  })

}

Client.prototype.createGame = function(settings) {
  var self = this
  var connection = self.connection
  self.game = engine(settings)
  self.game.settings = settings

  // retrieve name from local storage
  var name = localStorage.getItem('name')
  // if no name, choose a random name
  if (!name) {
    name = randomName()
    localStorage.setItem('name', name)
  }
  self.name = name

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
    connection.on('update', serverUpdate)
  }, 1000)

  // handle removing clients that leave
  connection.on('leave', removeClient)
  
  // return the game object
  return self.game

  // send player state to server, mostly avatar info (position, rotation, etc.)
  function sendState() {
    var player = self.game.controls.target()
    var state = {
      position: player.yaw.position,
      rotation: {
        y: player.yaw.rotation.y,
        x: player.pitch.rotation.x
      }
    }
    connection.emit('state', state)
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
  var self = this
  // todo use server sent location
}

Client.prototype.lerpMe = function(position) {
  var self = this
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
    var playerSkin = skin(self.game.THREE, self.playerTexture, {
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
