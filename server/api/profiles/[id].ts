import { readBody, getRouterParam, createError } from 'h3'
import { prisma } from '../../utils/db'
import { requireAdmin, asString } from '../../utils/auth'
import { lineKeyCreateData, parseConfig } from '../../utils/phoneConfig'

const include = {
  lineKeys: { orderBy: { position: 'asc' as const } },
  backgroundAsset: true,
  _count: { select: { phones: true } }
}

export default defineEventHandler(async (event: any) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (event.method === 'GET') {
    return id
      ? prisma.phoneProfile.findUnique({ where: { id }, include })
      : prisma.phoneProfile.findMany({ orderBy: { name: 'asc' }, include })
  }
  const body = await readBody(event)
  if (event.method === 'POST') {
    if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'Profile name is required' })
    const config = parseConfig(body)
    if (config.backgroundAssetId && !(await prisma.tftpAsset.findUnique({ where: { id: config.backgroundAssetId } }))) {
      throw createError({ statusCode: 400, statusMessage: 'Background asset not found' })
    }
    return prisma.phoneProfile.create({
      data: {
        name: asString(body.name, 80),
        model: config.model || 'Cisco 8841',
        callManagerPrimary: config.callManagerPrimary || 'asterisk',
        callManagerFailover: config.callManagerFailover || null,
        timezone: config.timezone || 'Etc/UTC',
        ntpServer: config.ntpServer || null,
        webAccess: config.webAccess ?? false,
        settingsAccess: config.settingsAccess ?? true,
        sshAccess: config.sshAccess ?? false,
        callWaiting: config.callWaiting ?? true,
        doNotDisturb: config.doNotDisturb ?? false,
        autoAnswer: config.autoAnswer ?? false,
        voicemailNumber: config.voicemailNumber || null,
        voicemailName: config.voicemailName || null,
        ringSetting: config.ringSetting || 'Cisco',
        sipTransport: config.sipTransport || 'UDP',
        backgroundAssetId: config.backgroundAssetId || null,
        lineKeys: { create: (config.lineKeys || []).map(lineKeyCreateData) }
      },
      include
    })
  }
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  if (event.method === 'PUT') {
    const config = parseConfig(body)
    if (config.backgroundAssetId && !(await prisma.tftpAsset.findUnique({ where: { id: config.backgroundAssetId } }))) {
      throw createError({ statusCode: 400, statusMessage: 'Background asset not found' })
    }
    const data: any = {
      ...(body?.name !== undefined ? { name: asString(body.name, 80) } : {}),
      ...(config.model !== undefined ? { model: config.model } : {}),
      ...(config.callManagerPrimary !== undefined ? { callManagerPrimary: config.callManagerPrimary } : {}),
      ...(config.callManagerFailover !== undefined ? { callManagerFailover: config.callManagerFailover || null } : {}),
      ...(config.timezone !== undefined ? { timezone: config.timezone } : {}),
      ...(config.ntpServer !== undefined ? { ntpServer: config.ntpServer || null } : {}),
      ...(config.webAccess !== undefined ? { webAccess: config.webAccess } : {}),
      ...(config.settingsAccess !== undefined ? { settingsAccess: config.settingsAccess } : {}),
      ...(config.sshAccess !== undefined ? { sshAccess: config.sshAccess } : {}),
      ...(config.callWaiting !== undefined ? { callWaiting: config.callWaiting } : {}),
      ...(config.doNotDisturb !== undefined ? { doNotDisturb: config.doNotDisturb } : {}),
      ...(config.autoAnswer !== undefined ? { autoAnswer: config.autoAnswer } : {}),
      ...(config.voicemailNumber !== undefined ? { voicemailNumber: config.voicemailNumber || null } : {}),
      ...(config.voicemailName !== undefined ? { voicemailName: config.voicemailName || null } : {}),
      ...(config.ringSetting !== undefined ? { ringSetting: config.ringSetting } : {}),
      ...(config.sipTransport !== undefined ? { sipTransport: config.sipTransport } : {}),
      ...(config.backgroundAssetId !== undefined ? { backgroundAssetId: config.backgroundAssetId || null } : {})
    }
    if (config.lineKeys !== undefined) data.lineKeys = { deleteMany: {}, create: config.lineKeys.map(lineKeyCreateData) }
    return prisma.phoneProfile.update({ where: { id }, data, include })
  }
  if (event.method === 'DELETE') {
    await prisma.phoneProfile.delete({ where: { id } })
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
