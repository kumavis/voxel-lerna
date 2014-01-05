# voxel-server

multiplayer server for [voxel-engine](http://github.com/maxogden/voxel-engine)

Use with [voxel-client](https://github.com/kumavis/voxel-client)


## Using as a module
The returned server object implements EventEmitter

```javascript
var Server = require('voxel-server')

var settings = {
  // various [voxel-engine]() settings to be sent to the clients
  avatarInitialPosition: [2, 20, 2],
  // list of incomming custom events to forward to all clients
  forwardEvents: ['attack','voiceChat']
}

// create server
var server = Server(settings)

// bind events
server.on('missingChunk', function(chunk){ ... })
server.on('client.join', function(client){ ... })
server.on('client.leave', function(client){ ... })
server.on('client.state', function(state){ ... })
server.on('chat', function(message){ ... })
server.on('set', function(pos, val, client){ ... })
server.on('error', function(error){ ... })

// connect a client
var duplexStream = SomeTransportSteam()
server.connectClient(duplexStream)
```

#### transport streams

websockets: [websocket-stream](https://github.com/maxogden/websocket-stream)

webRTC: [rtc-data-stream](https://github.com/kumavis/rtc-data-stream)



## further reading:

- http://buildnewgames.com/real-time-multiplayer/
- https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
- http://www.gabrielgambetta.com/?p=63 (all three parts)
- http://gafferongames.com/networking-for-game-programmers/what-every-programmer-needs-to-know-about-game-networking/
- http://gafferongames.com/game-physics/networked-physics/
- http://udn.epicgames.com/Three/NetworkingOverview.html

## license

BSD
