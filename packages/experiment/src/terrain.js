const { noise } = require('perlin')
const ndarray = require('ndarray')

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
    pointsInside(startX, startZ, chunkSize, function(x, z) {
      const n = noise.simplex2(x / divisor , z / divisor)
      const y = ~~scale(n, -1, 1, floor, ceiling)
      if (y === floor || startY < y && y < startY + chunkSize) {
        const xidx = Math.abs((chunkSize + x % chunkSize) % chunkSize)
        const yidx = Math.abs((chunkSize + y % chunkSize) % chunkSize)
        const zidx = Math.abs((chunkSize + z % chunkSize) % chunkSize)
        chunk.set(xidx, yidx, zidx, 1)
      }
    })
    return chunk
  }
}

function pointsInside(startX, startY, width, func) {
  for (let x = startX; x < startX + width; x++)
    for (let y = startY; y < startY + width; y++)
      func(x, y)
}

function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}
