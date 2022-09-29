import { cacheItem, closeConnection, initConnection, itemExists } from "../../shared/cache/redis";

const cacheKeyPrefix = "redis::cache::dex";

export async function propagateSwapEventData(
  pair: string,
  token0Name: string,
  token1Name: string,
  amount0In: string,
  amount1In: string,
  amount0Out: string,
  amount1Out: string,
  to: string
) {
  try {
    await initConnection();
    const swapKey = cacheKeyPrefix.concat("::", "swaps::", pair, Date.now().toString(16));
    await cacheItem(
      swapKey,
      {
        pair,
        token0Name,
        token1Name,
        amount0In,
        amount1In,
        amount0Out,
        amount1Out,
        to,
        timestamp: Date.now()
      },
      60 * 24 * 30
    );
    await closeConnection();
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateSyncEventData(pair: string, reserve0: string, reserve1: string) {
  try {
    await initConnection();
    const syncKey = cacheKeyPrefix.concat("::", "syncs::", pair, Date.now().toString(16));
    await cacheItem(syncKey, {
      pair,
      reserve0,
      reserve1
    });
    await closeConnection();
  } catch (error: any) {
    return Promise.reject(error);
  }
}
