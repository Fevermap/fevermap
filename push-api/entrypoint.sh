#!/bin/bash
set -e

# Turn on bash's job control so we can spawn subcommands
set -m

# Copy the pre-installed node_modules from the Docker container,
# but only if target does not have any files at all or they are older.
rsync -rv --update /tmp/node_modules .
# NOTE! The files will end up with root ownership outside of the container
# in directory app/node_modules, but right now we will just live with it.

# Create/update the node_modules directory with all the latest dependencies
npm install
# NOTE! This might modify files so they end up in root ownership outside of the
# container in directory app/node_modules, but right now we will just live with
# it.

export GOOGLE_APPLICATION_CREDENTIALS="/app/fevermap-firebase-account-file.json"

# Default to development if nothing is set
if [ -z "$NODE_ENV" ]
then
  export NODE_ENV="development"
fi


if [ "$NODE_ENV" == "development" ]
then
  # If run in development mode, run environment with nodemon to enable hot-reloads
  npm run serve
else
  # If in production mode, run with regular node
  node push-service.js
fi