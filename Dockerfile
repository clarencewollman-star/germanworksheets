FROM node:24-alpine AS assets
WORKDIR /src
COPY outputs/ outputs/
COPY scripts/stamp-version.cjs scripts/stamp-version.cjs
RUN node scripts/stamp-version.cjs

FROM nginx:stable-alpine
LABEL org.opencontainers.image.source="https://github.com/clarencewollman-star/germanworksheets"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=assets /src/outputs/*.html /usr/share/nginx/html/
COPY --from=assets /src/outputs/assets/ /usr/share/nginx/html/assets/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
