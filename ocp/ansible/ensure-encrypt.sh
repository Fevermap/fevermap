#!/bin/sh

echo "Encrypting files, it's fine if you see error about already encrypted files."

for file in \
group_vars/production/vault \
group_vars/staging/vault \
group_vars/dev/vault \
group_vars/konttikoulu_staging/vault
do
  echo encrypting $file
  ansible-vault encrypt $file
done
