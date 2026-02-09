import { buildOrderItems, canTransitionKitchenStatus, canTransitionManagerStatus } from "../src/services/orderService.js";

describe("orderService", () => {
  test("buildOrderItems computes totals", () => {
    const menuRows = [
      { id: 1, name: "Pizza", price: 10.0 },
      { id: 2, name: "Pasta", price: 12.5 }
    ];

    const { detailedItems, totalPrice } = buildOrderItems(menuRows, [
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 2, quantity: 1 }
    ]);

    expect(detailedItems).toHaveLength(2);
    expect(totalPrice).toBe(32.5);
  });

  test("kitchen status transitions are strict", () => {
    expect(canTransitionKitchenStatus("pending", "preparing")).toBe(true);
    expect(canTransitionKitchenStatus("pending", "ready")).toBe(false);
    expect(canTransitionKitchenStatus("preparing", "ready")).toBe(true);
  });

  test("manager can serve only ready orders", () => {
    expect(canTransitionManagerStatus("ready", "served")).toBe(true);
    expect(canTransitionManagerStatus("pending", "served")).toBe(false);
  });
});
