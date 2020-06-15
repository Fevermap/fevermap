Cloud Environment
=================

# Application architecture

Fevermap is designed to be modular. It consist of:

* WWW frontend
* API service
* Push API service
* Database

Those turn nicely into pods in kubernetes, and both the API and web frontend can
be individually scaled according to load. Each component has service for them
(kubernetes service discovery/dns). This handles load balancing as well in case
pods gets scaled up'n down.

![app in ocp](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-app.png)

Images are built once, and the URLs and some start options may be given them as
environment variables and config map to make them adapt to different runtime
locations.

# Setting up Fevermap into OpenShift

## Pre-requisites

Setup expects you have OpenShift access, and the oc -client installed. For local
tests on your laptop, get
[Code Ready Containers installed](https://developers.redhat.com/blog/2019/09/05/red-hat-openshift-4-on-your-laptop-introducing-red-hat-codeready-containers/) on
your laptop. It's OpenShift in virtual machine. Also this assumes you have done
Red Hat
[registry pull token](https://docs.openshift.com/container-platform/3.11/install_config/configuring_red_hat_registry.html#creating-service-accounts-tokens_configuring_red_hat_registry)
and added it to secret named
registry-redhat-io-secret
[instructed here](https://docs.openshift.com/container-platform/3.11/install_config/configuring_red_hat_registry.html#using-service-accounts_configuring_red_hat_registry).
You need to create free Red Hat developer account for this unless you already
have an account.


## Installing Fevermap project to OpenShift environment

There are two ways for intalling the Fevermap. Template is a quick and easy
one command. Ansible playbooks is to control different environmnets handling
the secrets in proper encrypted way. Ansible is the GitOps way.

## Install using templates

The easiest way is to use the template. It asks you few parameters, and
lets OpenShift bring up all the components. If you want to use GUI, import the
template first (need admin for this):

```
curl https://gitlab.com/fevermap/fevermap/-/blob/feature/ocp-template/ocp/
template-fevermap.yaml|oc create -n openshift
```

After that you'll find it from the OpenShift Catalog. It will ask you with
parameters, and provides the samples. See partial screenshot:

![app in ocp](
  https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-template.png)

Another way is to provision it from command line. Here are two examples, the
second one omits some parameters that are not necessary:

```
curl https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/staging/\
template-fevermap-staging.yaml| \
  oc new-app \
  -p NAME=test \
  -p NAMESPACE=fever-template \
  -p MEMORY_APP_LIMIT=512Mi \
  -p MEMORY_API_LIMIT=512Mi \
  -p MEMORY_MYSQL_LIMIT=512Mi \
  -p VOLUME_CAPACITY=1Gi \
  -p SOURCE_REPOSITORY_URL=https://gitlab.com/fevermap/fevermap.git \
  -p SOURCE_REPOSITORY_REF=master \
  -p APPLICATION_FRONT_DOMAIN=front.apps.ocp4.konttikoulu.fi \
  -p APPLICATION_API_DOMAIN=api.apps.ocp4.konttikoulu.fi \
  -p DATABASE_SERVICE_NAME=db \
  -p DATABASE_NAME=feverdb \
  -p DATABASE_USER=fever \
  -p DATABASE_PASSWORD=fever \
  -p DATABASE_ROOT_PASSWORD=feverr
```

from local file:

```
oc new-app \
  -f template-fevermap-staging.yaml \
  -p NAME=fevermap \
  -p NAMESPACE=fevermap-staging \
  -p APPLICATION_APP_DOMAIN=app.apps.ocp4.konttikoulu.fi \
  -p APPLICATION_API_DOMAIN=api.apps.ocp4.konttikoulu.fi
```

for production kind of env:

```
oc new-app \
  -f template-fevermap-runtime.yaml \
  -p NAME=fevermap \
  -p NAMESPACE=fevermap-prod \
  -p APPLICATION_APP_DOMAIN=app-prod.apps.ocp4.konttikoulu.fi \
  -p APPLICATION_API_DOMAIN=api-prod.apps.ocp4.konttikoulu.fi \
  -p APP_IMG_URL=quay.io/fevermap/fevermap-app \
  -p API_IMG_URL=quay.io/fevermap/fevermap-api
  ```

# Install using Ansible

Ansible playbooks are in ```ocp/ansible``` directory. The configuration is
capable of handling several sites. All config across the sites is similar,
only the site specific details vary.

There are some sites set up:

* dev
* staging
* production
* konttikoulu_staging (my personal playground)

Their corresponding variables are in ```group_vars``` directory for each group.
Each directory has the following files:

* main.yml - variables specific for the environment.
* vault - secrets that go into variables, e..g passwords, are encrypted here.

There are also common variables for all sites in ```group_vars/all/main.yml```.
Some common variables are also set in each role's ```defaults/main.yml``` file.

To allow ansible access your project, do the following commands in your project:

```
oc create sa ansible
oc adm policy add-role-to-user admin -z ansible
oc sa get-token ansible
```

Then insert the ansible token from the last command to ```vault_api_key```
-variable in your vault.

To install fevermap into konttikoulu_staging I use:

```
ansible-playbook -i konttikoulu_staging fevermap.yml \
  -e manage_projects=true -e state=present
```

To uninstall it, I use:

```
ansible-playbook -i konttikoulu_staging fevermap.yml \
  -e manage_projects=true -e state=absent
```

I can also configure just parts of it, like update some secret, or e.g. api:
```
ansible-playbook -i staging fevermap.yml -t secrets
ansible-playbook -i staging fevermap.yml -t api
```

## GitOps with Ansible

Everything in OpenShift can and should be configured now via ansible. This way
we can track the changes in git. If you want to change a setting or add
something, do in ```ocp/ansible/``` directory:

1. change the ansible configurations either in group variables, or
the logic code in ```roles/*``` directories.
2. test the changes first in staging
   ```ansible-playbook -i staging fevermap.yml```
3. Ensure the vault is encrypted
  ```./ensure-encrypt.sh```
3. commit the changes, do the usual merge and review...
4. merge to master
5. apply into production
   ```ansible-playbook -i production fevermap.yml```

When you edit ansible code, make sure it's idempodent. Which means you can
always safely rerun the configurations, and it should repeatedly work and end
up into same results.

## Ansible secrets handling

Things like passwords or tokens are in vault files. To access/modify them
you need to place your vault password into ```ocp/ansible/.vault-pw``` file.

You can now access the vaults the following ways:
```
ansible-vault decrypt group_vars/staging/vault
ansible-vault encrypt group_vars/staging/vault
ansible-vault edit    group_vars/staging/vault
ansible-vault view    group_vars/staging/vault
./ensure-encrypt.sh
```

# Storage

Both web frontend and API service are static images, which won't need persistent
storage. The database however will use persistent storage, which will be
provided by kubernetes. It's enough to specify the size of needed storage for
mariadb.

@ottok expects this being the bottle neck of performance. When the
application will get load, the storage for mariadb will get I/O peak. We could
use some other backend for MariaDB in production (Cassandra?), or have it
external if such happens.

# Logging and monitoring

Front end and API logs are collect and visible within OpenShift. Cluster might
be set to provide elastic search and kibana for logs. Monitoring by prometheus
is not set up yet.

# Build and Release Process

Fevermap has been setup with environment in OpenShift Online cloud service for
automated image builds, and test/stage environment. Environment follows the git
changes, and rebuilds and deploys the new versions based on code changes in
GitLab. Pipelines are in
[ocp/staging/pipelines](https://gitlab.com/fevermap/fevermap/-/tree/master/ocp/staging/pipelines)
directory.

Everything start from merge, commit or tag of master branch in gitlab. That will
send webhook to OCP. OCP will run the following pipelines for image build in
Jenkins.

## Code change

First we evaluate which directories the changes are in. If it doesn't consern
the ```app/```, ```api/```or ```push-api/``` dir, we don't care:

![detect change](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-pipeline-detect-change.png)

If the change is in ```api/```, ```push-api/```or ```app/``` dirs, pipeline
does the following steps:

![build pipeline](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-pipeline-build.png)

1. Detect change, and accordingly kick OpenShift buildstream to:
  * If API change, get the python container and do API image build with new
    code. Store the new image locally
  * If APP change, get the code and do nodejs build. Store the artifacts. Start
    second build step to build NginX image with generated static code.
  * If Push API change, get the code and do nodejs build.
2. Tag the built images with git version hash in OpenShift registry.
3. Push images to Quay.io for further use and security scan.
4. Tag image in Quay.io with git version hash.

## Release a new SW version

Once the team is ready to publish a new version into production, they create a
new tag on master branch. The following pipeline get's triggered by webhook from
gitlab:

![release pipeline](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-pipeline-release.png)

1. Detect release tag
2. Get commit hash
3. Tag API image in local registry with release tag
4. Tag APP image in local registry with release tag
5. Tag Push API image in local registry with release tag
6. Tag [API image in Quay.io](
   https://quay.io/repository/fevermap/fevermap-api?tab=tags) with release tag
7. Tag [APP image in Quay.io](
   https://quay.io/repository/fevermap/fevermap-app?tab=tags) with release tag
8. Tag [Push API image in Quay.io](
   https://quay.io/repository/fevermap/fevermap-push-api?tab=tags) with
   release tag

OpenShift is set to trigger on the release tag. New release tag will cause a
rolling upgrade for production. See
[OpenShiftdocs](https://docs.openshift.com/container-platform/latest/applications/deployments/managing-deployment-processes.html)
for options to roll back and forwards.

Images can be used from there for local development too. You can see the info
about images from Quay.io:

![build pipeline](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-quayio-releases.png)


## Build strategies

API is straight forward python container. It requires some packages to be
installed, and just dropping the flask code into container. At the end of build,
it will store the image to fevermap-api image stream.

Frontend is two staged build. It uses nodejs container to build the static page
code. The artifacts are stored for the second stage. The second stage will grab
NginX web container and drops the static code into www directory. This image is
be stored to fevermap image stream.

DB doesn't require any build, we use existing MariaDB images as such.

# Exposing the service to internet

OpenShift router exposes the web frontend port to internet using given fqdn.
Router terminates the SSL connection, and forwards the traffic to both the
fevermap and fevermap-api service. The FQDN is possible to be changed in static
code by using environment variables and config maps for the containers. That
sets the address at boot time of container.

# Acquiring and maintaining HTTPS TSL certificates

We have the site secured by HTTPS connections. Acquiring the TLS certificates is
automated using [Let's Encrypt](https://letsencrypt.org/) service and home grown
kubernetes automation for it.

Each route is labelled with label ```letsencrypt-me=true```. The
[certbot-ocp service](https://github.com/ikke-t/cerbot-ocp) is run and it
installs all such labeled routes with TLS certificate and key.

Service also uses persistent volume to store the certbot data for periodic
renewal of certificates, which is run as kubernetes cronjob.

# Self healing

We have set up limits and monitors for the components for memory/cpu usage. It
autoscale application according to set rules. If
container dies, it will be respawn by kubernetes.

# OpenShift settings

All OpenShift settings are stored in ```/ocp/ansible/``` directory of this
repository.


