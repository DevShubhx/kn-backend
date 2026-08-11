// server.js - Part A (Production Grade)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const https = require('https');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();

const { protectUser } = require('./middleware/authMiddleware');
const LiveStream = require('./models/LiveStream');
const { router: chatRouter, blockedEmails, filterMessage } = require('./routes/chatRoutes');
const Chat = require('./models/Chat');

const app = express();

const ALLOWED_ORIGINS = [
    'http://localhost:3000', 'http://localhost:3001',
    'http://localhost:5173', 'http://localhost:5174',
    'http://127.0.0.1:3000', 'http://127.0.0.1:5173',
    'https://kartoonnetworkindia.vercel.app',
];
if (process.env.FRONTEND_PRODUCTION_URL) {
    ALLOWED_ORIGINS.push(process.env.FRONTEND_PRODUCTION_URL.trim());
}

// server.js - Replace your current app.use(cors(...)) options block exactly with this:

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
        
        if (isLocalhost || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            console.error(`🚨 CORS Security Violation. Origin rejected: ${origin}`);
            return callback(new Error('Access denied by strict structural security policies.'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    
    // 🔒 FIXED HIGH ACCURACY: लोअरकेस और कैमलकेस दोनों वेरिएंट्स को कड़ाई से व्हाइटलिस्ट करना
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cache-Control', 
        'cache-control', // 🎯 FIXED: ब्राउज़र के लोअरकेस प्रीफ्लाइट रिजेक्शन को बाईपास करने के लिए
        'Pragma', 
        'pragma',        // 🎯 FIXED: सुरक्षित बैकअप फॉलबैक
        'Expires', 
        'expires',       // 🎯 FIXED: सुरक्षित बैकअप फॉलबैक
        'X-Requested-With', 
        'Accept',
        'Range'
    ],
    
    // ⚡ EXPOSED HEADERS MATRIX
    exposedHeaders: [
        'Content-Length', 
        'Content-Range', 
        'Accept-Ranges', 
        'Cache-Control',
        'cache-control',
        'Expires',
        'Pragma'
    ],
    optionsSuccessStatus: 204
}));


// 🛠️ CRITICAL CSP FIX: हेलमेट के अंदर से अतिरिक्त 'https://://' की सिंटैक्स एरर को हटा दिया गया है
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // 🌟 जादुई सुरक्षा लॉक: केवल प्लेयर और मुख्य किक डोमेन को आईफ्रेम में लोड होने की सटीक अनुमति
            frameSrc: ["'self'", "https://kick.com", "https://*.kick.com"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://*"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "http://localhost:*", "https://*"]
        }
    }
}));

app.use(express.json());
// 4. BUSINESS CORE APPS ROUTING SCHEDULERS
app.use('/api/shows', require('./routes/showRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/updates', require('./routes/updateRoutes'));
app.use('/api/live-tv', require('./routes/liveRoutes'));
app.use('/api/screen-bugs', require('./routes/bugRoutes'));
app.use('/api/theatre', require('./routes/theatreRoutes'));
app.use('/api/chat', chatRouter); 
app.use('/api/poll', require('./routes/pollRoutes'));
app.use('/api/new-shows', require('./routes/newShowRoutes'));
app.use('/api/weekly-schedule', require('./routes/scheduleRoutes'));

// Base Diagnostic Route
app.get('/', (req, res) => {
  res.send('Backend Server is Running Smoothly with Kick-Ready Socket Matrix!');
});

// ==========================================================================
// 📡 SOCKET.IO REAL-TIME CONNECTION HUBS & WEB SERVERS
// ==========================================================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS, 
        methods: ["GET", "POST"],
        credentials: true
    }
});

let activeWatchersCount = 0;

io.on('connection', (socket) => {
    activeWatchersCount++;
    io.emit('live_watchers_update', { count: activeWatchersCount });
    console.log(`🔌 User connected to Chat Matrix. Active Watchers: ${activeWatchersCount}`);

    socket.on('send_message', async (data) => {
        try {
            const { username, email, message } = data;
            if (blockedEmails.has(email.toLowerCase().trim())) {
                socket.emit('chat_error', '⚠️ Access Denied! You are blocked from this live chat.');
                return;
            }
            const cleanMessage = filterMessage(message);
            const newChat = new Chat({ username: username.trim(), email: email.toLowerCase().trim(), message: cleanMessage });
            await newChat.save();

            io.emit('receive_message', {
                _id: newChat._id, username: newChat.username, email: newChat.email, message: newChat.message, createdAt: newChat.createdAt
              });
        } catch (err) {
            console.error("📋 Chat Socket Operational Failure:", err.message);
        }
    });

    socket.on('disconnect', () => {
        activeWatchersCount = Math.max(0, activeWatchersCount - 1);
        io.emit('live_watchers_update', { count: activeWatchersCount });
        console.log(`❌ User disconnected. Active Watchers: ${activeWatchersCount}`);
    });
});

// 5. DATABASE & SERVER BOOTSTRAPPING SEQUENCER
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected safely to MongoDB Database');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Master Server is flying high on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });
