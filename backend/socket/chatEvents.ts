import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";

export function registerChatEvents(
  io: SocketIOServer,
  socket: Socket
) {
  // ==========================================
  // GET ALL CONVERSATIONS
  // ==========================================

  socket.on("getConversations", async () => {
    console.log("getConversations event");

    const userId = socket.data.userId;

    if (!userId) {
      socket.emit("getConversations", {
        success: false,
        msg: "Unauthorized",
      });

      return;
    }

    try {
      // Find all conversations where
      // the current user is a participant
      const conversations = await Conversation.find({
        participants: userId,
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select:
            "content senderId attachment createdAt",
        })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.log(
        "getConversations error: ",
        error
      );

      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  // ==========================================
  // NEW CONVERSATION
  // ==========================================

  socket.on(
    "newConversation",
    async (data) => {
      console.log(
        "newConversation event: ",
        data
      );

      try {
        // ======================================
        // DIRECT CONVERSATION
        // ======================================

        if (data.type === "direct") {
          // Check if a direct conversation
          // already exists between these users
          const existingConversation =
            await Conversation.findOne({
              type: "direct",
              participants: {
                $all: data.participants,
                $size: 2,
              },
            })
              .populate({
                path: "participants",
                select: "name avatar email",
              })
              .populate({
                path: "lastMessage",
                select:
                  "content senderId attachment createdAt",
              })
              .lean();

          // Conversation already exists
          if (existingConversation) {
            socket.emit("newConversation", {
              success: true,
              data: {
                ...existingConversation,
                isNew: false,
              },
            });

            return;
          }
        }

        // ======================================
        // CREATE NEW CONVERSATION
        // ======================================

        const conversation =
          await Conversation.create({
            type: data.type,
            participants: data.participants,
            name: data.name || "",
            avatar: data.avatar || "",
            createdBy: socket.data.userId,
          });

        // ======================================
        // GET ALL CONNECTED PARTICIPANTS
        // ======================================

        const connectedSockets = Array.from(
          io.sockets.sockets.values()
        ).filter((participantSocket) =>
          data.participants.includes(
            participantSocket.data.userId
          )
        );

        // ======================================
        // JOIN ALL PARTICIPANTS TO CONVERSATION
        // ROOM
        // ======================================

        connectedSockets.forEach(
          (participantSocket) => {
            participantSocket.join(
              conversation._id.toString()
            );
          }
        );

        // ======================================
        // GET POPULATED CONVERSATION
        // ======================================

        const populatedConversation =
          await Conversation.findById(
            conversation._id
          )
            .populate({
              path: "participants",
              select: "name avatar email",
            })
            .populate({
              path: "lastMessage",
              select:
                "content senderId attachment createdAt",
            })
            .lean();

        if (!populatedConversation) {
          throw new Error(
            "Failed to populate conversation"
          );
        }

        // ======================================
        // SEND NEW CONVERSATION TO ALL
        // PARTICIPANTS
        // ======================================

        io.to(
          conversation._id.toString()
        ).emit("newConversation", {
          success: true,
          data: {
            ...populatedConversation,
            isNew: true,
          },
        });
      } catch (error: any) {
        console.log(
          "newConversation error: ",
          error
        );

        socket.emit("newConversation", {
          success: false,
          msg: "Failed to create conversation",
        });
      }
    }
  );
}