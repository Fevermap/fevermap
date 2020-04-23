# -*- coding: utf-8 -*-

from datetime import datetime, timedelta

from flask_restful import Resource
from flask import request

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

        # Define filter array. Empty by default, which means no filtering.
        filters = []

        # If request has "?country=FI" then stats will apply only to submission
        # data with location_country_code="FI". Otherwise server global stats.
        if 'country' in request.args:
            app.logger.info(
                'Serving stats for country %s' % request.args['country'])
            filters.append(
                Submission.location_country_code.__eq__(
                    request.args['country']))
        else:
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
        submission_count = db_session.\
            query(Submission).filter(*filters).count()

        if submission_count == 0:
            return {
                'success': True,
                'data': data
            }

        midnight = datetime.combine(datetime.now(), datetime.min.time())
        midnight_7_days_ago = midnight - timedelta(days=7)

        # Analyze submissions, but group by submitter id to see how many unique
        # submitters submitted
        data['submitters'] = {
            # When was the first submitter created
            'since':
                db_session.query(Submitter).
                outerjoin(Submission, Submitter.id == Submission.submitter_id).
                filter(*filters).
                order_by(Submitter.timestamp_created).
                limit(1).
                one().
                timestamp_created.isoformat(timespec='seconds'),
            # How many submitters have submitted in total
            'total':
                db_session.query(Submission).
                filter(*filters).
                group_by(Submission.submitter_id).
                count(),
            # How many submitters have submitted today
            'today':
                db_session.query(Submission).
                filter(*filters).
                filter(Submission.timestamp_modified > midnight).
                group_by(Submission.submitter_id).
                count(),
            # How many submitters have submitted in past week
            'past_7_days':
                db_session.query(Submission).
                filter(*filters).
                filter(Submission.timestamp_modified > midnight_7_days_ago).
                group_by(Submission.submitter_id).
                count(),
        }

        data['submissions'] = {
            # When was the first submission created
            'since':
                db_session.query(Submission).
                filter(*filters).
                order_by(Submission.timestamp_created).
                limit(1).
                one().timestamp_created.isoformat(timespec='seconds'),
            # How many submission has there been in total
            'total':
                db_session.query(Submission).
                filter(*filters).
                count(),
            # How many submission has there been today
            'today':
                db_session.query(Submission).
                filter(*filters).
                filter(Submission.timestamp_modified > midnight).
                count(),
            # How many submission has there been in past week
            'past_7_days':
                db_session.query(Submission).
                filter(*filters).
                filter(Submission.timestamp_modified > midnight_7_days_ago).
                count(),
        }

        return {
            'success': True,
            'data': data
        }
