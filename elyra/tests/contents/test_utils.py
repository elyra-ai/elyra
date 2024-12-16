#
# Copyright 2018-2025 Elyra Authors
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
import errno
import os


def create_dir(location, dir_name):
    try:
        dir_path = os.path.join(location, dir_name)
        os.mkdir(dir_path)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise


def create_file(location, file_name, content, subdir=""):
    directory = os.path.join(location, subdir)
    try:
        os.makedirs(directory)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    resource = os.path.join(directory, file_name)
    with open(resource, "w", encoding="utf-8") as f:
        f.write(content)


expected_response = {
    "env_vars": {
        "VAR1": "newvalue",
        "VAR2": None,
        "VAR3": None,
        "VAR4": None,
        "VAR5": "localhost",
        "VAR6": "6",
        "VAR7": "value7",
        "VAR8": None,
    },
    "inputs": [],
    "outputs": [],
}

expected_response_empty = {"env_vars": {}, "inputs": [], "outputs": []}

text_content = "This is a text file."

notebook_content = {
    "cells": [
        {
            "cell_type": "markdown",
            "id": "advanced-touch",
            "metadata": {},
            "source": [
                "# Python Notebook with Environment Variables\n",
                "\n",
                "This python Notebook contains various environment variables to test the parser functionality.",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": 0,
            "id": "regional-indie",
            "metadata": {},
            "outputs": [],
            "source": [
                "import os\n",
                "\n",
                'os.getenv("VAR1")\n',
                'os.environ["VAR2"]\n',
                'os.environ.get("VAR3")\n',
                "\n",
                "print(os.environ['VAR4'])\n",
                "print(os.getenv(\"VAR5\", 'localhost'))",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": 1,
            "id": "completed-timothy",
            "metadata": {},
            "outputs": [],
            "source": [
                "os.environ['VAR6'] = \"6\"\n",
                "print(os.environ.get('VAR7', 'value7'))\n",
                "os.getenv('VAR8')\n",
                "\n",
                'os.environ["VAR1"] = "newvalue"',
            ],
        },
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "codemirror_mode": {"name": "ipython", "version": 3},
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.9.1",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

python_content = """
    import os

    os.getenv("VAR1")
    os.environ["VAR2"]
    os.environ.get("VAR3")

    print(os.environ['VAR4'])
    print(os.getenv("VAR5", 'localhost'))

    os.environ['VAR6'] = "6"
    print(os.environ.get('VAR7', 'value7'))
    os.getenv('VAR8')

    os.environ["VAR1"] = "newvalue"
"""

r_content = """
    Sys.setenv(VAR1 = "newvalue")
    Sys.getenv(VAR2)

    Sys.getenv("VAR3")
    Sys.getenv('VAR4')

    Sys.setenv('VAR5' = 'localhost')
    Sys.setenv("VAR6" = 6)

     Sys.setenv(VAR7 = "value7")
    Sys.getenv('VAR8')
"""

empty_notebook_content = {
    "cells": [
        {
            "cell_type": "markdown",
            "id": "literary-parts",
            "metadata": {},
            "source": [
                "# Python Notebook with No Environment Variables\n",
                "\n",
                "This python Notebook contains no environment variables to test the parser functionality.",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": 0,
            "id": "dental-manchester",
            "metadata": {},
            "outputs": [],
            "source": ["import os\n", "\n", "print(os.cwd())"],
        },
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "codemirror_mode": {"name": "ipython", "version": 3},
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.9.1",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}
