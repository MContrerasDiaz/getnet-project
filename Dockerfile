FROM python:3.13-slim

ENV DEBIAN_FRONTEND=noninteractive


RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    unixodbc-dev \
    gcc \
    g++ \
    build-essential \
    apt-transport-https \
    ca-certificates \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*





RUN apt-get update && apt-get install -y gnupg curl && \
curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg && \
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list && \
apt-get update && \
ACCEPT_EULA=Y apt-get install -y msodbcsql17 && \
apt-get clean && rm -rf /var/lib/apt/lists/*


RUN groupadd -r groupflask && useradd -r -g groupflask userflask


COPY . /app
WORKDIR /app


RUN pip install --upgrade pip && \
    pip install -r requirements.txt


EXPOSE 4000

USER userflask

CMD ["python", "app.py"]
