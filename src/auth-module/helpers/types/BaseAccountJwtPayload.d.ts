import { JwtPayload } from "jsonwebtoken";

export interface UserAccountJwtPayload extends JwtPayload {
	userAccountID: number,
}