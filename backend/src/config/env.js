import dotenv from "dotenv";

dotenv.config();

process.env.SQLITE_PATH ||= "./data/restaurant.sqlite";

if (process.env.NODE_ENV === "test") {
  process.env.JWT_SECRET ||= "test_secret";
  process.env.SQLITE_PATH ||= ":memory:";
}

const required = ["JWT_SECRET", "SQLITE_PATH"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const config = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  sqlitePath: process.env.SQLITE_PATH
};

export default config;
