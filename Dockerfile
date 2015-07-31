FROM node:0.12
ADD *.js package.json /app/
RUN cd /app; npm install
EXPOSE 8080
CMD node /app/server.js