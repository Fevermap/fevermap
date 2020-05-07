OCP-Project
===========

Creates project into OpenShift. Can be used to control anything project
(kubernetes namespace) specific items.

Requirements
------------

OpenShift connection and account with project admin access.

Role Variables
--------------

* **project_name**: Project's kubernetes namespace.
* **project_display_name**: Name shown in OpenShift web console.
* **project_description**: Longer description shown in OpenShift web console.

Dependencies
------------

None

Example Playbook
----------------

    - hosts: all
      roles:
         - { ocp-project: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall