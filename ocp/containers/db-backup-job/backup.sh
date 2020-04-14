#!/bin/bash
echo "Executing mysqldump"
mysqldump  -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" --host fevermap-db "$MYSQL_DATABASE" > /tmp/mysqldump.sql
now=$(date +"%Y-%m-%d-%H%M")
cd /tmp || exit
echo "Compressing"
tar -czvf "mysqldump-${now}-${BACKUP_FILE_SUFFIX}.tar.gz mysqldump.sql"
echo "Uploading"
aws s3 cp "/tmp/mysqldump-${now}-${BACKUP_FILE_SUFFIX}.tar.gz" --region="$AWS_S3_REGION" "s3://$AWS_S3_BUCKET"
