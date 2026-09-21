#!/bin/sh
set -eu

npx prisma db push --skip-generate
npx tsx prisma/seed.ts
exec node .output/server/index.mjs
