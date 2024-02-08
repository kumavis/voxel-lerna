module.exports = {
  findFloor,
  pointsInside3D,
  positiveModulus,
}

function hasClearance (pos, getBlock, minHeight = 1) {
  const [x, yStart, z] = pos
  const yEnd = yStart + minHeight
  for (let y = yStart; y < yEnd; y++) {
    if (getBlock([x, y, z]) !== 0) {
      return false
    }
  }
  return true
}

function findFloor (startPos, getBlock, minHeight = 1) {
  // we add a cache to avoid redundant calls to getBlock
  const voxelCache = new Map()
  const getBlockCached = (pos) => {
    const key = pos.join('|')
    if (voxelCache.has(key)) {
      return voxelCache.get(key)
    } else {
      const result = getBlock(pos)
      voxelCache.set(key, result)
      return result
    }
  }
  // first check for clearance
  // if no clearance, move up until there is clearance
  // if there is clearance, move down until there is no clearance
  const [x, y, z] = startPos
  if (hasClearance([x, y, z], getBlockCached, minHeight)) {
    let newY = y
    while (hasClearance([x, newY, z], getBlockCached, minHeight)) {
      newY--
    }
    // we went one step too far
    return [x, newY + 1, z]
  } else {
    let newY = y
    while (!hasClearance([x, newY, z], getBlockCached, minHeight)) {
      newY++
    }
    return [x, newY, z]
  }
}

// low and high inclusive
function* pointsInside3D(low, high) {
  const [lowX, lowY, lowZ] = low
  const highX = high[0] + 1
  const highY = high[1] + 1
  const highZ = high[2] + 1
  for (let z = lowZ; z < highZ; z++) {
    for (let y = lowY; y < highY; y++) {
      for (let x = lowX; x < highX; x++) {
        yield [x, y, z]
      }
    }
  }
}

function positiveModulus (n, m) {
  return ((n % m) + m) % m;
}
// // low inclusive, high exclusive
// function generateChunkByVoxel(low, high, getVoxelValueForPos) {
//   const [lowX, lowY, lowZ] = low
//   const [highX, highY, highZ] = high
//   const dims = [highX-lowX, highY-lowY, highZ-lowZ]
//   const elementCount = dims[0] * dims[1] * dims[2]
//   const data = ndarray(new Uint16Array(elementCount), dims)
//   for (let z = lowZ; z < highZ; z++)
//     for (let y = lowY; y < highY; y++)
//       for(let x = lowX; x < highX; x++) {
//         data.set(x-lowX, y-lowY, z-lowZ, getVoxelValueForPos(x, y, z))
//       }
//   return data
// }

// function calculateCumulativeBoundingBox(rootObject) {
//   const cumulativeBoundingBox = new THREE.Box3();
//   const tempBox = new THREE.Box3();
//   const tempMat = new THREE.Matrix4();

//   rootObject.updateMatrixWorld(true); // Ensure the world matrix is up to date

//   // Function to traverse and process each object
//   rootObject.traverse((object) => {
//       if (object.geometry) {
//           object.geometry.computeBoundingBox(); // Ensure the geometry's bounding box is computed
//           tempBox.copy(object.geometry.boundingBox); // Copy the geometry's bounding box to tempBox
//           tempMat.copy(object.matrixWorld); // Get the object's world matrix
//           tempBox.applyMatrix4(tempMat); // Apply the world matrix to the bounding box
//           cumulativeBoundingBox.union(tempBox); // Merge with the cumulative bounding box
//       }
//   });

//   return cumulativeBoundingBox;
// }