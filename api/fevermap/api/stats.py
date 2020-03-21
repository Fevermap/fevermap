# -*- coding: utf-8 -*-

from datetime import date, datetime, timedelta

from flask_restful import Resource

from fevermap.db import db_session
from fevermap.db.models.submission import Submission
from fevermap.db.models.submitter import Submitter

from flask import Flask
app = Flask('fevermap')

class StatsResource(Resource):

    def get(self, **kwargs):
        """Get stats."""

        # @TODO: Add cache headers so Nginx will cache the respons and not
        # hit the Flask server for all requests

        app.logger.info('Serving stats')

        midnight = datetime.combine(datetime.now(), datetime.min.time())
        midnight_7_days_ago = midnight - timedelta(days=7)

        data = {
            'submitters': {
                'since': db_session.query(Submitter).order_by(Submitter.timestamp_created).limit(1).one().timestamp_created.isoformat(timespec='seconds'),
                'total': db_session.query(Submitter).count(),
                'today': db_session.query(Submitter).filter(Submitter.timestamp_modified > midnight).count(),
                'past_7_days': db_session.query(Submitter).filter(Submitter.timestamp_modified > midnight_7_days_ago).count(),
            },
            'submissions': {
                'since': db_session.query(Submission).order_by(Submission.timestamp_created).limit(1).one().timestamp_created.isoformat(timespec='seconds'),
                'total': db_session.query(Submission).count(),
                'today': db_session.query(Submission).filter(Submission.timestamp_modified > midnight).count(),
                'past_7_days': db_session.query(Submission).filter(Submission.timestamp_modified > midnight_7_days_ago).count(),
            }
        }

        return {
            'success': True,
            'data': data
        }
