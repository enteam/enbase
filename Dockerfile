FROM node:12-alpine as builder
ENV NODE_ENV build
USER node
WORKDIR /home/node
COPY . /home/node
RUN yarn
RUN yarn build
FROM node:12-alpine
ENV NODE_ENV production
USER node
WORKDIR /app
COPY --from=builder /app/ /app/
CMD yarn start:prod