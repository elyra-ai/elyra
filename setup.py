from setuptools import setup, find_packages

try:
    long_desc = open('README.md').read()
except:
    long_desc = ''

setup(
    name="enterprise_scheduler_extension",
    url="https://github.com/codait/enterprise_scheduler_extension",
    author="Luciano Resende",
    author_email="lresende@apache.org",
    version="0.0.1",
    packages=find_packages(),
    install_requires=[
        'ipywidgets',
        'notebook>=4,<6',
        'nbconvert',
        'requests>=2.9.1,<3.0',
    ],
    include_package_data=True,
    description="A button on Jupyter's toolbar for Scheduling notebooks",
    long_description=long_desc,
)