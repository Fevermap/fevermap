#!/bin/sh

echo "secrets are not in git, put them in place first and remove this line"
exit

# create image streams
oc create -f is-fevermap-api.yaml
oc create -f is-fevermap-build.yaml
oc create -f is-fevermap.yaml
oc create -f is-nginx-runtime.yaml
oc create -f is-ubi8-s2i-web-app.yaml

# create secrets

oc create -f secret-fevermap-db.yaml
oc create -f secret-gitlab-webhook.yaml
oc create -f secret-registry-redhat-io-secret.yaml

# create builds

oc create -f bc-fevermap-api-s2i.yaml
oc create -f bc-fevermap-build.yaml
oc create -f bc-fevermap-runtime.yaml

# create storage

oc create -f pvc-mariadb-storage.yml

# create service

oc create -f svc-fevermap-api.yaml
oc create -f svc-fevermap-db.yaml
oc create -f svc-fevermap.yaml

# create deployments

oc create -f dc-fevermap-db.yaml
oc create -f dc-fevermap.yaml

# create routes

oc create -f route-fevermap-api.yaml
oc create -f route-fevermap.yaml

# at last, start API as database needs to start first.
echo give mariadb some time to start
sleep 120
oc create -f dc-fevermap-api.yaml

echo "done"
