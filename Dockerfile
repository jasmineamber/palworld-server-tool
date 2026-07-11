# --------- map resources -----------
FROM python:3.11-alpine AS mapDownloader

WORKDIR /app

COPY ./map_down.py /app/map_down.py
RUN python3 /app/map_down.py \
    --save-dir /app/map \
    --points-file /app/points.json

# --------- frontend -----------
FROM node:24-alpine AS frontendBuilder

WORKDIR /app

ARG proxy

RUN npm install -g pnpm@11.5.3

COPY ./web/pnpm-lock.yaml /app/web/pnpm-lock.yaml
COPY ./web/package.json /app/web/package.json
COPY ./web/pnpm-workspace.yaml /app/web/pnpm-workspace.yaml

RUN cd /app/web/ && pnpm i --frozen-lockfile

COPY ./web /app/web
COPY --from=mapDownloader /app/points.json /app/web/src/assets/map/points.json
RUN cd /app/web/ && pnpm build

# --------- sav_cli -----------
FROM python:3.13-alpine AS savBuilder

WORKDIR /app

RUN apk add --no-cache build-base python3-dev libstdc++ && \
    pip install --no-cache-dir \
      pyinstaller==6.16.0 \
      requests==2.32.5 \
      orjson==3.11.8 \
      setuptools==80.9.0 \
      wheel==0.45.1

COPY ./script/build_sav_cli.py /app/script/build_sav_cli.py
COPY ./sav_cli /app/sav_cli
RUN python3 /app/script/build_sav_cli.py \
    --output /app/dist/sav_cli \
    --cache-dir /tmp/sav-cli-cache

# --------- backend -----------
FROM golang:1.25-alpine AS backendBuilder

ARG proxy
ARG version

WORKDIR /app
ADD . .

COPY --from=frontendBuilder /app/assets /app/assets
COPY --from=frontendBuilder /app/favicon.ico /app/favicon.ico
COPY --from=frontendBuilder /app/index.html /app/index.html
COPY --from=mapDownloader /app/map /app/map

RUN if [ -n "$proxy" ]; then \
        export GOPROXY=https://goproxy.io,direct; \
    fi && \
    go build -tags assets -ldflags="-s -w -X 'main.version=${version}'" -o /app/dist/pst .

# --------- runtime -----------
FROM frolvlad/alpine-glibc AS runtime

WORKDIR /app

ENV SAVE__DECODE_PATH=/app/sav_cli

RUN apk add --no-cache libstdc++

COPY --from=savBuilder /app/dist/sav_cli /app/sav_cli
COPY --from=savBuilder /app/dist/sav_cli-GPL-3.0.txt /app/sav_cli-GPL-3.0.txt
COPY --from=backendBuilder /app/dist/pst /app/pst

EXPOSE 8080

CMD ["/app/pst"]
