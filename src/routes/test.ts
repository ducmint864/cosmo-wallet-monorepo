import express from 'express';
import { userAuth } from '../middlewares/user-auth';
import { retrieveEncryptedMnemonic  } from '../controllers/mnemonic';


const testRouter = express.Router();

testRouter.route('/mnemonic').post(userAuth, retrieveEncryptedMnemonic);

export default testRouter;