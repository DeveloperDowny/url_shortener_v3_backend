const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});

// Shutdown the server when some uncaught exception occurs
process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception Occured! Shutting down server");
  console.log({ error });
  process.exit(1);
});

const mongoose = require("mongoose");

const database = process.env.DATABASE_URL.replace(
  "<USERNAME>",
  process.env.DATABASE_USERNAME
).replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(database, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Database connected successfully!"))
  .catch((error) => console.log("Fail to connect database!", error));

const app = require("./app");
const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// Gracessfully shutdown when unhandled rejection occurs
process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection Occured! Shutting down server");
  console.log({ error });
  server.close(() => {
    console.log("Process terminatd");
  });
});
