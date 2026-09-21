import { getRouterParam, createError } from 'h3'
import { prisma } from '../../../utils/db'
import { requireAdmin } from '../../../utils/auth'
import { ciscoConfig } from '../../../utils/generators'
import { configuredDir, writeManagedFile } from '../../../utils/files'
export default defineEventHandler(async (event: any) => {
  await requireAdmin(event)
  const mac = (getRouterParam(event, 'mac') || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase()
  const phone = await prisma.phone.findFirst({ where: { macAddress: mac }, include: { lineKeys: { orderBy: { position: 'asc' } }, backgroundAsset: true } })
  if (!phone) throw createError({ statusCode: 404, statusMessage: 'Phone not found' })
  const xml = ciscoConfig(phone, process.env.ASTERISK_HOST || 'asterisk')
  await writeManagedFile(configuredDir(useRuntimeConfig().tftpDir, './data/tftp'), `SEP${mac}.xml`, xml)
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
