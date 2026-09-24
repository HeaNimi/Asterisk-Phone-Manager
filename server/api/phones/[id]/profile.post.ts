import { readBody, getRouterParam, createError } from "h3";
import { prisma } from "../../../utils/db";
import { requireAdmin } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const phoneId = getRouterParam(event as never, "id");
  const body = await readBody<Record<string, unknown>>(event as never);
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";
  if (!phoneId || !profileId)
    throw createError({
      statusCode: 400,
      statusMessage: "Profile id is required",
    });
  const profile = await prisma.phoneProfile.findUnique({
    where: { id: profileId },
    include: { lineKeys: { orderBy: { position: "asc" } } },
  });
  if (!profile)
    throw createError({ statusCode: 404, statusMessage: "Profile not found" });
  return prisma.phone.update({
    where: { id: phoneId },
    data: {
      profileId: profile.id,
      model: profile.model,
      callManagerPrimary: profile.callManagerPrimary,
      callManagerFailover: profile.callManagerFailover,
      timezone: profile.timezone,
      ntpServer: profile.ntpServer,
      webAccess: profile.webAccess,
      settingsAccess: profile.settingsAccess,
      sshAccess: profile.sshAccess,
      callWaiting: profile.callWaiting,
      doNotDisturb: profile.doNotDisturb,
      autoAnswer: profile.autoAnswer,
      voicemailNumber: profile.voicemailNumber,
      voicemailName: profile.voicemailName,
      ringSetting: profile.ringSetting,
      sipTransport: profile.sipTransport,
      backgroundAssetId: profile.backgroundAssetId,
      lineKeys: {
        deleteMany: {},
        create: profile.lineKeys.map((line) => ({
          position: line.position,
          label: line.label,
          extension: line.extension,
          feature: line.feature,
          ringSetting: line.ringSetting,
        })),
      },
    },
    include: {
      lineKeys: { orderBy: { position: "asc" } },
      backgroundAsset: true,
      profile: true,
    },
  });
});
