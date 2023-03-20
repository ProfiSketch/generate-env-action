import * as core from '@actions/core'
import fs from 'fs'
import {Config} from './typings'

function readConfig(configPath: string): string {
  try {
    return fs.readFileSync(new URL(configPath, import.meta.url))
  } catch (err) {
    core.setFailed(String(err))
  }
}

function parseConfig(configFile: string): unknown {
  try {
    return JSON.parse(configFile)
  } catch (err) {
    core.setFailed(String(err))
  }
}

function validateConfig(configObject: unknown) {}

export function getConfig(configPath: string): Config {
  const file = readConfig(configPath)
  const config = parseConfig(file)
  validateConfig(config)
  return config as Config
}
