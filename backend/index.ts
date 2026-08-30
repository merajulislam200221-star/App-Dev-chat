import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import { initializeSocket } from "./socket/socket";

dotenv.config();

const app = express();

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

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
  })
  .catch((error) => {
    console.error(
      "Failed to start server due to database connection error: ",
      error
    );
    process.exit(1);
  });