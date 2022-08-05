/// <reference lib="dom" />
type EventHandlerInput = import('./index').EventHandlerInput
type MetaIdentifierElement =
  import('@next-book/publisher').MetaIdentifierElement

// sends event from browser to server if:
// - not on localhost,
// - localstorage key nb-analytics-ignore not equal to true

const DEBUG = true
const AnalyticsURL = 'http://localhost:3000'

type EventName = string
type EventParams = {
  name: string
  category: string
  method: string
  value: string
}

function getClientId() {
  // check if valid cookie exists
  //
  const id =
    Math.random().toString(36).substring(2, 15) +
    '.' +
    Math.floor(new Date().getTime()) +
    '.' +
    Math.floor(performance.now())

  document.cookie = `nb-cid=${id}; max-age=60*60*24*365*2; SameSite=lax; Secure`
  // not: create cookie and return its value
  // yes: return its value
  // find
  return id
}

function track(event: EventParams | EventName) {
  const hostname = window.location.hostname
  if (!DEBUG && (hostname === 'localhost' || hostname === '127.0.0.1')) return
  if (window.localStorage.getItem('nb-analytics-ignore')) return
  const detailed = typeof event !== 'string'
  const identifier = document.querySelector<MetaIdentifierElement>(
    'meta[name="nb-identifier"]'
  ).content
  // const clientId = '78730de4-c8e4-403a-a69f-192aaadedf35'
  // const urlObj = new URL(document.URL)

  const clientId = getClientId()

  const params: EventHandlerInput = {
    v: '0.0.0',
    c: clientId,
    u: document.URL,
    d: document.domain + '/topol-kloktat-dehet',
    p: document.location.pathname,
    b: identifier,
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
  if (DEBUG) console.log('Opening request')
  request.open(
    'GET',
    `${AnalyticsURL}/collect?${new URLSearchParams(params).toString()}`
  )
  request.withCredentials = true
  if (false) {
    console.log('Event request aborted:', request)
    request.abort()
  } else {
    request.send()
  }
}

interface Window {
  track: (event: EventParams | EventName) => void
}

;(function (window: Window) {
  window.track = track
})(window)