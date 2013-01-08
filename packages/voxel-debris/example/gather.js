var createEngine = require('voxel-engine')
var game = createEngine({
    generate: function(x, y, z) {
        var d = Math.sqrt(x*x + y*y + z*z);
        if (d > 20) return 0;
        if (y < 18) return 0;
        return Math.floor(Math.random() * 4) + 1;
    },
    texturePath: './',
    materials: [ 'dirt', 'grass', 'crate', 'brick' ]
});
game.appendTo('#container');

var explode = require('../')(game, {
    yield: function (value) {
      return {
        dirt: 10,
        grass: 4,
        crate: 2,
        brick: 3
      }[game.materials[value-1]];
    }
});
explode.on('collect', function (item) {
    console.log(game.materials[item.value - 1]);
});

game.on('mousedown', function (pos) {
    if (erase) {
        explode(pos);
        game.setBlock(pos, 0);
    }
    else {
        game.createBlock(pos, 1);
    }
});

window.addEventListener('keydown', ctrlToggle);
window.addEventListener('keyup', ctrlToggle);

var erase = true
function ctrlToggle (ev) { erase = !ev.ctrlKey }
game.requestPointerLock('canvas');