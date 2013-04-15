var tic = require('tic')();
var createAtlas = require('atlaspack');

function Texture(opts) {
  if (!(this instanceof Texture)) return new Texture(opts || {});
  this.game = opts.game;
  this.THREE = this.game.THREE;
  this.materials = [];
  this.texturePath = opts.texturePath || '/textures/';

  this.options = defaults(opts || {}, {
    crossOrigin: 'Anonymous',
    materialParams: defaults(opts.materialParams || {}, {
      ambient: 0xbbbbbb
    }),
    materialType: this.THREE.MeshLambertMaterial,
    applyTextureParams: function(map) {
      map.magFilter = this.THREE.NearestFilter;
      map.minFilter = this.THREE.LinearMipMapLinearFilter;
    }.bind(this)
  });

  this._animations = [];

  // create a canvas for the texture atlas
  this.canvas = document.createElement('canvas');
  this.canvas.width = opts.atlasWidth || 512;
  this.canvas.height = opts.atlasHeight || 512;

  // create core atlas and texture
  this.atlas = createAtlas(this.canvas);
  this._atlasuv = false;
  this._atlaskey = false;
  this.texture = new this.THREE.Texture(this.canvas);
  this.options.applyTextureParams(this.texture);

  // load a first material for easy application to meshes
  this.material = new this.options.materialType(this.options.materialParams);
  this.material.map = this.texture;
  this.material.transparent = true;

  // a place for meshes to wait while textures are loading
  this._meshQueue = [];
}
module.exports = Texture;

Texture.prototype.load = function(names) {
  var self = this;
  if (!Array.isArray(names)) names = [names];

  var materialSlice = names.map(self._expandName);
  self.materials = self.materials.concat(materialSlice);

  // load onto the texture atlas
  self._atlasuv = false;
  var load = Object.create(null);
  materialSlice.forEach(function(mats) {
    mats.forEach(function(mat) {
      // todo: check if texture already exists
      load[mat] = true;
    });
  });
  each(Object.keys(load), self.pack.bind(self), function() {
    self._atlasuv = self.atlas.uv();
    self._atlaskey = Object.create(null);
    self.atlas.index().forEach(function(key) {
      self._atlaskey[key.name] = key;
    });
    self.texture.needsUpdate = true;
    self.material.needsUpdate = true;
    self.material.map.needsUpdate = true;
    //window.open(self.canvas.toDataURL());
    if (self._meshQueue.length > 0) {
      self._meshQueue.forEach(function(queue) {
        self.paint.apply(self, queue);
      });
      self._meshQueue = [];
    }
  });

  return materialSlice;
};

Texture.prototype.pack = function(name, done) {
  var self = this;
  function pack(img) {
    var node = self.atlas.pack(img);
    if (node === false) {
      self.atlas =  self.atlas.expand(img);
    }
    done();
  }
  if (typeof name === 'string') {
    var img = new Image();
    img.src = self.texturePath + ext(name);
    img.id = name;
    img.crossOrigin = self.options.crossOrigin;
    img.onload = function() {
      pack(img);
    };
    img.onerror = function() {
      console.error('Couldn\'t load URL [' + img.src + ']');
    };
  }
  return self;
};

Texture.prototype.find = function(name) {
  var self = this;
  var type = 0;
  self.materials.forEach(function(mats, i) {
    mats.forEach(function(mat) {
      if (mat === name) {
        type = i + 1;
        return false;
      }
    });
    if (type !== 0) return false;
  });
  return type;
};

Texture.prototype._expandName = function(name) {
  if (name.top) return [name.back, name.front, name.top, name.bottom, name.left, name.right];
  if (!Array.isArray(name)) name = [name];
  // load the 0 texture to all
  if (name.length === 1) name = [name[0],name[0],name[0],name[0],name[0],name[0]];
  // 0 is top/bottom, 1 is sides
  if (name.length === 2) name = [name[1],name[1],name[0],name[0],name[1],name[1]];
  // 0 is top, 1 is bottom, 2 is sides
  if (name.length === 3) name = [name[2],name[2],name[0],name[1],name[2],name[2]];
  // 0 is top, 1 is bottom, 2 is front/back, 3 is left/right
  if (name.length === 4) name = [name[2],name[2],name[0],name[1],name[3],name[3]];
  return name;
};

