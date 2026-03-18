import { Effect } from 'effect'
import type { ContextPayload } from './types.js'

const URL_PATTERN = /https?:\/\/[^\s,)}\]>'"]+/g

const FILE_PATH_PATTERN =
  /(?:(?:[a-zA-Z0-9_@-]+\/)+[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|\.[a-zA-Z][a-zA-Z0-9.]*)/g

const technologyMap: ReadonlyArray<{
  readonly name: string
  readonly patterns: ReadonlyArray<string>
}> = [
  { name: 'typescript', patterns: ['typescript', 'ts', '.ts', 'tsc'] },
  { name: 'javascript', patterns: ['javascript', 'js', '.js', 'node', 'nodejs', 'node.js'] },
  { name: 'react', patterns: ['react', 'jsx', 'tsx', 'usestate', 'useeffect', 'hooks', 'component'] },
  { name: 'nextjs', patterns: ['next.js', 'nextjs', 'next'] },
  { name: 'postgresql', patterns: ['postgresql', 'postgres', 'pg', 'psql'] },
  { name: 'docker', patterns: ['docker', 'dockerfile', 'container', 'docker-compose'] },
  { name: 'graphql', patterns: ['graphql', 'gql', 'resolver', 'mutation', 'subscription'] },
  { name: 'rest', patterns: ['rest', 'restful', 'rest api'] },
  { name: 'redis', patterns: ['redis', 'cache'] },
  { name: 'mongodb', patterns: ['mongodb', 'mongo', 'mongoose'] },
  { name: 'python', patterns: ['python', 'pip', 'pytest', 'django', 'flask', 'fastapi'] },
  { name: 'go', patterns: ['golang', 'go module'] },
  { name: 'effect', patterns: ['effect.gen', 'effect-ts', 'effect.succeed', 'layer', 'context.tag'] },
  { name: 'vitest', patterns: ['vitest', 'vitest.config'] },
  { name: 'jest', patterns: ['jest'] },
  { name: 'tailwind', patterns: ['tailwind', 'tailwindcss'] },
  { name: 'prisma', patterns: ['prisma'] },
  { name: 'kubernetes', patterns: ['kubernetes', 'k8s', 'kubectl', 'helm'] },
  { name: 'aws', patterns: ['aws', 'lambda', 's3', 'ec2', 'cloudformation'] },
  { name: 'css', patterns: ['css', 'scss', 'sass', 'styled-components'] },
  { name: 'html', patterns: ['html'] },
  { name: 'git', patterns: ['git', 'github', 'gitlab', 'bitbucket'] },
  { name: 'ci', patterns: ['ci', 'cd', 'pipeline', 'github actions', 'circleci'] },
]

const extractUrls = (text: string): ReadonlyArray<string> => {
  const matches = text.match(URL_PATTERN)
  return matches ?? []
}

const extractFilePaths = (text: string): ReadonlyArray<string> => {
  const urlFree = text.replace(URL_PATTERN, ' ')
  const matches = urlFree.match(FILE_PATH_PATTERN)
  return matches ?? []
}

const extractTechnologies = (text: string): ReadonlyArray<string> => {
  const lower = text.toLowerCase()
  const found = new Set<string>()

  for (const { name, patterns } of technologyMap) {
    for (const pattern of patterns) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?:^|[\\s,;()"'\`])${escaped}(?:$|[\\s,;()"'\`])`, 'i')
      if (regex.test(` ${lower} `)) {
        found.add(name)
        break
      }
    }
  }

  return Array.from(found)
}

export const assembleContext = (description: string): Effect.Effect<ContextPayload> =>
  Effect.succeed({
    rawDescription: description,
    urls: extractUrls(description),
    filePaths: extractFilePaths(description),
    technologies: extractTechnologies(description),
  })
