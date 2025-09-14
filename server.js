const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Admin credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "mypassword"; // ⚠️ change this in production!

// Basic Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    return res.status(401).send("Authentication required.");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [username, password] = credentials.split(":");

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Area"');
    return res.status(401).send("Access denied.");
  }
}

// ✅ Save contact messages (used by React site)
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | ${name} | ${email} | ${phone} | ${message}\n`;

  fs.appendFile("messages.txt", logEntry, (err) => {
    if (err) return res.status(500).json({ status: "error" });
    res.json({ status: "success" });
  });
});

// ✅ Admin fetch messages (Basic Auth required)
app.get("/api/messages", auth, (req, res) => {
  fs.readFile("messages.txt", "utf8", (err, data) => {
    if (err) return res.status(500).json({ status: "error", message: "Cannot read messages" });
    const lines = data.split("\n").filter((line) => line.length > 0);
    const messages = lines.map(line => {
      const [timestamp, name, email, phone, message] = line.split(" | ");
      return { timestamp, name, email, phone, message };
    });
    res.json(messages);
  });
});

// Serve static HTML files (e.g. your admin index.html)
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