Texture.prototype.paint = function(mesh, materials) {
  var self = this;

  // if were loading put into queue
  if (self._atlasuv === false) {
    self._meshQueue.push(arguments);
    return false;
  }

  var isVoxelMesh = (materials) ? false : true;
  if (!isVoxelMesh) materials = self._expandName(materials);

  mesh.geometry.faces.forEach(function(face, i) {
    if (mesh.geometry.faceVertexUvs[0].length < 1) return;

    if (isVoxelMesh) {
      var index = Math.floor(face.color.b*255 + face.color.g*255*255 + face.color.r*255*255*255);
      materials = self.materials[index - 1];
      if (!materials) materials = self.materials[0];
    }

    // BACK, FRONT, TOP, BOTTOM, LEFT, RIGHT
    var name = materials[0] || '';
    if      (face.normal.z === 1)  name = materials[1] || '';
    else if (face.normal.y === 1)  name = materials[2] || '';
    else if (face.normal.y === -1) name = materials[3] || '';
    else if (face.normal.x === -1) name = materials[4] || '';
    else if (face.normal.x === 1)  name = materials[5] || '';

    var atlasuv = self._atlasuv[name];
    if (!atlasuv) return;

    // 0 -- 1
    // |    |
    // 3 -- 2
    // faces on these meshes are flipped vertically, so we map in reverse
    // TODO: tops need rotate
    if (isVoxelMesh) {
      if (face.normal.z === -1 || face.normal.x === 1) {
        atlasuv = uvrot(atlasuv, 90);
      }
      atlasuv = uvinvert(atlasuv);
    } else {
      atlasuv = uvrot(atlasuv, -90);
    }
    for (var j = 0; j < 4; j++) {
      mesh.geometry.faceVertexUvs[0][i][j].set(atlasuv[j][0], 1 - atlasuv[j][1]);
    }
  });

  mesh.geometry.uvsNeedUpdate = true;
};

Texture.prototype.sprite = function(name, w, h, cb) {
  var self = this;
  if (typeof w === 'function') { cb = w; w = null; }
  if (typeof h === 'function') { cb = h; h = null; }
  w = w || 16; h = h || w;
  var img = new Image();
  img.src = self.texturePath + ext(name);
  img.onerror = cb;
  img.onload = function() {
    var textures = [];
    for (var x = 0; x < img.width; x += w) {
      for (var y = 0; y < img.height; y += h) {
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        var tex = new self.THREE.Texture(canvas);
        tex.name = name + '_' + x + '_' + y;
        tex.needsUpdate = true;
        textures.push(tex);
        // TODO: automatically load onto the atlas
      }
    }
    cb(null, textures);
  };
  return self;
};

// TODO: instead of names just pass materials to animate
Texture.prototype.animate = function(names, delay) {
  var self = this;
  delay = delay || 1000;
  names = names.map(function(name) {
    return (typeof name === 'string') ? self.find(name) : name;
  }).filter(function(name) {
    return (name !== -1);
  });
  if (names.length < 2) return false;

  var i = 0;
  var mat = self.materials[names[0]].clone();
  tic.interval(function() {
    mat.map = self.materials[names[i % names.length]].map;
    mat.needsUpdate = true;
    i++;
  }, delay);

  self.materials.push(mat);
  return mat;
};

Texture.prototype.tick = function(dt) {
  tic.tick(dt);
};

function uvrot(coords, deg) {
  if (deg === 0) return coords;
  var c = [];
  var i = (4 - Math.ceil(deg / 90)) % 4;
  for (var j = 0; j < 4; j++) {
    c.push(coords[i]);
    if (i === 3) i = 0; else i++;
  }
  return c;
}

function uvinvert(coords) {
  var c = coords.slice(0);
  return [c[3], c[2], c[1], c[0]];
}

function ext(name) {
  return (String(name).indexOf('.') !== -1) ? name : name + '.png';
}

function defaults(obj) {
  [].slice.call(arguments, 1).forEach(function(from) {
    if (from) for (var k in from) if (obj[k] == null) obj[k] = from[k];
  });
  return obj;
}

function each(arr, it, done) {
  var count = 0;
  arr.forEach(function(a) {
    it(a, function() {
      count++;
      if (count >= arr.length) done();
    });
  });
}
