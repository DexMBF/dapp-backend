import _ from "lodash";
import { cacheItem, itemExists, readItem, hCacheItem, hReadItems } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::launchpad";

export async function propagateLastBlockNumberForPublicSaleCreator(blockNumber: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::public_sale::", chainId);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}