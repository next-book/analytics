import dotenv from 'dotenv'
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import postgres from 'postgres'
import parseUserAgent from 'ua-parser-js'
import { createHash } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'node:util'
import { createReadStream } from 'fs'
const execPromisified = promisify(exec)

// 1. CLIENT -- request /collect?params --> SERVER
// 2. SERVER - validate query params
//            - parse query to event data
//            - anonymize event data
//            - store to postgres

dotenv.config()

const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
    file: './analytics-server-app.log',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
})

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

const sql = postgres({
  transform: {
    column: { to: postgres.fromCamel, from: postgres.toCamel },
  },
})

const EventHandlerInputSchema = z.object({
  v: z.string(), // version
  c: z.string().optional(), // client id
  u: z.string(), // url
  d: z.string(), // domain
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
  res.header('Access-Control-Allow-Credentials', 'true')
  res.send(result)
}

server.register(async (instance, _options, done) => {
  await instance.register(cors, {
    origin: (origin, cb) => {
      const allowed = ['localhost', '127.0.0.1', 'books-are-next.github.io']
      instance.log.info('origin:' + origin + ';')
      const hostname = new URL(origin).hostname
      if (allowed.includes(hostname)) {
        cb(null, true)
        return
      }
      cb(new Error('Not allowed'), false)
    },
  })

  instance.withTypeProvider<ZodTypeProvider>().route({
    method: ['GET'],
    url: '/collect',
    schema: {
      querystring: EventHandlerInputSchema,
    },
    handler: eventHandler,
  })

  done()
})

const ExportHandlerInputSchema = z.object({
  password: z.string(),
})

export type ExportHandlerInput = z.infer<typeof ExportHandlerInputSchema>

type ExportRequest = FastifyRequest<{
  Querystring: ExportHandlerInput
}>

server.withTypeProvider<ZodTypeProvider>().route({
  method: ['GET'],
  url: '/export',
  schema: {
    querystring: ExportHandlerInputSchema,
  },
  handler: async function (req: ExportRequest, res: FastifyReply) {
    const requiredHash =
      '15890ee7bb9829d01cedbd242b563f97961558afeea8a771b2fab367631d3261'
    const hash = createHash('sha256').update(req.query.password).digest('hex')
    if (hash !== requiredHash) {
      res.send({ message: 'password verification failed' })
      return
    }
    const { stderr } = await execPromisified(
      `psql -c "copy events to '/tmp/export.csv' delimiter ',' csv header"`
    )
    if (stderr) {
      throw new Error(`error: ${stderr}`)
    }
    const stream = createReadStream('/tmp/export.csv')
    const timestamp = new Date().toISOString()
    await res
      .header(
        'Content-Disposition',
        `attachment; filename=events-export-${timestamp}.csv`
      )
      .type('text/csv')
      .send(stream)
  },
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

export default EventHandlerInput
