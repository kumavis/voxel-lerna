const { noise } = require('perlin')
const ndarray = require('ndarray')
const { positiveModulus } = require('./voxel-util')

module.exports = function(seed, chunkSize, floor, ceiling, divisor) {
  floor = floor || 0
  ceiling = ceiling || 20 // minecraft's limit
  divisor = divisor || 50
  noise.seed(seed)
  return function generateChunk(position) {
    const startX = position[0] * chunkSize
    const startY = position[1] * chunkSize
    const startZ = position[2] * chunkSize
    const chunkData = new Int8Array(chunkSize * chunkSize * chunkSize)
    const chunk = ndarray(chunkData, [chunkSize, chunkSize, chunkSize])
    pointsInside2D(startX, startZ, chunkSize, function(x, z) {
      const n = noise.simplex2(x / divisor , z / divisor)
      // "hula operator" rounds to the nearest integer in the direction of zero,
      // it is Math.floor for positive numbers and Math.ceil for negative numbers
      const y = ~~scale(n, -1, 1, floor, ceiling)
      if (
        // this seems wrong
        y === floor ||
        // if y is in chunk
        startY < y && y < startY + chunkSize
      ) {
        const xVoxelPos = positiveModulus(x, chunkSize)
        const yEndVoxelPos = positiveModulus(y, chunkSize)
        const zVoxelPos = positiveModulus(z, chunkSize)
        // fill in all below establish y
        for (let yVoxelPos = 0; yVoxelPos <= yEndVoxelPos; yVoxelPos++) {
          chunk.set(xVoxelPos, yVoxelPos, zVoxelPos, 1)
        }
      }
    })
    return chunk
  }
}

function pointsInside2D(startX, startY, width, func) {
  for (let x = startX; x < startX + width; x++)
    for (let y = startY; y < startY + width; y++)
      func(x, y)
}

function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}
