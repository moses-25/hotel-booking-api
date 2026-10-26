// Barrel file for the room type controllers.
// Re-exports every controller function so that routers and other modules can
// import them from a single path, instead of importing each module individually.

export { createOneRoomType } from "./createOne.js";
export { updateOneRoomType } from "./updateOne.js";
export { listOneRoomType } from "./listOne.js";
export { listAllRoomTypes } from "./listAll.js";
export { deleteOneRoomType } from "./deleteOne.js";
