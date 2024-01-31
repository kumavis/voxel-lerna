var createGame = require('voxel-engine')
var highlight = require('voxel-highlight')
var player = require('voxel-player')
var voxel = require('voxel')
var extend = require('extend')
var fly = require('voxel-fly')
var walk = require('voxel-walk')
var createTree = require('voxel-forest');

const generateGentleHills = (i,j,k) => {
  return (j + 2 * Math.sin(i/13) + 3 * Math.sin(k/17)) < 0 ? 1 : 0
}

module.exports = function(opts, setup) {
  setup = setup || defaultSetup
  var defaults = {
    generate: generateGentleHills,
        chunkDistance: 2,
    // materials: ['#fff', '#000'],
    materials: [
      ['grass', 'dirt', 'grass_dirt'],
      'tree_side',
      'leaves_opaque',
      // 'obsidian',
      // 'brick',
      // 'grass',
      // 'plank'
    ],
    // materialFlatColor: true,
    worldOrigin: [0, 0, 0],
    controls: { discreteFire: true }
  }
  opts = extend({}, defaults, opts || {})

  // setup the game and add some trees
  var game = createGame(opts)
  var container = opts.container || document.body
  window.game = game // for debugging
  game.appendTo(container)
  if (game.notCapable()) return game
  
  var createPlayer = player(game)

  // create the player from a minecraft skin file and tell the
  // game to use it as the main player
  var avatar = createPlayer(opts.playerSkin || 'player.png')
  avatar.possess()
  avatar.yaw.position.set(2, 14, 4)

  // for (var i = 0; i < 250; i++) {
  //   createTree(game, { bark: 2, leaves: 3 });
  // }

  setup(game, avatar, defaultSetup)
  
  return game
}

function defaultSetup(game, avatar) {
  
  var makeFly = fly(game)
  var target = game.controls.target()
  game.flyer = makeFly(target)
  
  // highlight blocks when you look at them, hold <Ctrl> for block placement
  var blockPosPlace, blockPosErase
  var hl = game.highlighter = highlight(game, { color: 0xff0000 })
  hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos })
  hl.on('remove', function (voxelPos) { blockPosErase = null })
  hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos })
  hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null })

  // toggle between first and third person modes
  window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) avatar.toggle()
  })

  // block interaction stuff, uses highlight data
  var currentMaterial = 1

  game.on('fire', function (target, state) {
    
    // make tree
    if (!blockPosPlace && blockPosErase) {
      const position = blockPosErase
      console.log('createTree', position)
      createTree(game, { bark: 2, leaves: 3, position });
    }

    // var position = blockPosPlace
    // if (position) {
    //   game.createBlock(position, currentMaterial)
    // }
    // else {
    //   position = blockPosErase
    //   if (position) game.setBlock(position, 0)
    // }
  })

  game.on('tick', function() {
    walk.render(target.playerSkin)
    var vx = Math.abs(target.velocity.x)
    var vz = Math.abs(target.velocity.z)
    if (vx > 0.001 || vz > 0.001) walk.stopWalking()
    else walk.startWalking()
  })

}
