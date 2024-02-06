//Naive meshing (with face culling)
function CulledMesh(chunkData, chunkShape, chunk) {
  //Precalculate direction vectors for convenience
  var dir = new Array(3);
  for (var i = 0; i < 3; ++i) {
    dir[i] = [[0, 0, 0], [0, 0, 0]];
    dir[i][0][(i + 1) % 3] = 1;
    dir[i][1][(i + 2) % 3] = 1;
  }

  // this fixes an ZYX / XYZ ordering issue
  const lookupChunkData = (n) => {
    // console.log('lookupChunkData', n, chunkData[n])
    // 16 should be (1,0,0) but actually is (0,0,1)
    // 20 should be (1,1,0) but actually is (0,1,1)
    const oldZ = n % chunkShape[0]
    const oldY = Math.floor(n / chunkShape[0]) % chunkShape[1]
    const oldX = Math.floor(n / (chunkShape[0] * chunkShape[1]))

    // fix coordinate ordering
    const newX = oldZ
    const newY = oldY
    const newZ = oldX

    return chunk.get(newX, newY, newZ)
  }

  //March over the volume
  var vertices = []
    , faces = []
    , x = [0, 0, 0]
    , B = [[false, true]    //Incrementally update bounds (this is a bit ugly)
      , [false, true]
      , [false, true]]
    , n = -chunkShape[0] * chunkShape[1];
  for (B[2] = [false, true], x[2] = -1; x[2] < chunkShape[2]; B[2] = [true, (++x[2] < chunkShape[2] - 1)])
    for (n -= chunkShape[0], B[1] = [false, true], x[1] = -1; x[1] < chunkShape[1]; B[1] = [true, (++x[1] < chunkShape[1] - 1)])
      for (n -= 1, B[0] = [false, true], x[0] = -1; x[0] < chunkShape[0]; B[0] = [true, (++x[0] < chunkShape[0] - 1)], ++n) {
        //Read current voxel and 3 neighboring voxels using bounds check results
        var p = (B[0][0] && B[1][0] && B[2][0]) ? lookupChunkData(n) : 0
          , b = [(B[0][1] && B[1][0] && B[2][0]) ? lookupChunkData(n + 1) : 0
            , (B[0][0] && B[1][1] && B[2][0]) ? lookupChunkData(n + chunkShape[0]) : 0
            , (B[0][0] && B[1][0] && B[2][1]) ? lookupChunkData(n + chunkShape[0] * chunkShape[1]) : 0
          ];
        //Generate faces
        for (var d = 0; d < 3; ++d)
          if ((!!p) !== (!!b[d])) {
            var s = !p ? 1 : 0;
            var t = [x[0], x[1], x[2]]
              , u = dir[d][s]
              , v = dir[d][s ^ 1];
            ++t[d];

            var vertex_count = vertices.length;
            vertices.push([t[0], t[1], t[2]]);
            vertices.push([t[0] + u[0], t[1] + u[1], t[2] + u[2]]);
            vertices.push([t[0] + u[0] + v[0], t[1] + u[1] + v[1], t[2] + u[2] + v[2]]);
            vertices.push([t[0] + v[0], t[1] + v[1], t[2] + v[2]]);
            faces.push([vertex_count, vertex_count + 1, vertex_count + 2, vertex_count + 3, s ? b[d] : p]);
          }
      }
  return { vertices, faces };
}


if (exports) {
  exports.mesher = CulledMesh;
}
