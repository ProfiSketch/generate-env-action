/* eslint-disable sort-imports */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import/no-commonjs */

import {getInput, debug, setFailed} from '@actions/core'

import {generate} from './generator'
import {isFileExists} from './utils'
import {EnvName, Url} from './typings'

require('cross-fetch/polyfill')

async function run(): Promise<void> {
  debug(`generate-env-action started (${process.env.npm_package_version})`)

  try {
    const url = Url.parse(getInput('server_url'))
    const envName = EnvName.parse(getInput('env_name'))
    const configPath = getInput('config_path')

    isFileExists(configPath)

    await generate(url, envName, configPath)

    debug(`generate-env-action completed`)

    // setOutput('time', new Date().toTimeString())
  } catch (err) {
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
