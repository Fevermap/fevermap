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

# Run webpack in development mode (this Dockerfile is only for development use)
node node_modules/webpack-cli/bin/cli.js -w --mode development \
  --env.NODE_ENV="development" --env.API_URL="http://localhost:9000" --env.PUSH_API_URL="http://localhost:9001" &
# NOTE! The built files will end up with root ownership outside of the container
# in directory app/dist, but right now we will just live with it.

# Run ES server
node node_modules/es-dev-server/dist/cli.js

# Both of the above watch the source code files for new changes and
# automatically reload. This does however not apply to Webpack itself or its
# configuration file changes.
