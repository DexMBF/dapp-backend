import _ from "lodash";
import { cacheItem, itemExists, readItem, getAllKeysMatching } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::dex";

export async function propagateSwapEventData(
  pair: string,
  amount0In: string,
  amount1In: string,
  amount0Out: string,
  amount1Out: string,
  to: string,
  transactionHash: string,
  chainId: string
) {
  try {
    const swapKey = cacheKeyPrefix.concat("::", "swaps::", pair, "::", transactionHash, "::", chainId, "::", Date.now().toString(16));
    await cacheItem(
      swapKey,
      {
        pair,
        amount0In,
        amount1In,
        amount0Out,
        amount1Out,
        to,
        transactionHash,
        chainId,
        timestamp: Date.now()
      },
      60 * 24 * 30
    );
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateSyncEventData(pair: string, reserve0: string, reserve1: string, transactionHash: string, chainId: string) {
  try {
    const syncKey = cacheKeyPrefix.concat("::", "syncs::", pair, "::", transactionHash, "::", chainId, "::", Date.now().toString(16));
    await cacheItem(
      syncKey,
      {
        pair,
        reserve0,
        reserve1,
        transactionHash,
        chainId,
        timestamp: Date.now()
      },
      60 * 24 * 30
    );
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateTransferEventData(pair: string, from: string, to: string, amount: string, transactionHash: string, chainId: string) {
  try {
    const transferKey = cacheKeyPrefix.concat("::", "transfers::", pair, "::", transactionHash, "::", chainId, "::", Date.now().toString(16));
    await cacheItem(transferKey, { pair, from, to, transactionHash, chainId, amount, timestamp: Date.now() }, 60 * 24 * 30);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForFactory(blockNumber: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::factory::", chainId);
    await cacheItem(lastBlockKey, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForPairs(pair: string, blockNumber: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::pairs::", pair, "::", chainId);
    await cacheItem(lastBlockKey, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateEventForPairs(
  pair: string,
  amount1: string,
  amount2: string,
  eventName: string,
  chainId: string,
  transactionHash: string
) {
  try {
    const eventKey = cacheKeyPrefix.concat("::events::", pair, "::", chainId, "::", Date.now().toString(16));
    await cacheItem(
      eventKey,
      {
        chainId,
        amount1,
        amount2,
        pair,
        eventName,
        timestamp: Date.now(),
        transactionHash
      },
      60 * 24 * 30
    );
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getAllEvents() {
  try {
    const keysPattern = cacheKeyPrefix.concat("::events::*");
    const keys = await getAllKeysMatching(keysPattern);

    let events: Array<{
      chainId: string;
      amount1: string;
      amount2: string;
      pair: string;
      eventName: string;
      timestamp: number;
      transactionHash: string;
    }> = [];

    for (const key of keys) {
      const ev = await readItem(key);
      const item = JSON.parse(ev as string);
      events = _.concat(events, item);
    }
    return Promise.resolve(events);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForFactory(chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::factory::", chainId);
    const i = await readItem(lastBlockKey);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt(((await readItem(lastBlockKey)) as string).replace('"', "")) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPairs(pair: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::pairs::", pair, "::", chainId);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt(((await readItem(lastBlockKey)) as string).replace('"', "")) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllSwapEvents() {
  try {
    const swapKey = cacheKeyPrefix.concat("::swaps::", "*");
    const allMatchingKeys = await getAllKeysMatching(swapKey);
    let allSwapEvents: Array<{
      pair: string;
      amount0In: string;
      amount1In: string;
      amount0Out: string;
      amount1Out: string;
      to: string;
      transactionHash: string;
      chainId: string;
      timestamp: number;
    }> = [];

    for (const key of allMatchingKeys) {
      const item = JSON.parse((await readItem(key)) as string);
      allSwapEvents = _.concat(allSwapEvents, item);
    }
    return Promise.resolve(allSwapEvents);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllSyncEvents() {
  try {
    const syncKey = cacheKeyPrefix.concat("::syncs::", "*");
    const allMatchingKeys = await getAllKeysMatching(syncKey);
    let allSyncEvents: Array<{
      pair: string;
      reserve0: string;
      reserve1: string;
      transactionHash: string;
      chainId: string;
      timestamp: number;
    }> = [];

    for (const key of allMatchingKeys) {
      const item = JSON.parse((await readItem(key)) as string);
      allSyncEvents = _.concat(allSyncEvents, item);
    }

    // _.forEach(allMatchingKeys, async key => {

    // });

    return Promise.resolve(allSyncEvents);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllTransferEvents() {
  try {
    const transferKey = cacheKeyPrefix.concat("::transfers::", "*");
    const allMatchingKeys = await getAllKeysMatching(transferKey);
    let allTransferEvents: Array<{
      pair: string;
      from: string;
      to: string;
      transactionHash: string;
      amount: string;
      chainId: string;
      timestamp: number;
    }> = [];

    for (const key of allMatchingKeys) {
      const item = JSON.parse((await readItem(key)) as string);
      allTransferEvents = _.concat(allTransferEvents, item);
    }

    // _.each(allMatchingKeys, async key => {

    // });
    return Promise.resolve(allTransferEvents);
  } catch (error: any) {
    return Promise.reject(error);
  }
}
