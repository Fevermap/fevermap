api
===

Creates API for Fevermap.
See [Fevermap OCP README](
  https://gitlab.com/fevermap/fevermap/-/blob/master/ocp/README.md)
 for further info.

Requirements
------------

OpenShift connection and account with project admin access.

Role Variables
--------------

Defaults for following variables are in defaults/main.yml:

* **state**: present/absent
* **app**: Label all resources with given app label
* **db_name**: Database name
* **db_user**: DB username
* **db_password**: DB password
* **api_build_image**: S2I image to use for building container.
* **api_python_version**: This is used only for OpenShift GUI component
* **api_source_repository_ref**: Git branch/tag, e.g. 'master'
* **api_source_repository_url**: 'https://gitlab.com/fevermap/fevermap.git'
* **api_gitlab_webhook_secret**': Build job start webhook secret.
* **api_replicas**: Amount to scale replicas to
* **api_image**: Which api image and version to use.
* **api_image_tag**: Image tag used, e.g. release/latest
* **api_fqdn**: Public URL for your API.
* **app_hpa_\***: Autoscaler limits and trigger
* **app_memory_limit**: Pod memory limit

Dependencies
------------

Fevermap API component depends on Fevermap DB.

None

Example Playbook
----------------

    - hosts: all
      roles:
         - { api: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall