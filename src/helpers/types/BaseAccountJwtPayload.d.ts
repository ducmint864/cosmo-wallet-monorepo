import { JwtPayload } from "jsonwebtoken";

export interface BaseAccountJwtPayload extends JwtPayload {
	username: string,
	email: string,
}