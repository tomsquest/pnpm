import path = require('path')
import {Resolution, PackageSpec} from '../resolve'
import {PnpmError} from '../errorTypes'
import logger from 'pnpm-logger'
import loadYamlFile = require('load-yaml-file')
import writeYamlFile = require('write-yaml-file')
import R = require('ramda')
import rimraf = require('rimraf-then')
import isCI = require('is-ci')
import getRegistryName from '../resolve/npm/getRegistryName'
import npa = require('npm-package-arg')
import pnpmPkgJson from '../pnpmPkgJson'
import {Package} from '../types'

const lockfileLogger = logger('node_modules_lock')

export const LOCKFILE_FILENAME = 'node_modules_lock.yaml'
export const PRIVATE_LOCKFILE_FILENAME = path.join('node_modules', '.node_modules_lock.yaml')
const LOCKFILE_VERSION = 3
const CREATED_WITH = `${pnpmPkgJson.name}@${pnpmPkgJson.version}`

class LockfileBreakingChangeError extends PnpmError {
  constructor (filename: string) {
    super('SHRINKWRAP_BREAKING_CHANGE', `Lockfile file ${filename} not compatible with current pnpm`)
    this.filename = filename
  }
  filename: string
}

function getDefaultLockfile (registry: string) {
  return {
    version: LOCKFILE_VERSION,
    createdWith: CREATED_WITH,
    specifiers: {},
    dependencies: {},
    packages: {},
    registry,
  }
}

export type Lockfile = {
  version: number,
  createdWith: string,
  specifiers: ResolvedDependencies,
  dependencies: ResolvedDependencies,
  packages: ResolvedPackages,
  registry: string,
}

export type ResolvedPackages = {
  [pkgId: string]: DependencyLock,
}

export type ResolutionLock = Resolution | {
  integrity: string,
}

export type DependencyLock = {
  id?: string,
  dev?: true,
  optional?: true,
  resolution: ResolutionLock,
  dependencies?: ResolvedDependencies,
}

/*** @example
 * {
 *   "foo": "registry.npmjs.org/foo/1.0.1"
 * }
 */
export type ResolvedDependencies = {
  [pkgName: string]: string,
}

export async function readPrivate (
  pkgPath: string,
  opts: {
    force: boolean,
    registry: string,
  }
): Promise<Lockfile> {
  const lockfilePath = path.join(pkgPath, PRIVATE_LOCKFILE_FILENAME)
  let lockfile
  try {
    lockfile = await loadYamlFile<Lockfile>(lockfilePath)
  } catch (err) {
    if ((<NodeJS.ErrnoException>err).code !== 'ENOENT') {
      throw err
    }
    return getDefaultLockfile(opts.registry)
  }
  if (lockfile && lockfile.version === LOCKFILE_VERSION) {
    return lockfile
  }
  if (opts.force || isCI) {
    lockfileLogger.warn(`Ignoring not compatible lockfile file at ${lockfilePath}`)
    return getDefaultLockfile(opts.registry)
  }
  throw new LockfileBreakingChangeError(lockfilePath)
}

export async function read (
  pkgPath: string,
  opts: {
    force: boolean,
    registry: string,
}): Promise<Lockfile> {
  const lockfilePath = path.join(pkgPath, LOCKFILE_FILENAME)
  let lockfile
  try {
    lockfile = await loadYamlFile<Lockfile>(lockfilePath)
  } catch (err) {
    if ((<NodeJS.ErrnoException>err).code !== 'ENOENT') {
      throw err
    }
    return getDefaultLockfile(opts.registry)
  }
  if (lockfile && lockfile.version === LOCKFILE_VERSION) {
    return lockfile
  }
  if (opts.force || isCI) {
    lockfileLogger.warn(`Ignoring not compatible lockfile file at ${lockfilePath}`)
    return getDefaultLockfile(opts.registry)
  }
  throw new LockfileBreakingChangeError(lockfilePath)
}

export function save (pkgPath: string, lockfile: Lockfile) {
  const lockfilePath = path.join(pkgPath, LOCKFILE_FILENAME)
  const privateLockfilePath = path.join(pkgPath, PRIVATE_LOCKFILE_FILENAME)

  // empty lockfile is not saved
  if (Object.keys(lockfile.dependencies).length === 0) {
    return Promise.all([
      rimraf(lockfilePath),
      rimraf(privateLockfilePath),
    ])
  }

  const formatOpts = {
    sortKeys: true,
    lineWidth: 1000,
    noCompatMode: true,
  }

  return Promise.all([
    writeYamlFile(lockfilePath, lockfile, formatOpts),
    writeYamlFile(privateLockfilePath, lockfile, formatOpts),
  ])
}

