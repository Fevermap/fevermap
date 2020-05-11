pipelines
=========

Creates build and release pipelines for Fevermap.
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
* **project_name**: Needs to match the project namespace.
* **env**: Label for environment.
* **modify_default_jenkins**: In OCP3 Jenkins get's automatically created.
  We need to modify that a bit in OCP3, but not elsewhere.
* **slack_webhook_url**: URL to send notification to slack with Incoming Webhook.
  Defaults to -.


Dependencies
------------

Fevermap pipelines depend on other component build configs, and quay.io push secret.

Example Playbook
----------------

    - hosts: all
      roles:
         - { pipelines: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall