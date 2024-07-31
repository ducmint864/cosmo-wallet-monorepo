import { decodeAndVerifyToken } from "../../src/general/helpers/jwt-helper";
import jwt from "jsonwebtoken";
import { UserAccountJwtPayload } from "../../src/types/BaseAccountJwtPayload";
jest.mock("jsonwebtoken");
describe('decodeAndVerifyToken', () => {
    const publicKey = "mockPubKey";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the payload if the token is valid', () => {
        const token = "valid-token";
        const payload: UserAccountJwtPayload = {userAccountId: 123};

        (jwt.verify as jest.Mock).mockReturnValue(payload);

        const result = decodeAndVerifyToken(token, publicKey);

        expect(jwt.verify).toHaveBeenCalledWith(token, publicKey);
        expect(result).toEqual(payload);
    })
})