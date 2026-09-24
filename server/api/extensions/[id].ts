import { createError, getRouterParam, readBody } from "h3";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/db";
import { asPattern, asString, requireAdmin } from "../../utils/auth";

const phoneSelect = {
  id: true,
  name: true,
  macAddress: true,
  model: true,
  extension: true,
  enabled: true,
  displayName: true,
} as const;

type ExtensionWithPhone = Prisma.ExtensionGetPayload<{
  include: { phone: { select: typeof phoneSelect } };
}>;

function result(extension: ExtensionWithPhone) {
  const phone = extension.phone;
  const { secret: _secret, ...safeExtension } = extension;
  return {
    ...safeExtension,
    status: !phone ? "Unassigned" : extension.enabled ? "Enabled" : "Disabled",
    registrationState: "Not monitored",
    configState: phone ? "Configured" : "Needs a phone",
    phone,
  };
}

async function findPhone(phoneId: unknown) {
  if (phoneId === undefined || phoneId === null || phoneId === "") return null;
  if (typeof phoneId !== "string")
    throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  const phone = await prisma.phone.findUnique({
    where: { id: phoneId },
    select: phoneSelect,
  });
  if (!phone)
    throw createError({ statusCode: 400, statusMessage: "Phone not found" });
  return phone;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event as never, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });
  const current = await prisma.extension.findUnique({
    where: { id },
    include: { phone: { select: phoneSelect } },
  });
  if (!current)
    throw createError({
      statusCode: 404,
      statusMessage: "Extension not found",
    });

  if (event.method === "GET") return result(current);

  if (event.method === "PUT") {
    const body =
      (await readBody<Record<string, unknown>>(event as never)) || {};
    const phone = await findPhone(body.phoneId);
    const extension =
      body.extension === undefined
        ? current.extension
        : asPattern(body.extension, /^[0-9]{1,10}$/, 20);
    const conflict = await prisma.extension.findFirst({
      where: { extension, id: { not: id } },
    });
    if (conflict)
      throw createError({
        statusCode: 409,
        statusMessage: "Extension number is already in use",
      });
    const name =
      body.name === undefined ? current.name : asString(body.name, 120);
    const secret = body.secret
      ? asPattern(body.secret, /^[^\r\n]{1,120}$/, 120)
      : current.secret;
    const username =
      body.username !== undefined
        ? body.username
          ? asString(body.username, 80)
          : null
        : current.username;
    const data: Prisma.ExtensionUncheckedUpdateInput = {
      extension,
      name,
      ...(body.displayName !== undefined
        ? {
            displayName: body.displayName
              ? asString(body.displayName, 120)
              : null,
          }
        : {}),
      secret,
      username,
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      phoneId: phone?.id || null,
    };
    const updated = await prisma.$transaction(async (tx) => {
      if (phone) {
        await tx.extension.updateMany({
          where: { phoneId: phone.id, id: { not: id } },
          data: { phoneId: null },
        });
        await tx.phone.update({
          where: { id: phone.id },
          data: {
            extension,
            secret,
            username: username || extension,
            ...(data.displayName !== undefined
              ? { displayName: data.displayName }
              : {}),
          },
        });
      }
      return tx.extension.update({
        where: { id },
        data,
        include: { phone: { select: phoneSelect } },
      });
    });
    return result(updated);
  }

  if (event.method === "DELETE") {
    await prisma.extension.delete({ where: { id } });
    return { ok: true };
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
