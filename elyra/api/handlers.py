import os

from notebook.base.handlers import APIHandler
from tornado import web


class BaseSpecHandler(web.StaticFileHandler, APIHandler):

    @staticmethod
    def get_resource_metadata():
        """Returns the (resource, mime-type) for the handlers spec.
        """
        pass

    def initialize(self):
        web.StaticFileHandler.initialize(self, path=os.path.dirname(__file__))

    @web.authenticated
    def get(self):
        return web.StaticFileHandler.get(self, self.get_resource_metadata()[0])

    def get_content_type(self):
        return self.get_resource_metadata()[1]


class JsonSpecHandler(BaseSpecHandler):
    """Exposes the ability to return specifications from static files"""

    @staticmethod
    def get_resource_metadata():
        """Returns the (resource, mime-type) for the handlers spec.
        """
        return 'elyra.json', 'application/json'


class YamlSpecHandler(BaseSpecHandler):
    """Exposes the ability to return specifications from static files"""

    @staticmethod
    def get_resource_metadata():
        """Returns the (resource, mime-type) for the handlers spec.
        """
        return 'elyra.yaml', 'text/x-yaml'
