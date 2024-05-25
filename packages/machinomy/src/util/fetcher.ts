import ponyFill from 'fetch-ponyfill'

export interface Fetcher {
  fetch: typeof fetch
}

let fetcher: Fetcher

// tslint:disable-next-line:strict-type-predicates
if (typeof fetch === 'undefined') {
  fetcher = ponyFill()
} else {
  fetcher = {
    fetch: fetch.bind(undefined)
  }
}

export default fetcher
