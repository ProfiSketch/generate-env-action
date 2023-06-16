/* eslint-disable sort-imports */

import fs from 'fs'
import PocketBase from 'pocketbase'
import {setFailed, warning} from '@actions/core'

import {
  ConfigType,
  EnvFileType,
  EnvNameType,
  ServerResponseEnvList,
  ServerResponseEnvItemType,
  EnvStaticFileType
} from './typings'
import {isFileExists} from './utils'
import {getConfig} from './config'

export async function generate(
  serverUrl: string,
  envName: EnvNameType,
  configPath: string
): Promise<void> {
  const pb = new PocketBase(serverUrl)

  try {
    const {serviceName, plainFiles, envFiles, envStaticFiles} =
      getConfig(configPath)
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
    if (plainFiles) generatePlainFiles(arr, plainFiles, envName)

    if (envFiles) generateEnvFiles(arr, envFiles, envName)

    if (envStaticFiles) generateEnvStaticFiles(arr, envStaticFiles, envName)
  } catch (err) {
    if (err instanceof Error) setFailed(err.message)
  }
}

function generatePlainFiles(
  envsArr: ServerResponseEnvItemType[],
  plainFiles: NonNullable<ConfigType['plainFiles']>,
  envName: EnvNameType
): void {
  for (const entry of plainFiles) {
    const {output, envVarName} = entry
    const envVar = envsArr.find(el => el.name === envVarName)

    if (envVar) {
      // TODO: handle envName overload
      const text = envVar[envName]
      fs.writeFileSync(output, text)
    } else {
      warning(
        `🚧 MISSING VARIABLE - '${envVarName}', file generation skipped (${output})`
      )
    }
  }
}

function generateEnvFiles(
  envsArr: ServerResponseEnvItemType[],
  envFiles: NonNullable<ConfigType['envFiles']>,
  envName: EnvNameType
): void {
  for (const file of envFiles) {
    generateEnvFile(envsArr, file, envName)
  }
}

function generateEnvStaticFiles(
  envsArr: ServerResponseEnvItemType[],
  envStaticFiles: NonNullable<ConfigType['envStaticFiles']>,
  envName: EnvNameType
): void {
  for (const file of envStaticFiles) {
    try {
      isFileExists(file.template)
      generateEnvStaticFile(envsArr, file, envName)
    } catch (err) {
      warning(
        `🚧 MISSING TEMPLATE - '${file.template}', file generation skipped`
      )
      continue
    }
  }
}

function generateEnvStaticFile(
  envsArr: ServerResponseEnvItemType[],
  file: EnvStaticFileType,
  envName: EnvNameType
): void {
  const {template, output} = file

  let content = String(fs.readFileSync(template))
  const regexp = /\$\{([A-Z\d_]+)\}/gm
  const matches = new Set([...content.matchAll(regexp)])

  for (const match of matches) {
    const repl = envsArr.find(el => el.name === match[1])

    if (repl) {
      content = content.replace(match[0], repl[envName])
    } else {
      warning(
        `🚧 MISSING VARIABLE - '${match[1]}', skipped (template '${file.template}')`
      )
    }
  }

  fs.writeFileSync(output, '')
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
