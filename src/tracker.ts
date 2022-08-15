/// <reference lib="dom" />
type EventHandlerInput = import('./server').EventHandlerInput

type EventName = string

type EventParams = {
  name: string
  category?: string
  method?: string
  value?: string
}

class Tracker {
  private static instance: Tracker | null

  private version: string
  private debug: boolean
  private domain?: string
  private identifier?: string
  private initiated: boolean
  private apiURL?: string
  private clientId?: string

  constructor() {
    this.version = '0.0.2'
    this.debug = true
    this.initiated = false
  }

  public static getInstance(): Tracker {
    if (!Tracker.instance) {
      Tracker.instance = new Tracker()
    }
    return Tracker.instance
  }

  public init(id: string, domain: string, apiURL?: string, debug?: boolean) {
    const tracker = Tracker.getInstance()
    if (tracker.initiated) throw new Error('Tracker already initiated.')
    tracker.identifier = id
    tracker.domain = domain
    tracker.apiURL = apiURL || 'https://analytics.next-book.info'
    tracker.clientId = tracker.getClientId()
    if (debug) tracker.debug = debug
    tracker.initiated = true
  }

  /**
   * Returns client identifier from cookie if exists,
   * creates and returns new identifier otherwise.
   */
  private getClientId(): string {
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

  private log(message: string) {
    if (this.debug) console.log('[tracker] ' + message)
  }

  /**
   * Sends event to API endpoint, the event can be pageview, interaction or other kind
   */
  public send(event: EventParams | EventName) {
    if (!this.initiated || !this.identifier)
      throw new Error('Tracker is not initiated.')
    const hostname = window.location.hostname
    if (!this.debug && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      this.log('Event not send on localhost')
      return
    }
    if (window.localStorage.getItem('nb-analytics-ignore')) {
      this.log('Event ignored')
      return
    }
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
      ...(typeof event !== 'string'
        ? {
            en: event.name,
            ec: event.category,
            em: event.method,
            ev: event.value,
          }
        : { en: event }),
    }
    Object.keys(params).forEach(
      (key) =>
        !params[key as keyof EventHandlerInput] &&
        delete params[key as keyof EventHandlerInput]
    )
    let request = new XMLHttpRequest()
    const url = `${this.apiURL}/collect?${new URLSearchParams(
      params
    ).toString()}`
    request.open('GET', url)
    request.withCredentials = true
    if (!this.debug) {
      console.log('[track-debug] Event request aborted:', url)
      request.abort()
    } else {
      request.send()
    }
  }
}

let singletonTracker: Tracker = Tracker.getInstance()

export default singletonTracker
