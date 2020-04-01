FROM registry.redhat.io/ubi8/ubi

RUN dnf install -y unzip git

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    chmod +x /usr/local/bin/aws && \
    rm -fr aws awscliv2.zip
    

RUN curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | bash && \
    dnf install -y MariaDB-client && dnf clean all

RUN curl "https://mirror.openshift.com/pub/openshift-v4/clients/oc/latest/linux/oc.tar.gz" > "oc.tar.gz" && \
    tar -xzvf oc.tar.gz && \
    mv oc /usr/local/bin/oc && \
    chmod +x /usr/local/bin/oc && \
    rm -Rf oc.tar.gz

COPY ./backup.sh /usr/local/bin/backup.sh

RUN chmod +x /usr/local/bin/backup.sh

CMD /usr/local/bin/backup.sh
