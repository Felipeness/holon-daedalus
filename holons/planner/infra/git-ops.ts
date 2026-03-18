import { Effect } from 'effect'
import { Data } from 'effect'

export class GitOperationError extends Data.TaggedError('GitOperationError')<{
  readonly command: string
  readonly reason: string
}> {}

const execGit = (args: ReadonlyArray<string>): Effect.Effect<string, GitOperationError> =>
  Effect.tryPromise({
    try: async () => {
      const { execFile } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const exec = promisify(execFile)
      const { stdout } = await exec('git', [...args])
      return stdout.trim()
    },
    catch: (error) =>
      new GitOperationError({
        command: `git ${args.join(' ')}`,
        reason: error instanceof Error ? error.message : String(error),
      }),
  })

export const createBranch = (name: string): Effect.Effect<string, GitOperationError> =>
  execGit(['checkout', '-b', name])

export const createWorktree = (
  branchName: string,
  path: string,
): Effect.Effect<string, GitOperationError> =>
  execGit(['worktree', 'add', path, '-b', branchName])

export const currentBranch = (): Effect.Effect<string, GitOperationError> =>
  execGit(['branch', '--show-current'])

export const deleteBranch = (name: string): Effect.Effect<string, GitOperationError> =>
  execGit(['branch', '-D', name])

export const removeWorktree = (path: string): Effect.Effect<string, GitOperationError> =>
  execGit(['worktree', 'remove', path, '--force'])
