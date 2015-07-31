FROM node:0.12
ADD *.js /app/
ADD node_modules /app/node_modules
EXPOSE 8080
CMD node /app/server.js