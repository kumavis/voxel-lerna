require('./')(null, (game, avatar, defaultSetup) => {
  let miniMeshes = {}
  game.on('renderChunk', (chunk) => {
    const chunkIndex = chunk.position.join('|')
    console.log('renderChunk', chunkIndex)
    if (miniMeshes[chunkIndex]) {
      game.scene.remove(miniMeshes[chunkIndex])
    }
    const mesh = game.voxels.meshes[chunkIndex]
    const miniMesh = mesh.surfaceMesh.clone()
    miniMeshes[chunkIndex] = miniMesh
    miniMesh.scale.set(0.1, 0.1, 0.1)
    miniMesh.position.y += 4
    game.scene.add(miniMesh)
  })
  defaultSetup(game, avatar)
  globalThis.avatar = avatar
})