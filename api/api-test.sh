#!/bin/bash
set -e

API_URL="http://localhost:9000"

function api_test(){
  echo "-----------------------------------------------------------------------"
  echo "==> Request:"
  echo "$1"
  echo "<== Response:"
  curl -iLsS -X POST -H "Content-Type: application/json" -d "$1" "$API_URL/api/v0/submit" > /tmp/response
  cat /tmp/response
  if ! grep --quiet "200 OK" /tmp/response
  then
    echo "^ Error, fix it!"
    exit 1
  fi
}

# No fever and fever_temp null
# No symptoms or diagnosis submitted
api_test '{
  "device_id":"1584694478111",
  "fever_status":false,
  "fever_temp":null,
  "birth_year":"1996",
  "gender":"F",
  "location_country_code":"FI",
  "location_postal_code":"20100",
  "location_lng":"22.2833007",
  "location_lat":"60.4538845"
}'

# No fever and fever_temp missing
# Symptoms and diagnosis all null
api_test '{
  "device_id":"1584694478222",
  "fever_status":false,
  "symptom_difficult_to_breath":null,
  "symptom_cough":null,
  "symptom_sore_throat":null,
  "symptom_muscle_pain":null,
  "diagnosed_covid19":null,
  "birth_year":"2001",
  "gender":"F",
  "location_country_code":"SE",
  "location_postal_code":"7017710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'

# Fever
# Symptoms and diagnosis all true
api_test '{
  "device_id":"1584694478333",
  "fever_status":true,
  "fever_temp":"38.0",
  "symptom_difficult_to_breath":true,
  "symptom_cough":true,
  "symptom_sore_throat":true,
  "symptom_muscle_pain":true,
  "diagnosed_covid19":true,
  "birth_year":"1996",
  "gender":"M",
  "location_country_code":"FI",
  "location_postal_code":"20100",
  "location_lng":"22.2833007",
  "location_lat":"60.4538845"
}'

# Location is float with extra decimals
# Symptoms and diagnosis all false
api_test '{
  "device_id":"1584694478444",
  "fever_status":false,
  "symptom_difficult_to_breath":false,
  "symptom_cough":false,
  "symptom_sore_throat":false,
  "symptom_muscle_pain":false,
  "diagnosed_covid19":false,
  "birth_year":"2001",
  "gender":"M",
  "location_country_code":"US",
  "location_postal_code":"70-17710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'

# Location Ireland, different coordinates and postal code
api_test '{
  "device_id":"1584694478555",
  "fever_status":false,
  "fever_temp":"37.0",
  "birth_year":"1982",
  "gender":"M",
  "symptom_difficult_to_breath":false,
  "symptom_cough":true,
  "symptom_sore_throat":false,
  "symptom_muscle_pain":true,
  "diagnosed_covid19":true,
  "location_country_code":"IE",
  "location_postal_code":"H91 E2K3",
  "location_lng":"-9.2363393",
  "location_lat":"53.3867155"
}'

# Ensure one submission is always a new device
NEW_DEVICE_ID="$(date +%s)$(shuf -i 100-999 -n 1)"
api_test '{
  "device_id":"'"$NEW_DEVICE_ID"'",
  "fever_status":false,
  "symptom_difficult_to_breath":false,
  "symptom_cough":false,
  "symptom_sore_throat":false,
  "symptom_muscle_pain":false,
  "diagnosed_covid19":false,
  "birth_year":"2001",
  "gender":"M",
  "location_country_code":"US",
  "location_postal_code":"70-17710",
  "location_lng":"22.2833007",
  "location_lat":"60.45388459999"
}'

# Also test the stats API
curl -iLsS "$API_URL/api/v0/stats"
