import { Effect } from 'effect'
import { Data } from 'effect'

export class FileIndexError extends Data.TaggedError('FileIndexError')<{
  readonly directory: string
  readonly reason: string
}> {}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.go', '.py'])

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '__pycache__',
  '.next',
  '.turbo',
  'vendor',
])

export interface FileMetadata {
  readonly path: string
  readonly extension: string
  readonly sizeBytes: number
}

const walkDirectory = async (dir: string): Promise<ReadonlyArray<FileMetadata>> => {
  const { readdir, stat } = await import('node:fs/promises')
  const { join, extname, basename } = await import('node:path')

  const results: FileMetadata[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      const nested = await walkDirectory(fullPath)
      results.push(...nested)
      continue
    }

    const ext = extname(entry.name)
    if (!SOURCE_EXTENSIONS.has(ext)) continue

    const fileStat = await stat(fullPath)
    results.push({
      path: fullPath,
      extension: ext,
      sizeBytes: fileStat.size,
    })
  }

  return results
}

export const indexFiles = (directory: string): Effect.Effect<ReadonlyArray<FileMetadata>, FileIndexError> =>
  Effect.tryPromise({
    try: () => walkDirectory(directory),
    catch: (error) =>
      new FileIndexError({
        directory,
        reason: error instanceof Error ? error.message : String(error),
      }),
  })
