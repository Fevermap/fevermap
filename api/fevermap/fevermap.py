# -*- coding: utf-8 -*-

from flask import Flask

from fevermap.api import v0_blueprint
from fevermap.db.base import Base  # noqa F401
from fevermap.db import db_session
from fevermap.db import init_engine
from fevermap.views.ping import ping_blueprint
from fevermap import __appname__
from fevermap import __version__

import sqlalchemy.exc
import time
import os


def create_app():
    app = Flask('fevermap', instance_relative_config=True)

    # Accept both '/abc' and '/abc/'
    app.url_map.strict_slashes = False

    environment = os.environ.get('ENV', 'development')

    app.logger.info("Running app '{}' in mode '{}'".format(
        __appname__, environment))

    # Get database credentials from env or use default values
    engine = init_engine(
        os.environ.get(
            'FEVERMAP_API_DATABASE_URI',
            "mysql://fevermap:feverpass@database/fevermap?charset=utf8mb4"))

    while True:
        try:
            # Create all tables (automatically skips already existing)
            Base.metadata.create_all(engine)
            break
        except sqlalchemy.exc.OperationalError as error:
            app.logger.warning(
                "Database connectiong failed due to: {}".format(error))
            app.logger.warning("Trying again...")
            time.sleep(3)

    app.register_blueprint(v0_blueprint, url_prefix='/api/v0')
    app.register_blueprint(ping_blueprint)

    @app.context_processor
    def inject_app_details():
        details = {
            'appname': __appname__,
            'version': __version__,
        }
        return details

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app
