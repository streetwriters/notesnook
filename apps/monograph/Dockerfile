
FROM oven/bun:1.2.21-slim

RUN mkdir -p /home/bun/app && chown -R bun:bun /home/bun/app

WORKDIR /home/bun/app

USER bun

COPY --chown=bun:bun output .

RUN bun install

CMD [ "bun", "run", "start" ]
