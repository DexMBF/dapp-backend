import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi as actionsAbi } from "vefi-token-launchpad-staking/artifacts/contracts/StakingPoolActions.sol/StakingPoolActions.json";
import { StakingPoolModel, stakingPools } from "../db/models";
import { rpcCall } from "../../shared/utils";
import logger from "../../shared/log";

const actionsAbiInterface = new Interface(actionsAbi);

function pushStakingPoolToDB(id: string, tokenA: string, tokenB: string, tokenAAPY: number, tokenBAPY: number, chainId: string) {
  return new Promise<StakingPoolModel>((resolve, reject) => {
    stakingPools.addStakingPool(id, tokenA, tokenB, tokenAAPY, tokenBAPY, chainId).then(resolve).catch(reject);
  });
}

export const handleStakingPoolDepoyedEvent = (url: string, chainId: string) => {
  return async (log: any) => {
    const { args } = actionsAbiInterface.parseLog(log);
    const [poolId, tokenA, tokenB, tokenAAPY, tokenBAPY] = args;
    await pushStakingPoolToDB(poolId, tokenA, tokenB, tokenAAPY, tokenBAPY, chainId);
  };
};
