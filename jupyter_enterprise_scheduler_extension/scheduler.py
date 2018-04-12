import os
import requests

from notebook.base.handlers import IPythonHandler

class SchedulerHandler(IPythonHandler):

    def get(self):
        url = 'http://localhost:5000/scheduler/tasks'
        payload = '{"notebook_location":"http://home.apache.org/~lresende/notebooks/notebook-brunel.ipynb"}'

        requests.post(url=url, data=payload)

        msg_json = dict(title="Job submitted to scheduler Successfully!")
        self.write(msg_json)
        self.flush()
