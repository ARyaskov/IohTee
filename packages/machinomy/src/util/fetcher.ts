import fetch from 'node-fetch'

export interface Fetcher {
  fetch: typeof fetch
}

let fetcher: Fetcher

// tslint:disable-next-line:strict-type-predicates
if (typeof fetch === 'undefined') {
  fetcher = {
    fetch: fetch
  }
} else {
  fetcher = {
    fetch: fetch.bind(undefined),
  }
}

export default fetcher
