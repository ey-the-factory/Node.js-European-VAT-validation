FROM node:12-alpine

WORKDIR /usr/src/app

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./

USER node

RUN npm install --production 

COPY --chown=node:node . .

EXPOSE 8080
CMD [ "node", "app.js" ]