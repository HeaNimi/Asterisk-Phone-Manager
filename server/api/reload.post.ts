import { createError } from 'h3'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { requireAdmin } from '../utils/auth'
const run = promisify(execFile)
export default defineEventHandler(async (event: any) => { await requireAdmin(event); const config = useRuntimeConfig(); const command = String(config.reloadCommand || '').trim(); const allowed = String(config.reloadAllowedCommands || '').split(',').map(x => x.trim()).filter(Boolean); if (!command || !allowed.includes(command)) throw createError({ statusCode: 403, statusMessage: 'Reload command is not configured or allowed' }); const tokens = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(x => x.replace(/^"|"$/g, '')) || []; if (!tokens.length || tokens.some(x => /[;&|`$<>]/.test(x))) throw createError({ statusCode: 400, statusMessage: 'Unsafe reload command' }); const result = await run(tokens[0]!, tokens.slice(1), { timeout: 15000, windowsHide: true, encoding: 'utf8' }); return { ok: true, output: `${result.stdout || ''}${result.stderr || ''}`.slice(0, 4000) } })


