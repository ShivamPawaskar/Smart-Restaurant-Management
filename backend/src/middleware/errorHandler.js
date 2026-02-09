export const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    message: err.message || "Internal server error"
  };

  if (err.errors) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
