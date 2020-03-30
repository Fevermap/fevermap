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

if [ "$FLASK_ENV" == "development" ]
then
  # Start a secondary process to gracefully reload uswgi if any of it's files get
  # modified. Needs Debian packages procps and entr installed on system.
  echo "Starting entr to watch for source code changes..."
  (find /app | entr -p -s "echo 'Entr: reloading...' && pkill --signal SIGHUP uwsgi" &)
  # This is only indented for development use, don't run production with this entrypoint.
fi

uwsgi \
    --plugins=python37 \
    --module=fevermap.wsgi:application \
    --master \
    --processes=5 \
    --threads=2 \
    --set-placeholder="base=${APPDIR}" \
    --chdir="%(base)" \
    --http-socket="0.0.0.0:9000" \
    --uid="$(id -un)" \
    --gid="$(id -gn)" \
    --vacuum \
    --die-on-term \
    --env="LC_ALL=C.UTF-8" \
    --env="LANG=C.UTF-8"
