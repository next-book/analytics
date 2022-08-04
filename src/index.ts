import dotenv from 'dotenv'
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import postgres from 'postgres'
import parseUserAgent from 'ua-parser-js'

// import { writeFile, readFile } from 'fs/promises'
// import { randomBytes } from 'crypto'

// 1. CLIENT -- request /collect?params --> SERVER
// 2. SERVER - validate query params
//            - parse query to event data
//            - anonymize event data
//            - store to postgres

dotenv.config()

const server: FastifyInstance = Fastify({ logger: true })
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

const sql = postgres({
  transform: {
    column: { to: postgres.fromCamel, from: postgres.toCamel },
  },
})

const EventHandlerInputSchema = z.object({
  v: z.string(), // version
  c: z.string().uuid().optional(), // client id
  u: z.string(), // url
  d: z.string(), // domain
  l: z.string().optional(), // book location
  p: z.string().optional(), // pathname
  b: z.string(), // book identifier
  r: z.string().optional(), // referrer
  w: z.string().optional(), // width
  utm_medium: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  en: z.string(), // event name
  ec: z.string().optional(), // event category
  em: z.string().optional(), // event method
  ev: z.string().optional(), // event value
})

export type EventHandlerInput = z.infer<typeof EventHandlerInputSchema>

type EventRequest = FastifyRequest<{
  Querystring: EventHandlerInput
}>

function parseMajorVersion(v: string): string {
  return v.split('.')[0]
}

function parseCookie(c?: string): string | undefined {
  const parsed = c
    ?.trim()
    .split(';')
    .map((c) => c.split('='))
    .filter((nv) => nv[0] === 'nb_cid')
  if (parsed && parsed[0] && parsed[0][1]) return parsed[0][1]
}

function calculateScreenSize(w: number) {
  if (w < 576) return 'mobile'
  else if (w < 992) return 'tablet'
  else if (w < 1440) return 'laptop'
  return 'desktop'
}

// interface Salt {
//   salt: string
//   createdAt: string
// }

// interface Salts {
//   current: Salt
//   previous?: Salt
// }

// async function getSalts(): Promise<Salts> {
//   const path = '/tmp/var/.salts'
//   try {
//     const data = await readFile(path, { encoding: 'utf8' })
//     const salts: Salts = JSON.parse(data)
//     const currentDate = new Date(salts.current.createdAt)
//     if ()
//   } catch (err) {
//     const salts = {
//       current: {
//         salt: randomBytes(16).toString('base64'),
//         createdAt: new Date().toUTCString(),
//       },
//     }
//     await writeFile(path, JSON.stringify(salts))
//     return salts
//   }
//
//   //
//   // check if current sult is fresh
//   // not: move current sult to previous
//   //      generate new current salt
//   // return current and previous sult
// }
// function generateUserId(
//   dailySalt: string,
//   bookLocation: string,
//   ip: string,
//   userAgent: string
// ) {
//   return ''
// }

async function eventHandler(req: EventRequest, res: FastifyReply) {
  if (!process.env.npm_package_version)
    throw new Error('Package version not available.')
  if (
    parseMajorVersion(process.env.npm_package_version) !==
    parseMajorVersion(req.query.v)
  )
    throw new Error(
      `Unexpected version. Expects ${process.env.npm_package_version}`
    )
  const { query, headers } = req
  const ua = parseUserAgent(headers['user-agent'])
  const event = {
    clientId: query.c || parseCookie(headers.cookie) || null,
    bookId: query.b,
    domain: query.d,
    url: query.u,
    pathname: query.p || null,
    bookLocation: query.l || null,
    referrer: query.r || null,
    utmMedium: query.utm_medium || null,
    utmSource: query.utm_source || null,
    utmCampaign: query.utm_campaign || null,
    utmContent: query.utm_content || null,
    utmTerm: query.utm_term || null,
    category: query.ec || null,
    name: query.en || null,
    method: query.em || null,
    value: query.ev || null,
    operatingSystem: ua.os.name || null,
    operatingSystemVersion: ua.os.version || null,
    browser: ua.browser.name || null,
    browserVersion: ua.browser.version || null,
    screenSize: (query.w && calculateScreenSize(parseInt(query.w))) || null,
  }
  const result = await sql`
  insert into events ${sql(event)}
  `
  res.send(result)
}

server.withTypeProvider<ZodTypeProvider>().route({
  method: ['GET'],
  url: '/collect',
  schema: {
    querystring: EventHandlerInputSchema,
    // todo: typed result schema
  },
  handler: eventHandler,
})

const start = async () => {
  try {
    await server.listen({ port: 3000 })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
