import express from "express";
import { userAuth } from "../middlewares/user-auth";
import { retrieveEncryptedMnemonic  } from "../controllers/mnemonic";
import { deriveNewAccount } from "../controllers/auth";

const testRouter = express.Router();

testRouter.route("/mnemonic").post(userAuth, retrieveEncryptedMnemonic);
testRouter.route("/deriveNewAcc").post(userAuth, deriveNewAccount);

export default testRouter;