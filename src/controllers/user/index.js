// Barrel file for user controller.
// Re-exports every controller function so that router and other models can
// import them from a single path , instead of importing each module individually.
export { createOneUser } from "./createOne.js";
