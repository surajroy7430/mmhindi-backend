const express = require("express");
const upload = require("../config/multer");
const { uploadFiles,
    getFiles,
    viewCoverURL,
    viewUploadedFile,
    downloadUploadedFile,
    deleteUploadedFile
} = require("../controllers/fileController");

const router = express.Router();

router.post("/upload", upload.array("files"), uploadFiles);

router.get("/", getFiles);
router.get("/view/:key", viewUploadedFile);
router.get("/viewCoverImage/:key", viewCoverURL);
router.get("/download/:key", downloadUploadedFile);

router.delete("/:id", deleteUploadedFile);

module.exports = router;