const THREE = require('three')
const { Mesh } = require("voxel-mesh")
const { mesher } = require('./mesher.js')

module.exports = makeChunkView

function makeChunkView(opts = {}) {
  const chunkController = opts.chunkController
  if (!chunkController) {
    throw new Error('chunkViewer requires a chunkController')
  }

  const chunkContainer = new THREE.Group()
  chunkContainer.name = 'voxel chunk group'
  const chunkMeshes = new Map()

  const updateChunkMesh = (location, chunk) => {
    const chunkId = chunkController.getChunkIdFromLocation(location)
    // remove old mesh
    const oldMesh = chunkMeshes.get(chunkId)
    if (oldMesh) {
      chunkContainer.remove(oldMesh)
    }
    // create new mesh
    const chunkMesh = makeVoxelMesh(chunk)
    chunkMeshes.set(chunkId, chunkMesh)
    const [lowerCornerPos] = chunkController.getChunkBoundsByLocation(location)
    chunkMesh.position.set(...lowerCornerPos)
    chunkContainer.add(chunkMesh)
  }

  chunkController.events.on('chunkUpdated', (location, chunk) => {
    // const start = performance.now()
    updateChunkMesh(location, chunk)
    // const end = performance.now()
    // console.log('chunk updated in', end - start, 'ms')
  })

  return {
    chunkContainer,
  }
}

function makeVoxelMesh (chunk) {
  var scale = new THREE.Vector3(1, 1, 1)
  var mesh = new Mesh(chunk, mesher, scale, THREE)
  const chunkMesh = mesh.createSurfaceMesh()
  return chunkMesh
}
