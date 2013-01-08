var funstance = require('funstance');
var EventEmitter = require('events').EventEmitter;

module.exports = function (game, opts) {
    if (!opts) opts = {};
    if (!opts.limit) opts.limit = function () { return false };
    if (!opts.yield) opts.yield = function () { return 1 };
    if (!opts.expire) opts.expire = {};
    if (typeof opts.expire === 'number') {
        opts.expire = { start : opts.expire, end : opts.expire };
    }
    if (!opts.expire.start) opts.expire.start = 15 * 1000;
    if (!opts.expire.end) opts.expire.end = 30 * 1000;
    
    game.on('collision', function (item) {
        if (!item._debris) return;
        if (opts.limit && opts.limit(item)) return;
        
        game.removeItem(item);
        item._collected = true;
        em.emit('collect', item);
    });
    
    var em = new EventEmitter;
    return funstance(em, function (pos) {
        var value = game.getBlock(pos);
        if (value === 0) return;
        game.setBlock(pos, 0);
        
        for (var i = 0; i < opts.yield(value); i++) {
            var item = createDebris(game, pos, value);
            item.velocity = {
                x: (Math.random() * 2 - 1) * 0.05,
                y: (Math.random() * 2 - 1) * 0.05,
                z: (Math.random() * 2 - 1) * 0.05
            };
            game.addItem(item);
            
            var time = opts.expire.start + Math.random()
                * (opts.expire.end - opts.expire.start);
            
            setTimeout(function (item) {
                game.removeItem(item);
                if (!item._collected) em.emit('expire', item);
            }, time, item);
        }
    });
}

function createDebris (game, pos, value) {
    var mesh = new game.THREE.Mesh(
        new game.THREE.CubeGeometry(4, 4, 4),
        game.material
    );
    mesh.geometry.faces.forEach(function (face) {
        face.materialIndex = value - 1
    });
    mesh.translateX(pos.x);
    mesh.translateY(pos.y);
    mesh.translateZ(pos.z);
    
    return {
        mesh: mesh,
        size: 4,
        collisionRadius: 22,
        value: value,
        _debris: true,
        velocity: {
            x: (Math.random() * 2 - 1) * 0.05,
            y: (Math.random() * 2 - 1) * 0.05,
            z: (Math.random() * 2 - 1) * 0.05
        }
    };
}
