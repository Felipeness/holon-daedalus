import { Context, Layer } from 'effect'
import type { CorrelationContext } from '@holon/shared'

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

export interface LogEntry {
  readonly level: LogLevel
  readonly message: string
  readonly timestamp: string
  readonly correlationId?: string
  readonly data?: Record<string, unknown>
}

export interface LoggerService {
  readonly debug: (message: string, data?: Record<string, unknown>, ctx?: CorrelationContext) => void
  readonly info: (message: string, data?: Record<string, unknown>, ctx?: CorrelationContext) => void
  readonly warn: (message: string, data?: Record<string, unknown>, ctx?: CorrelationContext) => void
  readonly error: (message: string, data?: Record<string, unknown>, ctx?: CorrelationContext) => void
  readonly getEntries: () => ReadonlyArray<LogEntry>
}

export class Logger extends Context.Tag('Logger')<Logger, LoggerService>() {}

export const makeStructuredLogger = (): LoggerService => {
  const entries: LogEntry[] = []

  const log = (level: LogLevel, message: string, data?: Record<string, unknown>, ctx?: CorrelationContext) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: ctx?.correlationId,
      data,
    }
    entries.push(entry)
  }

  return {
    debug: (msg, data, ctx) => log(LogLevel.DEBUG, msg, data, ctx),
    info: (msg, data, ctx) => log(LogLevel.INFO, msg, data, ctx),
    warn: (msg, data, ctx) => log(LogLevel.WARN, msg, data, ctx),
    error: (msg, data, ctx) => log(LogLevel.ERROR, msg, data, ctx),
    getEntries: () => entries,
  }
}

export const StructuredLoggerLive = Layer.succeed(Logger, makeStructuredLogger())
