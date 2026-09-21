import { readMultipartFormData, createError, getRequestHeader } from 'h3'
import { prisma } from '../../utils/db'
import { requireAdmin, safeName } from '../../utils/auth'
import { configuredDir, ensureDir, withinDir } from '../../utils/files'
import { writeFile } from 'node:fs/promises'
export default defineEventHandler(async (event: any) => {
  await requireAdmin(event); const config = useRuntimeConfig(); const dir = configuredDir(config.tftpDir, './data/tftp')
  if (event.method === 'GET') return prisma.tftpAsset.findMany({ orderBy: { filename: 'asc' } })
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  const length = Number(getRequestHeader(event, 'content-length') || 0); if (length > 5 * 1024 * 1024 + 64 * 1024) throw createError({ statusCode: 413, statusMessage: 'Upload too large' })
  const parts = await readMultipartFormData(event); const file = parts?.find(p => p.name === 'file' && p.data)
  if (!file || file.data.length > 5 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'File missing or larger than 5 MB' })
  const filename = safeName(file.filename || 'asset.bin'); await ensureDir(dir); const path = withinDir(dir, filename); await writeFile(path, file.data)
  return prisma.tftpAsset.upsert({ where: { filename }, update: { originalName: file.filename || filename, mimeType: file.type, size: file.data.length, path }, create: { filename, originalName: file.filename || filename, mimeType: file.type, size: file.data.length, path } })
})