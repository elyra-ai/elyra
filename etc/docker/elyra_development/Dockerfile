FROM ubuntu:24.04

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH=/opt/conda/bin:$PATH

# build-essential compiles Python packages without prebuilt wheels for the
# image's architecture; tini is the container init process.
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends make wget bzip2 ca-certificates curl git build-essential tini && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.yml requirements.yml

# Miniforge (conda-forge) for the architecture the image is built for (x86_64 or aarch64).
# requirements.yml provides Python, Node.js and Yarn for the elyra-env environment.
RUN wget --quiet "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-$(uname -m).sh" -O ~/miniforge.sh && \
    /bin/bash ~/miniforge.sh -b -p /opt/conda && \
    rm ~/miniforge.sh && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate elyra-env" >> ~/.bashrc && \
    /opt/conda/bin/conda env create --file requirements.yml && \
    /opt/conda/bin/conda clean -afy

RUN mkdir -p /dev/elyra

ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "/bin/bash" ]
