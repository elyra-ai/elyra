#
# Copyright 2018-2023 Elyra Authors
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


class StaticTextSpinner:
    """
    A static text only spinner, implemented using the context manager interface.
    https://docs.python.org/3/library/stdtypes.html#context-manager-types
    """

    def __init__(self, text: str):
        self.enter_text = text

    def __enter__(self):
        """
        Called by the with statement to enter the runtime context
        https://docs.python.org/3/library/stdtypes.html#contextmanager.__enter__
        """
        print(self.enter_text)
        return self

    def __exit__(self, *args, **kwargs):
        """
        Called when the execution leaves the 'with' code block.
        https://docs.python.org/3/library/stdtypes.html#contextmanager.__exit__
        """
        return False
