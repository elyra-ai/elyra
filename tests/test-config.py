#
# Copyright 2018-2022 Elyra Authors
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
c.Session.debug = True
c.ServerApp.token = 'test'
c.ServerApp.port = 58888
c.ServerApp.port_retries = 0
c.ServerApp.quit_button = False
c.LabApp.open_browser = False
c.ServerApp.root_dir = './build/cypress-tests'
