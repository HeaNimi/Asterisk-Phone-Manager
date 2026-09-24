import { prisma } from "../../utils/db";

export default defineEventHandler(async () => ({
  available: (await prisma.admin.count()) === 0,
}));
