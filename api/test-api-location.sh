#!/bin/bash
set -e
#
# This runs dummy API queries (using curl) against the API server.
#
# The script is hard-coded to only run against a local development environment.
API_URL="http://localhost:9000"

function api_test(){
  echo "-----------------------------------------------------------------------"
  echo "==> Request endpoint: $1"
  echo "<== Response:"
  curl -iLsS "$API_URL/api/v0/$1" > /tmp/response
  tail -n +7 /tmp/response
  if ! grep --quiet "200 OK" /tmp/response
  then
    echo "^ Error, fix it!"
    exit 1
  fi
}

api_test stats
api_test stats?country=fi
api_test location
api_test location/fi
