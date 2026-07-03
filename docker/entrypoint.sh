#!/bin/sh
set -e

echo "Syncing database schema..."
i=0
until (cd /app/db && ./node_modules/.bin/prisma db push) >/tmp/dbpush.log 2>&1; do
	i=$((i + 1))
	if [ "$i" -ge 30 ]; then
		echo "Could not sync the database after 60s. Last output:"
		cat /tmp/dbpush.log
		exit 1
	fi
	sleep 2
done
echo "Database ready."

exec node /app/apps/web/server.js
