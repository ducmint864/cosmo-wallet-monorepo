import PasswordValidator from "password-validator";
import emailValidator from "email-validator";
import createError from "http-errors";
import {randomBytes} from "crypto"
import { authConfig } from "../../src/config";
import { compare as bcryptCompare } from "bcrypt";
import { checkPasswordAndThrow } from "../../src/general/helpers/credentials-helper";

describe('checkPasswordAndThrow', () => {
    // it('should return nothing if the password met the requirement', async () => {
    //     const password: string = "th1sIs_p@ssword";

    //     const result = checkPasswordAndThrow(password);

    //     expect(result).toBeUndefined();
    // });

    // it('should throw an error if the password is too short', async () => {
    //     const password: string = "1@abc";

    //     try{
    //         checkPasswordAndThrow(password)
    //     } catch (error) {
    //         expect(error).toHaveBeenCalledWith(400);
    //         expect(error).toHaveBeenCalledWith({message: "Invalid password"})
    //     }
    // });
})
