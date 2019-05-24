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
            if cell['cell_type'] == 'code':
                cell['outputs'] = []

        # UI port and username are temporarily hard coded
        job_url = "http://" + options['endpoint'].split(':')[1] + ':32150/#/login?endpoint=' + \
                  options['endpoint'].split('v1')[0] + "&username=test-user"

        response = None
        try:
            response = requests.post(url=url, data=json.dumps(task))

            if response.status_code in [200,201]:
                # Job submission is successful
                self.send_success_message("Job has been submitted!",
                                          job_url)
            else:
                error_message = "HTTP Error - {} ".format(response.status_code)
                self.send_error_message(response.status_code,
                                        "Job submission has failed!")

        except requests.exceptions.ConnectionError:
            error_message = "Connection Error: Could not connect to {}".format(task['endpoint'])
            self.send_error_message(403, error_message)
        except requests.exceptions.RequestException as err:
            error_message = err
            self.send_error_message(500, error_message)
        except requests.exceptions.HTTPError as http_err:
            error_message = http_err
            self.send_error_message(500, error_message)
        except Exception as err:
            error_message = err
            self.send_error_message(500, error_message)

    def send_message(self, message):
        self.write(message)
        self.flush()

    def send_success_message(self, message, job_url):
        self.set_status(200)
        msg = json.dumps({"status":"ok",
                          "message": message,
                          "url": job_url})
        self.send_message(msg)

    def send_error_message(self, status_code, error_message):
        self.set_status(status_code)
        msg = json.dumps({"status": "error",
                          "message": error_message})
        self.send_message(msg)
