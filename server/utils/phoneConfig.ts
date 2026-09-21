import { createError } from 'h3'
import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const featureValues = ['line', 'speed-dial', 'blf', 'park', 'voicemail', 'service'] as const

export const lineKeySchema = z.object({
  position: z.number().int().min(1).max(32),
  label: z.string().trim().min(1).max(80),
  extension: z.string().trim().regex(/^[0-9]{1,20}$/).nullable().optional(),
  feature: z.enum(featureValues).default('line'),
  ringSetting: optionalText(40)
})

export const configSchema = z.object({
  model: z.string().trim().min(1).max(80).optional(),
  profileId: z.string().trim().min(1).max(40).nullable().optional(),
  callManagerPrimary: z.string().trim().min(1).max(120).optional(),
  callManagerFailover: optionalText(120),
  timezone: z.string().trim().min(1).max(80).optional(),
  ntpServer: optionalText(120),
  webAccess: z.boolean().optional(),
  settingsAccess: z.boolean().optional(),
  sshAccess: z.boolean().optional(),
  callWaiting: z.boolean().optional(),
  doNotDisturb: z.boolean().optional(),
  autoAnswer: z.boolean().optional(),
  voicemailNumber: optionalText(40),
  voicemailName: optionalText(80),
  ringSetting: z.string().trim().min(1).max(40).optional(),
  sipTransport: z.enum(['UDP', 'TCP', 'TLS']).optional(),
  backgroundAssetId: z.string().trim().min(1).max(40).nullable().optional(),
  lineKeys: z.array(lineKeySchema).max(32).optional()
})

export function parseConfig(body: unknown) {
  const parsed = configSchema.safeParse(body || {})
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message || 'Invalid configuration' })
  const positions = parsed.data.lineKeys?.map(line => line.position) || []
  if (new Set(positions).size !== positions.length) throw createError({ statusCode: 400, statusMessage: 'Line key positions must be unique' })
  return parsed.data
}

export function lineKeyCreateData(line: z.infer<typeof lineKeySchema>) {
  return { position: line.position, label: line.label, extension: line.extension || null, feature: line.feature, ringSetting: line.ringSetting || null }
}
