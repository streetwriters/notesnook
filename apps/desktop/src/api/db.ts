import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { sqlService } from "../services/sql-service";
import { observable } from "@trpc/server/observable";

const t = initTRPC.create();

export const dbRouter = t.router({
  connect: t.procedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input }) => {
      const connectionId = await sqlService.connect(input.filePath);
      return connectionId;
    }),

  run: t.procedure
    .input(
      z.object({
        connectionId: z.string(),
        sql: z.string(),
        parameters: z.array(z.any()).optional()
      })
    )
    .mutation(async ({ input }) => {
      return sqlService.run(input.connectionId, input.sql, input.parameters);
    }),

  exec: t.procedure
    .input(
      z.object({
        connectionId: z.string(),
        sql: z.string(),
        parameters: z.array(z.any()).optional()
      })
    )
    .mutation(async ({ input }) => {
      return sqlService.exec(input.connectionId, input.sql, input.parameters);
    }),

  close: t.procedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ input }) => {
      await sqlService.close(input.connectionId);
    }),

  onDbChange: t.procedure.subscription(() => {
    return observable<void>((emit) => {
      const onChange = () => {
        emit.next();
      };
      sqlService.on("change", onChange);
      return () => {
        sqlService.off("change", onChange);
      };
    });
  })
});
