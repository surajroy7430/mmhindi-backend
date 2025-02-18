const express = require("express");
const cors = require("cors");
const fileRoutes = require("./routes/fileRoutes");
const { connectDB, getDBConnectionStatus } = require("./config/db");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, parameterLimit: 100000, limit: "50mb" })
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "PUT", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

connectDB();
app.use("/api/files", fileRoutes);

const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL;

app.use((req, res) => {
  const status = getDBConnectionStatus() ? "MongoDB Connected Successfully!" : "MongoDB Not Connected.";
  res.send(`Server running on - ${BASE_URL} <br> ${status}`);
});

app.listen(PORT, () => console.log(`Server running on port - ${PORT}`));
