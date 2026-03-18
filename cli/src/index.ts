#!/usr/bin/env node

const VERSION = '0.1.0'

const main = () => {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === '--help' || command === '-h') {
    console.log(`holon-minions v${VERSION}`)
    console.log('')
    console.log('Usage: holon-minions <command>')
    console.log('')
    console.log('Commands:')
    console.log('  run       Start the holon orchestrator')
    console.log('  --help    Show this help message')
    console.log('  --version Show version')
    return
  }

  if (command === '--version' || command === '-v') {
    console.log(VERSION)
    return
  }

  console.log(`holon-minions v${VERSION}`)
  console.log(`Unknown command: ${command}`)
  process.exit(1)
}

main()
