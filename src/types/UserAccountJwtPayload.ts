import { JwtPayload } from "jsonwebtoken";
import { role_enum } from "@prisma/client";

export interface UserAccountJwtPayload extends JwtPayload {
	userAccountId: number,
	userRole: role_enum,
}