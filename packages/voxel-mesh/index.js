var THREE = require('three')

module.exports = function(data, mesher, scaleFactor, three) {
  return new Mesh(data, mesher, scaleFactor, three)
}

module.exports.Mesh = Mesh

function Mesh(data, mesher, scaleFactor, three) {
  this.THREE = three || THREE
  this.data = data
  var geometry = this.geometry = new this.THREE.BufferGeometry()
  this.scale = scaleFactor || new this.THREE.Vector3(10, 10, 10)
  
  var result = mesher( data.voxels, data.dims )
  this.meshed = result

  // geometry.vertices.length = 0
  // geometry.faces.length = 0

  // for (var i = 0; i < result.vertices.length; ++i) {
  //   var q = result.vertices[i]
  //   geometry.vertices.push(new this.THREE.Vector3(q[0], q[1], q[2]))
  // } 

  // Assuming result.vertices is a flat array [x1, y1, z1, x2, y2, z2, ...]
  var vertices = new Float32Array(result.vertices.length * 3);
  for (let i = 0; i < result.vertices.length; i++) {
    vertices[i*3+0] = result.vertices[i][0];
    vertices[i*3+1] = result.vertices[i][1];
    vertices[i*3+2] = result.vertices[i][2];
  }
  geometry.setAttribute('position', new this.THREE.BufferAttribute(vertices, 3));

  // Assuming result.faces is an array of indices [a, b, c, d, ...]
  // For simplicity, let's assume all faces are triangles
  geometry.faceColors = [];
  if (result.faces.length > 0) {
    var indices = [];
    let uvArray = [];
    for (var i = 0; i < result.faces.length; i++) {
      var q = result.faces[i];
      let color;
      // Handle Quad
      if (q.length === 5) {
        // For quads or higher polygons, you would need to triangulate them first
        indices.push(q[0], q[1], q[2]); // Triangle 1
        indices.push(q[0], q[2], q[3]); // Triangle 2
        color = q[4];
        let uvs = this.faceVertexUv(i);
        // triangle 1
        uvArray.push(uvs[0].x, uvs[0].y);
        uvArray.push(uvs[1].x, uvs[1].y);
        uvArray.push(uvs[2].x, uvs[2].y);
        // triangle 2
        uvArray.push(uvs[0].x, uvs[0].y);
        uvArray.push(uvs[2].x, uvs[2].y);
        uvArray.push(uvs[3].x, uvs[3].y);
      // Handle Triangle
      } else if (q.length === 4) {
        indices.push(q[0], q[1], q[2]);
        color = q[3];
        let uvs = this.faceVertexUv(i);
        uvs.forEach(uv => {
          uvArray.push(uv.x, uv.y);
        });
      } else {
        console.error('Invalid face', q);
      }
      geometry.faceColors.push(color);
    }
    var indexArray = new Uint16Array(indices);
    geometry.setIndex(new this.THREE.BufferAttribute(indexArray, 1));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvArray), 2));
    geometry.attributes.uv.needsUpdate = true;
  }
  
  // geometry.computeFaceNormals()
  geometry.computeVertexNormals();

  // geometry.verticesNeedUpdate = true
  // geometry.elementsNeedUpdate = true
  // geometry.normalsNeedUpdate = true

  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

Mesh.prototype.createWireMesh = function(hexColor) {    
  var wireMaterial = new this.THREE.MeshBasicMaterial({
    color : hexColor || 0xffffff,
    wireframe : true
  })
  wireMesh = new this.THREE.Mesh(this.geometry, wireMaterial)
  wireMesh.scale = this.scale
  wireMesh.doubleSided = true
  this.wireMesh = wireMesh
  return wireMesh
}

Mesh.prototype.createSurfaceMesh = function(material) {
  material = material || new this.THREE.MeshNormalMaterial()
  var surfaceMesh  = new this.THREE.Mesh( this.geometry, material )
  surfaceMesh.scale = this.scale
  surfaceMesh.doubleSided = false
  this.surfaceMesh = surfaceMesh
  return surfaceMesh
}

Mesh.prototype.addToScene = function(scene) {
  if (this.wireMesh) scene.add( this.wireMesh )
  if (this.surfaceMesh) scene.add( this.surfaceMesh )
}

Mesh.prototype.setPosition = function(x, y, z) {
  if (this.wireMesh) this.wireMesh.position = new this.THREE.Vector3(x, y, z)
  if (this.surfaceMesh) this.surfaceMesh.position = new this.THREE.Vector3(x, y, z)
}

Mesh.prototype.faceVertexUv = function(i) {
  var vs = [
    this.meshed.vertices[i*4+0],
    this.meshed.vertices[i*4+1],
    this.meshed.vertices[i*4+2],
    this.meshed.vertices[i*4+3]
  ]
  var spans = {
    x0: vs[0][0] - vs[1][0],
    x1: vs[1][0] - vs[2][0],
    y0: vs[0][1] - vs[1][1],
    y1: vs[1][1] - vs[2][1],
    z0: vs[0][2] - vs[1][2],
    z1: vs[1][2] - vs[2][2]
  }
  var size = {
    x: Math.max(Math.abs(spans.x0), Math.abs(spans.x1)),
    y: Math.max(Math.abs(spans.y0), Math.abs(spans.y1)),
    z: Math.max(Math.abs(spans.z0), Math.abs(spans.z1))
  }
  if (size.x === 0) {
    if (spans.y0 > spans.y1) {
      var width = size.y
      var height = size.z
    }
    else {
      var width = size.z
      var height = size.y
    }
  }
  if (size.y === 0) {
    if (spans.x0 > spans.x1) {
      var width = size.x
      var height = size.z
    }
    else {
      var width = size.z
      var height = size.x
    }
  }
  if (size.z === 0) {
    if (spans.x0 > spans.x1) {
      var width = size.x
      var height = size.y
    }
    else {
      var width = size.y
      var height = size.x
    }
  }
  if ((size.z === 0 && spans.x0 < spans.x1) || (size.x === 0 && spans.y0 > spans.y1)) {
    return [
      new this.THREE.Vector2(height, 0),
      new this.THREE.Vector2(0, 0),
      new this.THREE.Vector2(0, width),
      new this.THREE.Vector2(height, width)
    ]
  } else {
    return [
      new this.THREE.Vector2(0, 0),
      new this.THREE.Vector2(0, height),
      new this.THREE.Vector2(width, height),
      new this.THREE.Vector2(width, 0)
    ]
  }
}
;
