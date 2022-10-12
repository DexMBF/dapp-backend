import _ from "lodash";
import { cacheItem, itemExists, readItem, getAllKeysMatching } from "../../shared/cache/redis";

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
    const stakeKey = cacheKeyPrefix.concat(
      "::",
      "stakes::",
      poolId,
      "::",
      stakeId,
      "::",
      transactionHash,
      "::",
      chainId,
      "::",
      Date.now().toString(16)
    );
    await cacheItem(stakeKey, {
      stake: stakeId,
      amount,
      token,
      timestamp,
      staker,
      transactionHash,
      chainId
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateUnstakeEventData(poolId: string, stakeId: string, amount: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::stakes::", poolId, "::", stakeId, "*");
    const allKeys = await getAllKeysMatching(key);
    let item;
    let theKey: string = "";

    for (const k of allKeys) {
      const val = await readItem(k);
      const valJSON = JSON.parse(val as string);

      if (valJSON.chainId === chainId) {
        item = valJSON;
        theKey = key;
      }
    }

    const newAmount = _.subtract(parseInt(item.amount), parseInt(amount));
    item = { ...item, amount: newAmount.toString() };
    await cacheItem(theKey, item);
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
    const i = await readItem(lastBlockKey);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt(((await readItem(lastBlockKey)) as string).replace('"', "")) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPool(pool: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::pools::", pool, "::", chainId);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt(((await readItem(lastBlockKey)) as string).replace('"', "")) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getAllStakeEvents() {
  try {
    const stakeKey = cacheKeyPrefix.concat("::stakes::", "*");
    const allMatchingKeys = await getAllKeysMatching(stakeKey);
    let allStakeEvents: Array<{
      stake: string;
      amount: string;
      token: string;
      timestamp: number;
      staker: string;
      transactionHash: string;
      chainId: string;
    }> = [];

    for (const key of allMatchingKeys) {
      const item = JSON.parse((await readItem(key)) as string);
      allStakeEvents = _.concat(allStakeEvents, item);
    }
    return Promise.resolve(allStakeEvents);
  } catch (error) {
    return Promise.reject(error);
  }
}
