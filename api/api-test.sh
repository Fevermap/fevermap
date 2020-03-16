#!/bin/bash
set -e

API_URL="http://localhost:9000"

function api_test(){
  echo "-----------------------------------------------------------------------"
  echo "==> Request:"
  echo "$1"
  echo "<== Response:"
  curl -iLsS -X POST -H "Content-Type: application/json" -d "$1" "$API_URL/api/v0/submit"
}

# No fever and fever_temp null
api_test '{
  "device_id":"1584694478111",
  "fever_status":false,
  "fever_temp":null,
  "birth_year":"1996",
  "gender":"M",
  "location_country_code":"FI",
  "location_postal_code":"20100",
  "location_lng":"22.2833007",
  "location_lat":"60.4538845"
}'

# No fever and fever_temp missing
api_test '{
  "device_id":"1584694478222",
  "fever_status":false,
  "birth_year":"2001",
  "gender":"F",
  "location_country_code":"SE",
  "location_postal_code":"7017710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'

# Fever
api_test '{
  "device_id":"1584694478333",
  "fever_status":true,
  "fever_temp":"38.0",
  "birth_year":"1996",
  "gender":"M",
  "location_country_code":"FI",
  "location_postal_code":"20100",
  "location_lng":"22.2833007",
  "location_lat":"60.4538845"
}'

# Location is float with extra decimals
api_test '{
  "device_id":"1584694478444",
  "fever_status":false,
  "birth_year":"2001",
  "gender":"M",
  "location_country_code":"US",
  "location_postal_code":"70-17710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'
