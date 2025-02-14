
FROM --platform=$BUILDPLATFORM oven/bun:1.2.2-alpine

RUN mkdir -p /home/bun/app && chown -R bun:bun /home/bun/app

WORKDIR /home/bun/app

USER bun

COPY --chown=bun:bun output .

RUN bun install

CMD [ "bun", "run", "start" ]
