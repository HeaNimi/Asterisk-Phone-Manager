import { join, resolve } from 'node:path'
import { mkdir, writeFile, readFile, readdir, stat, unlink } from 'node:fs/promises'
import { createError } from 'h3'
import { safeName } from './auth'

export function configuredDir(input: string, fallback: string) { return resolve(input || fallback) }
export async function ensureDir(path: string) { await mkdir(path, { recursive: true }); return path }
export function withinDir(dir: string, name: string) {
  const safe = safeName(name); const root = resolve(dir); const path = resolve(join(root, safe))
  if (path !== root && !path.startsWith(root + '\\') && !path.startsWith(root + '/')) throw createError({ statusCode: 400, statusMessage: 'Unsafe path' })
  return path
}
export async function writeManagedFile(dir: string, name: string, content: string) { const path = withinDir(await ensureDir(dir), name); await writeFile(path, content, 'utf8'); return path }
export async function readManagedFile(dir: string, name: string) { return readFile(withinDir(dir, name), 'utf8') }
export async function listManagedFiles(dir: string) { await ensureDir(dir); const entries = await readdir(dir, { withFileTypes: true }); return Promise.all(entries.filter(e => e.isFile()).map(async e => ({ filename: e.name, size: (await stat(join(dir, e.name))).size }))) }
export async function deleteManagedFile(dir: string, name: string) { await unlink(withinDir(dir, name)) }
