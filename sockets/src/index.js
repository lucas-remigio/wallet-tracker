import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import { createServer as createHttpServer } from "http";
import * as dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 8090;
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Add CORS middleware for the initial HTTP handshake
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = createHttpServer(app);

const wss = new WebSocketServer({
  server,
  path: "/ws", // This makes the WebSocket server only handle /ws path
});

// Track clients and rooms
const clients = new Map(); // ws -> { id, email }
const rooms = new Map(); // email -> Set<WebSocket>

// Handle new WebSocket connections
wss.on("connection", (ws, req) => {
  const clientId = Date.now().toString();
  clients.set(ws, { id: clientId });

  console.log(`Client connected: ${clientId}`);

  // Welcome message
  ws.send(
    JSON.stringify({
      type: "connection_established",
      clientId: clientId,
    })
  );

  // Message handler
  ws.on("message", (messageData) => {
    try {
      const message = JSON.parse(messageData.toString());
      console.log(`Message from ${clientId}:`, message);

      // ENDPOINT 1: Join Room
      if (message.type === "join_room" && message.email) {
        const email = message.email;

        // Create room if it doesn't exist
        if (!rooms.has(email)) {
          rooms.set(email, new Set());
        }

        // Add client to room
        rooms.get(email).add(ws);

        // Store email with client info
        clients.get(ws).email = email;

        console.log(`Client ${clientId} joined room: ${email}`);

        // Confirm room joined
        ws.send(
          JSON.stringify({
            type: "room_joined",
            email: email,
            success: true,
          })
        );
      }

      // ENDPOINT 2: Update Notification
      else if (message.type === "account_update" && message.email) {
        const email = message.email;

        // Check if room exists
        if (rooms.has(email)) {
          // Broadcast to all clients in room except sender
          rooms.get(email).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                // Get the recipient's client ID
                const recipientInfo = clients.get(client);
                const recipientId = recipientInfo?.id || "unknown";

                // Prepare message to send
                const updateMessage = {
                  type: "account_update",
                  action: message.action || "update",
                  timestamp: new Date().toISOString(),
                };

                // Send the message
                client.send(JSON.stringify(updateMessage));

                console.log(
                  `Broadcasting update from ${clientId} to client ${recipientId} in room: ${email}`
                );
              } catch (error) {
                console.error(
                  `Failed to send to a client in room ${email}:`,
                  error
                );
              }
            }
          });

          // Add summary logging after the broadcast attempt
          console.log(
            `Update attempted to broadcast to room: ${email} (${
              rooms.get(email).size
            } clients total)`
          );
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    const client = clients.get(ws);
    if (client && client.email) {
      // Remove from room
      const email = client.email;
      if (rooms.has(email)) {
        rooms.get(email).delete(ws);

        // Clean up empty room
        if (rooms.get(email).size === 0) {
          rooms.delete(email);
          console.log(`Room removed: ${email}`);
        }
      }
    }

    clients.delete(ws);
    console.log(`Client disconnected: ${clientId}`);
  });
});

// Health check endpoint
app.get("/ws/health", (req, res) => {
  res.status(200).send({
    status: "ok",
    connections: clients.size,
    rooms: Array.from(rooms.keys()).map((room) => ({
      email: room,
      clients: rooms.get(room).size,
    })),
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
