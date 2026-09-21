import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'
import { requireAdmin } from '../../utils/auth'
import { withinDir } from '../../utils/files'
import { unlink } from 'node:fs/promises'
export default defineEventHandler(async (event: any) => { await requireAdmin(event); const id = getRouterParam(event, 'id'); if (event.method !== 'DELETE' || !id) throw createError({ statusCode: 405, statusMessage: 'Method not allowed' }); const asset = await prisma.tftpAsset.findUnique({ where: { id } }); if (!asset) throw createError({ statusCode: 404, statusMessage: 'Asset not found' }); const dir = useRuntimeConfig().tftpDir; try { await unlink(withinDir(dir, asset.filename)) } catch (e: any) { if (e.code !== 'ENOENT') throw e }; await prisma.tftpAsset.delete({ where: { id } }); return { ok: true } })
