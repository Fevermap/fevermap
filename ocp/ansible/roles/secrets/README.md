secrets
=======

Creates secrets for Fevermap.
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
* **quay_push_passwd**: Password for Quay.io image push
* **quay_push_user**: Username for Quay.io image push
* **api_gitlab_webhook_secret_key**: Gitlab webhook secret
* **db_name**: Name for database
* **db_user**: Database username
* **db_password**: User's password
* **db_root_password**: Databaes root password
* **slack_webhook_url**: Slack webhook url

Dependencies
------------

Fevermap API component depends on Fevermap DB.

None

Example Playbook
----------------

    - hosts: all
      roles:
         - { secrets: project_name: foobar }

License
-------

GPLv3

Author Information
------------------

Ilkka Tengvall