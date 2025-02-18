const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;
let isDBConnected = false;

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });
        isDBConnected = true;
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        isDBConnected = false;
        process.exit(1);
    }
}

// Getter function for isDBConnected
function getDBConnectionStatus() {
    return isDBConnected;
}

module.exports = { connectDB, getDBConnectionStatus };