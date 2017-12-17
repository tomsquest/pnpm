import logger from '@pnpm/logger'
import {createServer} from '@pnpm/server'
import fs = require('graceful-fs')
import mkdirp = require('mkdirp-promise')
import path = require('path')
import onExit = require('signal-exit')
import { PnpmOptions } from 'supi'
import writeJsonFile = require('write-json-file')
import createStore from '../createStore'

export default async (input: string[], opts: PnpmOptions) => {
  logger.warn('The store server is an experimental feature. Breaking changes may happen in non-major versions.')

  const store = await createStore(opts)

  // the store folder will be needed because server will want to create a file there
  // for the IPC connection
  await mkdirp(store.path)

  const ipcConnectionPath = createIpcConnectionPath(store.path)
  const connectionOptions = {
    remotePrefix: `http://unix:${ipcConnectionPath}:`,
  }
  const serverJsonPath = path.join(store.path, 'server.json')
  await writeJsonFile(serverJsonPath, {connectionOptions})

  const serverOptions = {
    path: ipcConnectionPath,
  }
  const server = createServer(store.ctrl, serverOptions)

  onExit(() => {
    server.close()
    fs.unlinkSync(serverJsonPath)
  })
}

function createIpcConnectionPath (fsPath: string) {
  fsPath = path.normalize(fsPath) + path.sep + 'socket'
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\${fsPath}`
  }
  return fsPath
}
