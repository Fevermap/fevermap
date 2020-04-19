# -*- coding: utf-8 -*-

from datetime import datetime

from flask_restful import Resource

from fevermap.db import db_session
from fevermap.db.models.submission import Submission

from sqlalchemy import func

from flask import Flask
app = Flask('fevermap')


class LocationResource(Resource):

    def get(self, country_code=None, **kwargs):
        """Get data by location."""
        # @TODO: Add cache headers so Nginx will cache the respons and not
        # hit the Flask server for all requests

        data = {
            'generated': datetime.now().isoformat(timespec='seconds'),
            'submissions': {}
        }

        # If a country_code is given, return counts by postal codes
        # within that country
        if country_code:

            # Construct plain SQL query manually
            # Note placeholder :country_code inside query, which does not need
            # to have any quotes as SQLAlchemy will later handle it.
            # Use only first 3 characters from postal code to have larger
            # clusters of results and improve privacy as listing exact postal
            # codes would yield lots of data points with very low values.
            sql = """
            SELECT
                SUBSTRING(location_postal_code,1,3) as post_code_prefix,
                COUNT(*) AS count
            FROM submissions
            WHERE location_country_code = :country_code
            GROUP BY post_code_prefix
            ORDER BY post_code_prefix ASC
            """

            # Execute SQL query passing the variable parameters to it
            # Load the full result set into a variable (beware that if the
            # result set is big, this will be slow and consume a lot of
            # memory, so try to make the SQL query as specific as possible)
            result = db_session.execute(
                sql,
                {'country_code': country_code}
            ).fetchall()

            # Iterate over result set and store the result items in a Python
            # dict which later is automatically turned into the JSON response
            for r in result:
                data['submissions'][r.post_code_prefix] = r.count

            return {
                'success': True,
                'data': data,
                'country_code': country_code
                # Include country so result set self-documents what country the
                # postal codes listed apply for
            }

        # Default response if no country_code was given,
        # return counts by countries as a global list
        result = db_session.query(
            Submission.location_country_code,
            func.count(Submission.location_country_code)
        ).group_by(Submission.location_country_code).all()

        # Iterate over result set and store the result items in a dict
        for item, count in result:
            data['submissions'][item] = count

        # Python dict that becomes the response JSON
        return {
            'success': True,
            'data': data,
        }
