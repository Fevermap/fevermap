#!/bin/bash
# oc login
# oc project fevermap-staging
# and make sure you DON'T EVER PUSH THE SECRETS IN PLAINTEXT into git!
oc get bc -o yaml --export fevermap-api > bc-staging-fevermap-api.yaml
oc get bc -o yaml --export fevermap-app > bc-staging-fevermap-app.yaml
oc get bc -o yaml --export fevermap-app-compile > bc-staging-fevermap-app-compile.yaml
oc get bc -o yaml --export fevermap-pipeline > bc-staging-fevermap-pipeline.yaml
oc get bc -o yaml --export fevermap-release > bc-staging-fevermap-release.yaml
oc get bc -o yaml --export fevermap-push-api > bc-staging-push-api.yaml
oc get cj -o yaml --export certbot-ocp > cj-staging-certbot-ocp.yaml
oc get cm -o yaml --export window-settings > cm-staging-window-settings.yaml
oc get cm -o yaml --export fevermap-app-nginx-liveness > cm-staging-liveness-nginx.yaml
oc get cm -o yaml --export fevermap-api-uwsgi-starter > cm-staging-api-uwsgi-starter.yaml
oc get is -o yaml --export fevermap-app > is-staging-fevermap-app.yaml
oc get is -o yaml --export fevermap-app-compile > is-staging-fevermap-app-compile.yaml
oc get is -o yaml --export fevermap-api > is-staging-fevermap-api.yaml
oc get is -o yaml --export fevermap-push-api > is-staging-push-api.yaml
oc get is -o yaml --export ubi8-s2i-web-app > is-staging-ubi8-s2i-web-app.yaml
oc get pvc -o yaml --export mariadb-storage > pvc-staging-mariadb-storage.yaml
oc get pvc -o yaml --export certbot-letsencrypt > pvc-staging-certbot-letsencrypt.yaml
oc get secret -o yaml --export aws-db-backup > secret-staging-aws-db-backup.yaml
oc get secret -o yaml --export fevermap-db > secret-staging-fevermap-db.yaml
oc get secret -o yaml --export fevermap-api-db > secret-staging-fevermap-api-db.yaml
oc get secret -o yaml --export gitlab-webhook > secret-staging-gitlab-webhook.yaml
oc get secret -o yaml --export fevermap-firebase-account-file > secret-staging-firebase.yaml
oc get secret -o yaml --export quay-push-secret > secret-staging-quay-push-secret.yaml
oc get secret -o yaml --export registry-redhat-io-secret > secret-staging-registry-redhat-io-secret.yaml
oc get sa -o yaml --export certbot > sa-staging-certbot.yaml
oc get svc -o yaml --export fevermap-app > svc-staging-fevermap-app.yaml
oc get svc -o yaml --export fevermap-api > svc-staging-fevermap-api.yaml
oc get svc -o yaml --export fevermap-db > svc-staging-fevermap-db.yaml
oc get svc -o yaml --export fevermap-push-api > svc-staging-push-api.yaml
oc get svc -o yaml --export certbot-ocp > svc-staging-certbot-ocp.yaml
oc get rolebinding -o yaml certbot > rb-staging-certbot.yaml
oc get pod -o yaml --export certbot-ocp > pod-staging-certbot-ocp.yaml
oc get dc -o yaml --export fevermap-app > dc-staging-fevermap-app.yaml
oc get dc -o yaml --export fevermap-api > dc-staging-fevermap-api.yaml
oc get dc -o yaml --export fevermap-db > dc-staging-fevermap-db.yaml
oc get dc -o yaml --export fevermap-push-api > dc-staging-push-api.yaml
oc get route -o yaml --export fevermap-api > route-staging-fevermap-api.yaml
oc get route -o yaml --export fevermap-app > route-staging-fevermap-app.yaml
oc get route -o yaml --export fevermap-push-api-staging > route-staging-push-api.yaml

echo "Done. Remember to ansible-vault secret*"
