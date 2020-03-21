# -*- coding: utf-8 -*-

from flask import Blueprint

from flask_restful import Api

from .ping import PingResource
from .submission import SubmissionResource
from .stats import StatsResource

v0_blueprint = Blueprint('v0', __name__)
api = Api(v0_blueprint)

api.add_resource(PingResource, '/ping')

api.add_resource(SubmissionResource, '/submit')

api.add_resource(StatsResource, '/stats')
