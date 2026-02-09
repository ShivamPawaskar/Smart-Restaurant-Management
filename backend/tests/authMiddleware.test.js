import { authorize } from "../src/middleware/auth.js";
import { jest } from "@jest/globals";

describe("authorize middleware", () => {
  test("allows matching roles", () => {
    const req = { user: { role: "kitchen" } };
    const res = {};
    const next = jest.fn();

    authorize("kitchen", "manager")(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("blocks non-matching roles", () => {
    const req = { user: { role: "customer" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authorize("kitchen", "manager")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
