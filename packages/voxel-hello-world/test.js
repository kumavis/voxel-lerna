require('./')(null, (game, avatar, defaultSetup) => {
  let miniMeshes = {}
  game.on('renderChunk', (chunk) => {
    const chunkIndex = chunk.position.join('|')
    // manage a cute "mini mesh" clone of each chunk
    if (miniMeshes[chunkIndex]) {
      game.scene.remove(miniMeshes[chunkIndex])
    }
    const mesh = game.voxels.meshes[chunkIndex]
    const miniMesh = mesh.surfaceMesh.clone()
    miniMeshes[chunkIndex] = miniMesh
    // im not sure why the scale is like this
    const scale = 1/32
    miniMesh.scale.set(scale, scale, scale)
    miniMesh.position.y += 2
    game.scene.add(miniMesh)
  })
  defaultSetup(game, avatar)
  globalThis.avatar = avatar
})