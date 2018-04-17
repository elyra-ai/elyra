FROM elyra/nb2kg

# Switch to root to perform installs (source image runs as jovyan)
USER root

COPY enterprise_scheduler_extension*.whl /tmp
RUN pip install --upgrade pip && \
    pip install /tmp/enterprise_scheduler_extension*.whl && \
	jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix && \
	jupyter nbextension install --py enterprise_scheduler_extension --sys-prefix && \
	jupyter nbextension enable --py enterprise_scheduler_extension --sys-prefix && \
	rm -f /tmp/enterprise_scheduler_extension*.whl

# Switch back to jovyan user
USER jovyan

