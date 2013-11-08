// dependencies
var extend = require('extend')
var EventEmitter2 = require('eventemitter2').EventEmitter2
var path = require('path')
var uuid = require('hat')
// voxel dependencies
var voxel = require('voxel')
var crunch = require('voxel-crunch')
var engine = require('voxel-engine')
var texturePath = require('painterly-textures')(__dirname)

module.exports = Server

function Server(opts) {
  // force instantiation via `new` keyword 
  if(!(this instanceof Server)) { return new Server(opts) }
  this.initialize(opts)
}

Server.prototype.initialize = function(opts) {
  var self = this
  // server game settings are sent to all
  // new clients when they connect
  var defaults = {
    chunkDistance: 2,
    materials: [
      ['grass', 'dirt', 'grass_dirt'],
      'obsidian',
      'brick',
      'grass'
    ],
    texturePath: texturePath,
    worldOrigin: [0, 0, 0],
    controls: { discreteFire: true },
    avatarInitialPosition: [2, 20, 2],
  }
  var settings = self.settings = extend({}, defaults, opts)
  
  // prepare a server object to return
  extend(self, new EventEmitter2({ wildcard: true }))
  var game = self.game = engine(settings)
  var clients = self.clients = {}
  var chunkCache = self.chunkCache = {}

  // send player position/rotation updates
  setInterval(self.handleErrors(function() {
    self.sendUpdate()
  }), 1000/22) // every 45ms

  // forward some events to module consumer
  game.voxels.on('missingChunk', function(chunk){ self.emit('missingChunk',chunk) })

}

// Setup the client connection - register events, etc
Server.prototype.connectClient = function(connection) {
  var self = this
  var settings = self.settings
  var game = self.game
  // register client id 
  var id = connection.id = uuid()
  self.broadcast(id, 'join', id)
  var client = self.clients[id] = {
    id: id,
    connection: connection,
    player: {
      rotation: new game.THREE.Vector3(),
      position: new game.THREE.Vector3()
    },
  }

  // setup client response handlers
  self.bindClientEvents(client)

  // send client id and initial game settings
  connection.emit('id', id)
  connection.emit('settings', settings)

  // emit client.join for module consumers
  self.emit(['client','join'],client)

}

Server.prototype.removeClient = function(connection) {
  var self = this
  var id = connection.id
  var client = self.clients[id]
  delete self.clients[id]
  self.emit(['client',id,'leave'],client)
  self.broadcast(id, 'leave', id)
}

Server.prototype.bindClientEvents = function(client) {
  var self = this
  var game = self.game
  var id = client.id
  var connection = client.connection

  // forward chat message
  connection.on('chat', self.handleErrors(function(message) {
    if (!message.text) return
    if (message.text.length > 140) message.text = message.text.substr(0, 140)
    self.emit(['chat'],message,client)
    self.broadcast(null, 'chat', message)
  }))

  // when user ready ( game created, etc )
  connection.on('created', self.handleErrors(function() {
    // send initial world payload
    self.sendInitialChunks(connection)
  }))

  // client sends new position, rotation
  connection.on('state', self.handleErrors(function(state) {
    self.emit(['client',id,'state'],state)
    client.player.rotation.x = state.rotation.x
    client.player.rotation.y = state.rotation.y
    var pos = client.player.position
    var distance = pos.distanceTo(state.position)
    if (distance > 20) {
      var before = pos.clone()
      pos.lerp(state.position, 0.1)
      return
    }
    pos.copy(state.position)
  }))

  // client modifies a block
  var chunkCache = self.chunkCache
  connection.on('set', self.handleErrors(function(pos, val) {
    self.emit(['set'],pos,val,client)
    game.setBlock(pos, val)
    var chunkPos = game.voxels.chunkAtPosition(pos)
    var chunkID = chunkPos.join('|')
    if (chunkCache[chunkID]) delete chunkCache[chunkID]
    self.broadcast(null, 'set', pos, val)
  }))

  // forward custom events
  self.settings.forwardEvents.map(function(eventName) {
    connection.on(eventName,function() {
      var args = [].slice.apply(arguments)
      // add event name
      args.unshift(eventName)
      // add client id
      args.unshift(id)
      self.broadcast.apply(self,args)
    })
  })

}

// send message to all clients
Server.prototype.broadcast = function(id, event) {
  var self = this
  // normalize arguments
  var args = [].slice.apply(arguments)
  // remove client `id` argument
  args.shift()
  // emit on self
  self.emit.apply(self,args)
  Object.keys(self.clients).map(function(clientId) {
    if (clientId === id) return
    var connection = self.clients[clientId].connection
    // emit over connection
    connection.emit.apply(connection,args)
  })
}

// broadcast position, rotation updates for each player
Server.prototype.sendUpdate = function() {
  var self = this
  var clientIds = Object.keys(self.clients)
  if (clientIds.length === 0) return
  var update = {positions:{}, date: +new Date()}
  clientIds.map(function(id) {
    var client = self.clients[id]
    update.positions[id] = {
      position: client.player.position,
      rotation: {
        x: client.player.rotation.x,
        y: client.player.rotation.y,
      },
    }
  })
  self.broadcast(null, 'update', update)
}

// send all the game chunks
Server.prototype.sendInitialChunks = function(connection) {
  var self = this
  var chunks = self.game.voxels.chunks
  var chunkCache = self.chunkCache
  Object.keys(chunks).map(function(chunkID) {
    var chunk = chunks[chunkID]
    var encoded = chunkCache[chunkID]
    if (!encoded) {
      encoded = crunch.encode(chunk.voxels)
      chunkCache[chunkID] = encoded
    }
    connection.emit('chunk', encoded, {
      position: chunk.position,
      dims: chunk.dims,
      length: chunk.voxels.length
    })
  })
  connection.emit('noMoreChunks', true)
}

// utility function
// returns the provided function wrapped in a try-catch
// emits errors to module consumer
Server.prototype.handleErrors = function(func) {
  var self = this
  return function() {
    try {
      return func.apply(this,arguments)
    } catch (error) {
      self.emit(['error'],error)
    }
  }
}
