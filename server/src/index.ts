import express from "express";
import prisma from "./db.ts";
import router from "./routes/index.ts";

const app = express();
app.use(express.json());
app.use("/api", router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});