import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { abi as pairAbi } from "quasar-v1-core/artifacts/contracts/QuasarPair.sol/QuasarPair.json";
import _ from "lodash";
import {
  getLastBlockNumberForPairs,
  propagateLastBlockNumberForPairs,
  propagateSwapEventData,
  propagateSyncEventData,
  propagateTransferEventData
} from "../../cache";
import { buildProvider, rpcCall } from "../../../shared/utils";
import logger from "../../../shared/log";
import { pairs } from "../../db/models";

const pairAbiInterface = new Interface(pairAbi);

// Events hashes
const syncHash = hashId("Sync(uint112,uint112)");
const swapHash = hashId("Swap(address,uint256,uint256,uint256,uint256,address)");
const transferHash = hashId("Transfer(address,address,uint256)");

const handleSyncEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [reserve0, reserve1] = args;
      await propagateSyncEventData(pair, reserve0.toString(), reserve1.toString(), log.transactionHash, chainId);
      await propagateLastBlockNumberForPairs(pair, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

const handleSwapEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [, amount0In, amount1In, amount0Out, amount1Out, to] = args;
      await propagateSwapEventData(
        pair,
        amount0In.toString(),
        amount1In.toString(),
        amount0Out.toString(),
        amount1Out.toString(),
        to,
        log.transactionHash,
        chainId
      );
      await propagateLastBlockNumberForPairs(pair, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

const handleTransferEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [from, to, amount] = args;
      await propagateTransferEventData(pair, from, to, amount.toString(), log.transactionHash, chainId);
      await propagateLastBlockNumberForPairs(pair, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

export const watchPair = (url: string, pair: string, chainId: string) => {
  try {
    const provider = buildProvider(url);

    logger("----- Now watching pair %s on chain %s -----", pair, chainId);

    provider.on({ address: pair, topics: [syncHash] }, handleSyncEvent(pair, chainId));
    provider.on({ address: pair, topics: [swapHash] }, handleSwapEvent(pair, chainId));
    provider.on({ address: pair, topics: [transferHash] }, handleTransferEvent(pair, chainId));
  } catch (error: any) {
    logger(error.message);
  }
};

export const getPastLogsForAllPairs = async (url: string, chainId: string) => {
  try {
    const allPairs = await pairs.getAllPairs({ where: { chainId } });
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });

    _.each(allPairs, async model => {
      const lastPropagatedBlockForPair = await getLastBlockNumberForPairs(model.id, chainId);
      if (lastPropagatedBlockForPair > 0) {
        const logs = await rpcCall(parseInt(chainId), {
          method: "eth_getLogs",
          params: [{ fromBlock: hexValue(lastPropagatedBlockForPair + 1), toBlock: blockNumber, address: model.id, topics: [] }]
        });

        _.each(logs, async (log: any) => {
          const { args, name } = pairAbiInterface.parseLog(log);

          switch (name) {
            case "Sync": {
              const [, amount0In, amount1In, amount0Out, amount1Out, to] = args;
              await propagateSwapEventData(
                model.id,
                amount0In.toString(),
                amount1In.toString(),
                amount0Out.toString(),
                amount1Out.toString(),
                to,
                log.transactionHash,
                chainId
              );
              await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
              break;
            }
            case "Swap": {
              const [, amount0In, amount1In, amount0Out, amount1Out, to] = args;
              await propagateSwapEventData(
                model.id,
                amount0In.toString(),
                amount1In.toString(),
                amount0Out.toString(),
                amount1Out.toString(),
                to,
                log.transactionHash,
                chainId
              );
              await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
              break;
            }
            case "Transfer": {
              const [from, to, amount] = args;
              await propagateTransferEventData(model.id, from, to, amount.toString(), log.transactionHash, chainId);
              await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
              break;
            }
            default: {
              break;
            }
          }
        });

        watchPair(url, model.id, chainId);
      }
    });
  } catch (error: any) {
    logger(error.message);
  }
};
