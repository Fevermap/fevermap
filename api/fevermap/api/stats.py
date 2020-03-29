# -*- coding: utf-8 -*-

from datetime import datetime, timedelta

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

        data = {
            'generated': datetime.now().isoformat(timespec='seconds'),
            'submitters': {
                'since': None,
                'total': 0,
                'today': 0,
                'past_7_days': 0,
            },
            'submissions': {
                'since': None,
                'total': 0,
                'today': 0,
                'past_7_days': 0,
            }
        }

        # First check if the database is empty (e.g new development install)
        # and bail out quickly with all zeros response in that case
        submitters_count = db_session.query(Submitter).count()

        if submitters_count == 0:
            return {
                'success': True,
                'data': data
            }

        midnight = datetime.combine(datetime.now(), datetime.min.time())
        midnight_7_days_ago = midnight - timedelta(days=7)

        data['submitters'] = {
            'since': db_session.query(Submitter).order_by(Submitter.timestamp_created).limit(1).one().timestamp_created.isoformat(timespec='seconds'),
            'total': submitters_count,
            'today': db_session.query(Submitter).filter(Submitter.timestamp_modified > midnight).count(),
            'past_7_days': db_session.query(Submitter).filter(Submitter.timestamp_modified > midnight_7_days_ago).count(),
        }

        data['submissions'] = {
            'since': db_session.query(Submission).order_by(Submission.timestamp_created).limit(1).one().timestamp_created.isoformat(timespec='seconds'),
            'total': db_session.query(Submission).count(),
            'today': db_session.query(Submission).filter(Submission.timestamp_modified > midnight).count(),
            'past_7_days': db_session.query(Submission).filter(Submission.timestamp_modified > midnight_7_days_ago).count(),
        }

        return {
            'success': True,
            'data': data
        }
