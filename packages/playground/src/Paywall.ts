import 'dotenv/config'
import debug from 'debug'
import express from 'express'
import { URL } from 'url'
import urljoin from 'url-join'

const log = debug('paywall')

const HEADER_NAME = 'authorization'
const TOKEN_NAME = 'paywall'
const PREFIX = '/payments'

const GATEWAY_URL = process.env.GATEWAY_URL

function acceptUrl(base: URL) {
  return urljoin(base.toString(), PREFIX, 'accept')
}

function isAcceptUrl(url: string) {
  return url === PREFIX + '/accept'
}

function isValidToken(token: string): boolean {
  const tokenRegex = /^0x[0-9a-fA-F]{64}$/

  return tokenRegex.test(token)
}

function paywallHeaders(
  receiverAccount: `0x${string}`,
  gatewayUri: string,
  price: bigint,
) {
  let headers = {} as any
  headers['paywall-version'] = '1.0'
  headers['paywall-price'] = price.toString()
  headers['paywall-address'] = receiverAccount
  headers['paywall-gateway'] = gatewayUri
  return headers
}

function paywallHeadersToken(
  receiverAccount: `0x${string}`,
  gatewayUri: string,
  price: bigint,
  tokenContract: `0x${string}`,
) {
  let headers = {} as any
  headers['paywall-version'] = '1.0'
  headers['paywall-price'] = price.toString()
  headers['paywall-address'] = receiverAccount
  headers['paywall-gateway'] = gatewayUri
  headers['paywall-token-contract'] = tokenContract
  return headers
}

function parseToken(
  req: express.Request,
  callback: (
    error: string | null,
    token?: string,
    meta?: string,
    price?: bigint,
  ) => void,
) {
  let content = req.get(HEADER_NAME)
  if (content) {
    let authorization = content.split(' ')
    let type = authorization[0].toLowerCase()
    let token = authorization[1]
    if (!isValidToken(token)) {
      throw new Error(`Invalid token received: ${token}`)
    }
    let meta = authorization[2]
    let price = BigInt(authorization[3])
    if (type === TOKEN_NAME) {
      callback(null, token, meta, price)
    } else {
      callback(
        `Invalid ${HEADER_NAME} token name present. Expected ${TOKEN_NAME}, got ${type}`,
      )
    }
  } else {
    callback(`No ${HEADER_NAME} header present`)
  }
}

export default class Paywall {
  receiverAccount: `0x${string}`
  base: URL

  constructor(receiverAccount: `0x${string}`, base: URL) {
    this.receiverAccount = receiverAccount
    this.base = base
  }

  paymentRequired(
    price: bigint,
    req: express.Request,
    res: express.Response,
  ): void {
    log('Require payment ' + price.toString() + ' for ' + req.path)
    res
      .status(402)
      .set(paywallHeaders(this.receiverAccount, acceptUrl(this.base), price))
      .send('Payment Required')
      .end()
  }

  guard(
    price: bigint,
    callback: express.RequestHandler,
  ): express.RequestHandler {
    let _guard = async (
      fixedPrice: bigint,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      error: any,
      token?: string,
      meta?: string,
    ) => {
      if (error || !token) {
        log(error)
        this.paymentRequired(fixedPrice, req, res)
      } else {
        const response = await fetch(
          `${GATEWAY_URL}${PREFIX}/verify/${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        )

        if (response.status >= 200 && response.status < 300) {
          log('Got valid paywall token')
          callback(req, res, next)
        } else {
          log('Got invalid paywall token')
          this.paymentInvalid(fixedPrice, req, res)
        }
      }
    }

    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      log(`Requested ${req.path}`)
      parseToken(req, (error, token, meta) => {
        return _guard(price, req, res, next, error, token!, meta!)
      })
    }
  }

  paymentInvalid(price: bigint, req: express.Request, res: express.Response) {
    res
      .status(409) // Conflict
      .set(paywallHeaders(this.receiverAccount, acceptUrl(this.base), price))
      .send('Payment Invalid')
      .end()
  }

  middleware() {
    let handler: express.RequestHandler = async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      log('Called payment handler')
      try {
        const response = await fetch(`${GATEWAY_URL}${PREFIX}/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(req.body),
        })
        log('Accept request')
        const json = await response.json()
        res.status(202).header('Paywall-Token', json.token).send(json)
      } catch (e) {
        log('Reject request', e)
        next(e)
      }
    }

    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (isAcceptUrl(req.url)) {
        handler(req, res, next)
      } else {
        next()
      }
    }
  }

  paymentRequiredToken(
    price: bigint,
    tokenContract: `0x${string}`,
    req: express.Request,
    res: express.Response,
  ): void {
    log('Require payment ' + price.toString() + ' for ' + req.path)
    res
      .status(402)
      .set(
        paywallHeadersToken(
          this.receiverAccount,
          acceptUrl(this.base),
          price,
          tokenContract,
        ),
      )
      .send('Payment Required')
      .end()
  }

  paymentInvalidToken(
    price: bigint,
    tokenContract: `0x${string}`,
    req: express.Request,
    res: express.Response,
  ) {
    res
      .status(409) // Conflict
      .set(
        paywallHeadersToken(
          this.receiverAccount,
          acceptUrl(this.base),
          price,
          tokenContract,
        ),
      )
      .send('Payment Invalid')
      .end()
  }

  guardToken(
    price: bigint,
    tokenContract: `0x${string}`,
    callback: express.RequestHandler,
  ): express.RequestHandler {
    let _guard = async (
      fixedPrice: bigint,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      error: any,
      _tokenContract: `0x${string}`,
      token?: string,
      meta?: string,
    ) => {
      if (error || !token) {
        log(error)
        this.paymentRequiredToken(fixedPrice, _tokenContract, req, res)
      } else {
        const response = await fetch(
          `${GATEWAY_URL}${PREFIX}/verify/${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        )

        if (response.status >= 200 && response.status < 300) {
          log('Got valid paywall token')
          callback(req, res, next)
        } else {
          log('Got invalid paywall token')
          this.paymentInvalidToken(fixedPrice, _tokenContract, req, res)
        }
      }
    }

    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      log(`Requested ${req.path}`)
      parseToken(req, (error, token, meta) => {
        return _guard(
          price,
          req,
          res,
          next,
          error,
          tokenContract,
          token!,
          meta!,
        )
      })
    }
  }
}
