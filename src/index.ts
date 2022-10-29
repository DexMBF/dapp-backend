import express, { Router } from "express";
import morgan from "morgan";
import { dexRouter, syncAll as syncDEXDB, handleDEXEvents } from "./dex";
import { stakingPoolsRouter, syncAll as syncStakingPoolDB, handleStakingPoolEvents } from "./staking";
import { multiSigRouter, syncAll as syncMultiSigDB, handleMultiSigActionsEvents } from "./multi-sig";
import logger from "./shared/log";
import { initConnection as initRedisConnection } from "./shared/cache/redis";
import { env } from "./shared/environment";

const app: express.Application = express();
const port = parseInt(process.env.PORT || "7755");
const router = Router();

router.use("/dex", dexRouter);
router.use("/staking", stakingPoolsRouter);
router.use("/multisig", multiSigRouter);

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

  // Sync DB and handle events
  syncMultiSigDB();
  handleMultiSigActionsEvents();

  logger("Everything synced and app is running on port %d in %s", port, env);
});
