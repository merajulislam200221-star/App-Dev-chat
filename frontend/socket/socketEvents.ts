import { getSocket } from "./socket";

export const testSocket = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("testSocket", payload);
  } else if (typeof payload === "function") {
    socket.on("testSocket", payload);
  } else {
    socket.emit("testSocket", payload);
  }
};

export const updateProfile = (
  payload: any,
  callbackOrOff: ((res: any) => void) | boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (typeof callbackOrOff === "boolean" && callbackOrOff) {
    socket.off("updateProfile", payload);
    return;
  }

  if (typeof payload === "function") {
    socket.on("updateProfile", payload);
    return;
  }

  if (typeof callbackOrOff === "function") {
    socket.once("updateProfile", callbackOrOff);
    socket.emit("updateProfile", payload);
    return;
  }

  socket.emit("updateProfile", payload);
};

export const getContacts = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("getContacts", payload);
  } else if (typeof payload === "function") {
    socket.on("getContacts", payload);
  } else {
    socket.emit("getContacts", payload);
  }
};

// ==========================================
// CONVERSATION & MESSAGE SOCKET EVENTS
// ==========================================

export const getConversations = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("getConversations", payload);
  } else if (typeof payload === "function") {
    socket.on("getConversations", payload);
  } else {
    socket.emit("getConversations", payload);
  }
};

export const newConversation = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("newConversation", payload);
  } else if (typeof payload === "function") {
    socket.on("newConversation", payload);
  } else {
    socket.emit("newConversation", payload);
  }
};

export const getMessage = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("getConversation", payload);
  } else if (typeof payload === "function") {
    socket.on("getConversation", payload);
  } else {
    socket.emit("getConversation", payload);
  }
};

export const newMessage = (
  payload: any,
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    socket.off("newMessage", payload);
  } else if (typeof payload === "function") {
    socket.on("newMessage", payload);
  } else {
    socket.emit("newMessage", payload);
  }
};