let ioInstance;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO is not initialized");
  }
  return ioInstance;
};

export const emitRoleEvent = (role, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`role:${role}`).emit(event, payload);
  }
};

export const emitUserEvent = (userId, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
};
