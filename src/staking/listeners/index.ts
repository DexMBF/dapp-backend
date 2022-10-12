import _ from "lodash";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { env } from "../../shared/environment";
import supportedChains from "../../shared/supportedChains.json";
import logger from "../../shared/log";
import xInfo from "../assets/__chains__actions.json";
import { buildProvider } from "../../shared/utils";
import { handleStakingPoolDeployedEvent, getPastLogsForActions } from "./handlers";
import { getPastLogsForAllPools } from "./helpers/staking-pools";

const chains = supportedChains[env === "production" ? "mainnet" : "testnet"] as any;

// Event ID
const stakingPoolDeployedEventId = hashId("StakingPoolDeployed(address,address,address,address,uint256,uint256,uint256)");

function listenForAllStakingPoolEvents() {
  try {
    _.keys(chains).forEach(key => {
      const provider = buildProvider(chains[key].rpcUrl);
      const address = xInfo[key as keyof typeof xInfo].actions;

      logger("----- Initializing watch for %s -----", address);
      provider.on({ address, topics: [stakingPoolDeployedEventId] }, handleStakingPoolDeployedEvent(chains[key].rpcUrl, hexValue(parseInt(key))));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

function getPastStakingPoolEvents() {
  try {
    _.keys(chains).forEach(async key => {
      await getPastLogsForActions(chains[key].rpcUrl, xInfo[key as keyof typeof xInfo].actions, hexValue(parseInt(key)));
      await getPastLogsForAllPools(chains[key].rpcUrl, hexValue(parseInt(key)));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

export default function handleStakingPoolEvents() {
  listenForAllStakingPoolEvents();
  getPastStakingPoolEvents();
}
