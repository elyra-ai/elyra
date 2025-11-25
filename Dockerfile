# ---- Builder stage (build JS assets + install python deps) ----
FROM quay.io/jupyter/base-notebook:python-3.11 AS builder
ARG DEBIAN_FRONTEND=noninteractive

USER root
WORKDIR /app

# System deps needed for builds (including Airflow dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    build-essential \
    pkg-config \
    libffi-dev \
    libyaml-dev \
    libssl-dev \
    libpq-dev \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Install Node 20 (NodeSource) and enable corepack (for Yarn 3)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Activate corepack so yarn@stable (berry) is available
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy project source (use .dockerignore to exclude node_modules, .venv, build artifacts)
COPY . /app

# Install Python dependencies - Airflow first, then JupyterLab
RUN pip install --upgrade pip wheel setuptools

# Install PyYAML with prebuilt wheel only
RUN pip install --no-cache-dir --only-binary :all: "pyyaml==6.0.2"

# Install Apache Airflow with constraints
RUN AIRFLOW_VERSION=2.7.3 && \
    PYTHON_VERSION=3.11 && \
    CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt" && \
    pip install --no-cache-dir "apache-airflow==${AIRFLOW_VERSION}" --constraint "${CONSTRAINT_URL}"

# Install JupyterLab and extensions
RUN pip install --no-cache-dir \
    jupyterlab \
    jupyterlab-git \
    jupyter-lsp \
    python-lsp-server[all] \
    jupyter-resource-usage \
    nbdime \
    python-gitlab \
    giteapy


# Install Kubeflow Pipelines runtime support (Elyra v4 Compatible)
RUN pip install --no-cache-dir \
    kfp==1.8.22 \
    kfp-server-api==1.8.5

# Ensure Yarn berry uses the project settings
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false

# Disable PnP (required for JupyterLab extensions)
RUN yarn config set nodeLinker node-modules

# Install JS deps and build the frontend
RUN yarn install && \
    yarn lerna run build --stream

# Install Elyra python package (NOT editable - proper installation)
RUN pip install . --no-cache-dir

# Explicitly enable Elyra server extension
RUN jupyter server extension enable elyra --py --sys-prefix

# List all installed extensions to verify
RUN jupyter server extension list && \
    jupyter labextension list

# Build JupyterLab with all extensions
RUN jupyter lab build --minimize=True

# Verify the build was successful
RUN test -f /opt/conda/share/jupyter/lab/static/index.html || (echo "Lab build failed!" && exit 1)

# ---- Final runtime image ----
FROM quay.io/jupyter/base-notebook:python-3.11

USER root
WORKDIR /home/jovyan/work

# Minimal runtime deps (including Airflow requirements)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# CRITICAL FIX: Copy from the builder's conda environment to runtime's conda environment
# This ensures Python packages are in the correct location for Python 3.11
COPY --from=builder /opt/conda/lib/python3.11/site-packages /opt/conda/lib/python3.11/site-packages
COPY --from=builder /opt/conda/bin/jupyter* /opt/conda/bin/
COPY --from=builder /opt/conda/bin/airflow /opt/conda/bin/
COPY --from=builder /opt/conda/bin/elyra* /opt/conda/bin/

# CRITICAL: Copy the built JupyterLab static assets
COPY --from=builder /opt/conda/share/jupyter /opt/conda/share/jupyter

# Copy Elyra configuration
COPY --from=builder /opt/conda/etc/jupyter /opt/conda/etc/jupyter

# Copy start.sh into image (before USER switch, so we can chmod)
#COPY start.sh /usr/local/bin/start.sh
#RUN chmod +x /usr/local/bin/start.sh && \
#    chown jovyan:users /usr/local/bin/start.sh

# Create work directory with proper permissions
RUN mkdir -p /home/jovyan/work && \
    chown -R jovyan:users /home/jovyan/work

# Environment setup
ENV PYTHONUNBUFFERED=1
ENV JUPYTER_ENABLE_LAB=1

# Switch to jovyan (non-root user)
USER jovyan

# Expose the default Jupyter Lab port
EXPOSE 8888

# Default command for the container
#CMD ["/usr/local/bin/start.sh"]
CMD ["jupyter", "lab", "--ip=0.0.0.0"]