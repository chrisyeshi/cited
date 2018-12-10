#!/usr/bin/env node

const fs = require('fs')
const { execSync } = require('child_process')

const config = {
  repository: 'git@github.com:chrisyeshi/discovery-engine.git',
  branch: 'master',
  folder: 'dist',
  script: 'npm run build',
  commit: 'deployed by the deploy.js script'
}
const cwd = process.cwd()

if (fs.existsSync(config.folder)) {
  console.log(
    `Please remove directory "${config.folder}" before running this script.`)
  process.exit(1)
}

console.log(`cloning...`)

console.log(execSync(
  `git clone -b ${config.branch} ${config.repository} ${config.folder}`,
  { cwd }).toString('utf-8'))

console.log('building...')
execSync(`${config.script}`, { cwd }).toString('utf-8')

console.log('committing...')
execSync([
  `cd ${config.folder}`,
  'git add .',
  `git commit --allow-empty -m "${config.commit}"`
].join('&&'), { cwd })

console.log('pushing...')

execSync([
  `cd ${config.folder}`,
  `git push --tags ${config.repository} ${config.branch}`
].join('&&'), { cwd })

console.log('done.')