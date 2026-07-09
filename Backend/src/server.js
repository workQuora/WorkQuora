require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const socketHandler = require('./Sockets/socketHandler');
const chatSocketHandler = require('./Sockets/chatSocket');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// 1. Database Connect
connectDB();

// 2. HTTP Server Create kiya (Express app ko wrap karke)
const server = http.createServer(app);

// 3. Socket.io Engine Initialize kiya
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    methods: ["GET", "POST"]
  }
});

// Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (err) {
    console.error('Socket Auth Error:', err.message);
    next(new Error('Authentication error: ' + err.message));
  }
});

// 4. Socket Handler ko call kiya
socketHandler(io);
chatSocketHandler(io);

// Pre-load background event consumer services to register event listeners (Vol 3)
require('./services/settlementService');
require('./services/referralService');

// Express app ko io instance de diya taaki controllers (jaise TaskController) live alerts bhej sakein
app.set('io', io); 

// 5. Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Master Server & Socket Engine running on port ${PORT}`);
  
  const cronService = require('./services/cronService');
  cronService.startScheduledJobs();
});

// Global crash guards to prevent unhandled rejection/exceptions from silently killing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Uncaught exceptions might leave the process in an corrupted state, safe to exit and let PM2/Render restart it.
  process.exit(1);
});