/// <reference lib="dom" />
type EventHandlerInput = import('./server').EventHandlerInput

type EventName = string

type EventParams = {
  name: string
  category: string
  method: string
  value: string
}

let singletonTracker: Tracker | null = null

class Tracker {
  private version: string
  private debug: boolean
  private domain: string
  private identifier: string
  private apiURL?: string
  private clientId?: string

  constructor(identifier: string, domain: string, apiURL?: string) {
    if (singletonTracker) throw new Error('Tracker instance already exists.')
    this.version = '0.0.0'
    this.debug = false
    this.identifier = identifier
    this.domain = domain
    this.apiURL = 'http://46.101.96.119' || apiURL
    this.clientId = this.getClientId()
  }

  /**
   * Returns client identifier from cookie if exists,
   * creates and returns new identifier otherwise.
   */
  getClientId(): string {
    const cookies = document.cookie
      .split('; ')
      .map((a) => a.split('='))
      .filter((c) => c[0] === 'nb-cid')
    const exists = cookies.length == 1
    if (!exists) {
      const id =
        (Math.random().toString(16) + '000000000').substr(2, 8) +
        '.' +
        Math.floor(new Date().getTime()) +
        '.' +
        Math.floor(performance.now())
      document.cookie = `nb-cid=${id}; max-age=60*60*24*365*2; SameSite=lax; Secure`
      return id
    }
    return cookies[0][1]
  }

  /**
   * Sends event to API endpoint, the event can be pageview, interaction or other kind
   */
  send(event: EventParams | EventName) {
    const hostname = window.location.hostname
    if (!this.debug && (hostname === 'localhost' || hostname === '127.0.0.1'))
      return
    if (window.localStorage.getItem('nb-analytics-ignore')) return
    const detailed = typeof event !== 'string'

    const params: EventHandlerInput = {
      v: this.version,
      c: this.clientId,
      u: document.URL,
      d: this.domain || document.domain,
      p: document.location.pathname,
      b: this.identifier,
      r: document.referrer,
      w: window.innerWidth.toString(),
      // utm_medium: url('utm_medium'),
      // utm_source: url('utm_source'),
      // utm_campaign: url('utm_campaign'),
      // utm_content: url('utm_content'),
      en: detailed ? event.name : event,
    }
    if (detailed) {
      params.en = event.name
      params.ec = event.category
      params.em = event.method
      params.ev = event.value
    } else {
      params.en = event
    }
    let request = new XMLHttpRequest()
    if (this.debug) console.log('Opening request')
    request.open(
      'GET',
      `${this.apiURL}/collect?${new URLSearchParams(params).toString()}`
    )
    request.withCredentials = true
    if (this.debug) {
      console.log('Event request aborted:', request)
      request.abort()
    } else {
      request.send()
    }
  }
}

export function createTracker(
  identifier: string,
  domain: string,
  apiURL?: string
) {
  singletonTracker = new Tracker(identifier, domain, apiURL)
  return singletonTracker
}

export default singletonTracker
