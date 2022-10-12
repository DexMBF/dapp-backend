import assert from "assert";
import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi as actionsAbi } from "vefi-token-launchpad-staking/artifacts/contracts/StakingPoolActions.sol/StakingPoolActions.json";
import { StakingPoolModel, stakingPools } from "../db/models";
import { rpcCall } from "../../shared/utils";
import logger from "../../shared/log";
import xInfo from "../assets/__chains__actions.json";
import { getLastBlockNumberForAction } from "../cache";
import { watchPool } from "./helpers/staking-pools";

const actionsAbiInterface = new Interface(actionsAbi);

function pushStakingPoolToDB(id: string, tokenA: string, tokenB: string, tokenAAPY: number, tokenBAPY: number, tax: number, chainId: string) {
  return new Promise<StakingPoolModel>((resolve, reject) => {
    stakingPools.addStakingPool(id, tokenA, tokenB, tokenAAPY, tokenBAPY, tax, chainId).then(resolve).catch(reject);
  });
}

export const handleStakingPoolDeployedEvent = (url: string, chainId: string) => {
  return async (log: any) => {
    const { args } = actionsAbiInterface.parseLog(log);
    const [poolId, tokenA, tokenB, tokenAAPY, tokenBAPY, tax] = args;
    await pushStakingPoolToDB(poolId, tokenA, tokenB, tokenAAPY, tokenBAPY, tax, chainId);
  };
};

export const getPastLogsForActions = async (url: string, actions: string, chainId: string) => {
  try {
    assert.equal(actions, xInfo[parseInt(chainId) as unknown as keyof typeof xInfo].actions, "actions do not match");
    logger("----- Retrieving last propagated block for actions %s -----", actions);
    const lastPropagatedBlockForActions = await getLastBlockNumberForAction(chainId);
    logger("----- Last propagated block for actions %s is %d", actions, lastPropagatedBlockForActions);

    if (lastPropagatedBlockForActions > 0) {
      const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });
      const logs = await rpcCall(parseInt(chainId), {
        method: "eth_getLogs",
        params: [{ fromBlock: hexValue(lastPropagatedBlockForActions + 1), toBlock: blockNumber, address: actions, topics: [] }]
      });

      logger("----- Iterating logs for actions %s -----", actions);
      for (const log of logs) {
        {
          const { args, name } = actionsAbiInterface.parseLog(log);

          switch (name) {
            case "StakingPoolDeployed": {
              const { args } = actionsAbiInterface.parseLog(log);
              const [poolId, tokenA, tokenB, tokenAAPY, tokenBAPY, tax] = args;
              logger("----- New pool created %s -----", poolId);
              await pushStakingPoolToDB(poolId, tokenA, tokenB, tokenAAPY, tokenBAPY, tax, chainId);
              watchPool(url, poolId, chainId);
              break;
            }
            default: {
              break;
            }
          }
        }
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
