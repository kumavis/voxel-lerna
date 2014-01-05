# voxel-client

Enable an app based on voxel-engine to be a client for [voxel-server](https://github.com/kumavis/voxel-server)


## Using as a module

```javascript
// establish a transport stream with the server
var duplexStream = SomeTransportSteam()

var client = new Client({
  serverStream: duplexStream,
  container: document.body,
})

// use the client.connection [DuplexEmitter](https://github.com/pgte/duplex-emitter) to react to remote events
client.connection.on('join', function(user) {
  console.log(user,'joined.')
})

// or emit your own events back to the server!
// Note: to have the server forward the event to all players,
// add the event name to `server.forwardEvents`
client.connection.emit('attack', attackDetails)
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

BSD LICENSE