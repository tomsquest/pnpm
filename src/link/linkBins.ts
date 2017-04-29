import path = require('path')
import normalizePath = require('normalize-path')
import fs = require('mz/fs')
import mkdirp = require('mkdirp-promise')
import safeReadPkg from '../fs/safeReadPkg'
import getPkgDirs from '../fs/getPkgDirs'
import binify from '../binify'
import isWindows = require('is-windows')
import thenify = require('thenify')
import cmdShimCB = require('cmd-shim')
import logger from 'pnpm-logger'
import Module = require('module')
import symlinkDir from 'symlink-dir'

const cmdShim = thenify(cmdShimCB)

const IS_WINDOWS = isWindows()

export default async function linkAllBins (modules: string, binPath: string, exceptPkgName?: string) {
  const pkgDirs = await getPkgDirs(modules)
  return Promise.all(
    pkgDirs
      .map(pkgDir => normalizePath(pkgDir))
      .filter(pkgDir => !exceptPkgName || !pkgDir.endsWith(`/${exceptPkgName}`))
      .map((pkgDir: string) => linkPkgBins(pkgDir, binPath))
  )
}

/**
 * Links executable into `node_modules/.bin`.
 */
export async function linkPkgBins (target: string, binPath: string) {
  const pkg = await safeReadPkg(target)

  if (!pkg) {
    logger.warn(`There's a directory in node_modules without package.json: ${target}`)
    return
  }

  const cmds = await binify(pkg, target)

  await mkdirp(binPath)
  const linkBin = IS_WINDOWS ? cmdShim : linkOnNonWindows
  await Promise.all(cmds.map(async cmd => {
    const externalBinPath = path.join(binPath, cmd.name)

    return linkBin(cmd.path, externalBinPath)
  }))
}

async function linkOnNonWindows (src: string, dest: string) {
  await symlinkDir(src, dest)
  await fs.chmod(dest, '755')
}
