import { Context, Data, Effect } from 'effect'

export class GitHubError extends Data.TaggedError('GitHubError')<{
  readonly reason: string
}> {}

export interface PRCreateInput {
  readonly title: string
  readonly body: string
  readonly branch: string
  readonly base: string
}

export interface PRCreateResult {
  readonly url: string
  readonly number: number
}

export interface GitHubClient {
  readonly createPR: (
    input: PRCreateInput,
  ) => Effect.Effect<PRCreateResult, GitHubError>
}

export class GitHubClientTag extends Context.Tag('GitHubClient')<
  GitHubClientTag,
  GitHubClient
>() {}

export const GitHubClientLive: GitHubClient = {
  createPR: (input) =>
    Effect.tryPromise({
      try: async () => {
        const { execSync } = await import('node:child_process')

        const result = execSync(
          [
            'gh pr create',
            `--title "${input.title.replace(/"/g, '\\"')}"`,
            `--body "${input.body.replace(/"/g, '\\"')}"`,
            `--head "${input.branch}"`,
            `--base "${input.base}"`,
          ].join(' '),
          { encoding: 'utf-8', timeout: 30_000 },
        )

        const urlMatch = /https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/.exec(result)
        const prNumber = urlMatch ? parseInt(urlMatch[1]!, 10) : 0

        return {
          url: result.trim(),
          number: prNumber,
        }
      },
      catch: (error) =>
        new GitHubError({
          reason: error instanceof Error ? error.message : String(error),
        }),
    }),
}
