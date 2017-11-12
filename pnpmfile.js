'use strict'
module.exports = {
  hooks: {
    readPackage
  }
}

function readPackage (pkg) {
  if (pkg.name == 'pnpm-default-reporter') {
    pkg.dependencies['log-update'] = 'zkochan/log-update'
  }
  return pkg
}
