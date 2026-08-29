import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";
import Message from "../modals/Message";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
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
      const conversations = await Conversation.find({
        participants: userId,
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt",
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
      console.log("getConversations error: ", error);

      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  // ==========================================
  // NEW CONVERSATION
  // ==========================================

  socket.on("newConversation", async (data) => {
    console.log("newConversation event: ", data);

    try {
      if (data.type === "direct") {
        const existingConversation = await Conversation.findOne({
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
            select: "content senderId attachment createdAt",
          })
          .lean();

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

      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "",
        avatar: data.avatar || "",
        createdBy: socket.data.userId,
      });

      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (participantSocket) =>
          data.participants.includes(participantSocket.data.userId)
      );

      connectedSockets.forEach((participantSocket) => {
        participantSocket.join(conversation._id.toString());
      });

      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt",
        })
        .lean();

      if (!populatedConversation) {
        throw new Error("Failed to populate conversation");
      }

      io.to(conversation._id.toString()).emit("newConversation", {
        success: true,
        data: {
          ...populatedConversation,
          isNew: true,
        },
      });
    } catch (error: any) {
      console.log("newConversation error: ", error);

      socket.emit("newConversation", {
        success: false,
        msg: "Failed to create conversation",
      });
    }
  });

  // ==========================================
  // NEW MESSAGE
  // ==========================================

  socket.on("newMessage", async (data) => {
    console.log("newMessage: ", data);
    try {
      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: data.sender.id,
        content: data.content,
        attachment: data.attachment,
      });

      io.to(data.conversationId).emit("newMessage", {
        success: true,
        data: {
          id: message._id,
          content: data.content,
          sender: {
            id: data.sender.id,
            name: data.sender.name,
            avatar: data.sender.avatar,
          },
          attachment: data.attachment,
          createdAt: new Date().toISOString(),
          conversationId: data.conversationId,
        },
      });

      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: message._id,
      });
    } catch (error) {
      console.log("newMessage error: ", error);
      socket.emit("newMessage", {
        success: false,
        msg: "Failed to send Message",
      });
    }
  });

  // ==========================================
  // GET MESSAGES
  // ==========================================

  socket.on(
    "getMessage",
    async (data: { conversationId?: string; conversation?: string }) => {
      console.log("getMessage: ", data);
      const targetConversationId = data.conversationId || data.conversation;

      if (!targetConversationId) {
        socket.emit("getMessage", {
          success: false,
          msg: "Conversation ID is required",
        });
        return;
      }

      try {
        // Ensure user joins socket room for real-time updates
        socket.join(targetConversationId);

        const messages = await Message.find({
          conversationId: targetConversationId,
        })
          .sort({ createdAt: -1 })
          .populate<{ senderId: { _id: any; name: string; avatar: string } }>({
            path: "senderId",
            select: "name avatar",
          })
          .lean();

        const messageWithSender = messages.map((msg: any) => ({
          ...msg,
          id: msg._id,
          sender: {
            id: msg.senderId?._id,
            name: msg.senderId?.name,
            avatar: msg.senderId?.avatar,
          },
        }));

        socket.emit("getMessage", {
          success: true,
          data: messageWithSender,
        });
      } catch (error) {
        console.log("getMessage error: ", error);
        socket.emit("getMessage", {
          success: false,
          msg: "Failed to fetch messages",
        });
      }
    }
  );
}