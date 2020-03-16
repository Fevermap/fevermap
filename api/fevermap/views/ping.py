# -*- coding: utf-8 -*-

from flask import abort
from flask import Blueprint
from flask import render_template
from jinja2 import TemplateNotFound

ping_blueprint = Blueprint('ping', __name__, template_folder='templates')


@ping_blueprint.route('/')
@ping_blueprint.route('/ping')
def ping():
    try:
        return render_template('ping.html', message="Ping-Pong")
    except TemplateNotFound:
        abort(404)
