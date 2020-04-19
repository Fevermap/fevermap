# -*- coding: utf-8 -*-

from flask import Blueprint

from flask_restful import Api

from .ping import PingResource
from .submission import SubmissionResource
from .stats import StatsResource
from .location import LocationResource

v0_blueprint = Blueprint('v0', __name__)

# Use Flask API object
# https://flask.palletsprojects.com/en/1.1.x/api/
api = Api(v0_blueprint)

api.add_resource(PingResource, '/ping')

api.add_resource(SubmissionResource, '/submit')

api.add_resource(StatsResource, '/stats')

# Arguments 'country_code' and 'postal_code' will be set automatically as
# arguments to the get() function in LocationResource
# https://flask.palletsprojects.com/en/1.1.x/api/#url-route-registrations
api.add_resource(
    LocationResource,
    '/location',
    '/location/<country_code>')
