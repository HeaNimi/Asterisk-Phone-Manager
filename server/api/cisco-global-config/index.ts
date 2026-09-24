import { createError, readBody } from "h3";
import { prisma } from "../../utils/db";
import { asString, requireAdmin } from "../../utils/auth";

const defaults = {
  loadInformation: null,
  inactiveLoadInformation: null,
  timezone: "Etc/UTC",
  ntpServer: null,
  directoryEnabled: true,
  directoryUrl: null,
  messagesUrl: null,
  servicesUrl: null,
  fullConfig: true,
  advancedXml: "",
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  if (event.method === "GET") {
    return (
      (await prisma.ciscoGlobalConfig.findUnique({ where: { id: 1 } })) ??
      defaults
    );
  }
  if (event.method !== "PUT")
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });

  const body = await readBody<Record<string, unknown>>(event as never);
  const text = (value: unknown, max: number) =>
    value === null || value === "" ? null : asString(value, max);
  const advancedXml =
    typeof body.advancedXml === "string" ? body.advancedXml.trim() : "";
  if (advancedXml.length > 20000 || /<\/?device\b/i.test(advancedXml))
    throw createError({
      statusCode: 400,
      statusMessage: "Advanced XML must be a device fragment",
    });

  return prisma.ciscoGlobalConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ...defaults,
      loadInformation: text(body.loadInformation, 120),
      inactiveLoadInformation: text(body.inactiveLoadInformation, 120),
      timezone:
        body.timezone === undefined
          ? defaults.timezone
          : asString(body.timezone, 80),
      ntpServer: text(body.ntpServer, 120),
      directoryEnabled:
        typeof body.directoryEnabled === "boolean"
          ? body.directoryEnabled
          : true,
      directoryUrl: text(body.directoryUrl, 255),
      messagesUrl: text(body.messagesUrl, 255),
      servicesUrl: text(body.servicesUrl, 255),
      fullConfig: typeof body.fullConfig === "boolean" ? body.fullConfig : true,
      advancedXml,
    },
    update: {
      loadInformation: text(body.loadInformation, 120),
      inactiveLoadInformation: text(body.inactiveLoadInformation, 120),
      timezone:
        body.timezone === undefined ? undefined : asString(body.timezone, 80),
      ntpServer: text(body.ntpServer, 120),
      directoryEnabled:
        typeof body.directoryEnabled === "boolean"
          ? body.directoryEnabled
          : undefined,
      directoryUrl: text(body.directoryUrl, 255),
      messagesUrl: text(body.messagesUrl, 255),
      servicesUrl: text(body.servicesUrl, 255),
      fullConfig:
        typeof body.fullConfig === "boolean" ? body.fullConfig : undefined,
      advancedXml,
    },
  });
});
