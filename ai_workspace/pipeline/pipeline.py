#
# Copyright 2018-2019 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os


class Operation:

    def __init__(self, id, type, title, artifact, image, dependencies=None ):
        self._id = id
        self._type = type
        self._title = title
        self._artifact = artifact
        self._image = image
        if dependencies:
            self._dependencies = dependencies
        else:
            self._dependencies = []

    @property
    def id(self):
        return self._id

    @property
    def type(self):
        return self._type

    @property
    def title(self):
        return self._title

    @property
    def artifact(self):
        return self._artifact

    @property
    def artifact_filename(self):
        return os.path.basename(self._artifact)

    @property
    def artifact_name(self):
        return os.path.basename(self._artifact).split(".")[0]

    @property
    def image(self):
        return self._image

    @property
    def dependencies(self):
        return self._dependencies

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.id == other.id and \
                   self.type == other.type  and \
                   self.title == other.title  and \
                   self.artifact == other.artifact  and \
                   self.image == other.image and \
                   self.dependencies == other.dependencies


class Pipeline:

    def __init__(self, id, title, platform):
        self._id = id
        self._title = title
        self._platform = platform
        self._operations = {}

    @property
    def id(self):
        return self._id

    @property
    def title(self):
        return self._title

    @property
    def platform(self):
        return self._platform

    @property
    def operations(self):
        return self._operations

    def __eq__(self, other: object) -> bool:
        if isinstance(self, other.__class__):
            return self.title == other.title and \
                   self.platform == other.platform and \
                   self.operations == other.operations
