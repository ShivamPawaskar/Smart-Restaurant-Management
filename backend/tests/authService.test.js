import { hashPassword, newSessionId, signToken, verifyPassword, verifyToken } from "../src/services/authService.js";

describe("authService", () => {
  const env = process.env;

  beforeAll(() => {
    process.env.JWT_SECRET = "unit_test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
  });

  afterAll(() => {
    process.env = env;
  });

  test("hash and verify password", async () => {
    const password = "password123";
    const hashed = await hashPassword(password);

    expect(hashed).not.toEqual(password);
    await expect(verifyPassword(password, hashed)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hashed)).resolves.toBe(false);
  });

  test("token includes role and session", () => {
    const sessionId = newSessionId();
    const token = signToken({
      id: 10,
      role: "manager",
      sessionId,
      name: "Manager",
      email: "manager@example.com"
    });

    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(10);
    expect(decoded.role).toBe("manager");
    expect(decoded.sessionId).toBe(sessionId);
  });
});
