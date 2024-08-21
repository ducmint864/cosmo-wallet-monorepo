import PasswordValidator from "password-validator";
import emailValidator from "email-validator";
import createError from "http-errors";
import {randomBytes} from "crypto"
import { authConfig } from "../../src/config";
import { compare as bcryptCompare } from "bcrypt";
import { checkPasswordAndThrow } from "../../src/general/helpers/credentials-helper";

describe('checkPasswordAndThrow', () => {
    it('should return nothing if the password met the requirement', async () => {
        // Arrange
        const password: string = "th1sIs_p@ssword";

        // Act
        const result = checkPasswordAndThrow(password);

        // Assert
        expect(result).toBeUndefined();
    });

    it('should throw an error if the password is too short', async () => {
        // Arrange
        const password: string = "1@aBc";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (error) {
            expect(error.message).toContain("Invalid password:");
            expect(error.message).toContain("Password must be between 8 - 32 characters");   
        }
    });
});
