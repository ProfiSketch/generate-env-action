import {z} from 'zod'

export const Url = z.string().url()

export const EnvName = z.enum(['dev', 'qa', 'prod'])

const EnvTemplateFile = z.object({
  template: z.string(),
  output: z.string()
})

const PlainFile = z.object({
  envVarName: z.string(),
  output: z.string()
})

export const Config = z.object({
  serviceName: z.string(),
  plainFiles: z.array(PlainFile).optional(),
  envTemplateFiles: z.array(EnvTemplateFile).optional()
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
export type EnvTemplateFileType = z.infer<typeof EnvTemplateFile>
export type EnvNameType = z.infer<typeof EnvName>
export type ServerResponseEnvItemType = z.infer<typeof ServerResponseEnvItem>
