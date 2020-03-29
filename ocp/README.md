Cloud Environment
=================

# Application architecture

Fevermap is designed to be modular. It consist of:

* WWW frontend
* API service
* Database

Those turn nicely into pods in kubernetes, and both the API and web frontend can
be individually scaled according to load. Each component has service for them
(kubernetes service discovery/dns). This handles load balancing as well in case
pods gets scaled up'n down.

![app in ocp](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-app.png)

Images are built once, and the URLs and some start options may be given them as
environment variables and config map to make them adapt to different runtime
locations.

# Setting up test environment

The easiest way is to use the template. It asks you few parameters, and
lets OpenShift bring up all the components. If you want to use GUI, import the
template first (need admin for this):

```
curl https://gitlab.com/fevermap/fevermap/-/blob/feature/ocp-template/ocp/template-fevermap.yaml|oc create -n openshift
```

After that you'll find it from the OpenShift Catalog. It will ask you with parameters,
and provides the samples. See partial screenshot:

![app in ocp](https://gitlab.com/fevermap/fevermap/-/raw/master/ocp/ocp-template.png)

Another way is to provision it from command line. Here are two examples, the second
one omits some parameters that are not necessary:

```
curl https://gitlab.com/fevermap/fevermap/-/blob/feature/ocp-template/ocp/template-fevermap-persistent.yaml| \
  oc new-app \
  -p NAME=test \
  -p NAMESPACE=fever-template \
  -p MEMORY_FRONT_LIMIT=512Mi \
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
  -f template-fevermap-persistent.yaml \
  -p NAME=fevermap \
  -p NAMESPACE=fever-template \
  -p APPLICATION_FRONT_DOMAIN=front.apps.ocp4.konttikoulu.fi \
  -p APPLICATION_API_DOMAIN=api.apps.ocp4.konttikoulu.fi
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

# Image builds.

Fevermap has been setup with environment in OpenShift Online cloud service for
automated image builds, and test/stage environment. Environment follows the git
changes, and rebuilds and deploys the new versions based on code changes in
GitLab.

After code changes the rebuilt images are shared for further use and security
scanning. Jenkins job uploads images here:

* [Frontend container](https://quay.io/repository/fevermap/fevermap) including
  static frontpage
* [API container](https://quay.io/repository/fevermap/fevermap-api) including
  the API code

Quay.io container registry then does security scanning on them.

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

# Self healing

It's still to do that we set up limits and monitors for the components for
memory/cpu usage. It would then autoscale application according to set rules. At
any case, if container dies, it will be respawn by kubernetes.
