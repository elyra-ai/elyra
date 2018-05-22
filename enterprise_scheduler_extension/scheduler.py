import json
import requests

from notebook.base.handlers import IPythonHandler

class SchedulerHandler(IPythonHandler):

    def get(self):
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def post(self, *args, **kwargs):
        url = 'http://localhost:5000/scheduler/tasks'

        options = self.get_json_body()

        task = {}
        task['executor'] = options['platform']
        task['host'] = options['endpoint']
        task['kernelspec'] = 'python2'
        task['notebook'] = options['notebook']

        #TODO: don't send cell outputs to optimize bandwith
        #for cell in payload['notebook']['cells']:
        #    del cell['outputs']

        requests.post(url=url, data=json.dumps(task))

        msg_json = dict(title="Job submitted to scheduler Successfully!")
        self.write(msg_json)
        self.flush()
