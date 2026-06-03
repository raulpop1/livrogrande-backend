const express = require('express');
const http = require('http'); // ☁️ CLOUD CHANGE: Reverted to 'http'. The cloud platform handles HTTPS!
const { Server } = require('socket.io');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./graphql/schema');
const bookRoutes = require('./routes/bookRoutes');
const stealthLogger = require('./middleware/stealthLogger');

const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); 
const Chat = require('./models/Chat');

const db = require('./models');

const app = express();

// ☁️ CLOUD CHANGE: Create a standard HTTP server (Render adds the SSL on top automatically)
const server = http.createServer(app);

// ☁️ CLOUD CHANGE: Allow the cloud to assign the Port and Frontend URL
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ☁️ CLOUD CHANGE: Secure your WebSockets to only accept connections from your Vercel URL
const io = new Server(server, {
  cors: { 
    origin: FRONTEND_URL, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ☁️ CLOUD CHANGE: Secure your REST API
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.set('io', io);

// ROUTES
app.use('/api/books', stealthLogger, bookRoutes);
app.use('/api/users', userRoutes); 

// ☁️ CLOUD CHANGE: Use environment variable for MongoDB (Atlas)
// ☁️ CLOUD CHANGE: Use environment variable, with your link directly as a fallback string with the NEW PASSWORD
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://popraul035_db_user:LivroGrande2026Password@livrograndecluster.ozsi3ic.mongodb.net/?appName=LivrograndeCluster';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

async function startServer() {
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  // WEBSOCKETS (Real-Time Chat) 
  io.on('connection', (socket) => {
    console.log('🔌 Client connected');

    // Send the last 50 messages when someone opens the app
    Chat.find().sort({ timestamp: -1 }).limit(50).then(chats => {
      socket.emit('chat_history', chats.reverse());
    });

    // Listen for someone typing a new message
    socket.on('send_message', async (data) => {
      try {
        const newChat = new Chat({ username: data.username, message: data.message });
        await newChat.save(); // Save to MongoDB
        io.emit('receive_message', newChat); // Broadcast to everyone else
      } catch (err) {
        console.error("Chat save error:", err);
      }
    });
  });

  // ☁️ CLOUD CHANGE: Build the database tables in Neon!
  await db.sequelize.sync({ alter: true });
  console.log('🐘 PostgreSQL Tables Synced!');

  const publisherCount = await db.Publisher.count();
    if (publisherCount === 0) {
      console.log('🌱 Database is empty! Seeding default publishers...');
      await db.Publisher.bulkCreate([
        { name: 'Penguin Books', location: 'New York' },
        { name: 'HarperCollins', location: 'London' },
        { name: 'Simon & Schuster', location: 'New York' }
      ]);
      console.log('✅ Publishers seeded!');
    }

  // Prevent Jest from hanging
  if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
      // ☁️ CLOUD CHANGE: Removed the hardcoded local IP address logging
      console.log(`☁️ Live Server running on port ${PORT}`);
      console.log(`🌌 GraphQL ready at /graphql`);
    });
  }
}
startServer();

module.exports = app;