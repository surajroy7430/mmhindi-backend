const mongoose = require("mongoose");

// MongoDB Schema
const FileSchema = new mongoose.Schema({
    filename: String,
    viewUrl: String,
    downloadUrl: String,
    coverImageUrl: String,
    fileSize: Number,
    key: String,
    uploadedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model("File", FileSchema);