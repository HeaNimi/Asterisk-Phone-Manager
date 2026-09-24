import { getRouterParam, createError } from "h3";
import { prisma } from "../../../utils/db";
import { requireAdmin } from "../../../utils/auth";
import { snomProfile } from "../../../utils/deviceProfiles";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const mac = (getRouterParam(event as never, "mac") || "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();
  const phone = await prisma.phone.findFirst({ where: { macAddress: mac } });
  if (!phone)
    throw createError({ statusCode: 404, statusMessage: "Phone not found" });
  return snomProfile(phone, "/api/directory");
});
