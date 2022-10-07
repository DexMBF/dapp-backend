import express, { Router } from "express";
import _ from "lodash";
import { Interface } from "@ethersproject/abi";
import { abi as pairAbi } from "quasar-v1-core/artifacts/contracts/QuasarPair.sol/QuasarPair.json";
import chains from "../../shared/supportedChains.json";
import { env } from "../../shared/environment";
import { rpcCall } from "../../shared/utils";
import { getAllSyncEvents } from "../cache";

// Chain
const chain = chains[env === "production" ? "mainnet" : "testnet"] as any;

// ABIs
const pairAbiInterface = new Interface(pairAbi);

const fetchPriceForPair = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const allSyncEvents = await getAllSyncEvents();
    let filteredSyncEvents = _.filter(allSyncEvents, ev => ev.pair === params.pair && ev.chainId === params.chainId);

    if (query.period) {
      const period = query.period as string;
      const time = parseInt(period);
      if (Date.now() >= time) {
        filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - time);
      } else {
        throw new Error("No data available for this time");
      }
    } else {
      filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - 60 * 60 * 24 * 1000);
    }

    return res.status(200).json({ result: filteredSyncEvents });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/:pair/:chainId", fetchPriceForPair);

export default router;
