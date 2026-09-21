import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'change-me-now'
  const hash = await bcrypt.hash(password, 12)
  await prisma.admin.upsert({ where: { username }, update: {}, create: { username, passwordHash: hash } })
  const count = await prisma.phone.count()
  const profile = await prisma.phoneProfile.upsert({
    where: { name: 'Cisco office standard' },
    update: {},
    create: {
      name: 'Cisco office standard',
      model: 'Cisco 8841',
      callManagerPrimary: process.env.ASTERISK_HOST || 'asterisk',
      timezone: process.env.PHONE_TIMEZONE || 'Etc/UTC',
      ntpServer: process.env.NTP_SERVER || null,
      lineKeys: { create: [{ position: 1, label: 'Main line', extension: '100', feature: 'line', ringSetting: 'Cisco' }] }
    }
  })
  let phone = await prisma.phone.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!count) phone = await prisma.phone.create({ data: { name: 'Lobby phone', extension: '100', macAddress: '001122334455', model: 'Cisco 8841', secret: 'change-this-secret', displayName: 'Lobby', profileId: profile.id, lineKeys: { create: [{ position: 1, label: 'Lobby', extension: '100', feature: 'line' }] } } })
  if (phone) await prisma.extension.upsert({ where: { extension: phone.extension }, update: { phoneId: phone.id }, create: { extension: phone.extension, name: phone.name, displayName: phone.displayName, secret: phone.secret, username: phone.username, enabled: phone.enabled, phoneId: phone.id } })
  const contacts = await prisma.contact.count()
  if (!contacts) await prisma.contact.createMany({ data: [{ name: 'Reception', number: '100' }, { name: 'Emergency', number: '911', description: 'Emergency services' }] })
}
main().finally(() => prisma.$disconnect())
