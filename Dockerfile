FROM python:alpine

RUN groupadd -r groupflask && useradd -r -g groupflask userflask


COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
RUN apt-get update && apt-get install -y \
    curl \
    apt-transport-https \
    unixodbc-dev \
    gcc
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y \
    msodbcsql17
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
RUN pip install pyodbc
RUN apt-get update && apt-get install -y unixodbc
EXPOSE 4000
USER userflask
CMD [ "python", "app.py" ]




