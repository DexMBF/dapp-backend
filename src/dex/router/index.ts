import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import fs from "fs";
import path from "path";
import { getAllEventsByChainId, getAllSwapEventsByChainId, getAllSyncEventsByChainId, getAllTransferEventsByChainId } from "../cache";

const fetchPriceHistoryForPair = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const allSyncEvents = await getAllSyncEventsByChainId(params.chainId);
    let filteredSyncEvents = _.filter(allSyncEvents, ev => ev.pair.toLowerCase() === params.pair.toLowerCase());

    if (query.period) {
      const period = query.period as string;
      const time = parseInt(period);
      assert(Date.now() >= time, "No data available for this time");
      filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - time);
    } else {
      filteredSyncEvents = _.filter(filteredSyncEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - 60 * 60 * 24 * 1000);
    }

    filteredSyncEvents = filteredSyncEvents.sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json({ result: filteredSyncEvents });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchSwapEventsForPairUsingPeriod = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const allSwapEvents = await getAllSwapEventsByChainId(params.chainId);

    let filteredSwapEvents = _.filter(allSwapEvents, ev => ev.pair.toLowerCase() === params.pair.toLowerCase());

    if (query.period) {
      const period = query.period as string;
      const time = parseInt(period);
      assert(Date.now() >= time, "No data available for this time");
      filteredSwapEvents = _.filter(filteredSwapEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - time);
    } else {
      filteredSwapEvents = _.filter(filteredSwapEvents, ev => ev.timestamp <= Date.now() && ev.timestamp >= Date.now() - 60 * 60 * 24 * 1000);
    }

    filteredSwapEvents = filteredSwapEvents.sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json({ result: filteredSwapEvents });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchTopPairs = async (req: express.Request, res: express.Response) => {
  try {
    const { params } = _.pick(req, ["params"]);
    const allSwapEvents = _.filter(await getAllSwapEventsByChainId(params.chainId));
    const occurrences: { [key: string]: number } = {};

    _.each(allSwapEvents, ev => {
      if (!occurrences[ev.pair]) occurrences[ev.pair] = 1;
      else occurrences[ev.pair] = _.add(occurrences[ev.pair], 1);
    });

    const result = Object.keys(occurrences)
      .sort((a, b) => occurrences[b] - occurrences[a])
      .slice(0, 20);
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchLiquidityPoolsForAddress = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["query", "params"]);
    const allTransferEvents = await getAllTransferEventsByChainId(params.chainId);
    const pairs = _.filter(allTransferEvents, ev => ev.to.toLowerCase() === params.to.toLowerCase()).map(ev => ev.pair);
    const pairSet = new Set<string>(pairs);
    let result: any = Array.from(pairSet);
    const length = result.length;

    if (query.page) {
      result = _.slice(result, (parseInt(query.page as string) - 1) * 20, parseInt(query.page as string) * 20);
    } else {
      result = _.slice(result, 0, 20);
    }

    result = {
      items: result,
      totalItems: length
    };

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchEvents = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["query", "params"]);
    const allEvents = await getAllEventsByChainId(params.chainId);
    let filteredEvents: typeof allEvents[0][] = allEvents;

    if (query.eventName && _.includes(["mint", "swap", "burn"], query.eventName as string)) {
      filteredEvents = _.filter(filteredEvents, ev => ev.eventName.toLowerCase() === (query.eventName as string).toLowerCase());
    }

    const length = filteredEvents.length;

    if (query.page) {
      filteredEvents = _.slice(filteredEvents, (parseInt(query.page as string) - 1) * 20, parseInt(query.page as string) * 20);
    } else {
      filteredEvents = _.slice(filteredEvents, 0, 20);
    }

    filteredEvents = filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    const result = {
      totalItems: length,
      items: filteredEvents
    };

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
    return res.status(200).json({ result: contentJSON.sort((a: any, b: any) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0)) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/price_history/:pair/:chainId", fetchPriceHistoryForPair);
router.get("/swap_events/:pair/:chainId", fetchSwapEventsForPairUsingPeriod);
router.get("/pools/:chainId/:to", fetchLiquidityPoolsForAddress);
router.get("/listing/:chainId", fetchListing);
router.get("/top_pairs/:chainId", fetchTopPairs);
router.get("/events/:chainId", fetchEvents);

export default router;
