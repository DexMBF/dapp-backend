import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import _ from "lodash";
import { abi as stakingPoolAbi } from "vefi-token-launchpad-staking/artifacts/contracts/StakingPool.sol/StakingPool.json";
import { propagateStakeEventData, propagateLastBlockNumberForPool, getLastBlockNumberForPool, propagateUnstakeEventData } from "../../cache";
import { buildProvider, rpcCall } from "../../../shared/utils";
import logger from "../../../shared/log";
import { stakingPools } from "../../db/models";

const stakingPoolAbiInterface = new Interface(stakingPoolAbi);

// Events hashes
const stakedHash = hashId("Staked(uint256,address,uint256,address,bytes32)");
const unstakedHash = hashId("Unstaked(uint256,bytes32)");

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
      const { args } = stakingPoolAbiInterface.parseLog(log);
      const [amountUnstaked, stakeId] = args;
      logger("----- Unstaking occurred on pool %s -----", poolId);
      await propagateUnstakeEventData(poolId, stakeId, amountUnstaked.toString(), chainId);
      await propagateLastBlockNumberForPool(poolId, hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

export const watchPool = (url: string, poolId: string, chainId: string) => {
  try {
    const provider = buildProvider(url);

    logger("----- Now watching pool %s on chain %s -----", poolId, chainId);

    provider.on({ address: poolId, topics: [stakedHash] }, handleStakedEvent(poolId, chainId));
    provider.on({ address: poolId, topics: [unstakedHash] }, handleUnstakedEvent(poolId, chainId));
  } catch (error: any) {
    logger(error.message);
  }
};

export const getPastLogsForAllPools = async (url: string, chainId: string) => {
  try {
    const allPools = await stakingPools.getAllStakingPools({ where: { chainId } });
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });

    for (const model of allPools) {
      {
        logger("----- Retrieving last propagated block for pool %s -----", model.id);
        const lastPropagatedBlockForPool = await getLastBlockNumberForPool(model.id, chainId);
        logger("----- Last propagated block for pool %s is %d", model.id, lastPropagatedBlockForPool);
        if (lastPropagatedBlockForPool > 0) {
          const logs = await rpcCall(parseInt(chainId), {
            method: "eth_getLogs",
            params: [{ fromBlock: hexValue(lastPropagatedBlockForPool + 1), toBlock: blockNumber, address: model.id, topics: [] }]
          });

          logger("----- Iterating logs for pair %s -----", model.id);
          for (const log of logs) {
            {
              const { args, name } = stakingPoolAbiInterface.parseLog(log);

              switch (name) {
                case "Staked": {
                  logger(
                    "----- Retrieving staked event with transaction hash %s and block number %s for pool %s -----",
                    log.transactionHash,
                    log.blockNumber,
                    model.id
                  );
                  const [amount, token, timestamp, staker, stakeId] = args;
                  await propagateStakeEventData(
                    model.id,
                    amount.toString(),
                    token,
                    _.multiply(timestamp, 1000),
                    staker,
                    stakeId,
                    log.transactionHash,
                    chainId
                  );
                  await propagateLastBlockNumberForPool(model.id, hexValue(log.blockNumber), chainId);
                  break;
                }
                case "Unstaked": {
                  logger(
                    "----- Retrieving unstaked event with transaction hash %s and block number %s for pool %s -----",
                    log.transactionHash,
                    log.blockNumber,
                    model.id
                  );
                  const [amountUnstaked, stakeId] = args;
                  await propagateUnstakeEventData(model.id, stakeId, amountUnstaked.toString(), chainId);
                  await propagateLastBlockNumberForPool(model.id, hexValue(log.blockNumber), chainId);
                  break;
                }
                default: {
                  break;
                }
              }
            }
          }

          watchPool(url, model.id, chainId);
        }
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
