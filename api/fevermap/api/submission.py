# -*- coding: utf-8 -*-

import datetime
import re

from flask import request

from flask_restful import Resource

from fevermap.db import db_session
from fevermap.db.models.submission import Submission
from fevermap.db.models.submitter import Submitter

from flask import Flask
app = Flask('fevermap')

# For debugging:
# from pprint import pprint

class SubmissionResource(Resource):

    def _fever_status_history(self, submitter=None):
        history = []
        for s in submitter.submissions:
            history += [(
                # Time format example: "2020-03-19T22:59:31"
                s.timestamp_modified.isoformat(timespec='seconds'),
                # true/false
                s.fever_status,
                # E.g. 37.5
                s.fever_temp
            )]
        return history

    def options(self, **kwargs):
        """Basic options response."""
        return {
            'success': True,
            'message': 'This endpoint is input only',
        }

    def post(self, **kwargs):
        """Save new submission."""

        # @TODO: Add general POST protection early in the processing to compare
        # IP addresses of submitters and block too frequent use of same IP.

        # Expect JSON payload
        data = request.json

        # Fall back to form data if JSON was None
        if not data:
            data = kwargs.get('data', request.form)

        if not data:
            return {
                'success': False,
                'message': 'Empty payload in POST request.'
            }

        app.logger.info('Processing: {}'.format(data))

        # Validate submission
        errors = []

        if not re.fullmatch(r'[0-9]{13}', data['device_id']):
            errors += ('device_id', 'Incorrect form for device identifier')

        if not isinstance(data['fever_status'], bool) and \
           not re.fullmatch(r'true|false|1|0', data['fever_status']):
            errors += ('fever_status', 'Value not true/false')

        if not re.fullmatch(r'[12][90][0-9][0-9]', data['birth_year']):
            errors += ('birth_year', 'Value not a year between 1900 and 2020')

        if not re.fullmatch(r'[MF]{1}', data['gender']):
            errors += ('gender', 'Value not M or F')

        if not re.fullmatch(r'[A-Z]{2}', data['location_country_code']):
            errors += ('location_country_code', 'Value not two capitals')

        if not re.fullmatch(r'[0-9a-z-A-Z-\.]{5,10}', data['location_postal_code']):
            errors += ('location_postal_code', 'Incorrect characters or length')

        if not re.fullmatch(r'[0-9]{2}\.[0-9]{5,}', data['location_lng']):
            errors += ('location_lng', 'Incorrect form or length')

        if not re.fullmatch(r'[0-9]{2}\.[0-9]{5,}', data['location_lat']):
            errors += ('location_lat', 'Incorrect form or length')

        # Abort if validation failed
        if errors:
            app.logger.warning('Syntax errors: {}'.format(errors))
            return {
                'success': False,
                'message': 'Invalid payload rejected.',
                'data': errors
            }

        # Convert strings into correct Python data types for processing
        device_id = int(data['device_id'])
        birth_year = int(data['birth_year'])
        gender = str(data['gender'])
        location_country_code = str(data['location_country_code'])
        location_postal_code = str(data['location_postal_code'])
        # Cut to have 2.7 decimals, not more
        location_lng = float(data['location_lng'][0:10])
        location_lat = float(data['location_lat'][0:10])

        # Time 1584649859812 when this was written
        if not 1584000000000 < device_id:
            errors += ('device_id', 'Value not in range')

        if not 1900 <= birth_year <= 2020:
            errors += ('birth_year', 'Value not in range')

        # String true/false requires sepecial treatment bool() can't do
        # Check the string values and then set propet Python data types
        if data['fever_status'] in [False, '0', 'false', 'False']:
            fever_status = False
            # Override any fever_temp value with None (Null in database)
            fever_temp = None
        else:
            fever_status = True

            if data['fever_status'] in [None, False, 0, '0', 'false', 'False']:
                fever_temp = None
            else:
                # Validate fever_temp only is submitter has fever
                fever_temp = float(data['fever_temp'])
                if not re.fullmatch(r'[34][0-9]\.[0-9]', data['fever_temp']):
                    errors += ('fever_temp', 'Value between 37.0–44.0')
                if not 37.0 <= fever_temp <= 44.0:
                    errors += ('fever_temp', 'Value not in range')

        # Abort if validation failed
        if errors:
            app.logger.warning('Semantic errors: {}'.format(errors))
            return {
                'success': False,
                'message': 'Invalid values rejected.',
                'data': errors
            }

        # Get submitter if device_id already exists
        submitter = db_session.query(Submitter).filter(
                        Submitter.device_id == device_id).one_or_none()

        # Create a new submitter if device_id is new
        if submitter is None:
            submitter = Submitter(
                device_id=device_id,
                birth_year=birth_year,
                gender=gender)
        else:
            # For existing submitter, check when was the last data received
            last_submission = submitter.submissions[-1]

            earliest_next_submission_time = \
                last_submission.timestamp_modified + datetime.timedelta(hours=12)

            if earliest_next_submission_time > datetime.datetime.now():
                app.logger.warning(
                    'Rejected too new submission: {}'.format(data))
                return {
                    'success': False,
                    'message': 'Do not submit new temp before {}'.format(
                        earliest_next_submission_time.isoformat(
                            timespec='seconds')),
                    'data': {'history': self._fever_status_history(submitter)}
                }

            # Update birth year and gender
            if submitter.birth_year != birth_year:
                submitter.birth_year = birth_year
                app.logger.warning(
                    f'Submitter {device_id} changed birth year from '
                    f'{submitter.birth_year} to {birth_year}')

            if submitter.gender != gender:
                submitter.gender = gender
                app.logger.warning(
                    f'Submitter {device_id} changed gender from '
                    f'{submitter.gender} to {gender}')

        # Create new submission
        submission = Submission(
            fever_status=fever_status,
            fever_temp=fever_temp,
            location_country_code=location_country_code,
            location_postal_code=location_postal_code,
            location_lng=location_lng,
            location_lat=location_lat,
        )

        # Add new submission for submitter
        submitter.submissions += [submission]

        # Mark submitter to be added or updated. Since the submission belongs
        # to it, there it no need to add the submission separately.
        db_session.add(submitter)

        # Commit automatically reloads the objects from the database, so after
        # this step the submitter object will include an id and the submission
        # will include timestamps.
        db_session.commit()

        history = self._fever_status_history(submitter)

        saved_data = {
            'device_id': device_id,
            'fever_status': fever_status,
            'fever_temp': fever_temp,
            'birth_year': birth_year,
            'location_country_code': location_country_code,
            'location_postal_code': location_postal_code,
            'location_lng': location_lng,
            'location_lat': location_lat,
            'history': history
        }
        return {
            'success': True,
            'message': 'Submission received.',
            'data': saved_data
        }
