import { readBody, createError } from "h3";
import { prisma } from "../../utils/db";
import { verifyPassword, createSession, asString } from "../../utils/auth";
export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event as never);
  const username = asString(body?.username, 80);
  const password = asString(body?.password, 200);
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash)))
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  await createSession(event, admin.id);
  return { username: admin.username };
});
