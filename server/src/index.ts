import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/index.ts";
import { employeeContext } from "./middleware/employeeContext.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(employeeContext);

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
