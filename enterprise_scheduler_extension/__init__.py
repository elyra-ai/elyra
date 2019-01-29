from notebook.utils import url_path_join

from enterprise_scheduler_extension.scheduler import SchedulerHandler
from enterprise_scheduler_extension.experiments import ExperimentsHandler


def _jupyter_server_extension_paths():
    return [{
        "module": "enterprise_scheduler_extension"
    }]


def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/scheduler'), SchedulerHandler),
        (url_path_join(web_app.settings['base_url'], r'/experiments'), ExperimentsHandler)
    ])
