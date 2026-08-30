import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";
import Message from "../modals/Message";
import { triggerAutoReply } from "../services/autoReplyService";

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
          populate: {
            path: "senderId",
            select: "name avatar",
          },
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
            populate: {
              path: "senderId",
              select: "name avatar",
            },
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

      const conversationIdStr = conversation._id.toString();

      // Ensure current socket joins the room
      socket.join(conversationIdStr);

      // Join all currently connected participant sockets to this room
      const participantIdStrings = data.participants.map((p: any) => p.toString());
      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (participantSocket) =>
          participantSocket.data.userId &&
          participantIdStrings.includes(participantSocket.data.userId.toString())
      );

      connectedSockets.forEach((participantSocket) => {
        participantSocket.join(conversationIdStr);
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
          populate: {
            path: "senderId",
            select: "name avatar",
          },
        })
        .lean();

      if (!populatedConversation) {
        throw new Error("Failed to populate conversation");
      }

      // Emit to everyone in the room
      io.to(conversationIdStr).emit("newConversation", {
        success: true,
        data: {
          ...populatedConversation,
          isNew: true,
        },
      });

      // Direct emit to creator to guarantee delivery
      socket.emit("newConversation", {
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
      const senderId = data.sender?.id || socket.data.userId;
      const senderName = data.sender?.name || socket.data.name || "User";
      const senderAvatar = data.sender?.avatar || socket.data.avatar || "";

      if (!data.conversationId) {
        socket.emit("newMessage", {
          success: false,
          msg: "Conversation ID is required",
        });
        return;
      }

      const message = await Message.create({
        conversationId: data.conversationId,
        senderId,
        content: data.content,
        attachment: data.attachment,
      });

      io.to(data.conversationId).emit("newMessage", {
        success: true,
        data: {
          id: message._id,
          content: data.content,
          sender: {
            id: senderId,
            name: senderName,
            avatar: senderAvatar,
          },
          attachment: data.attachment,
          createdAt: new Date().toISOString(),
          conversationId: data.conversationId,
        },
      });

      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: message._id,
      });

      // Trigger automatic reply from recipient/group member
      triggerAutoReply(
        io,
        data.conversationId,
        senderId.toString(),
        data.content || ""
      );
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