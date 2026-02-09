import api from "./client";

export const signupRequest = (payload) => api.post("/auth/signup", payload);
export const loginRequest = (payload) => api.post("/auth/login", payload);
export const getMeRequest = () => api.get("/auth/me");
export const updateMyTableNumber = (tableNumber) =>
  api.patch("/auth/me/table-number", { tableNumber });

export const getMenu = () => api.get("/menu");

export const createOrder = (payload) => api.post("/orders", payload);
export const getMyOrders = () => api.get("/orders/me");
export const getKitchenOrders = () => api.get("/orders/kitchen");
export const getManagerOrders = () => api.get("/orders/manager");
export const updateKitchenStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}/kitchen-status`, { status });
export const markServed = (orderId) => api.patch(`/orders/${orderId}/serve`);
export const updatePayment = (orderId, paymentStatus) =>
  api.patch(`/orders/${orderId}/payment`, { paymentStatus });
export const payMyOrder = (orderId, paymentMethod = "upi") =>
  api.patch(`/orders/${orderId}/pay`, { paymentMethod });
export const getPayments = () => api.get("/orders/payments");
export const callWaiter = (message) => api.post("/orders/waiter-call", { message });
export const getWaiterCalls = () => api.get("/orders/waiter-calls");
export const resolveWaiterCall = (callId) => api.patch(`/orders/waiter-calls/${callId}/resolve`);

export const getAnalytics = () => api.get("/analytics/overview");

export const submitFeedback = (payload) => api.post("/feedback", payload);
export const getFeedback = () => api.get("/feedback");
