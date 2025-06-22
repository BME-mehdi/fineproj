// server/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuration options for MongoDB connection
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
};

// Connection state management
let isConnected = false;

const connectDB = async () => {
  // If already connected, return
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return;
  }

  // Check if MONGO_URI is provided
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not defined');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    
    isConnected = true;
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📍 Database: ${conn.connection.db.databaseName}`);
    console.log(`🌐 Host: ${conn.connection.host}:${conn.connection.port}`);
    
    // Log connection status
    console.log(`📊 Connection ready state: ${conn.connection.readyState}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Log specific error details
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 DNS resolution failed. Check your MongoDB URI.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused. Check if MongoDB is running.');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('⏰ Server selection timeout. Check network connectivity.');
    }
    
    isConnected = false;
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Export connection function and status
export default connectDB;
export { isConnected };