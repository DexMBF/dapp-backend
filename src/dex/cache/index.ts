import _ from "lodash";
import { cacheItem, itemExists, readItem, hCacheItem, hReadItems } from "../../shared/cache/redis";

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
    const key = cacheKeyPrefix.concat("::swaps::", chainId);
    await hCacheItem(key, transactionHash, {
      pair,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
      transactionHash,
      chainId,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateSyncEventData(pair: string, reserve0: string, reserve1: string, transactionHash: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::syncs::", chainId);
    await hCacheItem(key, transactionHash, {
      pair,
      reserve0,
      reserve1,
      transactionHash,
      chainId,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateTransferEventData(pair: string, from: string, to: string, amount: string, transactionHash: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::transfers::", chainId);
    await hCacheItem(key, transactionHash, {
      pair,
      from,
      to,
      amount,
      transactionHash,
      chainId,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForFactory(blockNumber: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::factory::", chainId);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForPairs(pair: string, blockNumber: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::pairs::", pair, "::", chainId);
    await cacheItem(key, blockNumber);
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
    const key = cacheKeyPrefix.concat("::events::", chainId);
    await hCacheItem(key, transactionHash, {
      pair,
      amount1,
      amount2,
      eventName,
      chainId,
      transactionHash,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getAllEventsByChainId(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::events::", chainId);

    let events: Array<{
      chainId: string;
      amount1: string;
      amount2: string;
      pair: string;
      eventName: string;
      timestamp: number;
      transactionHash: string;
    }> = [];

    const ev = await hReadItems(key);

    for (const k of _.keys(ev)) events = _.concat(events, JSON.parse(ev[k]));

    return Promise.resolve(events);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForFactory(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::factory::", chainId);
    const lastBlock = (await itemExists(key)) ? parseInt((await readItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPairs(pair: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::pairs::", pair, "::", chainId);
    const lastBlock = (await itemExists(key)) ? parseInt((await readItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllSwapEventsByChainId(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::swaps::", chainId);
    let events: Array<{
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

    const ev = await hReadItems(key);

    for (const k of _.keys(ev)) events = _.concat(events, JSON.parse(ev[k]));

    return Promise.resolve(events);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllSyncEventsByChainId(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::syncs::", chainId);
    let events: Array<{
      pair: string;
      reserve0: string;
      reserve1: string;
      transactionHash: string;
      chainId: string;
      timestamp: number;
    }> = [];

    const ev = await hReadItems(key);

    for (const k of _.keys(ev)) events = _.concat(events, JSON.parse(ev[k]));

    return Promise.resolve(events);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllTransferEventsByChainId(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::transfers::", chainId);
    let events: Array<{
      pair: string;
      from: string;
      to: string;
      transactionHash: string;
      amount: string;
      chainId: string;
      timestamp: number;
    }> = [];

    const ev = await hReadItems(key);

    for (const k of _.keys(ev)) events = _.concat(events, JSON.parse(ev[k]));

    return Promise.resolve(events);
  } catch (error: any) {
    return Promise.reject(error);
  }
}
