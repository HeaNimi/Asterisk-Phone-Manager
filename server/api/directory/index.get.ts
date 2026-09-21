import { prisma } from '../../utils/db'
import { ciscoDirectory } from '../../utils/generators'
export default defineEventHandler(async (event: any) => { const contacts = await prisma.contact.findMany({ orderBy: { name: 'asc' } }); setHeader(event, 'content-type', 'application/xml; charset=utf-8'); return ciscoDirectory(contacts) })