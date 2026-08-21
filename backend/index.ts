import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose"; 
import authRoutes from "./routes/auth.routes";
import { initializeSocket } from "./socket/socket";

dotenv.config();

const app = express();

// CORS কনফিগারেশন আপডেট করা হয়েছে যাতে ব্রাউজার রিকোয়েস্ট ব্লক না করে
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("server is running");
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

//listen to socket events
initializeSocket(server);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

connectDB()
    .then(() => {
        console.log("Database connected");
        server.listen(PORT, () => {
            console.log("Server is running on port ", PORT);
        });
    })
    .catch((error) => {
        console.log(
            "Failed to start server due to database connection error: ",
            error
        );
    });