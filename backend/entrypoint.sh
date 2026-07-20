#!/bin/sh
set -e

DB_PATH="${DJANGO_SQLITE_PATH:-/app/db.sqlite3}"
DB_DIR="$(dirname "$DB_PATH")"

mkdir -p "$DB_DIR"
chown -R app:app "$DB_DIR"

if [ "$1" = "python" ] && [ "$2" = "manage.py" ] && [ "$3" = "runserver" ]; then
  gosu app python manage.py migrate --noinput
  exec gosu app "$@"
fi

exec gosu app "$@"
