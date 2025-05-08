FROM python:3.13-alpine

RUN apk add --no-cache \
    shadow \
    build-base \
    unixodbc-dev \
    curl \
    gcc \
    g++ \
    musl-dev \
    py3-pip \
    python3-dev

RUN groupadd -r groupflask && useradd -r -g groupflask userflask


COPY . /app
WORKDIR /app

RUN pip install --upgrade pip && \
    pip install -r requirements.txt


EXPOSE 4000


USER userflask


CMD ["python", "app.py"]
