/* eslint-disable sort-imports */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import/no-commonjs */

import {getInput, debug, setFailed} from '@actions/core'

import {generate} from './generator'
import {EnvName, isFileExists, Url} from './typings'

require('cross-fetch/polyfill')

async function run(): Promise<void> {
  try {
    const url = Url.parse(getInput('server_url'))
    const envName = EnvName.parse(getInput('env_name'))
    const configPath = getInput('config_path')

    isFileExists(configPath)

    await generate(url, envName, configPath)

    debug(`Generation complete.`)

    // setOutput('time', new Date().toTimeString())
  } catch (err) {
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
