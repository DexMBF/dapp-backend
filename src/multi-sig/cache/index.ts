import { cacheItem, itemExists, readItem, getAllKeysMatching } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::multisig";

export async function propagateLastBlockNumberForMultiSigAction(blockNumber: string, chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::multisig_actions::", chainId);
    await cacheItem(lastBlockKey, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberMultiSigAction(chainId: string) {
  try {
    const lastBlockKey = cacheKeyPrefix.concat("::", "last_block::multisig_actions::", chainId);
    const i = await readItem(lastBlockKey);
    const lastBlock = (await itemExists(lastBlockKey)) ? parseInt(((await readItem(lastBlockKey)) as string).replace('"', "")) : 0;
    return Promise.resolve(lastBlock);
  } catch (error) {
    return Promise.reject(error);
  }
}
