export class Logger {
  public debug(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.debug(...args)
  }

  public log(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }

  public error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }

  public warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn(...args)
  }
}

const logger = new Logger()
export default logger
