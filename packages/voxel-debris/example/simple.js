var createEngine = require('voxel-engine')
var game = createEngine({
    generate: function(x, y, z) { return x*x + y*y <= 20*20 },
    texturePath: './',
    materials: [ 'dirt', 'grass', 'crate', 'brick' ]
});
game.appendTo('#container');

var explode = require('../')(game);

explode.on('collect', function (item) {
    console.log(game.materials[item.value - 1]);
});

game.on('mousedown', function (pos) {
    if (erase) explode(pos)
    else game.createBlock(pos, 1)
});

window.addEventListener('keydown', ctrlToggle);
window.addEventListener('keyup', ctrlToggle);

var erase = true
function ctrlToggle (ev) { erase = !ev.ctrlKey }
game.requestPointerLock('canvas');
