/* eslint-disable sort-imports */

import {getInput, debug, setFailed} from '@actions/core'

import {generate} from './generator'
import {EnvName} from './typings'

async function run(): Promise<void> {
  try {
    const url = getInput('server_url')
    const envName = EnvName.parse(getInput('env_name'))
    const configPath = getInput('config_path')

    await generate(url, envName, configPath)

    debug(`Generation complete.`)

    // setOutput('time', new Date().toTimeString())
  } catch (err) {
    if (err instanceof Error) setFailed(err.message)
  }
}

run()
