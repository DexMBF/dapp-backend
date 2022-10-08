import express, { Router } from "express";
import morgan from "morgan";
import { dexRouter, syncAll as syncDEXDB, handleDEXEvents } from "./dex";
import logger from "./shared/log";

const app: express.Application = express();
const port = parseInt(process.env.PORT || "7755");
const router = Router();

router.use("/dex", dexRouter);

app.use(express.json());
app.use(morgan("combined"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

app.listen(port, () => {
  // Sync DB and handle events
  syncDEXDB();
  handleDEXEvents();

  logger("Everything synced and app is running on port %d", port);
});
