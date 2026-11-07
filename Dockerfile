FROM node:20-alpine
WORKDIR /srv
COPY server ./server
COPY game ./game
ENV PORT=8080 APK_DIR=/data/apk
VOLUME /data
EXPOSE 8080
CMD ["node","server/server.js"]
