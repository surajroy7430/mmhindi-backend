const File = require("../models/File");
const { s3, awsBucketName } = require("../config/s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const musicMetadata = require("music-metadata");
const sharp = require("sharp");
const getFormattedDate = require("../utils/formatDate");

const BASE_URL = process.env.BASE_URL;

const uploadFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: "No files uploaded" });

        const uploadedFiles = await Promise.all(
            req.files.map(async (file) => {
                const fileName = file.originalname.replace(/\(MyMp3Song[s]?\)/gi, "");
                
                const fileKey = file.originalname
                    .replace(/[\s-,]+/g, "-")
                    .replace(/\(MyMp3Song[s]?\)/gi, "")
                    .trim();

                let coverImageKey = null;
                if (file.mimetype.startsWith("audio/")) {
                    const metadata = await musicMetadata.parseBuffer(file.buffer);

                    const fileBaseName = file.originalname
                        .replace(/[\s-,]+/g, "-")                    // remove whitespace, hyphens and comma
                        .replace(/\(MyMp3Song[s]?\)/gi, "")          
                        .replace(/\.[a-zA-Z0-9]+$/, "")              // remove file extension
                        .trim();

                    const year = metadata.common.year || null;
                    const language = metadata.common.language || "Hindi";

                    if (metadata.common.picture && metadata.common.picture.length > 0) {
                        const coverImageBuffer = metadata.common.picture[0].data;

                        const imageMimeType =
                            metadata.common.picture[0].format ||
                            "image/jpg" ||
                            "image/jpeg" ||
                            "image/png";

                        const { width, height } = await sharp(coverImageBuffer).metadata();
                        const imageExt = imageMimeType.split("/")[1];

                        coverImageKey = `${fileBaseName}-${language}-${year ? year : null
                            }-${getFormattedDate()}-${width}x${height}.${imageExt}`;

                        // Upload cover image to S3
                        await s3.send(
                            new PutObjectCommand({
                                Bucket: awsBucketName,
                                Key: coverImageKey,
                                Body: coverImageBuffer,
                                ContentType: imageMimeType,
                                ContentDisposition: `inline; filename="${coverImageKey}"`,
                            })
                        );
                    }
                }

                // 🔹 Upload to S3 with public read access
                await s3.send(
                    new PutObjectCommand({
                        Bucket: awsBucketName,
                        Key: fileKey,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ContentDisposition: `inline; filename="${fileKey}"`, // For view
                    })
                );

                // 🔹 Save Metadata in MongoDB
                const viewUrl = `${BASE_URL}/api/files/view/${encodeURIComponent(fileKey)}`;
                const downloadUrl = `${BASE_URL}/api/files/download/${encodeURIComponent(
                    fileKey
                )}`;
                const coverImageUrl = coverImageKey
                    ? `${BASE_URL}/api/files/viewCoverImage/${encodeURIComponent(coverImageKey)}`
                    : null;

                const newFile = await File.create({
                    filename: fileName,
                    viewUrl,
                    downloadUrl,
                    coverImageUrl,
                    key: fileKey,
                });

                return newFile;
            })
        );

        res.json({ message: "Files uploaded successfully!", files: uploadedFiles });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
};

const getFiles = async (req, res) => {
    try {
        const files = await File.find().sort({ uploadedAt: -1 });

        res.json(files);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Failed to retrieve files" });
    }
}

const viewCoverURL = async (req, res) => {
    try {
        const coverImageKey = decodeURIComponent(req.params.key);
        const coverImageUrl = `https://${awsBucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${coverImageKey}`;
        res.setHeader("Content-Disposition", "inline"); // Instruct browser to display inline
        res.redirect(coverImageUrl); // Directly redirects to the public URL for the cover image
    } catch (error) {
        console.error("View Cover Image Error:", error);
        res.status(500).json({ error: "Failed to view cover image" });
    }
}

const viewUploadedFile = async (req, res) => {
    try {
        const fileKey = decodeURIComponent(req.params.key);

        const viewUrl = `https://${awsBucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        res.setHeader("Content-Disposition", "inline"); // Instruct browser to display inline
        res.redirect(viewUrl); // Directly redirects to the public URL for viewing
    } catch (error) {
        console.error("View File Error:", error);
        res.status(500).json({ error: "Failed to view file" });
    }
}

const downloadUploadedFile = async (req, res) => {
    try {
        const fileKey = decodeURIComponent(req.params.key); // Get file key from URL

        // 🔹 Generate a pre-signed URL (valid for 60 seconds)
        const command = new GetObjectCommand({
            Bucket: awsBucketName,
            Key: fileKey,
            ResponseContentDisposition: `attachment; filename="${fileKey}"`, // Force download with original filename
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

        // Redirect user to the signed URL (forces download)
        res.redirect(signedUrl);
    } catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({ error: "Failed to generate download link" });
    }
}

const deleteUploadedFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        // 🔹 Delete from S3
        await s3.send(
            new DeleteObjectCommand({
                Bucket: awsBucketName,
                Key: file.key,
            })
        );

        if (file.coverImageUrl) {
            const coverImageKey = file.coverImageUrl.split("/").pop();
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: awsBucketName,
                    Key: coverImageKey,
                })
            );
        }

        // 🔹 Remove from MongoDB
        await file.deleteOne();

        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
}

module.exports = {
    uploadFiles,
    getFiles,
    viewCoverURL,
    viewUploadedFile,
    downloadUploadedFile,
    deleteUploadedFile
};