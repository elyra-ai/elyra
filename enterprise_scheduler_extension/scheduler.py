import json
import requests

from os import listdir
from os.path import isfile, join

from notebook.base.handlers import IPythonHandler


class SchedulerHandler(IPythonHandler):

    """REST-ish method calls to run our batch jobs"""
    def get(self):

        """ Assume that in the future this method will support status of batch jobs
        FFDL - may support polling through /v1/models/{model_id}/training_status """
        msg_json = dict(title="Operation not supported.")
        self.write(msg_json)
        self.flush()

    def post(self, *args, **kwargs):

        """Scheduler endpoint"""
        url = 'http://127.0.0.1:5000/scheduler/tasks'

        options = self.get_json_body()

        task = dict()
        task['executor'] = options['platform']
        task['framework'] = options['framework']
        task['endpoint'] = options['endpoint']
        task['user'] = options['user']
        task['userinfo'] = options['userinfo']
        task['cpus'] = options['cpus']
        task['gpus'] = options['gpus']
        task['memory'] = options['memory']
        task['cos_endpoint'] = options['cos_endpoint']
        task['cos_user'] = options['cos_user']
        task['cos_password'] = options['cos_password']
        task['kernelspec'] = 'python3'

        #Add Dependencies
        dependencies = dict()
        if 'dependency_list' in options:
            allfiles = [f for f in listdir('.') if isfile(join('.', f))]

            dependency_types = options['dependency_list'].split(',')
            for dependency_type in dependency_types:
                dependency_extension = dependency_type.replace('*.', '.')
                for dependency_file in allfiles:
                    if dependency_file.endswith(dependency_extension):
                        with open(dependency_file, "r") as dependency_file_content:
                            data = dependency_file_content.read()
                            dependencies[dependency_file] = data

        task['dependencies'] = dependencies

        #Add Notebook
        task['notebook_name'] = options['notebook_name']
        task['notebook'] = options['notebook']
        # Clean cell outputs to optimize bandwidth
        for cell in task['notebook']['cells']:
            cell['outputs'] = []

        # UI port and username are temporarily hard coded
        job_url = "http://" + options['endpoint'].split(':')[1] + ':32150/#/login?endpoint=' + \
                  options['endpoint'].split('v1')[0] + "&username=test-user"

        result = None
        try:
            result = requests.post(url=url, data=json.dumps(task))

        except requests.exceptions.ConnectionError:
            job_msg = "Connection Error: Could not connect to {}".format(task['endpoint'])
            self.send_message(" has failed", job_msg, job_url)
            return -1
        except requests.exceptions.HTTPError as http_err:
            job_msg = "HTTP Error - {} ".format(http_err)
            self.send_message(" has failed", job_msg, job_url)
            return -1
        except requests.exceptions.RequestException as err:
            job_msg = err
            self.send_message(" has failed", job_msg, job_url)
            return -1

        # Job submission is successful
        self.send_message(" Successfully!", "Job has been submitted.", job_url)

    def send_message(self, status, message, result_url):
        msg_json = json.dumps({"title": status, "message": message, "job_url": result_url})
        self.write(msg_json)
        self.flush()

