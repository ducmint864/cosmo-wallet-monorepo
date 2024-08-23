import PasswordValidator from "password-validator";
import emailValidator from "email-validator";
import createError from "http-errors";
import {randomBytes} from "crypto"
import { authConfig } from "../../src/config";
import { compare as bcryptCompare } from "bcrypt";
import { checkPasswordAndThrow, checkEmailAndThrow } from "../../src/general/helpers/credentials-helper";

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

    it("should throw an error if the password is too long", async () => {
        // Arrange
        const password: string = "qwertyuiOPasdfghjkl;'zxcvbnm,.25okay";
        
        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (err) {
            expect(err.message).toContain("Invalid password:");
            expect(err.message).toContain("Password must be between 8 - 32 characters");
        }
    });

    it("should throw an error if the password doesn't have a lowercase letter", async () => {
        // Arrange
        const password: string = "QWERTYUIOPASDFGHJKLZXCV@123";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (error) {
            expect(error.message).toContain("Invalid password:");
            expect(error.message).toContain("Password must contains lowercase letter(s)");
        }
    });

    it("should throw an error if the password doesn't have a uppercase letter", async () => {
        // Arrange
        const password: string = "p@ssw0rd";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (err) {
            expect(err.message).toContain("Invalid password:");
            expect(err.message).toContain("Password must contains uppercase letter(s)");
        }
    })

    it("should throw an error if the password doesn't have a digit", async () => {
        // Arrange
        const password: string = "p@sswOrd";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (err) {
            expect(err.message).toContain("Invalid password:");
            expect(err.message).toContain("Password must contains digit(s)");
        }
    });

    it("should throw an error if the password doesn't have a symbol/ special character", async () =>{
        // Arrange
        const password: string = "p4sswOrd";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (err) {
            expect(err.message).toContain("Invalid password:");
            expect(err.message).toContain("Password must contains at least 1 symbol")
        }
    });

    it('should throw an error if password is an empty string', async () => {
        // Arrange
        const password: string = "";

        // Act and Assert
        try {
            checkPasswordAndThrow(password);
        } catch (err) {
            expect(err.message).toContain("Invalid password:");
            expect(err.message).toContain("Password must be between 8 - 32 characters");
            expect(err.message).toContain("Password must contains lowercase letter(s)");
            expect(err.message).toContain("Password must contains uppercase letter(s)");
            expect(err.message).toContain("Password must contains digit(s)");
            expect(err.message).toContain("Password must contains at least 1 symbol");
        }
    })
});

describe('checkEmailAndThrow', () => {
    it('should return nothing if the email met the requirements', async () => {
        // Arrange
        const email: string = "test@example.com";

        // Act
        const result = checkEmailAndThrow(email);

        // Assert
        expect(result).toBeUndefined();
    });

    it('should throw error if provided email is invalid', async () => {
        // Arrange
        const email: string = "test@.com";

        // Act and Assert
        try {
            checkEmailAndThrow(email);
        } catch (err) {
            expect(err.message).toContain("Invalid email");
        }
    });

    it('should throw error if email is an empty string', async () => {
        // Arrange
        const email: string = "";

        // Act and Assert
        try {
            checkEmailAndThrow(email);
        } catch (err) {
            expect(err.message).toContain("Invalid email");
        }
    });
});