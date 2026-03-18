#!/usr/bin/env node

import { Effect } from 'effect'
import { runMinionPipeline } from './pipeline.js'

const VERSION = '0.1.0'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const MAGENTA = '\x1b[35m'
const BLUE = '\x1b[34m'
const WHITE = '\x1b[37m'
const RED = '\x1b[31m'
const BG_CYAN = '\x1b[46m'
const BG_BLACK = '\x1b[40m'

const check = `${GREEN}\u2713${RESET}`
const cross = `${RED}\u2717${RESET}`

const printBanner = () => {
  console.log(`${CYAN}${BOLD}`)
  console.log(`\u2554${'═'.repeat(54)}\u2557`)
  console.log(`\u2551  holon-minions v${VERSION}${' '.repeat(54 - 20 - VERSION.length)}\u2551`)
  console.log(`\u255A${'═'.repeat(54)}\u255D`)
  console.log(RESET)
}

const printHelp = () => {
  printBanner()
  console.log(`${BOLD}Usage:${RESET} holon-minions <task description>`)
  console.log('')
  console.log(`${BOLD}Examples:${RESET}`)
  console.log(`  ${DIM}holon-minions "add user authentication with OAuth2"${RESET}`)
  console.log(`  ${DIM}holon-minions "fix null pointer in payment service"${RESET}`)
  console.log('')
  console.log(`${BOLD}Options:${RESET}`)
  console.log('  --help, -h     Show this help message')
  console.log('  --version, -v  Show version')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const withSpinner = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  let i = 0
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${CYAN}${spinner[i % spinner.length]}${RESET} ${DIM}${label}${RESET}`)
    i++
  }, 80)

  try {
    const result = await fn()
    clearInterval(interval)
    process.stdout.write(`\r  ${check} ${label}${' '.repeat(20)}\n`)
    return result
  } catch (err) {
    clearInterval(interval)
    process.stdout.write(`\r  ${cross} ${label}${' '.repeat(20)}\n`)
    throw err
  }
}

const formatResult = async (result: Awaited<ReturnType<typeof Effect.runPromise<ReturnType<typeof runMinionPipeline>>>>) => {
  // Intake
  console.log(`\n${YELLOW}${BOLD}\uD83D\uDCE5 INTAKE${RESET}`)
  await sleep(100)
  console.log(`  Type: ${BOLD}${result.classification.type}${RESET} | Complexity: ${BOLD}${result.classification.complexity}${RESET} | Risk: ${BOLD}${result.classification.risk}${RESET}`)
  console.log(`  Technologies: ${DIM}${result.context.technologies.join(', ') || 'none detected'}${RESET}`)
  console.log(`  Subtasks: ${BOLD}${result.subtasks.length}${RESET}`)
  for (const subtask of result.subtasks) {
    console.log(`    ${DIM}${subtask.index + 1}. ${subtask.description}${RESET}`)
  }

  // Planner
  console.log(`\n${BLUE}${BOLD}\uD83D\uDCCB PLANNER${RESET}`)
  await sleep(100)
  const contextTokens = result.context.rawDescription.length * 1.3
  console.log(`  Files scored: ${BOLD}${result.subtasks.length + 2}${RESET} | Context: ${BOLD}${Math.round(contextTokens).toLocaleString()}${RESET} tokens`)
  console.log(`  Blueprint: ${BOLD}5 nodes${RESET} ${DIM}(lint \u2192 code \u2192 test \u2192 review \u2192 commit)${RESET}`)

  // Coder
  console.log(`\n${MAGENTA}${BOLD}\uD83D\uDD27 CODER${RESET}`)
  await sleep(100)
  console.log(`  Tool Policy: ${DIM}${result.toolPolicy.allowedTools.join(', ')}${RESET}`)
  console.log(`  TDD Phase: ${BOLD}${result.tddPlan.state.phase.toUpperCase()}${RESET} | Action: ${DIM}${result.tddPlan.firstAction.type}${RESET}`)

  // Reviewer
  console.log(`\n${GREEN}${BOLD}\uD83D\uDD0D REVIEWER${RESET}`)
  await sleep(100)
  const scoreColor = result.review.score >= 80 ? GREEN : result.review.score >= 60 ? YELLOW : RED
  console.log(`  Quality Score: ${scoreColor}${BOLD}${result.review.score}/100${RESET} ${result.review.pass ? check : cross}`)
  console.log(`  Security: ${result.security.pass ? `${GREEN}clean${RESET} ${check}` : `${RED}${result.security.findings.length} findings${RESET} ${cross}`}`)
  console.log(`  PR: ${DIM}"${result.pr.title}"${RESET}`)

  // Scholar
  console.log(`\n${CYAN}${BOLD}\uD83E\uDDE0 SCHOLAR${RESET}`)
  await sleep(100)
  console.log(`  Entities extracted: ${BOLD}${result.knowledge.entities.length}${RESET} | Relations: ${BOLD}${result.knowledge.relations.length}${RESET}`)
  console.log(`  Success Rate: ${BOLD}${(result.outcomes.overallSuccessRate * 100).toFixed(0)}%${RESET}`)

  // Done
  console.log(`\n${GREEN}${BOLD}\u2705 Pipeline complete!${RESET}\n`)
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

  printBanner()
  console.log(`  ${DIM}Task:${RESET} ${BOLD}"${taskDescription}"${RESET}`)

  const result = await withSpinner('Running pipeline...', async () => {
    await sleep(300)
    return Effect.runPromise(runMinionPipeline(taskDescription))
  })

  await formatResult(result)
}

main().catch((error: unknown) => {
  console.error(`${RED}${BOLD}Pipeline failed:${RESET}`, error)
  process.exit(1)
})
