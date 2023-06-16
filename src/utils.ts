import {lstat} from 'fs/promises'

export async function isFileExists(filepath: string): Promise<boolean> {
  const stat = await lstat(filepath)

  if (!stat.isFile()) throw Error(`File does not exist - '${filepath}'`)

  return true
}
