import _ from "lodash";
import { cacheItem, itemExists, readItem, getAllKeysMatching, hCacheItem, hReadItems } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::staking-pools";

export async function propagateStakeEventData(
  poolId: string,
  amount: string,
  token: string,
  timestamp: number,
  staker: string,
  stakeId: string,
  transactionHash: string,
  chainId: string
) {
  try {
    const key = cacheKeyPrefix.concat("::stakes::", chainId);
    await hCacheItem(key, transactionHash, {
      stake: stakeId,
      amount,
      token,
      timestamp,
      staker,
      transactionHash,
      chainId,
      poolId
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateUnstakeEventData(poolId: string, stakeId: string, amount: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::stakes::", chainId);
    const items = await hReadItems(key);
    let theKey = "";

    for (const k of _.keys(items)) {
      const valJSON = JSON.parse(items[k]);

      if (valJSON.chainId === chainId && valJSON.stake === stakeId && valJSON.poolId === poolId) {
        theKey = k;
      }
    }
    if (theKey !== "") {
      let item = JSON.parse(items[theKey]);
      const newAmount = _.subtract(parseInt(item.amount), parseInt(amount));
      item = { ...item, amount: newAmount.toString() };
      await hCacheItem(key, theKey, item);
    }
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForAction(blockNumber: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::action::", chainId);
    await cacheItem(lastBlockKey, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForPool(pool: string, blockNumber: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::pools::", pool, "::", chainId);
    await cacheItem(lastBlockKey, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForAction(chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::action::", chainId);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt((await readItem(lastBlockKey)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPool(pool: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::pools::", pool, "::", chainId);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt((await readItem(lastBlockKey)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllStakeEventsByChainId(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::stakes::", chainId);
    let allStakeEvents: Array<{
      stake: string;
      amount: string;
      token: string;
      timestamp: number;
      staker: string;
      transactionHash: string;
      chainId: string;
    }> = [];

    const ev = await hReadItems(key);

    for (const k of _.keys(ev)) allStakeEvents = _.concat(allStakeEvents, JSON.parse(ev[k]));

    return Promise.resolve(allStakeEvents);
  } catch (error) {
    return Promise.reject(error);
  }
}
