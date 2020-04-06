# Before running this script, ensure you have done:
# oc login
# oc project fevermap-prod
# and make sure you DON'T EVER PUSH THE SECRETS IN PLAINTEXT into git!

oc get cm -o yaml --export fevermap-app-nginx-liveness > cm-prod-liveness-nginx.yaml
oc get cm -o yaml --export fevermap-api-uwsgi-starter > cm-prod-uwsgi-starter.yaml
oc get dc -o yaml --export fevermap-front > dc-prod-fevermap-front.yaml
oc get dc -o yaml --export fevermap-api > dc-prod-fevermap-api.yaml
oc get dc -o yaml --export fevermap-db > dc-prod-fevermap-db.yaml
oc get hpa -o yaml --export fevermap-api > hpa-prod-api.yaml
oc get hpa -o yaml --export fevermap-front > hpa-prod-front.yaml
oc get cj -o yaml --export fevermap-db-backup > cj-prod-db-backup.yaml
oc get project -o yaml fevermap-prod > project-prod-fevermap-prod.yaml
oc get pvc -o yaml --export fevermap-mariadb-storage > pvc-prod-mariadb.yaml
oc get route -o yaml --export fevermap-api > route-prod-fevermap-api.yaml
oc get route -o yaml --export fevermap-app > route-prod-fevermap-front.yaml
oc get secret -o yaml --export aws-db-backup > secret-prod-aws-db-backup.yaml
oc get secret -o yaml --export fevermap-db > secret-prod-fevermap-db.yaml
oc get secret -o yaml --export fevermap-api-db > secret-prod-fevermap-api-db.yaml
oc get svc -o yaml --export fevermap-front > svc-prod-fevermap-front.yaml
oc get svc -o yaml --export fevermap-api > svc-prod-fevermap-api.yaml
oc get svc -o yaml --export fevermap-db > svc-prod-fevermap-db.yaml

echo "Done. Remember to ansible-vault secret* and route*"