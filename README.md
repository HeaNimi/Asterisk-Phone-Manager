# Asterisk Phone Manager

A runnable Nuxt 4.5.1 MVP for a small, single-admin Cisco/Asterisk phone deployment. The backend manages inventory and files; it does **not** run a TFTP server. Keep TFTP serving on the host or an existing TFTP service.

## Features

- Local single-admin setup/login with bcrypt password hashes and secure HTTP-only sessions.
- Phone inventory (extension, MAC, model, SIP credentials) and contacts/phonebook.
- Curated Cisco SEP settings per phone: call-manager failover, timezone/NTP, web/security controls, SIP transport and call features, voicemail, ring settings, line keys/buttons, and a host-served background asset.
- Reusable Cisco profiles that can be applied to a phone, with validated line-key templates.
- Cisco XML directory endpoint and Cisco UCMA-compatible `SEP<MAC>.xml` generation.
- Generated `pjsip.generated.conf` and `extensions.generated.conf` files.
- Safe bind-mounted file writes with filename/path traversal protection.
- TFTP asset upload/list/delete (5 MB limit), with files written to the configured TFTP root.
- Model-neutral SIP profile data suitable for adding Snom rendering later. Cisco model selection currently covers common 78xx/88xx models.
- Optional controlled reload command, only when the exact command is present in an allowlist.
- SQLite default; `prisma/schema.postgres.prisma` is provided for PostgreSQL deployments.

Set `SESSION_COOKIE_SECURE=true` when serving the application over HTTPS. Leave it
`false` for a local HTTP deployment.

## Local setup

```sh
cp .env.example .env
# Change SESSION_SECRET and ADMIN_PASSWORD in .env
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. On a fresh database use **First-time setup**, or use the seeded credentials from `.env`. The seed creates a `Cisco office standard` profile and a lobby phone when the inventory is empty.

## Host mounts and TFTP

The application only writes files. Run a host TFTP daemon (for example, `tftpd-hpa`) pointed at the same directory configured as `TFTP_DIR`. For Docker, mount it at `/app/data/tftp`:

```yaml
volumes:
  - /srv/tftp:/app/data/tftp
  - /etc/asterisk:/app/data/asterisk
```

The container runs `prisma db push` and the idempotent seed script on startup,
so the SQLite database is initialized automatically. Keep `./data` persistent.

Asterisk includes can reference `/etc/asterisk/pjsip.generated.conf` and `/etc/asterisk/extensions.generated.conf` after mounting the generated directory. The UI's generate action safely replaces only those managed files. The Cisco XML directory is available at `/api/directory`; put it behind your reverse proxy if phones need a stable HTTPS URL. `GET /api/generate/ucma/<MAC>` writes and returns a SEP XML file. All inventory, profile, asset, and generation APIs require the admin session.

## Optional reload

Set both `RELOAD_COMMAND` and the exact same comma-separated value in `RELOAD_ALLOWED_COMMANDS`, e.g. `asterisk -rx reload`. The endpoint refuses commands not explicitly allowed and rejects shell metacharacters. Prefer a narrowly scoped wrapper executable in production.

## PostgreSQL

Copy `prisma/schema.postgres.prisma` over `prisma/schema.prisma`, set `DATABASE_URL=postgresql://...`, then run `npx prisma generate && npx prisma db push`. `schema.prisma` is the SQLite default; `schema.postgres.prisma` contains the same configuration models for PostgreSQL.
