# voxel-server

multiplayer server for [voxel-engine](http://github.com/maxogden/voxel-engine)

Use with [voxel-client](https://github.com/maxogden/voxel-client)

If the client sends an object with a settings property, it will use those settings when creating its game instance and will send those instances to other clients that connect.

If the client settings have the property "resetSettings", the server will switch to those. It deletes any game instance and clears the chunkCache.

## Get it running on your machine

```
npm install
```

Run the start script:

```
npm start
```
This gets the server running on port 8080.

## Using as a module
The returned server object implements [EventEmitter2](https://github.com/hij1nx/EventEmitter2)

```javascript
var createServer = require('voxel-server')

var settings = {
  generateChunks: false,
  chunkDistance: 2,
  materials: [
    ['grass', 'dirt', 'grass_dirt'],
    'dirt',
    'plank',
    'cobblestone',
    'brick',
  ],
  avatarInitialPosition: [2, 20, 2],
}

var server = createServer(settings)

server.on('missingChunk', function(chunk){ ... })
server.on('client.join', function(client){
  server.on(['client', client.id, 'leave'], function(client){ ... })
  server.on(['client', client.id, 'state'], function(state){ ... })
})
server.on('message', function(message, authorClient){ ... })
server.on('set', function(pos, val, client){ ... })
server.on('error', function(error){ ... })
```

## explanation

background research:

- http://buildnewgames.com/real-time-multiplayer/
- https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
- http://www.gabrielgambetta.com/?p=63 (all three parts)
- http://gafferongames.com/networking-for-game-programmers/what-every-programmer-needs-to-know-about-game-networking/
- http://gafferongames.com/game-physics/networked-physics/
- http://udn.epicgames.com/Three/NetworkingOverview.html

## license

BSD
