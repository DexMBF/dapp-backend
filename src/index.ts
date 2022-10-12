import express, { Router } from "express";
import morgan from "morgan";
import { dexRouter, syncAll as syncDEXDB, handleDEXEvents } from "./dex";
import { stakingPoolsRouter, syncAll as syncStakingPoolDB, handleStakingPoolEvents } from "./staking";
import logger from "./shared/log";
import { initConnection as initRedisConnection } from "./shared/cache/redis";

const app: express.Application = express();
const port = parseInt(process.env.PORT || "7755");
const router = Router();

router.use("/dex", dexRouter);
router.use("/staking", stakingPoolsRouter);

app.use(express.json());
app.use(morgan("combined"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

app.use("/api", router);

app.listen(port, () => {
  (async () => {
    await initRedisConnection();
  })();
  // Sync DB and handle events
  syncDEXDB();
  handleDEXEvents();

  // Sync DB and handle events
  syncStakingPoolDB();
  handleStakingPoolEvents();

  logger("Everything synced and app is running on port %d", port);
});
