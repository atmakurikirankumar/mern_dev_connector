const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

// Enable CORS
app.use(cors());

// Body Parser
app.use(express.json());

// Connection to Database.
connectDB();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("API Running");
});

// Router setup
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

app.listen(PORT, () => {
  console.log(`App is running on port - ${PORT}`);
});