export function prune (lockfile: Lockfile, pkg: Package): Lockfile {
  const packages: ResolvedPackages = {}
  const optionalDependencies = R.keys(pkg.optionalDependencies)
  const dependencies = R.difference(R.keys(pkg.dependencies), optionalDependencies)
  const devDependencies = R.difference(R.difference(R.keys(pkg.devDependencies), optionalDependencies), dependencies)
  copyDependencyTree(packages, lockfile, {
    registry: lockfile.registry,
    dependencies: devDependencies,
    dev: true,
  })
  copyDependencyTree(packages, lockfile, {
    registry: lockfile.registry,
    dependencies: optionalDependencies,
    optional: true,
  })
  copyDependencyTree(packages, lockfile, {
    registry: lockfile.registry,
    dependencies,
  })

  const allDeps = R.reduce(R.union, [], [optionalDependencies, devDependencies, dependencies])
  const specifiers: ResolvedDependencies = {}
  const allDependencies: ResolvedDependencies = {}

  R.keys(lockfile.specifiers).forEach(depName => {
    if (allDeps.indexOf(depName) === -1) return
    specifiers[depName] = lockfile.specifiers[depName]
    allDependencies[depName] = lockfile.dependencies[depName]
  })

  return {
    version: LOCKFILE_VERSION,
    createdWith: lockfile.createdWith || CREATED_WITH,
    specifiers,
    registry: lockfile.registry,
    dependencies: allDependencies,
    packages,
  }
}

function copyDependencyTree (
  resolvedPackages: ResolvedPackages,
  lockfile: Lockfile,
  opts: {
    registry: string,
    dependencies: string[],
    dev?: boolean,
    optional?: boolean,
  }
): ResolvedPackages {
  let pkgIds: string[] = opts.dependencies
    .map((pkgName: string) => getPkgShortId(lockfile.dependencies[pkgName], pkgName))
  const checked = new Set<string>()

  while (pkgIds.length) {
    let nextPkgIds: string[] = []
    for (let pkgId of pkgIds) {
      if (checked.has(pkgId)) continue
      checked.add(pkgId)
      if (!lockfile.packages[pkgId]) {
        logger.warn(`Cannot find resolution of ${pkgId} in lockfile file`)
        continue
      }
      const depShr = lockfile.packages[pkgId]
      resolvedPackages[pkgId] = depShr
      if (opts.optional) {
        depShr.optional = true
      } else {
        delete depShr.optional
      }
      if (opts.dev) {
        depShr.dev = true
      } else {
        delete depShr.dev
      }
      const newDependencies = R.keys(depShr.dependencies)
        .map((pkgName: string) => getPkgShortId(<string>(depShr.dependencies && depShr.dependencies[pkgName]), pkgName))
        .filter((newPkgId: string) => !checked.has(newPkgId))
      nextPkgIds = R.union(nextPkgIds, newDependencies)
    }
    pkgIds = nextPkgIds
  }
  return resolvedPackages
}

export function shortIdToFullId (
  shortId: string,
  registry: string
) {
  if (shortId[0] === '/') {
    const registryName = getRegistryName(registry)
    return `${registryName}${shortId}`
  }
  return shortId
}

export function getPkgShortId (
  reference: string,
  pkgName: string
) {
  if (reference.indexOf('/') === -1) {
    return `/${pkgName}/${reference}`
  }
  return reference
}

export function getPkgId (
  reference: string,
  pkgName: string,
  registry: string
) {
  if (reference.indexOf('/') === -1) {
    const registryName = getRegistryName(registry)
    return `${registryName}/${pkgName}/${reference}`
  }
  return reference
}

export function pkgIdToRef (
  pkgId: string,
  pkgName: string,
  resolution: Resolution,
  standardRegistry: string
) {
  if (resolution.type) return pkgId

  const registryName = getRegistryName(standardRegistry)
  if (pkgId.startsWith(`${registryName}/`)) {
    const ref = pkgId.replace(`${registryName}/${pkgName}/`, '')
    if (ref.indexOf('/') === -1) return ref
    return pkgId.replace(`${registryName}/`, '/')
  }
  return pkgId
}

export function pkgShortId (
  pkgId: string,
  standardRegistry: string
) {
  const registryName = getRegistryName(standardRegistry)

  if (pkgId.startsWith(`${registryName}/`)) {
    return pkgId.substr(pkgId.indexOf('/'))
  }
  return pkgId
}
