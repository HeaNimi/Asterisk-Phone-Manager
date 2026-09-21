import bcrypt from 'bcryptjs'
import { createError, getCookie, setCookie, deleteCookie } from 'h3'
import { randomBytes } from 'node:crypto'
import { prisma } from './db'

const COOKIE = 'apm_session'
const ttl = 1000 * 60 * 60 * 24 * 7
export async function createSession(event: any, adminId: string) {
  const id = randomBytes(32).toString('hex')
  await prisma.session.create({ data: { id, adminId, expiresAt: new Date(Date.now() + ttl) } })
  setCookie(event, COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: useRuntimeConfig().sessionCookieSecure, path: '/', maxAge: ttl / 1000 })
}
export async function clearAuthSession(event: any) {
  const id = getCookie(event, COOKIE)
  if (id) await prisma.session.deleteMany({ where: { id } })
  deleteCookie(event, COOKIE, { path: '/' })
}
export async function requireAdmin(event: any) {
  const id = getCookie(event, COOKIE)
  if (!id) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const session = await prisma.session.findUnique({ where: { id }, include: { admin: true } })
  if (!session || session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { id } }); deleteCookie(event, COOKIE, { path: '/' })
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }
  return session.admin
}
export const hashPassword = (value: string) => bcrypt.hash(value, 12)
export const verifyPassword = (value: string, hash: string) => bcrypt.compare(value, hash)
export function safeName(name: string) {
  const base = name.replace(/\\/g, '/').split('/').pop() || ''
  if (!base || base === '.' || base === '..' || base.length > 180 || !/^[\w .-]+$/.test(base)) throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  return base
}
export function asPattern(value: unknown, pattern: RegExp, max = 200) { const text = asString(value, max); if (!pattern.test(text)) throw createError({ statusCode: 400, statusMessage: 'Invalid input format' }); return text }
export function xmlEscape(value: string) { return value.replace(/[<>&'\"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '\"': '&quot;' }[c]!)) }
export function asString(value: unknown, max = 200) { if (typeof value !== 'string' || !value.trim() || value.length > max) throw createError({ statusCode: 400, statusMessage: 'Invalid input' }); return value.trim() }


