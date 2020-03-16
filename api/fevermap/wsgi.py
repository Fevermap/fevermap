# -*- coding: utf-8 -*-

from fevermap.fevermap import create_app

# Must use variable 'application' to meet WSGI standard
application = create_app()

if __name__ == '__main__':
    application.run()
