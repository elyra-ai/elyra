import os
import json
import requests

from os import listdir
from os.path import isfile, join

from notebook.base.handlers import IPythonHandler
from ffdl.client import Config, FfDLClient


class ExperimentsHandler(IPythonHandler):

    """REST-ish method to retrieve list of submitted notebook experiments"""
    def get(self):

        """ FFDL support retrieving list of submitted experiments via /v1/models/ """

        config = Config(api_endpoint=os.getenv('FFDL_API_ENDPOINT'),
                        user=os.getenv('FFDL_USER'),
                        password=os.getenv('FFDL_PASSWORD'),
                        user_info=os.getenv('FFDL_USER_INFO'))

        config.is_valid()

        result = None
        try:
            client = FfDLClient(config)
            result = client.get('/models')

        except requests.exceptions.ConnectionError:
            job_msg = "Connection Error: Could not connect to {}".format(config.api_endpoint)
            self.send_message('Failed', job_msg, config.api_endpoint)
            return -1
        except requests.exceptions.HTTPError as http_err:
            job_msg = "HTTP Error - {} ".format(http_err)
            self.send_message('Failed', job_msg, config.api_endpoint)
            return -1
        except requests.exceptions.RequestException as err:
            job_msg = err
            self.send_message('Failed', job_msg, config.api_endpoint)
            return -1

        # Job submission is successful
        self.write(result)
        self.flush()

    def post(self, *args, **kwargs):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def send_message(self, status, message, url):
        msg_json = json.dumps({"title": status, "message": message, "api_endpoint": url})
        self.write(msg_json)
        self.flush()
