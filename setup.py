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
    install_requires=[
        'ipywidgets',
        'notebook>=6',
        'nbconvert',
        'requests>=2.9.1,<3.0',
        'ffdl-client>=0.1.1',
        "jupyter_core>=4.0,<5.0",
        "kfp",
        "minio",
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
