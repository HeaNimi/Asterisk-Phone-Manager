import { createError, readBody } from "h3";
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
    // These are configuration states only. The manager does not monitor SIP
    // registration, so never present an enabled account as connected.
    status: !phone ? "Unassigned" : extension.enabled ? "Enabled" : "Disabled",
    registrationState: "Not monitored",
    configState: phone ? "Configured" : "Needs a phone",
    phone,
  };
}

async function syncPhoneExtensions() {
  const phones = await prisma.phone.findMany({ orderBy: { extension: "asc" } });
  for (const phone of phones) {
    await prisma.extension.updateMany({
      where: { phoneId: phone.id, extension: { not: phone.extension } },
      data: { phoneId: null },
    });
    await prisma.extension.upsert({
      where: { extension: phone.extension },
      update: {
        phoneId: phone.id,
        name: phone.name,
        displayName: phone.displayName,
        secret: phone.secret,
        username: phone.username,
        enabled: phone.enabled,
      },
      create: {
        extension: phone.extension,
        name: phone.name,
        displayName: phone.displayName,
        secret: phone.secret,
        username: phone.username,
        enabled: phone.enabled,
        phoneId: phone.id,
      },
    });
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  if (event.method === "GET") {
    await syncPhoneExtensions();
    const extensions = await prisma.extension.findMany({
      orderBy: { extension: "asc" },
      include: { phone: { select: phoneSelect } },
    });
    return extensions.map(result);
  }
  if (event.method === "POST") {
    const body =
      (await readBody<Record<string, unknown>>(event as never)) || {};
    const extension = asPattern(body.extension, /^[0-9]{1,10}$/, 20);
    if (await prisma.extension.findUnique({ where: { extension } })) {
      throw createError({
        statusCode: 409,
        statusMessage: "Extension number is already in use",
      });
    }
    const name = asString(
      body.name || body.displayName || `Extension ${extension}`,
      120,
    );
    const secret = asPattern(
      body.secret || `${extension}-change-me`,
      /^[^\r\n]{1,120}$/,
      120,
    );
    const phoneId = body.phoneId;
    if (
      phoneId !== undefined &&
      phoneId !== null &&
      typeof phoneId !== "string"
    )
      throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
    const phone = phoneId
      ? await prisma.phone.findUnique({
          where: { id: phoneId },
          select: phoneSelect,
        })
      : null;
    if (phoneId && !phone)
      throw createError({ statusCode: 400, statusMessage: "Phone not found" });
    const created = await prisma.$transaction(async (tx) => {
      if (phone) {
        await tx.extension.updateMany({
          where: { phoneId: phone.id },
          data: { phoneId: null },
        });
        await tx.phone.update({
          where: { id: phone.id },
          data: {
            extension,
            secret,
            username: body.username ? asString(body.username, 80) : extension,
            displayName: body.displayName
              ? asString(body.displayName, 120)
              : phone.displayName,
          },
        });
      }
      return tx.extension.create({
        data: {
          extension,
          name,
          displayName: body.displayName
            ? asString(body.displayName, 120)
            : null,
          secret,
          username: body.username ? asString(body.username, 80) : extension,
          enabled: body.enabled !== false,
          phoneId: phone?.id || null,
        },
        include: { phone: { select: phoneSelect } },
      });
    });
    return result(created);
  }
  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
