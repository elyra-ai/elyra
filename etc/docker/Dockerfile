FROM jupyter/minimal-notebook

# Switch to root to perform installs (source image runs as jovyan)
USER root

COPY enterprise_scheduler_extension*.whl /tmp

RUN apt-get update && apt-get install -y curl

# install/update pip packages
# Install Lab and 'the button' dependencies. Lab extension is optionally enabled at runtime.
RUN pip install --upgrade pip && \
    pip install setuptools --ignore-installed --upgrade && \
    pip install --upgrade jupyter_contrib_nbextensions jupyterlab enterprise_scheduler /tmp/enterprise_scheduler_extension*.whl && \
    jupyter contrib nbextension install --sys-prefix && \
	jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix && \
	jupyter nbextension install --py enterprise_scheduler_extension --sys-prefix && \
	jupyter nbextension enable --py enterprise_scheduler_extension --sys-prefix && \
	rm -f /tmp/enterprise_scheduler_extension*.whl

ADD start-jupyter.sh /usr/local/share/jupyter/

# Run with remote kernel managers
ENTRYPOINT ["/usr/local/share/jupyter/start-jupyter.sh"]
CMD ["notebook"]

# Do the pip installs as the unprivileged notebook user
USER jovyan

WORKDIR /home/jovyan/work
