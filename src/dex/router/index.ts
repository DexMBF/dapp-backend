import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import fs from "fs";
import path from "path";
import { Interface } from "@ethersproject/abi";
import { hexStripZeros } from "@ethersproject/bytes";
import { abi as pairAbi } from "quasar-v1-core/artifacts/contracts/QuasarPair.sol/QuasarPair.json";
import { abi as erc20Abi } from "quasar-v1-core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import chains from "../../shared/supportedChains.json";
import { env } from "../../shared/environment";
import { rpcCall } from "../../shared/utils";
import { getAllSyncEvents, getAllTransferEvents } from "../cache";

// Chain
const chain = chains[env === "production" ? "mainnet" : "testnet"] as any;

// ABIs
const pairAbiInterface = new Interface(pairAbi);
const erc20AbiInterface = new Interface(erc20Abi);

const fetchPriceHistoryForPair = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const allSyncEvents = await getAllSyncEvents();
    let filteredSyncEvents = _.filter(
      allSyncEvents,
      ev => ev.pair.toLowerCase() === params.pair.toLowerCase() && ev.chainId.toLowerCase() === params.chainId.toLowerCase()
    );

    if (query.period) {
      const period = query.period as string;
      const time = parseInt(period);
      assert(Date.now() >= time, "No data available for this time");
      filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - time);
    } else {
      filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - 60 * 60 * 24 * 1000);
    }

    return res.status(200).json({ result: filteredSyncEvents });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchLiquidityPoolsForAddress = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["query", "params"]);
    const allTransferEvents = await getAllTransferEvents();
    const pairs = _.filter(
      allTransferEvents,
      ev => ev.chainId.toLowerCase() === params.chainId.toLowerCase() && ev.to.toLowerCase() === params.to.toLowerCase()
    ).map(ev => ev.pair);
    const pairSet = new Set<string>(pairs);
    let result = Array.from(pairSet);

    if (query.page) {
      result = _.slice(result, (parseInt(query.page as string) - 1) * 20, parseInt(query.page as string) * 20);
    } else {
      result = _.slice(result, 0, 20);
    }

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchListing = async (req: express.Request, res: express.Response) => {
  try {
    const { params } = _.pick(req, ["params"]);
    const location = path.join(__dirname, "../assets/listing/", parseInt(params.chainId).toString() + ".json");
    assert.ok(fs.existsSync(location), "listing for this chain does not exist");
    const contentBuf = fs.readFileSync(location);
    const contentJSON = JSON.parse(contentBuf.toString());
    return res.status(200).json({ result: contentJSON });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/price_history/:pair/:chainId", fetchPriceHistoryForPair);
router.get("/pools/:chainId/:to", fetchLiquidityPoolsForAddress);
router.get("/listing/:chainId", fetchListing);

export default router;
