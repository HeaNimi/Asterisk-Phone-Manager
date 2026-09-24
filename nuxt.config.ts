export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/ui", "@nuxt/icon", "@nuxt/eslint"],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
    sessionSecret: process.env.SESSION_SECRET || "development-only-change-me",
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === "true",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "change-me-now",
    uploadDir: process.env.UPLOAD_DIR || "./data/tftp",
    asteriskConfigDir: process.env.ASTERISK_CONFIG_DIR || "./data/asterisk",
    tftpDir: process.env.TFTP_DIR || "./data/tftp",
    reloadCommand: process.env.RELOAD_COMMAND || "",
    reloadAllowedCommands: process.env.RELOAD_ALLOWED_COMMANDS || "",
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Asterisk Phone Manager",
    },
  },
  nitro: { preset: "node-server" },
  typescript: { strict: true, typeCheck: true },
});
