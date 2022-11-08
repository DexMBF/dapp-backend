import _ from "lodash";
import { cacheItem, itemExists, readItem } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::launchpad";

export async function propagateLastBlockNumberForPublicSaleCreator(blockNumber: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::public_sale_creator::", chainId);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForPrivateSaleCreator(blockNumber: string, chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::private_sale_creator::", chainId);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPublicSaleCreator(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::public_sale_creator::", chainId);
    const lastBlock = (await itemExists(key)) ? parseInt((await readItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForPrivateSaleCreator(chainId: string) {
  try {
    const key = cacheKeyPrefix.concat("::last_block::private_sale_creator::", chainId);
    const lastBlock = (await itemExists(key)) ? parseInt((await readItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}
