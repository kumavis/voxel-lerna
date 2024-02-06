const EventEmitter = require('events')
const raycast = require('voxel-raycast')

module.exports = makeChunkerController

function makeChunkerController (opts = {}) {
  const events = new EventEmitter()
  // how many voxels in a chunk
  const chunkSize = opts.chunkSize || 32

  // "location" is where the chunk is relative to other chunks
  // "position" is where the chunk is in the world
  // "chunkId" is a string that uniquely identifies a chunk
  
  const chunks = new Map()


  const getChunkById = (chunkId) => {
    return chunks.get(chunkId)
  }
  const getChunkIdFromLocation = ([x, y, z]) => {
    return `${x}|${y}|${z}`
  }
  
  const getChunkAtLocation = (location) => {
    const chunkId = getChunkIdFromLocation(location)
    return chunks.get(chunkId)
  }
  const setChunkAtLocation = (location, chunk) => {
    // validate chunk
    if (chunk.shape?.some(size => size !== chunkSize)) {
      throw new Error('chunk size does not match chunker size')
    }
    const chunkId = getChunkIdFromLocation(location)
    chunks.set(chunkId, chunk)
    events.emit('chunkUpdated', location, chunk)
  }


  const getChunkLocationFromPosition = ([x, y, z]) => {
    return [
      Math.floor(x / chunkSize),
      Math.floor(y / chunkSize),
      Math.floor(z / chunkSize),
    ]
  }
  const getChunkIdFromPosition = (position) => {
    const location = getChunkLocationFromPosition(position)
    return getChunkIdFromLocation(location)
  }
  const getChunkAtPosition = (position) => {
    const location = getChunkLocationFromPosition(position)
    return getChunkAtLocation(location)
  }
  // this returns the position of the lower and upper bounds of the chunk
  const getChunkBoundsByLocation = (location) => {
    const [x, y, z] = location
    const low = [x * chunkSize, y * chunkSize, z * chunkSize]
    const high = [(x + 1) * chunkSize, (y + 1) * chunkSize, (z + 1) * chunkSize]
    return [low, high]
  }
  const getLocalVoxelPosition = (position) => {
    return position.map(n => positiveModulus(Math.floor(n), chunkSize))
  }
  const getVoxelAtPosition = (position) => {
    const chunk = getChunkAtPosition(position)
    if (chunk === undefined) {
      return undefined
    }
    const voxelPosition = getLocalVoxelPosition(position)
    return chunk.get(...voxelPosition)
  }
  const setVoxelAtPosition = (position, value) => {
    const location = getChunkLocationFromPosition(position)
    const chunk = getChunkAtLocation(location)
    if (chunk === undefined) {
      return undefined
    }
    const voxelPosition = getLocalVoxelPosition(position)
    chunk.set(...voxelPosition, value)
    events.emit('chunkUpdated', location, chunk)
  }

  const raycastVoxel = (startPosition, startVector, distance) => {
    const epilson = 1e-8
    const hitNormal = [0, 0, 0]
    const hitPosition = [0, 0, 0]
    const getBlock = (x, y, z) => {
      return chunkController.getVoxelAtPosition([x,y,z])
    }
    const hitBlock = raycast({ getBlock }, startPosition, startVector, distance, hitPosition, hitNormal, epilson)
    if (hitBlock === 0) {
      return undefined
    }
    
    return {
      position: hitPosition,
      normal: hitNormal,
      block: hitBlock,
    }
  }

  return {
    events,

    getChunkById,
    getChunkIdFromLocation,
    getChunkIdFromPosition,

    getChunkAtLocation,
    setChunkAtLocation,
    getChunkAtPosition,
    getChunkBoundsByLocation,

    getChunkLocationFromPosition,
    getVoxelAtPosition,
    setVoxelAtPosition,

    raycastVoxel,
  }
}

function positiveModulus (n, m) {
  return ((n % m) + m) % m;
}