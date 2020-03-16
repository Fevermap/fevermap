from flask_restful import Resource


class PingResource(Resource):
    """Dummy front page.

    This page exists simply so that there is something to server at
    localhost:9000/ and users can see that at least the API is running.
    """

    def get(self):
        return {'msg': 'Pong! For details on how to use this API see '
                       'https://fevermap.net/'}
