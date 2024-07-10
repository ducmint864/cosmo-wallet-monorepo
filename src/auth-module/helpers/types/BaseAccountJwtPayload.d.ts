import { JwtPayload } from "jsonwebtoken";

export interface UserAccountJwtPayload extends JwtPayload {
	userAccountId: number,
}