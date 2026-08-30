import { Server as SocketIOServer } from "socket.io";
import Conversation from "../modals/Conversation";
import Message from "../modals/Message";
import User from "../modals/User";

// 50+ diverse, human-like, and engaging auto-generated replies
export const AUTO_REPLIES: string[] = [
  // 1-10: Greetings & Catch-ups
  "Hey there! Great to hear from you 😊",
  "Hello! How has your day been going?",
  "Hey! What are you working on today?",
  "Hi! Good to connect with you.",
  "Yo! Hope everything is going great on your end.",
  "Hey friend! Hope you're having an awesome week!",
  "Hi there! Always a pleasure chatting with you.",
  "Hey! Long time no talk, how are things?",
  "Greetings! Hope you're having a productive day!",
  "Hey! Just saw your message, what's up?",

  // 11-20: Enthusiastic & Affirmative
  "That sounds like an amazing plan! 🚀",
  "100%! I was just thinking the exact same thing.",
  "Totally agree with you on this one 👍",
  "Awesome! Let's definitely move forward with that.",
  "Sounds perfect to me, count me in!",
  "That makes complete sense, well said!",
  "Love the energy! Let's make it happen 💪",
  "That's fantastic news! Really happy to hear that.",
  "Spot on! Couldn't have said it better myself.",
  "Yes, absolutely! I'm completely on board.",

  // 21-30: Productive & Collaborative
  "I'm reviewing the latest updates right now, looking great!",
  "Just finishing up a task on my end, I'll check this out shortly.",
  "Thanks for the heads-up! I'll take a look right away.",
  "Got it! I've noted that down.",
  "Everything looks on track from my side. Nice job! 👏",
  "Let me know if you need any help or feedback with that.",
  "Let's sync up later today to go over the final details.",
  "Working through my tasks now, will keep you posted!",
  "I tested the latest flow and it's working super smoothly!",
  "Great teamwork on this project, really loving the progress!",

  // 31-40: Casual & Friendly Reactions
  "Haha that's hilarious! 😂",
  "Oh wow, that's really impressive! 🌟",
  "No worries at all! Take all the time you need.",
  "All good on my side! Thanks for checking in.",
  "Super cool! Really like how this is turning out.",
  "Haha good one! Made my day 😄",
  "Appreciate the kind words! 🙌",
  "Cheers! Always glad to chat with you.",
  "Sounds like fun! Let me know how it goes.",
  "Haha totally! You're awesome.",

  // 41-52: Inquisitive & Engaging
  "Interesting! Tell me a bit more about that?",
  "How did that turn out in the end?",
  "What do you think our next step should be?",
  "Have you had a chance to test it out yet?",
  "When would be a good time for us to catch up?",
  "Sounds intriguing! Any other updates to share?",
  "What's your favorite part about it so far?",
  "Do you think we should invite more people to the group?",
  "Are we still good for our discussion later today?",
  "Looks great to me! What do you have planned next?",
  "Thanks for sharing! Always love hearing your thoughts.",
  "Talk to you soon, have a wonderful rest of your day! ✨",
];

// Contextual keyword-based replies for even smarter responses
const CONTEXTUAL_REPLIES: { keywords: string[]; replies: string[] }[] = [
  {
    keywords: ["hi", "hello", "hey", "hola", "yo", "morning", "evening", "afternoon"],
    replies: [
      "Hey there! Great to hear from you 😊",
      "Hello! How has your day been going?",
      "Hey! What are you working on today?",
      "Hi! Hope you're having an awesome day!",
      "Yo! Great to connect with you today!",
    ],
  },
  {
    keywords: ["how are you", "how r u", "how's it going", "how is it going", "what's up", "whats up"],
    replies: [
      "I'm doing really well, thanks for asking! How about you?",
      "All good here, having a productive day! What's new with you?",
      "Doing great! Just excited to see Chatify coming along nicely ✨",
      "Pretty good! Just catching up on some work. How are things on your side?",
    ],
  },
  {
    keywords: ["thanks", "thank you", "thx", "appreciate", "grateful"],
    replies: [
      "You're very welcome! Always happy to help 😊",
      "Anytime! Glad I could be of assistance.",
      "No problem at all! Let me know if you need anything else.",
      "Don't mention it! Happy to collaborate.",
    ],
  },
  {
    keywords: ["bye", "goodbye", "see you", "cya", "night", "good night", "later"],
    replies: [
      "Catch you later! Have a wonderful day ahead 👋",
      "Take care! Talk to you soon ✨",
      "Good night! Have a restful evening 🌙",
      "See you! Reach out whenever you want to chat again.",
    ],
  },
  {
    keywords: ["meeting", "call", "sync", "schedule", "discuss"],
    replies: [
      "Sounds like a plan! Let me know what time works best for you 📅",
      "Let's definitely sync up on that. I'm available later today!",
      "I'll check my calendar and let you know. Looking forward to it!",
      "Count me in! Send over an invite whenever you're ready.",
    ],
  },
  {
    keywords: ["cool", "great", "nice", "awesome", "perfect", "good", "love"],
    replies: [
      "Awesome! Really happy we're aligned on this 🚀",
      "Super cool! Loving how smoothly everything is running.",
      "Glad you like it! Let's keep the great momentum going.",
      "Totally agree! It's coming together nicely.",
    ],
  },
];

