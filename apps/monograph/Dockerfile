
FROM node:20-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY --chown=node:node build ./build

RUN mv build/package.json .

RUN npm install

RUN ls

CMD [ "npm", "run", "start" ]