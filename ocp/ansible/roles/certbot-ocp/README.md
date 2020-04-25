Certbot-ocp
===========

Utility for creating and updating SSL certificates for routes in OpenShift
project. Uses [Let's Encrypt certbot](https://certbot.eff.org/), apache and
OpenShift command line tools to fetch, update and install
the certificates.

This utility container is stored at
[quay.io/fevermap/certbot-ocp](
  https://quay.io/repository/fevermap/certbot-ocp?tab=info)

## How does it work?

Container runs apache and certbot. When the container starts it scans all the
routes in OpenShift project. Those routes that have been labeled with
```letsencrypt-me=true``` will be listed.

Container will create acme-challenge routes for the the domains, and it will
handle the certbot requests for all the domains. SSL certs are stored to
persistent storage for further renewals.

Once all certs are acquired, they will be patched to the application routes. Now
you have SSL certs which are valid for 90 days. When ever container is rerun, it
will renew the certs that need renewing. And again updates the routes with fresh
certs.


## OpenShift routes

This utility looks for routes labelled in certain way. You need to label your
public routes for your services with label ```letsencrypt-me=true```, or
according to your custom label from env ROUTE_LABEL.

E.g:

```
oc label route fevermap-app letsencrypt-me=true
```

## Persistence

Pod will be scaled to 0 when task is done, persistent data for certbot
will be saved in OpenShift persistent volume. Kubernetes Cron Job will use the
data in persistent storage for renewals.

Requirements
------------

This tool works for the admin user of OpenShift project. No cluster-admin
needed. Project admin rights will be used to create service account for oc
-command.

oc -command will be used to modify the OpenShift route to include the
certificates. Also we'll create temporary routes for the Let's Encrypt
verifications. For that reason we create certbot-ocp service account to have
admin permission for the container.


Role Variables
--------------

### Environement variables

The following environment variables are required for the pod:

* **cb_email**: Your email address used for the
  [Let's Encrypt](https://letsencrypt.org/) account

Optional Parameters:

* **cb_route_label**: a label in routes to recognize which routes to setup SSL
  for.
* **cb_certbot_extra_opts**: passes additional parameters for certbot. E.g.
  --test would be good while just trying out before production.
* **cb_trash_all**: deletes all /etc/letsencrypt contents. Used to force getting
  new certs. Good to use while testing the service.
* **cb_certbot_service_name**: name of the certbot service, if empty defaults to
  certbot-ocp.

Dependencies
------------

No dependencies.

Example Playbook
----------------

Including an example of how to use your role (for instance, with variables passed in as parameters) is always nice for users too:

    - hosts: servers
      roles:
         - { role: username.rolename, x: 42 }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall <ilkka.tengvall@iki.fi>
