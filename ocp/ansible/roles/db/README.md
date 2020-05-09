db
==

Creates database for Fevermap.
See [Fevermap OCP README](
  https://gitlab.com/fevermap/fevermap/-/blob/master/ocp/README.md)
 for further info.

Requirements
------------

OpenShift connection and account with project admin access.

Role Variables
--------------

Defaults for following variables are in defaults/main.yml:

* **state**: present/absent to control creation or deletion
* **app**: app label for all resources created.
* **db_size**: Storage size for database, e.g: 1Gi
* **db_image**: Image to use for database, e.g: mariadb:10.2
* **db_memory_limit**: Pod memory limit

Dependencies
------------

Secret for database credentials come from secrets role.

Example Playbook
----------------

    - hosts: all
      roles:
         - { db: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall