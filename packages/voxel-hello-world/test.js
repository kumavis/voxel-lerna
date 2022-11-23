require('./')(null, (game, avatar, defaultSetup) => {
  // const GamePrototype = Reflect.getPrototypeOf(game)
  // const showChunkSuper = GamePrototype.showChunk
  // GamePrototype.showChunk = function(chunk) {
  //   const mesh = showChunkSuper.call(this, chunk)
  //   var chunkIndex = chunk.position.join('|')
  //   console.log('chunk index', chunkIndex)
  //   // var bounds = this.voxels.getBounds.apply(this.voxels, chunk.position)
  //   // var scale = new THREE.Vector3(1, 1, 1)
  //   // var mesh = voxelMesh(chunk, this.mesher, scale, this.THREE)
  //   // this.voxels.chunks[chunkIndex] = chunk
  //   // if (this.voxels.meshes[chunkIndex]) {
  //   //   if (this.voxels.meshes[chunkIndex].surfaceMesh) this.scene.remove(this.voxels.meshes[chunkIndex].surfaceMesh)
  //   //   if (this.voxels.meshes[chunkIndex].wireMesh) this.scene.remove(this.voxels.meshes[chunkIndex].wireMesh)
  //   // }
  //   // this.voxels.meshes[chunkIndex] = mesh
  //   // if (this.isClient) {
  //   //   if (this.meshType === 'wireMesh') mesh.createWireMesh()
  //   //   else mesh.createSurfaceMesh(this.materials.material)
  //   //   this.materials.paint(mesh)
  //   // }
  //   // mesh.setPosition(bounds[0][0], bounds[0][1], bounds[0][2])
  //   // mesh.addToScene(this.scene)
  //   // this.emit('renderChunk', chunk)
  //   return mesh
  // }
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