api
===

Creates frontend APP for Fevermap.
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
* **app_fqdn**: List of domains to expose as routes
* **app_source_repository_ref**: Fevermap git repo branch
* **app_source_repository_url**:  Fevermap git url
* **app_stage1_build_image**: e.g: nodeshift/ubi8-s2i-web-app:10.x
* **app_stage2_build_image**: e.g. registry.redhat.io/rhel8/nginx-116
* **app_image**: Which app image and version to use.
* **app_image_tag**: Image tag used, e.g. release/latest
* **app_google_analytics_code**: Google analytics code
* **ws_api_url**: How does browser reach your API? E.g:'https://api.example.com'
* **ws_app_url**: How does browser reach your API? E.g:'https://app.example.com'
* **api_hpa_\***: Autoscaler limits and trigger
* **api_memory_limit**: Pod memory limit

Dependencies
------------

Fevermap APP component depends on Fevermap DB.

None

Example Playbook
----------------

    - hosts: all
      roles:
         - { app: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall