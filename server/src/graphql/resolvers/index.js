/**
 * @module graphql/resolvers
 * @description Combines every domain resolver into a single resolver map
 * for ApolloServer.
 *
 * To add a new domain: create `<domain>Resolver.js`, import it, and append
 * it to the `mergeResolvers` array below. `mergeResolvers` merges child
 * keys of shared roots (`Query`, `Mutation`) instead of overwriting them,
 * so two domains can both contribute mutations without stepping on each
 * other.
 */

import { mergeResolvers } from '@graphql-tools/merge';
import { authResolver } from './authResolver.js';
import { userResolver } from './userResolver.js';

/**
 * Combined resolver map consumed by `ApolloServer({ resolvers })`.
 * @type {Object}
 */
export const resolvers = mergeResolvers([authResolver, userResolver]);
