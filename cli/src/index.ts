#!/usr/bin/env node

import { Effect } from 'effect'
import { runDaedalusPipeline } from './pipeline.js'

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

const printBanner = (mode: 'LIVE' | 'DEMO') => {
  const modeLabel = mode === 'LIVE' ? `${GREEN}[LIVE MODE]${CYAN}${BOLD}` : `${DIM}[DEMO MODE]${CYAN}${BOLD}`
  const innerWidth = 54
  const prefix = `  holon-daedalus v${VERSION}`
  // Visible characters only for padding calc
  const modeLabelVisible = mode === 'LIVE' ? '[LIVE MODE]' : '[DEMO MODE]'
  const padding = innerWidth - prefix.length - modeLabelVisible.length - 2
  console.log(`${CYAN}${BOLD}`)
  console.log(`\u2554${'═'.repeat(innerWidth)}\u2557`)
  console.log(`\u2551${prefix}${' '.repeat(Math.max(padding, 1))}${modeLabel}  \u2551`)
  console.log(`\u255A${'═'.repeat(innerWidth)}\u255D`)
  console.log(RESET)
}

const printHelp = () => {
  printBanner('DEMO')
  console.log(`${BOLD}Usage:${RESET} holon-daedalus <task description> [--cwd <path>]`)
  console.log('')
  console.log(`${BOLD}Examples:${RESET}`)
  console.log(`  ${DIM}# Demo mode (no LLM calls)${RESET}`)
  console.log(`  ${DIM}holon-daedalus "add user authentication with OAuth2"${RESET}`)
  console.log('')
  console.log(`  ${DIM}# Live mode (calls claude -p to write real code)${RESET}`)
  console.log(`  ${DIM}holon-daedalus "fix null pointer in payment service" --cwd /path/to/repo${RESET}`)
  console.log('')
  console.log(`${BOLD}Options:${RESET}`)
  console.log('  --cwd <path>   Target repo for live mode (calls claude -p)')
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

const formatResult = async (result: Awaited<ReturnType<typeof Effect.runPromise<ReturnType<typeof runDaedalusPipeline>>>>, targetDir?: string) => {
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
  if (result.liveMode) {
    const exitLabel = result.liveMode.exitCode === 0 ? `${GREEN}0 ${check}${RESET}` : `${RED}${result.liveMode.exitCode} ${cross}${RESET}`
    console.log(`\n${MAGENTA}${BOLD}\uD83D\uDD27 CODER (LIVE MODE)${RESET}`)
    await sleep(100)
    console.log(`  Target: ${BOLD}${targetDir}${RESET}`)
    console.log(`  Tool Policy: ${DIM}${result.toolPolicy.allowedTools.join(', ')}${RESET}`)
    console.log(`  Exit code: ${exitLabel}`)
    console.log('')
    // Show claude output, indented
    const outputLines = result.liveMode.claudeOutput.split('\n')
    const maxLines = 50
    const displayLines = outputLines.length > maxLines
      ? [...outputLines.slice(0, maxLines), `  ${DIM}... (${outputLines.length - maxLines} more lines)${RESET}`]
      : outputLines
    for (const line of displayLines) {
      console.log(`  ${DIM}${line}${RESET}`)
    }
  } else {
    console.log(`\n${MAGENTA}${BOLD}\uD83D\uDD27 CODER${RESET}`)
    await sleep(100)
    console.log(`  Tool Policy: ${DIM}${result.toolPolicy.allowedTools.join(', ')}${RESET}`)
    console.log(`  TDD Phase: ${BOLD}${result.tddPlan.state.phase.toUpperCase()}${RESET} | Action: ${DIM}${result.tddPlan.firstAction.type}${RESET}`)
  }

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

  // Parse --cwd flag
  const cwdIndex = args.indexOf('--cwd')
  let targetDir: string | undefined
  if (cwdIndex !== -1 && args[cwdIndex + 1]) {
    targetDir = args[cwdIndex + 1]
    args.splice(cwdIndex, 2)
  }

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
  const mode = targetDir ? 'LIVE' : 'DEMO' as const

  printBanner(mode)
  console.log(`  ${DIM}Task:${RESET} ${BOLD}"${taskDescription}"${RESET}`)
  if (targetDir) {
    console.log(`  ${DIM}Target:${RESET} ${BOLD}${targetDir}${RESET}`)
  }

  const spinnerLabel = targetDir
    ? 'Running pipeline (live mode - this may take a few minutes)...'
    : 'Running pipeline...'

  const result = await withSpinner(spinnerLabel, async () => {
    if (!targetDir) await sleep(300)
    return Effect.runPromise(runDaedalusPipeline(taskDescription, targetDir))
  })

  await formatResult(result, targetDir)
}

main().catch((error: unknown) => {
  console.error(`${RED}${BOLD}Pipeline failed:${RESET}`, error)
  process.exit(1)
})
