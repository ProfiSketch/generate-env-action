import * as core from '@actions/core'
import PocketBase from 'pocketbase'
import fs from 'fs'

import {Config, EnvNameType, ServerResponseEnv, EnvFile} from './typings'
import {getConfig} from './config'

export async function generate(
  serverUrl: string,
  envName: EnvNameType,
  configPath: string
) {
  const {serviceName, plainFiles, envFiles} = getConfig(configPath)

  const pb = new PocketBase(serverUrl)

  try {
    // fetch a paginated records list
    const arr = (await pb.collection('env').getFullList({
      filter: `services ?~ "${serviceName}"`,
      sort: 'name'
    })) as ServerResponseEnv[]

    consoleDeprecatedVariables(arr)
    generatePlainFiles(arr, plainFiles, envName)
    generateEnvFiles(arr, envFiles)
  } catch (err) {
    core.setFailed(String(err))
  }
}

function generatePlainFiles(
  envsArr: ServerResponseEnv[],
  plainFiles: Config['plainFiles'],
  envName: EnvNameType
) {
  for (const key in plainFiles) {
    if (Object.hasOwnProperty.call(plainFiles, key)) {
      const path = plainFiles[key]
      const envVar = envsArr.find(el => el.name == key)

      if (envVar) {
        // TODO: handle envName overload
        const text = envVar[envName]
        fs.writeFileSync(path, text)
      } else {
        console.warn(
          `🚧 MISSING VARIABLE - '${key}', file generation skipped (${path})`
        )
      }
    }
  }
}

function generateEnvFiles(
  envsArr: ServerResponseEnv[],
  envFiles: Config['envFiles']
) {
  for (const file of envFiles) {
    generateEnvFile(envsArr, file)
  }
}

function generateEnvFile(
  envsArr: ServerResponseEnv[],
  envFile: EnvFile,
  envName: EnvNameType
) {
  const {path, variables} = envFile
  fs.writeFileSync(path, '')

  for (const configVar in variables) {
    if (Object.hasOwnProperty.call(variables, configVar)) {
      const configVal = variables[configVar]

      const envVar = envsArr.find(el => el.name == configVar)

      if (envVar) {
        if (typeof configVal === 'string') {
          fs.appendFileSync(path, `${configVal}=${envVar[envName]}\n`)
        } else {
          const {name, mapping} = configVal
          const env = envName in mapping ? mapping[envName] : envName
          fs.appendFileSync(path, `${name}=${envVar[env]}\n`)
        }
      } else {
        console.warn(
          `🚧 MISSING VARIABLE - '${configVar}', file generation skipped (${path})`
        )
      }
    }
  }
}

function consoleDeprecatedVariables(envsArr: ServerResponseEnv[]): void {
  for (const el of envsArr) {
    if (el.is_deprecated) {
      console.warn(`🚧 '${el.name}' is DEPRECATED:`, el.comment)
    }
  }
}
