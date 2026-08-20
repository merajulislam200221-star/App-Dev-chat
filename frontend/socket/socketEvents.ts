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

  // Remove listener
  if (typeof callbackOrOff === "boolean" && callbackOrOff) {
    socket.off("updateProfile", payload);
    return;
  }

  // Register listener
  if (typeof payload === "function") {
    socket.on("updateProfile", payload);
    return;
  }

  // Emit updateProfile and listen for the response
  if (typeof callbackOrOff === "function") {
    socket.once("updateProfile", callbackOrOff);
    socket.emit("updateProfile", payload);
    return;
  }

  // Normal emit without callback
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
    // turn off listening to this event
    socket.off("getContacts", payload);
  } else if (typeof payload === "function") {
    // payload as callback for this event
    socket.on("getContacts", payload);
  } else {
    // sending payload as data
    socket.emit("getContacts", payload);
  }
};

export const newConversation = (payload: any, off: boolean = false) => {
  const socket = getSocket();
  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    // turn off listing to this event
    socket.off("newConversation", payload); // payload is the callback
  } else if (typeof payload == "function") {
    socket.on("newConversation", payload); // payload as callback for this event
  } else {
    socket.emit("newConversation", payload); // sending payload as data
  }
};