/**
 * Selects a smart, varied reply based on incoming message content without repeating excluded replies
 */
export function getAutoReply(content: string = "", excludeList: string[] = []): string {
  const normalized = content.toLowerCase().trim();

  // Check contextual keywords first
  for (const group of CONTEXTUAL_REPLIES) {
    const match = group.keywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      return regex.test(normalized) || normalized.includes(kw);
    });

    if (match) {
      const available = group.replies.filter((r) => !excludeList.includes(r));
      if (available.length > 0) {
        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
      }
    }
  }

  // Fallback to picking randomly from the 50+ general replies
  const availableGeneral = AUTO_REPLIES.filter((r) => !excludeList.includes(r));
  const pool = availableGeneral.length > 0 ? availableGeneral : AUTO_REPLIES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Triggers automated replies from ALL other group/direct members with realistic staggered delays
 */
export function triggerAutoReply(
  io: SocketIOServer,
  conversationId: string,
  senderId: string,
  content: string
) {
  setTimeout(async () => {
    try {
      const conversation = await Conversation.findById(conversationId)
        .populate<{ participants: any[] }>({
          path: "participants",
          select: "name avatar email _id",
        })
        .lean();

      if (!conversation || !conversation.participants || conversation.participants.length <= 1) {
        return;
      }

      // Filter all other participants who did not send this message
      const otherParticipants = conversation.participants.filter(
        (p: any) => p._id.toString() !== senderId.toString()
      );

      if (otherParticipants.length === 0) {
        return;
      }

      const usedReplies: string[] = [];

      // Every member replies with staggered delays (e.g. Member 1 @ 1.2s, Member 2 @ 2.6s, Member 3 @ 4.0s...)
      otherParticipants.forEach((respondent: any, index: number) => {
        const staggerDelay = index * 1400 + Math.floor(Math.random() * 500);

        setTimeout(async () => {
          try {
            const replyContent = getAutoReply(content, usedReplies);
            usedReplies.push(replyContent);

            // Create new message in DB
            const autoMessage = await Message.create({
              conversationId,
              senderId: respondent._id,
              content: replyContent,
              attachment: null,
            });

            // Update conversation's lastMessage
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: autoMessage._id,
            });

            const messagePayload = {
              id: autoMessage._id,
              content: replyContent,
              sender: {
                id: respondent._id.toString(),
                name: respondent.name,
                avatar: respondent.avatar || "",
              },
              attachment: null,
              createdAt: new Date().toISOString(),
              conversationId,
            };

            // Broadcast to all sockets in the conversation room
            io.to(conversationId).emit("newMessage", {
              success: true,
              data: messagePayload,
            });

            console.log(
              `[AutoReply] Member ${index + 1}/${otherParticipants.length} (${respondent.name}) replied in ${conversationId}: "${replyContent}"`
            );
          } catch (innerError) {
            console.log(`[AutoReply] Error sending reply from ${respondent.name}:`, innerError);
          }
        }, staggerDelay);
      });
    } catch (error) {
      console.log("[AutoReply] Error fetching conversation participants:", error);
    }
  }, 1000);
}

