import { PrismaClient } from "@prisma/client";

/**
 * Because prisma implements connection pooling under-the-hood,
 * there's no real benefit to building a connection manager class
 * rather than briefly exporting an instance of PrismaClient
 * */ 
export const prisma = new PrismaClient();