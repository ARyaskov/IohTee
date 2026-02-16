import Payment from './payment'
import Logger from './log'
import {
  AcceptPaymentRequest,
  AcceptPaymentRequestSerde,
} from './accept_payment_request'
import {
  AcceptPaymentResponse,
  AcceptPaymentResponseSerde,
} from './accept_payment_response'
import {
  AcceptTokenRequest,
  AcceptTokenRequestSerde,
} from './accept_token_request'
import {
  AcceptTokenResponse,
  AcceptTokenResponseSerde,
} from './accept_token_response'
import {
  PaymentRequiredRequest,
  PaymentRequiredRequestSerializer,
} from './PaymentRequiredRequest'
import {
  PaymentRequiredResponse,
  PaymentRequiredResponseSerializer,
} from './PaymentRequiredResponse'
import { BadResponseError } from './Exceptions'

const LOG = new Logger('transport')

export interface TransportResponse {
  statusCode: number
  headers: Record<string, string>
  body: unknown
}

async function request(
  input: URL | string,
  init?: RequestInit,
): Promise<TransportResponse> {
  const response = await fetch(input, init)
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  return {
    statusCode: response.status,
    headers,
    body,
  }
}

export const STATUS_CODES = {
  PAYMENT_REQUIRED: 402,
  OK: 200,
} as const

const extractPaywallToken = (response: TransportResponse): string => {
  const token = response.headers['paywall-token']
  if (!token) {
    throw new Error('Can not find a token in the response')
  }
  LOG.info('Got token from the server')
  return token
}

export interface GetWithTokenCallbacks {
  onWillLoad?: () => void
  onDidLoad?: () => void
}

export interface RequestTokenOpts {
  onWillSendPayment?: () => void
  onDidSendPayment?: () => void
}

export class Transport {
  /**
   * Requests a protected resource using a paywall token.
   *
   * @param uri Full URL of the protected resource.
   * @param token Paywall token received from the gateway.
   * @param opts Lifecycle callbacks invoked before/after loading.
   * @returns HTTP-like response object with status, headers and body.
   */
  async getWithToken(
    uri: string,
    token: string,
    opts: GetWithTokenCallbacks = {},
  ): Promise<TransportResponse> {
    const headers = {
      authorization: `Paywall ${token}`,
    }

    LOG.info(`Getting ${uri} using access token ${token}`)
    opts.onWillLoad?.()
    const result = await this.get(uri, headers)
    opts.onDidLoad?.()
    return result
  }

  get(
    uri: string,
    headers?: Record<string, string>,
  ): Promise<TransportResponse> {
    LOG.info(`Getting ${uri} using headers`, headers)
    const init: RequestInit = { method: 'GET' }
    if (headers) {
      init.headers = headers
    }
    return request(uri, init)
  }

  /**
   * Request token from the server's gateway.
   *
   * @param uri Full URL to the gateway endpoint.
   * @param payment Serialized payment payload to exchange for a paywall token.
   * @param opts Lifecycle callbacks invoked before/after sending payment.
   * @returns Paywall token string from the `paywall-token` response header.
   */
  async requestToken(
    uri: string,
    payment: Partial<Payment>,
    opts: RequestTokenOpts = {},
  ): Promise<string> {
    if (!payment.tokenContract) {
      delete payment.tokenContract
    }

    LOG.info('Getting request token in exchange for payment', payment)
    opts.onWillSendPayment?.()

    const res = await request(uri, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payment),
    })

    const token = extractPaywallToken(res)
    opts.onDidSendPayment?.()
    return token
  }

  /**
   * Sends signed payment payload to merchant gateway.
   *
   * @param paymentRequest Request with serialized payment and optional purchase meta.
   * @param gateway Full gateway URL.
   * @returns Parsed acceptance response from gateway.
   */
  async doPayment(
    paymentRequest: AcceptPaymentRequest,
    gateway: string,
  ): Promise<AcceptPaymentResponse> {
    const res = await request(gateway, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        AcceptPaymentRequestSerde.instance.serialize(paymentRequest),
      ),
    })

    return AcceptPaymentResponseSerde.instance.deserialize(res.body)
  }

  /**
   * Verifies a previously issued token at gateway.
   *
   * @param tokenRequest Request containing token.
   * @param gateway Full gateway URL.
   * @returns Token verification response.
   */
  async doVerify(
    tokenRequest: AcceptTokenRequest,
    gateway: string,
  ): Promise<AcceptTokenResponse> {
    const res = await request(gateway, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        AcceptTokenRequestSerde.instance.serialize(tokenRequest),
      ),
    })

    return AcceptTokenResponseSerde.instance.deserialize(res.body)
  }

  /**
   * Performs preflight request (`402` / `200`) and parses paywall headers.
   *
   * @param paymentRequiredRequest Preflight request descriptor.
   * @param gateway Full gateway URL.
   * @returns Parsed paywall requirements.
   */
  async paymentRequired(
    paymentRequiredRequest: PaymentRequiredRequest,
    gateway: string,
  ): Promise<PaymentRequiredResponse> {
    const res = await request(
      PaymentRequiredRequestSerializer.instance.serialize(
        paymentRequiredRequest,
        gateway,
      ),
      {
        method: 'GET',
      },
    )

    switch (res.statusCode) {
      case STATUS_CODES.PAYMENT_REQUIRED:
      case STATUS_CODES.OK:
        return PaymentRequiredResponseSerializer.instance.deserialize(
          res.headers,
        )
      default:
        throw new BadResponseError()
    }
  }
}

export const build = (): Transport => new Transport()
