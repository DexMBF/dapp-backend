import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi } from "quasar-v1-core/artifacts/contracts/QuasarFactory.sol/QuasarFactory.json";
import assert from "assert";
import { getLastBlockNumberForFactory, propagateLastBlockNumberForFactory, propagateLastBlockNumberForPairs } from "../cache";
import { PairModel, pairs } from "../db/models";
import { watchPair } from "./helpers/pairs";
import xInfo from "../assets/__chains__routers__factories.json";
import { rpcCall } from "../../shared/utils";
import logger from "../../shared/log";

const factoryAbiInterface = new Interface(abi);

function pushPairToDB(pair: string, token0: string, token1: string, chainId: string) {
  return new Promise<PairModel>((resolve, reject) => {
    pairs.addPair(pair, token0, token1, chainId).then(resolve).catch(reject);
  });
}

// Factory event handlers
export const handlePairCreatedEvent = (url: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = factoryAbiInterface.parseLog(log);
      const [token0, token1, pair] = args;

      logger("----- New pair created %s -----", pair);

      await pushPairToDB(pair, token0, token1, chainId);
      await propagateLastBlockNumberForFactory(log.blockNumber, chainId);
      await propagateLastBlockNumberForPairs(pair, log.blockNumber, chainId);
      watchPair(url, pair, chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

export const getPastLogsForFactory = async (url: string, factory: string, chainId: string) => {
  try {
    assert.equal(factory, xInfo[parseInt(chainId) as unknown as keyof typeof xInfo].factory, "factories do not match");
    logger("----- Retrieving last propagated block for factory %s -----", factory);
    let lastPropagatedBlockForFactory = await getLastBlockNumberForFactory(chainId);
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });
    logger("----- Last propagated block for factory %s is %d", factory, lastPropagatedBlockForFactory);

    if (lastPropagatedBlockForFactory === 0) {
      lastPropagatedBlockForFactory = parseInt(blockNumber);
      await propagateLastBlockNumberForFactory(blockNumber, chainId);
    }

    const logs = await rpcCall(parseInt(chainId), {
      method: "eth_getLogs",
      params: [{ fromBlock: hexValue(lastPropagatedBlockForFactory + 1), toBlock: blockNumber, address: factory, topics: [] }]
    });

    logger("----- Iterating logs for factory %s -----", factory);
    for (const log of logs) {
      {
        const { args, name } = factoryAbiInterface.parseLog(log);

        switch (name) {
          case "PairCreated": {
            const [token0, token1, pair] = args;
            logger("----- New pair created %s -----", pair);
            await pushPairToDB(pair, token0, token1, chainId);
            await propagateLastBlockNumberForFactory(log.blockNumber, chainId);
            watchPair(url, pair, chainId);
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
