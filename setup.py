from setuptools import setup, find_packages

try:
    long_desc = open('README.md').read()
except:
    long_desc = ''

setup(
    name="ai-workspace",
    url="https://github.ibm.com/ai-workspace/ai-workspace",
    author="CODAIT",
    version="0.0.1",
    packages=find_packages(),
    data_files=[('etc/jupyter/jupyter_notebook_config.d',
                 ['jupyter-config/jupyter_notebook_config.d/ai_workspace.json'])],
    install_requires=[
        "jupyter_core>=4.0,<5.0",
        "kfp",
        "kfp-notebook>=0.2.0",
        "minio",
        'ipywidgets',
        'jupyterlab>=1.0.0,<2.0.0',
        'nbconvert',
        'notebook>=6',
        'requests>=2.9.1,<3.0',
    ],
    include_package_data=True,
    description="Enterprise Workspace for AI",
    long_description=long_desc,
    entry_points={
        'console_scripts': [
            'jupyter-runtime = ai_workspace.metadata.runtime:RuntimeMetadataApp.launch_instance',
        ],
    },
)
