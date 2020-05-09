push-api
========

Creates Push-API for Fevermap.
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
* **push_api_source_repository_url**: 'https://gitlab.com/fevermap/fevermap.git'
* **push_api_source_repository_ref**: 'master'
* **push_api_firebase_account**: Production credentials for firebase
* **push_api_build_image**: S2I image to build push api
* **push_api_image**: Which api image and version to use.
* **push_api_image_tag**: Image tag used, e.g. release/latest
* **push_api_memory_limit**: Pod memory limit

Dependencies
------------

Fevermap API component depends on Fevermap DB.

None

Example Playbook
----------------

    - hosts: all
      roles:
         - { push-api: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall