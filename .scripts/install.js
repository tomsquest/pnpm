const exec = require('child_process').exec
const execFile = require('child_process').execFile
const path = require('path')
const fs = require('fs')
const execPath = process.execPath
const binPath = path.dirname(execPath)
const pnpm = path.join(execPath, '../../lib/node_modules/pnpm')
const repository = 'https://github.com/pnpm/dist.git'
const bin = path.join(pnpm, 'lib/bin/pnpm.js')

process.stdout.write(
  'exec: git' + [' clone', repository, pnpm].join(' ') + '\n'
)
exec('git clone ' + repository + ' ' + pnpm, (e) => {
  if (e) throw e
  process.stdout.write('link: ' + bin + '\n')
  process.stdout.write(' => ' + path.join(binPath, 'pnpm') + '\n')
  execFile(bin, ['link'], {cwd: pnpm}, (e) => {
    if (e) throw e
    execFile(bin, ['rebuild'], {cwd: pnpm}, (e) => {
      if (e) throw e
    })
  })
})
