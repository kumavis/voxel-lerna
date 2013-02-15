var createGame = require('voxel-engine');
var voxel = require('voxel');
var skin = require('minecraft-skin');
var game = createGame({
    generate: voxel.generator['Valley'],
    texturePath: '/textures/'
});
window.game = game;
game.appendTo('#container');

var debris = require('voxel-debris');
var explode = debris(game, { power: 1.5, yield: 0 });

var createPlayer = require('voxel-player')(game);
var substack = createPlayer('substack.png');
substack.possess();

window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) {
        substack.toggle();
    }
});

game.on('fire', function (target, state) {
    var vec = game.cameraVector();
    var pos = game.cameraPosition();
    var point = game.raycast(pos, vec, 100);
    if (!point) return;
    
    if (state.ctrl) {
        var pt = point.addSelf(vec.multiplyScalar(-game.cubeSize / 2));
        game.createBlock(pt, 1);
    }
    else explode(point);
});
