import { readBody, getRouterParam, createError } from "h3";
import type { Phone, Prisma } from "@prisma/client";
import { prisma } from "../../utils/db";
import { requireAdmin, asString, asPattern } from "../../utils/auth";
import { lineKeyCreateData, parseConfig } from "../../utils/phoneConfig";

const include = {
  lineKeys: { orderBy: { position: "asc" as const } },
  backgroundAsset: true,
  profile: { include: { lineKeys: { orderBy: { position: "asc" as const } } } },
};

type RequestBody = Record<string, unknown>;

function baseData(body: RequestBody, creating = false) {
  return {
    ...(creating || body?.name !== undefined
      ? { name: asString(body?.name) }
      : {}),
    ...(creating || body?.extension !== undefined
      ? { extension: asPattern(body?.extension, /^[0-9]{1,10}$/, 20) }
      : {}),
    ...(creating || body?.macAddress !== undefined
      ? {
          macAddress: asPattern(body?.macAddress, /^[a-fA-F0-9: -]{12,17}$/, 30)
            .replace(/[^a-fA-F0-9]/g, "")
            .toUpperCase(),
        }
      : {}),
    ...(creating || body?.secret !== undefined
      ? { secret: asPattern(body?.secret, /^[^\r\n]{1,120}$/, 120) }
      : {}),
    ...(body?.username !== undefined
      ? {
          username:
            body.username === null || body.username === ""
              ? null
              : asString(body.username, 80),
        }
      : {}),
    ...(body?.displayName !== undefined
      ? {
          displayName:
            body.displayName === null || body.displayName === ""
              ? null
              : asString(body.displayName, 80),
        }
      : {}),
    ...(body?.model !== undefined
      ? { model: asString(body.model, 80) }
      : creating
        ? { model: "Cisco 8841" }
        : {}),
    ...(typeof body?.enabled === "boolean"
      ? { enabled: body.enabled }
      : creating
        ? { enabled: true }
        : {}),
  };
}

function configData(body: RequestBody, creating = false) {
  const config = parseConfig(body);
  return {
    ...(config.model !== undefined ? { model: config.model } : {}),
    ...(config.profileId !== undefined
      ? { profileId: config.profileId || null }
      : {}),
    ...(config.callManagerPrimary !== undefined
      ? { callManagerPrimary: config.callManagerPrimary }
      : creating
        ? { callManagerPrimary: "asterisk" }
        : {}),
    ...(config.callManagerFailover !== undefined
      ? { callManagerFailover: config.callManagerFailover || null }
      : {}),
    ...(config.timezone !== undefined
      ? { timezone: config.timezone }
      : creating
        ? { timezone: "Etc/UTC" }
        : {}),
    ...(config.ntpServer !== undefined
      ? { ntpServer: config.ntpServer || null }
      : {}),
    ...(config.webAccess !== undefined
      ? { webAccess: config.webAccess }
      : creating
        ? { webAccess: false }
        : {}),
    ...(config.settingsAccess !== undefined
      ? { settingsAccess: config.settingsAccess }
      : creating
        ? { settingsAccess: true }
        : {}),
    ...(config.sshAccess !== undefined
      ? { sshAccess: config.sshAccess }
      : creating
        ? { sshAccess: false }
        : {}),
    ...(config.callWaiting !== undefined
      ? { callWaiting: config.callWaiting }
      : creating
        ? { callWaiting: true }
        : {}),
    ...(config.doNotDisturb !== undefined
      ? { doNotDisturb: config.doNotDisturb }
      : creating
        ? { doNotDisturb: false }
        : {}),
    ...(config.autoAnswer !== undefined
      ? { autoAnswer: config.autoAnswer }
      : creating
        ? { autoAnswer: false }
        : {}),
    ...(config.voicemailNumber !== undefined
      ? { voicemailNumber: config.voicemailNumber || null }
      : {}),
    ...(config.voicemailName !== undefined
      ? { voicemailName: config.voicemailName || null }
      : {}),
    ...(config.ringSetting !== undefined
      ? { ringSetting: config.ringSetting }
      : creating
        ? { ringSetting: "Cisco" }
        : {}),
    ...(config.sipTransport !== undefined
      ? { sipTransport: config.sipTransport }
      : creating
        ? { sipTransport: "UDP" }
        : {}),
    ...(config.backgroundAssetId !== undefined
      ? { backgroundAssetId: config.backgroundAssetId || null }
      : {}),
  };
}

async function syncExtension(phone: Phone) {
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

function decoratePhone(phone: Phone) {
  return {
    ...phone,
    status: phone.enabled ? "Enabled" : "Disabled",
    configState: "Configured",
  };
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event as never, "id");
  if (event.method === "GET") {
    const phones = id
      ? await prisma.phone.findUnique({ where: { id }, include })
      : await prisma.phone.findMany({ orderBy: { extension: "asc" }, include });
    return Array.isArray(phones)
      ? phones.map(decoratePhone)
      : phones && decoratePhone(phones);
  }
  const body = await readBody<Record<string, unknown>>(event as never);
  if (event.method === "POST") {
    const config = parseConfig(body);
    const data = {
      ...baseData(body, true),
      ...configData(body, true),
    } as Prisma.PhoneUncheckedCreateInput;
    if (config.backgroundAssetId) {
      const asset = await prisma.tftpAsset.findUnique({
        where: { id: config.backgroundAssetId },
      });
      if (!asset)
        throw createError({
          statusCode: 400,
          statusMessage: "Background asset not found",
        });
    }
    const created = await prisma.phone.create({
      data: {
        ...data,
        lineKeys: { create: (config.lineKeys || []).map(lineKeyCreateData) },
      },
      include,
    });
    await syncExtension(created);
    return decoratePhone(created);
  }
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });
  if (event.method === "PUT") {
    const config = parseConfig(body);
    if (
      config.profileId &&
      !(await prisma.phoneProfile.findUnique({
        where: { id: config.profileId },
      }))
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Profile not found",
      });
    }
    if (config.backgroundAssetId) {
      const asset = await prisma.tftpAsset.findUnique({
        where: { id: config.backgroundAssetId },
      });
      if (!asset)
        throw createError({
          statusCode: 400,
          statusMessage: "Background asset not found",
        });
    }
    const data: Prisma.PhoneUncheckedUpdateInput = {
      ...baseData(body),
      ...configData(body),
    };
    if (config.lineKeys !== undefined) {
      data.lineKeys = {
        deleteMany: {},
        create: config.lineKeys.map(lineKeyCreateData),
      };
    }
    const updated = await prisma.phone.update({ where: { id }, data, include });
    await syncExtension(updated);
    return decoratePhone(updated);
  }
  if (event.method === "DELETE") {
    await prisma.extension.updateMany({
      where: { phoneId: id },
      data: { phoneId: null },
    });
    await prisma.phone.delete({ where: { id } });
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
