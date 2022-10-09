import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import _ from "lodash";
import { abi as stakingPoolAbi } from "vefi-token-launchpad-staking/artifacts/contracts/StakingPool.sol/StakingPool.json";
import {
  propagateLastBlockNumberForAction,
  propagateStakeEventData,
  propagateLastBlockNumberForPool,
  getLastBlockNumberForAction,
  getLastBlockNumberForPool
} from "../../cache";
import { buildProvider, rpcCall } from "../../../shared/utils";
import logger from "../../../shared/log";
import { stakingPools } from "../../db/models";

const stakingPoolAbiInterface = new Interface(stakingPoolAbi);

// Events hashes
const stakedHash = hashId("Staked(uint256,address,uint256,address,bytes32)");
const unstakedHash = hashId("Unstaked(uint256,bytes32)");
const withdrawnHash = hashId("Withdrawn(uint256,bytes32)");

const handleStakedEvent = (poolId: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = stakingPoolAbiInterface.parseLog(log);
      const [amount, token, timestamp, staker, stakeId] = args;
      logger("----- Stake occurred on pool %s -----", poolId);
      await propagateStakeEventData(poolId, amount.toString(), token, _.multiply(timestamp, 1000), staker, stakeId, log.transactionHash, chainId);
      await propagateLastBlockNumberForPool(poolId, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

const handleUnstakedEvent = (poolId: string, chainId: string) => {
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
        const lastPropagatedBlockForPair = await getLastBlockNumberForPairs(model.id, chainId);
        logger("----- Last propagated block for pair %s is %d", model.id, lastPropagatedBlockForPair);
        if (lastPropagatedBlockForPair > 0) {
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
                default: {
                  break;
                }
              }
            }
          }

          watchPair(url, model.id, chainId);
        }
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
