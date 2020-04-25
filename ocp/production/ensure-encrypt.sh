#!/bin/sh

echo "Encrypting files, it's fine if you see error about already encrypted files."

for file in route-prod-fevermap-api.yaml \
route-prod-push-api.yaml \
route-prod-fevermap-front.yaml \
route-prod-feberkarta-se-app.yaml \
route-prod-kuumekartta-fi-app.yaml \
secret-prod-aws-db-backup.yaml \
secret-prod-fevermap-api-db.yaml \
secret-prod-firebase.yaml \
secret-prod-fevermap-db.yaml; \
do
  echo encrypting $file
  ansible-vault encrypt --vault-password-file=../.vault-pw $file --output $file.vaulted
done
