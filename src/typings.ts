export type EnvNameType = 'dev' | 'qa' | 'prod'

export interface Config {
  serviceName: string
  plainFiles: Record<string, string>
  envFiles: EnvFile[]
}

export interface EnvFile {
  path: string
  variables: Record<string, EnvValue>
}

export type EnvValue =
  | string
  | {
      name: string
      mapping: Record<EnvNameType, EnvNameType>
    }

export interface ServerResponseEnv {
  id: string
  name: string
  services: string[]
  dev: string
  qa: string
  prod: string
  is_deprecated: boolean
  comment?: string
}
