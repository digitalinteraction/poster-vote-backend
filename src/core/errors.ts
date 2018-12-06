/*
 *  A set of custom errors to be used throughout the project
 */

/** An error to subclass to make custom errors */
export class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/** An error with a http status code */
export class HttpError extends CustomError {
  public status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export class NotFound extends HttpError {
  constructor(message = 'NotFound') {
    super(message, 404)
  }
}

export class BadAuth extends HttpError {
  constructor(message = 'BadAuth') {
    super(message, 401)
  }
}

export class BadRequest extends HttpError {
  constructor(message: string) {
    super(message, 404)
  }
}

type ParamDef<T> = {
  [K in keyof T]: 'string' | 'number' | 'boolean' | 'object'
}

export class BadParams extends HttpError {
  constructor(missingArgs: string[] = []) {
    let message = 'Bad parameters: ' + missingArgs.join(', ')
    super(message, 400)
  }

  static check<T extends any>(body: any, args: ParamDef<T>): T {
    let missing = new Array<string>()
    for (let [key, type] of Object.entries(args)) {
      if (typeof body[key] === type) continue
      missing.push(`'${key}' should be a '${type}'`)
    }
    if (missing.length === 0) return body as T
    throw new BadParams(missing)
  }

  static shouldBe(name: string, typeOrEnum: string | any[]) {
    if (typeof typeOrEnum === 'string') {
      return new BadParams([`'${name}' should be a '${typeOrEnum}'`])
    } else {
      return new BadParams([`'${name}' should be in: ${typeOrEnum.join('|')}`])
    }
  }
}

export class Redirect extends HttpError {
  public url: string
  constructor(url = '/', permenant = false) {
    super('Redirect', permenant ? 301 : 302)
    this.url = url
  }
}
