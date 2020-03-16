#!/bin/bash
set -e

# Turn on bash's job control so we can spawn subcommands
set -m

# https://flask.palletsprojects.com/en/1.1.x/cli/
export FLASK_APP="fevermap"

# Default to development if nothing is set
if [ -z "$FLASK_ENV" ]
then
  export FLASK_ENV="development"
fi

export PYTHONPATH="${APPDIR}:${PYTHONPATH}"
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Start a secondary process to gracefully reload uswgi if any of it's files get
# modified. Needs Debian packages procps and entr installed on system.
(find /app | entr -p -s "echo 'Entr: reloading...' && pkill --signal SIGHUP uwsgi" &)

uwsgi \
    --plugins=python37 \
    --module=fevermap.wsgi:application \
    --master \
    --processes=5 \
    --threads=2 \
    --set-placeholder="base=/app" \
    --chdir="%(base)" \
    --touch-reload="%(base)/fevermap/__init__.py" \
    --http-socket="0.0.0.0:9000" \
    --uid="fevermap" \
    --gid="fevermap" \
    --vacuum \
    --die-on-term \
    --env="LC_ALL=C.UTF-8"
    --env="LANG=C.UTF-8"
