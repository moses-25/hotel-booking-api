import { UserService } from "../../services/userServices.js";
import Boom from "@hapi/boom";

/**
 * Creates a user from the request body and delegates persistence to UserService.
 */
export const createOneUser = async (req, res, next) => {
  const newUser = {
    firstName: req.body.firstName,
    middleName: req.body.middleName,
    firstLastName: req.body.firstLastName,
    secondLastName: req.body.secondLastName,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    status: req.body.status,
    phones: req.body.phones,
    lastLogin: req.body.lastLogin,
  };

  const userManager = new UserService();

  try {
    const response = await userManager.createOne(newUser);

    if (response.status === "CREATED SUCCESSFULLY") {
      return res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    }
  } catch (err) {
    const boomError = Boom.boomify(err, {
      message: "It is not possible to create the user in the database.",
    });
    next(boomError);
  }
};
