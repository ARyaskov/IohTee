import { format } from 'node:util'

export default class Logger {
  readonly scope: string

  constructor(scope: string) {
    this.scope = scope
  }

  private write(level: 'debug' | 'info' | 'warn' | 'error', args: unknown[]) {
    const prefix = `[iohtee:${this.scope}]`
    const line =
      args.length > 0 ? format(...(args as [unknown, ...unknown[]])) : ''
    const out = `${prefix} ${line}`.trimEnd()
    switch (level) {
      case 'debug':
        console.debug(out)
        break
      case 'info':
        console.info(out)
        break
      case 'warn':
        console.warn(out)
        break
      case 'error':
        console.error(out)
        break
    }
  }

  debug(...args: unknown[]) {
    this.write('debug', args)
  }

  info(...args: unknown[]) {
    this.write('info', args)
  }

  warn(...args: unknown[]) {
    this.write('warn', args)
  }

  error(...args: unknown[]) {
    this.write('error', args)
  }
}
