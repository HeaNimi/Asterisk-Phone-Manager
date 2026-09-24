import { requireAdmin } from "../../utils/auth";
import { prisma } from "../../utils/db";
import { pjsipConfig, extensionsConfig } from "../../utils/generators";
import { configuredDir, writeManagedFile } from "../../utils/files";
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const accounts = await prisma.extension.findMany({
    orderBy: { extension: "asc" },
  });
  const pjsip = pjsipConfig(accounts);
  const extensions = extensionsConfig(accounts);
  const dir = configuredDir(
    useRuntimeConfig().asteriskConfigDir,
    "./data/asterisk",
  );
  await writeManagedFile(dir, "pjsip.generated.conf", pjsip);
  await writeManagedFile(dir, "extensions.generated.conf", extensions);
  setHeader(event, "content-type", "application/json");
  return {
    files: ["pjsip.generated.conf", "extensions.generated.conf"],
    pjsip,
    extensions,
  };
});
