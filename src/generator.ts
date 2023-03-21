/* eslint-disable sort-imports */

import fs from 'fs'
import PocketBase from 'pocketbase'
import {setFailed, warning} from '@actions/core'

import {
  ConfigType,
  EnvFileType,
  EnvNameType,
  ServerResponseEnvList,
  ServerResponseEnvItemType
} from './typings'
import {getConfig} from './config'

export async function generate(
  serverUrl: string,
  envName: EnvNameType,
  configPath: string
): Promise<void> {
  const pb = new PocketBase(serverUrl)

  try {
    const {serviceName, plainFiles, envFiles} = getConfig(configPath)
    // fetch a paginated records list
    const response = await pb.collection('env').getFullList({
      filter: `services ?~ "${serviceName}"`,
      sort: 'name'
    })

    const arr = ServerResponseEnvList.parse(response)

    if (!arr) {
      throw Error('Invalid config server response')
    }

    consoleDeprecatedVariables(arr)
    generatePlainFiles(arr, plainFiles, envName)
    generateEnvFiles(arr, envFiles, envName)
  } catch (err) {
    if (err instanceof Error) setFailed(err.message)
  }
}

function generatePlainFiles(
  envsArr: ServerResponseEnvItemType[],
  plainFiles: ConfigType['plainFiles'],
  envName: EnvNameType
): void {
  for (const key in plainFiles) {
    if (Object.hasOwnProperty.call(plainFiles, key)) {
      const path = plainFiles[key]
      const envVar = envsArr.find(el => el.name === key)

      if (envVar) {
        // TODO: handle envName overload
        const text = envVar[envName]
        fs.writeFileSync(path, text)
      } else {
        warning(
          `🚧 MISSING VARIABLE - '${key}', file generation skipped (${path})`
        )
      }
    }
  }
}

function generateEnvFiles(
  envsArr: ServerResponseEnvItemType[],
  envFiles: ConfigType['envFiles'],
  envName: EnvNameType
): void {
  for (const file of envFiles) {
    generateEnvFile(envsArr, file, envName)
  }
}

function generateEnvFile(
  envsArr: ServerResponseEnvItemType[],
  envFile: EnvFileType,
  envName: EnvNameType
): void {
  const {path, variables} = envFile
  fs.writeFileSync(path, '')

  for (const configVar in variables) {
    if (Object.hasOwnProperty.call(variables, configVar)) {
      const configVal = variables[configVar]

      const envVar = envsArr.find(el => el.name === configVar)

      if (envVar) {
        if (typeof configVal === 'string') {
          fs.appendFileSync(path, `${configVal}=${envVar[envName]}\n`)
        } else {
          const {name, mapping} = configVal
          const env =
            mapping && envName in mapping ? mapping[envName]! : envName
          fs.appendFileSync(path, `${name}=${envVar[env]}\n`)
        }
      } else {
        warning(
          `🚧 MISSING VARIABLE - '${configVar}', file generation skipped (${path})`
        )
      }
    }
  }
}

function consoleDeprecatedVariables(
  envsArr: ServerResponseEnvItemType[]
): void {
  for (const el of envsArr) {
    if (el.is_deprecated) {
      warning(`🚧 '${el.name}' is DEPRECATED: '${el.comment}'`)
    }
  }
}
