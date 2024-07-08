// import { NextFunction, Request, Response } from "express";
// import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
// import { Coin, StdFee } from "@cosmjs/stargate";
// import { writeFileSync } from "fs";
// import { prisma } from "../database/prisma";
// import { errorHandler } from "../middlewares/errors/error-handler";
// // import { baseAccountPayload } from "../helpers/jwt-helper";
// import { genToken, decodeAndVerifyToken } from "../helpers/jwt-helper";
// import { getDerivedAccount, makeHDPath } from "../helpers/crypto-helper";
// import jwt, { JwtPayload }  from 'jsonwebtoken';
// import { encrypt, decrypt } from "../helpers/crypto-helper";
// import config from "../config";
// import createError from "http-errors";
// import bcrypt from "bcrypt";
// import crypto, { KeyObject } from "crypto";
// import "dotenv/config";

// import { SigningStargateClient } from "@cosmjs/stargate";

// const rpc = "http://0.0.0.0:26657"; // Hardcode for now

// export async function sendCoin(req: Request, res: Response, next: NextFunction): Promise<void> {
// 	try {
// 		const {
// 			sender: _sender,
// 			denom: _denom,
// 			amount: _amount,
// 			receiver: _receiver,
// 			gasLimit: _gasLimit,
// 			feeDenom: _feeDenom,
// 			feeAmount: _feeAmount 			
// 		} = req.body;
		
	
	
// 	const signer = await DirectSecp256k1Wallet.fromKey(key);
//     const client = await SigningStargateClient.connectWithSigner(rpc, signer);

//     const coin: Coin = {
//         denom: _denom,
//         amount: _amount,
//     }
//     let coins = [coin];
//     let fee: StdFee = {
//         amount: [{amount: _feeAmount, denom: _feeDenom}],
//         gas: _gasLimit // gas limit probably   
//     }

//     const tx = await client.sendTokens(
// 		_sender,
//         _receiver,
//         coins,
//         fee,
// 		);
// 		writeFileSync('./send-tx.json', JSON.stringify(tx, null, 2));
// 	} catch (err) {
// 		errorHandler(err, req, res, next);
// 	}	
// }






