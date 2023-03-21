/* eslint-disable sort-imports */

import fs from 'fs'

import {Config, ConfigType} from './typings'

function readConfig(configPath: string): string {
  return fs.readFileSync(configPath).toString()
}

function parseConfig(configFile: string): unknown {
  return JSON.parse(configFile)
}

function validateConfig(configObject: unknown): ConfigType {
  return Config.parse(configObject)
}

export function getConfig(configPath: string): ConfigType {
  const file = readConfig(configPath)
  const configJson = parseConfig(file)
  const config = validateConfig(configJson)
  return config
}
