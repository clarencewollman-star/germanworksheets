FROM nginx:stable-alpine
LABEL org.opencontainers.image.source="https://github.com/clarencewollman-star/germanworksheets"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY outputs/*.html /usr/share/nginx/html/
COPY outputs/assets/ /usr/share/nginx/html/assets/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
