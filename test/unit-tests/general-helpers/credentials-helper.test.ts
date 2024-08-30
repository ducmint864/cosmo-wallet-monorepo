import { prisma } from "../../../src/connections";
import { cryptoConfig } from "../../../src/config";
import bcrypt from "bcrypt";
import { checkPasswordAndThrow, checkEmailAndThrow, checkUsernameAndThrow, genUsername, checkNicknameAndThrow, isValidPassword } from "../../../src/general/helpers/credentials-helper";

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
        };
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
        };
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
        };
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
        };
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
        };
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
        };
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
        };
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
        };
    });

    it('should throw error if email is an empty string', async () => {
        // Arrange
        const email: string = "";

        // Act and Assert
        try {
            checkEmailAndThrow(email);
        } catch (err) {
            expect(err.message).toContain("Invalid email");
        };
    });
});

describe('checkUsernameAndThrow', () => {
    it('should return nothing if the username met the requirements', async () => {
        // Arrange
        const username: string = "testUsername";

        // Act
        const result = checkUsernameAndThrow(username);

        // Assert
        expect(result).toBeUndefined();
    })

    it('should throw an error if the username too short', async() => {
        // Arrange
        const username: string = "ab";
        
        // Act and Assert
        try {
            checkUsernameAndThrow(username);
        } catch (err) {
            expect(err.message).toContain("Invalid username:");
            expect(err.message).toContain("Username must be between 6  -  16 characters");
        };
    });

    it('should throw an error if the username too long', async() => {
        // Arrange
        const username: string = "QWERTYUIOIPASDFGHJKLZXCVBNM_ASDGHFUIWYE1234567890";
        
        // Act and Assert
        try {
            checkUsernameAndThrow(username);
        } catch (err) {
            expect(err.message).toContain("Invalid username:");
            expect(err.message).toContain("Username must be between 6  -  16 characters");
        };
    });

    it('should throw an error if the username contain special character/ symbol', async () => {
        // Arrange
        const username: string = "testUser!@#";

        // Act and Assert
        try {
            checkUsernameAndThrow(username);
        } catch (err) {
            expect(err.message).toContain("Invalid username:");
            expect(err.message).toContain("Username can only contain alphanumerics and underscores");
        };
    });
    
    it("should throw an error if the username don't have a letter", async () => {
        // Arrange
        const username: string = "1234567890";

        // Act and Assert
        try {
            checkUsernameAndThrow(username);
        } catch (err) {
            expect(err.message).toContain("Invalid username:");
            expect(err.message).toContain("Username must contain at least 1 letter");
        };
    });

    it('should throw an error if the username is an empty string', async () => {
        // Arrange
        const username: string = "";

        // Act and Assert
        try {
            checkUsernameAndThrow(username);
        } catch (err) {
            expect(err.message).toContain("Invalid username:");
            expect(err.message).toContain("Username must be between 6  -  16 characters");
            expect(err.message).toContain("Username can only contain alphanumerics and underscores");
            expect(err.message).toContain("Username must contain at least 1 letter");
        };
    });
});

jest.mock("../../../src/connections", () => ({
  prisma: {
    user_accounts: {
      findUnique: jest.fn(), 
    },
  },
}));

describe('genUsername', () => {
    it('should return a valid username', async () => {
        // Set up mock
        (prisma.user_accounts.findUnique as jest.Mock)
            .mockResolvedValue(null);

        // Act
        const username = await genUsername();

        // Assert
        expect(username).toBeDefined();
    });

    it('should work on multiple call', async () => {
        // Set up mock
        (prisma.user_accounts.findUnique as jest.Mock)
            .mockResolvedValue(null);

        // Act 
        const user1name = await genUsername();
        const user2name = await genUsername();
        const user3name = await genUsername();

        // Assert
        expect(user1name).toBeDefined();
        expect(user2name).toBeDefined();
        expect(user3name).toBeDefined();
    });

    it('should return a string value', async () => {
        // Set up mock
        (prisma.user_accounts.findUnique as jest.Mock)
            .mockResolvedValue(null);
        
        // Act
        const username = await genUsername();

        //Assert
        expect(typeof username).toBe("string");
    });

    it('should return a username that between 6  -  16 characters', async () => {
        // Set up mock
        (prisma.user_accounts.findUnique as jest.Mock)
            .mockResolvedValue(null);
        
        // Act
        const username = await genUsername();

        //Assert
        expect(username.length).toBeGreaterThanOrEqual(8);
        expect(username.length).toBeLessThanOrEqual(16);
    });

    it('should return a username that only contain alphanumerics and underscores', async () => {
        // Set up mock
        (prisma.user_accounts.findUnique as jest.Mock)
            .mockResolvedValue(null);
        
        // Act
        const username = await genUsername();

        //Assert
        expect(username).toMatch(/^[a-zA-Z0-9_]+$/);
    });
});

describe('checkNicknameAndThrow', () => {
    it('should return nothing if nickname is valid', () => {
        // Arrange
        const nickname: string = 'helloworld';
        
        // Act 
        const result = checkNicknameAndThrow(nickname);

        // Assert
        expect(result).toBeUndefined();
    });

    it('should throw an error if nickname is an empty string', async () => {
        // Arrange
        const nickname: string = '';

        // Act and Assert
        try {
            checkNicknameAndThrow(nickname);
        } catch (err) {
            expect(err.message).toContain("Invalid nickname: Nickname must be between 1 - 16 characters");
        };
    });

    it('should throw an error if nickname is too long', async () => {
        // Arrange
        const nickname: string = 'a'.repeat(17);

        // Act and Assert
        try {
            checkNicknameAndThrow(nickname);
        } catch (err) {
            expect(err.message).toContain("Invalid nickname: Nickname must be between 1 - 16 characters");
        };
    });
});

describe('isValidPassword', () => {
    it('should return true if the input password is correct', async () => {
        // Arrange
        const password: string = 'MrP0t@to805';
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = 'MrP0t@to805';

        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(true);
    });

    it('should return false if the input password is wrong', async () => {
        // Arrange
        const password: string = 'MsInf0rm@tion63';
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = "MrP0t@to805";

        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(false);
    });

    it('should return false if the input password is null', async () => {
        // Arrange
        const password: string = "p@ssW0rd";
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = '';

        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
        // Arrange
        const password: string = "MrP0t@to805";
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = "Mrp0t@tO805";
        
        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(false);
    });

    it('should not ignore whitespace', async () => {
        // Arrange
        const password: string = "MrP0t@to805";
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = "MrP0t@to 805";

        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(false);
    });

    it('should handle large input', async () => {
        // Arrange
        const password: string = 'a'.repeat(1000);
        const hashedPassword: string = await bcrypt.hash(password, cryptoConfig.bcrypt.saltRounds);
        const inputPassword: string = 'a'.repeat(1000);

        // Act
        const result = await isValidPassword(inputPassword, hashedPassword);

        // Assert
        expect(result).toBe(true);
    });
});