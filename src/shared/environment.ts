import dotenv from "dotenv";

dotenv.config();

export const env = process.env.NODE_ENV;
export const dbURI = process.env.DB_URI;
