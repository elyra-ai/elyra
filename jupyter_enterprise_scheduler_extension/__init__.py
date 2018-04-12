from notebook.utils import url_path_join

from jupyter_enterprise_scheduler_extension.scheduler import SchedulerHandler

def _jupyter_server_extension_paths():
    return [{
        "module": "jupyter_enterprise_scheduler_extension"
    }]


def _jupyter_nbextension_paths():
    """Required to load JS button"""
    return [dict(
        section="notebook",
        src="static",
        dest="scheduler",
        require="scheduler/index")]


def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/scheduler'), SchedulerHandler)
    ])
