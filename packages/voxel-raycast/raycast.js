"use strict"

var EPSILON = 1e-8

function traceRay(voxels, origin, direction, max_d, hit_pos, hit_norm) {
  var ox = origin[0]
    , oy = origin[1]
    , oz = origin[2]
    , px = origin[0]
    , py = origin[1]
    , pz = origin[2]
    , dx = direction[0]
    , dy = direction[1]
    , dz = direction[2]
    , ds = Math.sqrt(dx*dx + dy*dy + dz*dz)
    , t = 0.0
    , nx=0, ny=0, nz=0
    , ix, iy, iz
    , fx, fy, fz
    , ox, oy, oz
    , ex, ey, ez
    , b, step, min_step
  if(ds < EPSILON) {
    if(hit_pos) {
      hit_pos[0] = hit_pos[1] = hit_pos[2]
    }
    if(hit_norm) {
      hit_norm[0] = hit_norm[1] = hit_norm[2]
    }
    return 0;
  }
  dx /= ds
  dy /= ds
  dz /= ds
  if(typeof(max_d) === "undefined") {
    max_d = 64.0
  }
  //Step block-by-block along ray
  while(t <= max_d) {
    ox = px + t * dx
    oy = py + t * dy
    oz = pz + t * dz
    ix = Math.floor(ox)
    iy = Math.floor(oy)
    iz = Math.floor(oz)
    fx = ox - ix
    fy = oy - iy
    fz = oz - iz
    b = voxels.getBlock(ix, iy, iz)
    if(b) {
      if(hit_pos) {
        //Clamp to face on hit
        hit_pos[0] = fx < EPSILON ? +ix : ox
        hit_pos[1] = fy < EPSILON ? +iy : oy
        hit_pos[2] = fz < EPSILON ? +iz : oz
      }
      if(hit_norm) {
        hit_norm[0] = nx
        hit_norm[1] = ny
        hit_norm[2] = nz
      }
      return b
    }
    //Check edge cases
    min_step = EPSILON * (1.0 + t)
    if(t > min_step) {
      ex = nx < 0 ? fx <= min_step : fx >= 1.0 - min_step
      ey = ny < 0 ? fy <= min_step : fy >= 1.0 - min_step
      ez = nz < 0 ? fz <= min_step : fz >= 1.0 - min_step
      if(ex && ey && ez) {
        b = voxels.getBlock(ix+nx, iy+ny, iz) ||
            voxels.getBlock(ix, iy+ny, iz+nz) ||
            voxels.getBlock(ix+nx, iy, iz+nz)
        if(b) {
          if(hit_pos) {
            hit_pos[0] = nx < 0 ? ix-EPSILON : ix + 1.0-EPSILON
            hit_pos[1] = ny < 0 ? iy-EPSILON : iy + 1.0-EPSILON
            hit_pos[2] = nz < 0 ? iz-EPSILON : iz + 1.0-EPSILON
          }
          if(hit_norm) {
            hit_norm[0] = nx
            hit_norm[1] = ny
            hit_norm[2] = nz
          }
          return b
        }
      }
      if(ex && (ey || ez)) {
        b = voxels.getBlock(ix+nx, iy, iz)
        if(b) {
          if(hit_pos) {
            hit_pos[0] = nx < 0 ? ix-EPSILON : ix + 1.0-EPSILON
            hit_pos[1] = fy < EPSILON ? +iy : oy
            hit_pos[2] = fz < EPSILON ? +iz : oz
          }
          if(hit_norm) {
            hit_norm[0] = nx
            hit_norm[1] = ny
            hit_norm[2] = nz
          }
          return b
        }
      }
      if(ey && (ex || ez)) {
        b = voxels.getBlock(ix, iy+ny, iz)
        if(b) {
          if(hit_pos) {
            hit_pos[0] = fx < EPSILON ? +ix : ox
            hit_pos[1] = ny < 0 ? iy-EPSILON : iy + 1.0-EPSILON
            hit_pos[2] = fz < EPSILON ? +iz : oz
          }
          if(hit_norm) {
            hit_norm[0] = nx
            hit_norm[1] = ny
            hit_norm[2] = nz
          }
          return b
        }
      }
      if(ez && (ex || ey)) {
        b = voxels.getBlock(ix, iy, iz+nz)
        if(b) {
          if(hit_pos) {
            hit_pos[0] = fx < EPSILON ? +ix : ox
            hit_pos[1] = fy < EPSILON ? +iy : oy
            hit_pos[2] = nz < 0 ? iz-EPSILON : iz + 1.0-EPSILON
          }
          if(hit_norm) {
            hit_norm[0] = nx
            hit_norm[1] = ny
            hit_norm[2] = nz
          }
          return b
        }
      }
    }
    //Walk to next face of cube along ray
    nx = ny = nz = 0
    step = 2.0
    if(dx < -EPSILON) {
      var s = -fx/dx
      nx = 1
      step = s
    }
    if(dx > EPSILON) {
      var s = (1.0-fx)/dx
      nx = -1
      step = s
    }
    if(dy < -EPSILON) {
      var s = -fy/dy
      if(s < step-min_step) {
        nx = 0
        ny = 1
        step = s
      } else if(s < step+min_step) {
        ny = 1
      }
    }
    if(dy > EPSILON) {
      var s = (1.0-fy)/dy
      if(s < step-min_step) {
        nx = 0
        ny = -1
        step = s
      } else if(s < step+min_step) {
        ny = -1
      }
    }
    if(dz < -EPSILON) {
      var s = -fz/dz
      if(s < step-min_step) {
        nx = ny = 0
        nz = 1
        step = s
      } else if(s < step+min_step) {
        nz = 1
      }
    }
    if(dz > EPSILON) {
      var s = (1.0-fz)/dz
      if(s < step-min_step) {
        nx = ny = 0
        nz = -1
        step = s
      } else if(s < step+min_step) {
        nz = -1
      }
    }
    if(step > max_d - t) {
      step = max_d - t - min_step
    }
    if(step < min_step) {
      step = min_step
    }
    t += step
  }
  if(hit_pos) {
    hit_pos[0] = ox;
    hit_pos[1] = oy;
    hit_pos[2] = oz;
  }
  if(hit_norm) {
    hit_norm[0] = hit_norm[1] = hit_norm[2] = 0;
  }
  return 0
}

module.exports = traceRay