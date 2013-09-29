// dependencies
var http = require('http')
var extend = require('extend')
var ecstatic = require('ecstatic')
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var WebSocketServer = require('ws').Server
var websocket = require('websocket-stream')
var duplexEmitter = require('duplex-emitter')
var path = require('path')
var uuid = require('hat')
// voxel dependencies
var voxel = require('voxel')
var crunch = require('voxel-crunch')
var engine = require('voxel-engine')
var texturePath = require('painterly-textures')(__dirname)

module.exports = function(settings) {
  
  // server game settings are used to create a
  // world on the server and are sent to all
  // new clients when they connect
  var defaults = {
    generate: voxel.generator['Valley'],
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
  settings = extend({}, defaults, settings)
  
  // prepare a server object to return
  var server = extend({}, new EventEmitter2({ wildcard: true }))
  var game = server.game = engine(settings)
  var httpServer = server.http = http.createServer(ecstatic(path.join(__dirname, 'www')))
  server.listen = httpServer.listen.bind(httpServer)
  var wss = server.wss = new WebSocketServer({server: httpServer})
  var clients = server.clients = {}
  var chunkCache = server.chunkCache = {}

  // send player position/rotation updates
  setInterval(handleErrors(sendUpdate), 1000/22) // 45ms

  // forward some events to module consumer
  game.voxels.on('missingChunk', function(chunk){ server.emit('missingChunk',chunk) })

  // websocket connect established
  wss.on('connection', handleErrors(configureClient))

  // return the server object so module consumers can
  // subscribe to events and extend functionality
  return server

  // Setup the client connection - register events, etc
  function configureClient(ws) {
    // turn 'raw' websocket into a stream
    var stream = websocket(ws)
    // setup two way communication with the client
    var emitter = duplexEmitter(stream)

    // register client id 
    var id = uuid()
    emitter.emit('id', id)
    broadcast(id, 'join', id)
    console.log(id, 'joined')
    var client = clients[id] = {
      id: id,
      emitter: emitter,
      player: {
        rotation: new game.THREE.Vector3(),
        position: new game.THREE.Vector3()
      },
    }
    server.emit(['client','join'],client)

    // send initial game settings
    emitter.emit('settings', settings)

    //
    // Handle client-sent events
    //

    // connection end/error
    stream.once('end', removeClient)
    stream.once('error', removeClient)
    function removeClient() {
      delete clients[id]
      server.emit(['client',id,'leave'],client)
      broadcast(id, 'leave', id)
      console.log(id, 'left')
    }

    // forward chat message
    emitter.on('message', handleErrors(function(message) {
      if (!message.text) return
      if (message.text.length > 140) message.text = message.text.substr(0, 140)
      server.emit(['message'],message,client)
      broadcast(null, 'message', message)
      console.log('chat', message)
    }))

    // when user ready ( game created, etc )
    emitter.on('created', handleErrors(function() {
      // send initial world payload
      sendInitialChunks(emitter)
    }))

    // client sends new position, rotation
    emitter.on('state', handleErrors(function(state) {
      server.emit(['client',id,'state'],state)
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
    emitter.on('set', handleErrors(function(pos, val) {
      server.emit(['set'],pos,val,client)
      game.setBlock(pos, val)
      var chunkPos = game.voxels.chunkAtPosition(pos)
      var chunkID = chunkPos.join('|')
      if (chunkCache[chunkID]) delete chunkCache[chunkID]
      broadcast(null, 'set', pos, val)
    }))

  }

  // send message to all clients
  function broadcast(id, cmd, arg1, arg2, arg3) {
    Object.keys(clients).map(function(clientId) {
      if (clientId === id) return
      clients[clientId].emitter.emit(cmd, arg1, arg2, arg3)
    })
  }

  // broadcast position, rotation updates for each player
  function sendUpdate() {
    var clientIds = Object.keys(clients)
    if (clientIds.length === 0) return
    var update = {positions:{}, date: +new Date()}
    clientIds.map(function(id) {
      var client = clients[id]
      update.positions[id] = {
        position: client.player.position,
        rotation: {
          x: client.player.rotation.x,
          y: client.player.rotation.y,
        },
      }
    })
    broadcast(null, 'update', update)
  }

  // send all the game chunks
  function sendInitialChunks(emitter) {
    Object.keys(game.voxels.chunks).map(function(chunkID) {
      var chunk = game.voxels.chunks[chunkID]
      var encoded = chunkCache[chunkID]
      if (!encoded) {
        encoded = crunch.encode(chunk.voxels)
        chunkCache[chunkID] = encoded
      }
      emitter.emit('chunk', encoded, {
        position: chunk.position,
        dims: chunk.dims,
        length: chunk.voxels.length
      })
    })
    emitter.emit('noMoreChunks', true)
  }

  // utility function
  // returns the provided function wrapped in a try-catch
  // emits errors to module consumer
  function handleErrors(func) {
    return function(){
      try {
        return func.apply(this,arguments)
      } catch (error) {
        server.emit(['error'],error)
      }
    }
  }

}