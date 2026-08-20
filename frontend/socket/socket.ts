import { API_URL } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Socket, io } from "socket.io-client";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("No token found. User must login first");
  }

  if (!socket) {
    socket = io(API_URL, {
      auth: {
        token,
      },
    });

    await new Promise<void>((resolve, reject) => {
      socket!.on("connect", () => {
        console.log("Socket connected:", socket!.id);
        resolve();
      });

      socket!.on("connect_error", (error) => {
        console.log("Socket connection error:", error.message);
        reject(error);
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function testSocket(
  callback?: (data: any) => void,
  removeListener: boolean = false
): void {
  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (removeListener) {
    if (callback) {
      socket.off("testSocket", callback);
    }
    return;
  }

  if (callback) {
    socket.on("testSocket", callback);
  }

  socket.emit("testSocket", {});
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}