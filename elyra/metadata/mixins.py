#
# Copyright 2018-2020 IBM Corporation
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


class AppUtilMixin(object):

    def log_and_exit(self, msg, exit_status=1, display_help=False):
        self.log.error(msg)
        if display_help:
            print()
            self.print_help()
        self.exit(exit_status)

    def confirm_required(self, name, value):
        if value is None or len(value) == 0:
            self.log_and_exit("'{}' is a required parameter.".format(name), display_help=True)
