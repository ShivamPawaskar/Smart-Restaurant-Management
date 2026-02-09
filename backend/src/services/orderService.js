import { ApiError } from "../utils/apiError.js";

const transitions = {
  pending: ["preparing"],
  preparing: ["ready"],
  ready: [],
  served: []
};

export const canTransitionKitchenStatus = (currentStatus, nextStatus) =>
  transitions[currentStatus]?.includes(nextStatus) || false;

export const canTransitionManagerStatus = (currentStatus, nextStatus) =>
  currentStatus === "ready" && nextStatus === "served";

export const buildOrderItems = (menuRows, items) => {
  const menuMap = new Map(menuRows.map((row) => [row.id, row]));
  const detailedItems = items.map((item) => {
    const menuItem = menuMap.get(item.menuItemId);
    if (!menuItem) {
      throw new ApiError(400, `Menu item ${item.menuItemId} not found`);
    }

    const quantity = Number(item.quantity || 1);
    if (Number.isNaN(quantity) || quantity < 1) {
      throw new ApiError(400, `Invalid quantity for menu item ${item.menuItemId}`);
    }

    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity,
      subtotal: Number(menuItem.price) * quantity
    };
  });

  const totalPrice = detailedItems.reduce((sum, item) => sum + item.subtotal, 0);
  return { detailedItems, totalPrice: Number(totalPrice.toFixed(2)) };
};
