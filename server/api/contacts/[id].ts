import { readBody, getRouterParam, createError } from "h3";
import { prisma } from "../../utils/db";
import { requireAdmin, asString } from "../../utils/auth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event as never, "id");
  if (event.method === "GET")
    return id
      ? prisma.contact.findUnique({ where: { id } })
      : prisma.contact.findMany({ orderBy: { name: "asc" } });
  if (event.method === "POST") {
    const b = await readBody<Record<string, unknown>>(event as never);
    return prisma.contact.create({
      data: {
        name: asString(b?.name),
        number: asString(b?.number, 40),
        description: b?.description ? asString(b.description, 160) : null,
        speedDial: b?.speedDial ? asString(b.speedDial, 20) : null,
      },
    });
  }
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing id" });
  if (event.method === "PUT") {
    const b = await readBody<Record<string, unknown>>(event as never);
    return prisma.contact.update({
      where: { id },
      data: {
        name: b?.name ? asString(b.name) : undefined,
        number: b?.number ? asString(b.number, 40) : undefined,
        description:
          b?.description === null
            ? null
            : b?.description
              ? asString(b.description, 160)
              : undefined,
        speedDial:
          b?.speedDial === null
            ? null
            : b?.speedDial
              ? asString(b.speedDial, 20)
              : undefined,
      },
    });
  }
  if (event.method === "DELETE") {
    await prisma.contact.delete({ where: { id } });
    return { ok: true };
  }
});
