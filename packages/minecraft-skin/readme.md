# minecraft-skin

load minecraft skins as meshes in three.js applications

originally written by @daniel_hede for [this awesome demo](http://djazz.mine.nu/apps/MinecraftSkin/), turned into a module and upgraded to r54 by @maxogden

minecraft is property of Mojang AB

```javascript
var skin = require('minecraft-skin')
var viking = skin(THREE, 'viking.png')
viking.mesh.position.y = 50
scene.add(viking.mesh)
```

object hierarchy and part reference
```
playerGroup <-- skin.mesh (opts.scale applied here)
  playerRotation
    playerModel <-- skin.playerModel
      rotatedHead
        headgroup <-- playerGroup.head
          unrotatedHeadMesh
            headmesh  <-- skin.head
          helmet
          ears
          playerGroup.cameraInside
            playerGroup.cameraOutside
      leftLeg <-- skin.leftLeg
      rightleg <-- skin.rightLeg
      upperbody <-- skin.upperbody
        bodymesh <-- skin.body
        leftarm <-- skin.leftArm
        rightarm <-- skin.rightArm
```


designed for use with [browserify](http://browserify.org)

# license

BSD