import { JwtPayload } from "jsonwebtoken";
import { user_type_enum } from "@prisma/client";

export interface UserAccountJwtPayload extends JwtPayload {
	userAccountId: number,
	userType: user_type_enum,
}