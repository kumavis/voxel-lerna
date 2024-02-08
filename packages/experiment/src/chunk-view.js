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
  // chunks pending re-meshing
  const pendingChunks = new Set()

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
    const chunkId = chunkController.getChunkIdFromLocation(location)
    pendingChunks.add(chunkId)
  })

  const update = () => {
    if (pendingChunks.size === 0) return
    for (const chunkId of pendingChunks) {
      const location = chunkController.getLocationFromChunkId(chunkId)
      const chunk = chunkController.getChunkAtLocation(location)
      updateChunkMesh(location, chunk)
    }
    pendingChunks.clear()
  }

  return {
    chunkContainer,
    update,
  }
}

function makeVoxelMesh (chunk) {
  var scale = new THREE.Vector3(1, 1, 1)
  var mesh = new Mesh(chunk, mesher, scale, THREE)
  const chunkMeshContainer = new THREE.Group()
  const chunkMesh = mesh.createSurfaceMesh()
  const chunkWireframe = mesh.createWireMesh(0x112233, {
    transparent: true,
    opacity: 0.1,
  })
  chunkMeshContainer.add(chunkMesh)
  chunkMeshContainer.add(chunkWireframe)
  return chunkMeshContainer
}
