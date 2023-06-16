/* eslint-disable sort-imports */

import fs from 'fs'
import PocketBase from 'pocketbase'
import {setFailed, warning} from '@actions/core'

import {
  ConfigType,
  EnvNameType,
  ServerResponseEnvList,
  ServerResponseEnvItemType,
  EnvName
} from './typings'
import {isFileExists} from './utils'
import {getConfig} from './config'

class EnvGenerator {
  private subsRegexp = /\$\{([A-z\d_;<-]+)\}/gm

  private pb: PocketBase
  private config: ConfigType

  private envName: EnvNameType

  private envsArr: ServerResponseEnvItemType[] = []

  private _currFilename: string = ''

  constructor(serverUrl: string, envName: EnvNameType, configPath: string) {
    this.pb = new PocketBase(serverUrl)
    this.envName = envName

    this.config = getConfig(configPath)
  }

  async generate() {
    try {
      await this.fetchEnv()

      this.generatePlainFiles()
      this.generateEnvTemplateFiles()
    } catch (err) {
      if (err instanceof Error) setFailed(err.message)
    }
  }

  private async fetchEnv() {
    // fetch a paginated records list
    const response = await this.pb.collection('env').getFullList({
      filter: `services ?~ "${this.config.serviceName}"`,
      sort: 'name'
    })

    const arr = ServerResponseEnvList.parse(response)

    if (!arr) {
      throw Error('Invalid config server response')
    }

    this.envsArr = ServerResponseEnvList.parse(response)
  }

  private generatePlainFiles() {
    if (!this.config.plainFiles) return

    const {envName, envsArr} = this

    for (const entry of this.config.plainFiles) {
      const {output, envVarName} = entry
      const envVar = envsArr.find(el => el.name === envVarName)

      if (envVar) {
        this.checkIfDeprecated(envVar)

        const text = envVar[envName]

        fs.writeFileSync(output, text)
      } else {
        warning(
          `🚧 MISSING VARIABLE - '${envVarName}', file generation skipped (${output})`
        )
      }
    }
  }

  private generateEnvTemplateFiles() {
    if (!this.config.envTemplateFiles) return

    for (const file of this.config.envTemplateFiles) {
      this._currFilename = file.template
      try {
        isFileExists(file.template)
        const content = String(fs.readFileSync(file.template))
        const res = this.generateEnvTemplateFile(content)
        fs.writeFileSync(file.output, res)
      } catch (err) {
        warning(
          `🚧 MISSING TEMPLATE - '${file.template}', file generation skipped`
        )
        continue
      }
    }
  }

  private generateEnvTemplateFile(content: string) {
    let res = content

    const matches = new Set([...res.matchAll(this.subsRegexp)])

    for (const match of matches) {
      const [subs, name] = match
      const repl = this.getEnvSubstitution(name)

      if (repl) {
        res = res.replace(subs, repl)
      } else {
        warning(
          `🚧 MISSING VARIABLE - '${name}', skipped (template '${this._currFilename}')`
        )
      }
    }

    return res
  }

  private getEnvSubstitution(envSubs: string) {
    const {envName, envsArr} = this

    const {name, variants} = this.parseEnvSub(envSubs)

    const envVar = envsArr.find(el => el.name === name)

    if (envVar) {
      this.checkIfDeprecated(envVar)

      if (variants && envName in variants) {
        const mapped = variants[envName]
        return envVar[mapped]
      }
      return envVar[envName]
    }

    return undefined
  }

  private parseEnvSub(envSub: string) {
    const [name, ...rest] = envSub.split(';')

    const parsed: {name: string; variants?: Record<EnvNameType, EnvNameType>} =
      {name}

    if (rest.length > 0) {
      parsed.variants = {} as Record<EnvNameType, EnvNameType>

      const tuples = rest.map(el => el.split('<-'))
      tuples.forEach(([fromEnv, toEnv]) => {
        try {
          const fromEnvParsed = EnvName.parse(fromEnv)
          const toEnvParsed = EnvName.parse(toEnv)
          parsed.variants![fromEnvParsed] = toEnvParsed
        } catch (err) {
          warning(
            `🚧 UNKNOWN ENV NAMES - ['${fromEnv}', '${fromEnv}'], skipped (template '${this._currFilename}')`
          )
        }
      })
    }

    return parsed
  }

  private checkIfDeprecated(envsArrItem: ServerResponseEnvItemType) {
    if (envsArrItem.is_deprecated) {
      warning(
        `🚧 '${envsArrItem.name}' is DEPRECATED: '${envsArrItem.comment}'`
      )
    }
  }
}

export default EnvGenerator
