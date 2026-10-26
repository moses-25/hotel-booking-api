import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { readFileSync } from "node:fs";
import { DateTimeResolver } from "graphql-scalars";
import { checkAPIkey } from "../middlewares/apiAuthHandler.js";
import { graphqlIpLimiter } from "../middlewares/rateLimitHandler.js";
import { buildContext } from "./context.js";
import { resolvers } from "./resolvers/index.js";

const typeDefs = readFileSync(
  new URL("./schema.graphql", import.meta.url),
  "utf8",
);

/**
 * Starts Apollo and mounts the GraphQL endpoint on the Express application.
 *
 * @param {import("express").Express} api - Express application to configure.
 * @returns {Promise<void>} Resolves after Apollo is started and mounted.
 */
export const useGraphql = async (api) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers: {
      ...resolvers,
      DateTime: DateTimeResolver,
    },
  });

  await server.start();

  api.use(
    "/api/v1/graphql",
    graphqlIpLimiter,
    checkAPIkey,
    expressMiddleware(server, {
      context: async ({ req, res }) => buildContext({ req, res }),
    }),
  );
};
