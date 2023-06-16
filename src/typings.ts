import {lstat} from 'fs/promises'
import {z} from 'zod'

export const Url = z.string().url()

export const EnvName = z.enum(['dev', 'qa', 'prod'])

const EnvValueExtended = z.object({
  name: z.string(),
  mapping: z.record(EnvName, EnvName).optional()
})

const EnvStaticFile = z.object({
  template: z.string(),
  output: z.string()
})

const EnvValue = z.union([z.string(), EnvValueExtended])

export const EnvFile = z.object({
  path: z.string(),
  variables: z.record(z.string(), EnvValue)
})

export const Config = z.object({
  serviceName: z.string(),
  plainFiles: z.record(z.string(), z.string()).optional(),
  envFiles: z.array(EnvFile).optional(),
  envStaticFiles: z.array(EnvStaticFile).optional()
})

const ServerResponseEnvItem = z.object({
  id: z.string(),
  name: z.string(),
  services: z.array(z.string()),
  dev: z.string(),
  qa: z.string(),
  prod: z.string(),
  is_deprecated: z.boolean(),
  comment: z.string().optional()
})

export const ServerResponseEnvList = z.array(ServerResponseEnvItem)

export type ConfigType = z.infer<typeof Config>
export type EnvFileType = z.infer<typeof EnvFile>
export type EnvStaticFileType = z.infer<typeof EnvStaticFile>
export type EnvNameType = z.infer<typeof EnvName>
export type ServerResponseEnvItemType = z.infer<typeof ServerResponseEnvItem>

export async function isFileExists(filepath: string): Promise<boolean> {
  const stat = await lstat(filepath)

  if (!stat.isFile()) throw Error('Config file does not exist')

  return true
}
