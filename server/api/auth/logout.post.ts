import { clearAuthSession } from '../../utils/auth'
export default defineEventHandler(async (event: any) => { await clearAuthSession(event); return {ok:true} })
