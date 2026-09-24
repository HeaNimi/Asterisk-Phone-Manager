import { readBody, createError } from "h3";
import { prisma } from "../../utils/db";
import { hashPassword, createSession, asString } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  if (await prisma.admin.count()) {
    throw createError({
      statusCode: 409,
      statusMessage: "Admin already configured",
    });
  }

  const body = await readBody<Record<string, unknown>>(event as never);
  const username = asString(
    body?.username || process.env.ADMIN_USERNAME || "admin",
    80,
  );
  const password = asString(body?.password, 200);
  const admin = await prisma.admin.create({
    data: { username, passwordHash: await hashPassword(password) },
  });

  await createSession(event, admin.id);
  return { username: admin.username };
});
