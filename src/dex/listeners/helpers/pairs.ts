import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { abi as pairAbi } from "quasar-v1-core/artifacts/contracts/QuasarPair.sol/QuasarPair.json";
import { BigNumber } from "@ethersproject/bignumber";
import {
  getLastBlockNumberForPairs,
  propagateEventForPairs,
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
const mintHash = hashId("Mint(address,uint256,uint256)");
const burnHash = hashId("Burn(address,uint256,uint256,address)");

const handleSyncEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [reserve0, reserve1] = args;
      logger("----- Sync occurred on pair %s -----", pair);
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
      logger("----- Swap occurred on pair %s -----", pair);
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
      await propagateEventForPairs(
        pair,
        BigNumber.from(amount0In.toString()).gt("0") ? amount0In.toString() : amount0Out.toString(),
        BigNumber.from(amount1In.toString()).gt("0") ? amount1In.toString() : amount1Out.toString(),
        "swap",
        chainId,
        log.transactionHash
      );
      await propagateLastBlockNumberForPairs(pair, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

const handleMintEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [, amount0, amount1] = args;
      logger("----- Mint occurred on pair %s -----", pair);
      await propagateEventForPairs(pair, amount0.toString(), amount1.toString(), "mint", chainId, log.transactionHash);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

const handleBurnEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [, amount0, amount1] = args;
      logger("----- Burn occurred on pair %s -----", pair);
      await propagateEventForPairs(pair, amount0.toString(), amount1.toString(), "burn", chainId, log.transactionHash);
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
      logger("----- Transfer occurred on pair %s -----", pair);
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
    provider.on({ address: pair, topics: [mintHash] }, handleMintEvent(pair, chainId));
    provider.on({ address: pair, topics: [burnHash] }, handleBurnEvent(pair, chainId));
  } catch (error: any) {
    logger(error.message);
  }
};

export const getPastLogsForAllPairs = async (url: string, chainId: string) => {
  try {
    const allPairs = await pairs.getAllPairs({ where: { chainId } });
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });

    for (const model of allPairs) {
      {
        logger("----- Retrieving last propagated block for pair %s -----", model.id);
        let lastPropagatedBlockForPair = await getLastBlockNumberForPairs(model.id, chainId);

        if (lastPropagatedBlockForPair === 0) {
          lastPropagatedBlockForPair = parseInt(blockNumber);
          await propagateLastBlockNumberForPairs(model.chainId, blockNumber, chainId);
        }
        const logs = await rpcCall(parseInt(chainId), {
          method: "eth_getLogs",
          params: [{ fromBlock: hexValue(lastPropagatedBlockForPair + 1), toBlock: blockNumber, address: model.id, topics: [] }]
        });

        logger("----- Iterating logs for pair %s -----", model.id);
        for (const log of logs) {
          {
            const { args, name } = pairAbiInterface.parseLog(log);

            switch (name) {
              case "Sync": {
                logger(
                  "----- Retrieving sync event with transaction hash %s and block number %s for pair %s -----",
                  log.transactionHash,
                  log.blockNumber,
                  model.id
                );
                const [reserve0, reserve1] = args;
                await propagateSyncEventData(model.id, reserve0.toString(), reserve1.toString(), log.transactionHash, chainId);
                await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
                break;
              }
              case "Swap": {
                logger(
                  "----- Retrieving swap event with transaction hash %s and block number %s for pair %s -----",
                  log.transactionHash,
                  log.blockNumber,
                  model.id
                );
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
                await propagateEventForPairs(
                  model.id,
                  BigNumber.from(amount0In.toString()).gt("0") ? amount0In.toString() : amount0Out.toString(),
                  BigNumber.from(amount1In.toString()).gt("0") ? amount1In.toString() : amount1Out.toString(),
                  "swap",
                  chainId,
                  log.transactionHash
                );
                await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
                break;
              }
              case "Transfer": {
                logger(
                  "----- Retrieving transfer event with transaction hash %s and block number %s for pair %s -----",
                  log.transactionHash,
                  log.blockNumber,
                  model.id
                );
                const [from, to, amount] = args;
                await propagateTransferEventData(model.id, from, to, amount.toString(), log.transactionHash, chainId);
                await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
                break;
              }
              case "Mint": {
                const [, amount0, amount1] = args;
                logger(
                  "----- Retrieving mint event with transaction hash %s and block number %s for pair %s -----",
                  log.transactionHash,
                  log.blockNumber,
                  model.id
                );
                await propagateEventForPairs(model.id, amount0.toString(), amount1.toString(), "mint", chainId, log.transactionHash);
                await propagateLastBlockNumberForPairs(model.id, hexValue(log.blockNumber), chainId);
                break;
              }
              case "Burn": {
                const [, amount0, amount1] = args;
                logger(
                  "----- Retrieving burn event with transaction hash %s and block number %s for pair %s -----",
                  log.transactionHash,
                  log.blockNumber,
                  model.id
                );
                await propagateEventForPairs(model.id, amount0.toString(), amount1.toString(), "burn", chainId, log.transactionHash);
                break;
              }
              default: {
                break;
              }
            }
          }
        }

        watchPair(url, model.id, chainId);
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
