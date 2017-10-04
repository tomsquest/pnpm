'use strict'
let _drivelist
try {
  _drivelist = require('zkochan-drivelist')
} catch (err) {
  // In case drivelist could not be built
  _drivelist = null
}

const promisify = require('util.promisify')
const once = require('once')
const R = require('ramda')
const isSubdir = require('is-subdir')

const drivelist = _drivelist
  ? promisify(_drivelist.list)
  : () => Promise.reject(new Error('drivelist could not be built on this system'))
const sortByMountpoint = R.sortBy(R.prop('mountpointPath'))
const drivesByMountpoints = once(_drivesByMountpoints)

module.exports = function driveByPath (path) {
  if (typeof path !== 'string') {
    throw new TypeError(`Expected \`path\` to be of type \`string\`, got \`${typeof path}\``)
  }
  return drivesByMountpoints()
    .then(drives => {
      const match = drives.find(drive => isSubdir(drive.mountpointPath, path))
      if (!match) {
        return null
      }
      return Object.assign({}, match.drive, {
        matchedMountpointPath: match.mountpointPath
      })
    })
}

function _drivesByMountpoints () {
  return drivelist()
    .then(groupedDrives => {
      return sortByMountpoint(
        R.unnest(
          groupedDrives.map(drive =>
            drive.mountpoints.map(mountpoint => ({
              mountpointPath: mountpoint.path,
              drive
            }))
          )
        )
      )
      .reverse()
      // The longer mountpoints are checked first.
      // On Linux there is always a / mountpoint and all the other volumes
      // are started with / as well
    })
}
