#!/usr/bin/env node

import { Effect } from 'effect'
import { runMinionPipeline } from './pipeline.js'

const VERSION = '0.1.0'

const printHelp = () => {
  console.log(`holon-minions v${VERSION}`)
  console.log('')
  console.log('Usage: holon-minions <task description>')
  console.log('')
  console.log('Examples:')
  console.log('  holon-minions "add user authentication with OAuth2"')
  console.log('  holon-minions "fix null pointer in payment service"')
  console.log('')
  console.log('Options:')
  console.log('  --help, -h     Show this help message')
  console.log('  --version, -v  Show version')
}

const formatResult = (result: Awaited<ReturnType<typeof Effect.runPromise<ReturnType<typeof runMinionPipeline>>>>) => {
  console.log('\n=== Holon Minions Pipeline Result ===\n')

  console.log(`Task Type:    ${result.classification.type}`)
  console.log(`Complexity:   ${result.classification.complexity}`)
  console.log(`Risk:         ${result.classification.risk}`)
  console.log(`Technologies: ${result.context.technologies.join(', ') || 'none detected'}`)
  console.log(`Subtasks:     ${result.subtasks.length}`)

  for (const subtask of result.subtasks) {
    console.log(`  ${subtask.index + 1}. ${subtask.description}`)
  }

  console.log(`\nTool Policy:  ${result.toolPolicy.allowedTools.join(', ')}`)
  console.log(`TDD Phase:    ${result.tddPlan.state.phase}`)
  console.log(`First Action: ${result.tddPlan.firstAction.type}`)
  console.log(`\nCode Quality: ${result.review.score}/100 (${result.review.pass ? 'PASS' : 'FAIL'})`)
  console.log(`Security:     ${result.security.pass ? 'PASS' : 'FAIL'} (${result.security.findings.length} findings)`)
  console.log(`\nPR Title:     ${result.pr.title}`)
  console.log(`Knowledge:    ${result.knowledge.entities.length} entities, ${result.knowledge.relations.length} relations`)
  console.log(`Success Rate: ${(result.outcomes.overallSuccessRate * 100).toFixed(0)}%`)
}

const main = async () => {
  const args = process.argv.slice(2)
  const first = args[0]

  if (!first || first === '--help' || first === '-h') {
    printHelp()
    return
  }

  if (first === '--version' || first === '-v') {
    console.log(VERSION)
    return
  }

  const taskDescription = args.join(' ')
  console.log(`holon-minions v${VERSION}`)
  console.log(`Processing: "${taskDescription}"`)

  const result = await Effect.runPromise(runMinionPipeline(taskDescription))
  formatResult(result)
}

main().catch((error: unknown) => {
  console.error('Pipeline failed:', error)
  process.exit(1)
})
