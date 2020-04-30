#!/bin/sh

echo "Encrypting files, it's fine if you see error about already encrypted files."

for file in route-staging-fevermap-api.yaml \
route-staging-fevermap-app.yaml \
route-staging-push-api.yaml \
secret-staging-aws-db-backup.yaml \
secret-staging-fevermap-api-db.yaml \
secret-staging-fevermap-db.yaml \
secret-staging-gitlab-webhook.yaml \
secret-staging-quay-push-secret.yaml \
secret-staging-firebase.yaml \
secret-staging-registry-redhat-io-secret.yaml; do
  echo encrypting $file
  ansible-vault encrypt --vault-password-file=../.vault-pw $file --output $file.vaulted
done
