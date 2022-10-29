import _ from "lodash";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { env } from "../../shared/environment";
import supportedChains from "../../shared/supportedChains.json";
import logger from "../../shared/log";
import actions from "../assets/__actions__.json";
import { buildProvider } from "../../shared/utils";
import { handleMultiSigDeployedEvent, getPastLogsForMultiSigAction } from "./handlers";

const chains = supportedChains[env === "production" ? "mainnet" : "testnet"] as any;

// Event ID
const multiSigDeployedEventId = hashId("MultiSigDeployed(address,address[],uint256)");

function listenForAllMultiSigActionsEvents() {
  try {
    _.keys(chains).forEach(key => {
      const provider = buildProvider(chains[key].rpcUrl);
      const address = actions[key as keyof typeof actions];

      logger("----- Initializing watch for %s -----", address);
      provider.on({ address, topics: [multiSigDeployedEventId] }, handleMultiSigDeployedEvent(hexValue(parseInt(key))));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

function getPastMultiSigActionsEvents() {
  try {
    _.keys(chains).forEach(async key => {
      await getPastLogsForMultiSigAction(actions[key as keyof typeof actions], hexValue(parseInt(key)));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

export default function handleMultiSigActionsEvents() {
  listenForAllMultiSigActionsEvents();
  getPastMultiSigActionsEvents();
}
