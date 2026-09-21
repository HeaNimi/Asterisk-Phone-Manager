import { requireAdmin } from '../../utils/auth'
export default defineEventHandler(async (event: any) => { const admin = await requireAdmin(event); return { username: admin.username } })
