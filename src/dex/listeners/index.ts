import _ from "lodash";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { env } from "../../shared/environment";
import supportedChains from "../../shared/supportedChains.json";
import logger from "../../shared/log";
import xInfo from "../assets/__chains__routers__factories.json";
import { buildProvider } from "../../shared/utils";
import { handlePairCreatedEvent, getPastLogsForFactory } from "./handlers";
import { getPastLogsForAllPairs } from "./helpers/pairs";

const chains = supportedChains[env === "production" ? "mainnet" : "testnet"] as any;

// Event ID
const pairCreatedEventId = hashId("PairCreated(address,address,address,uint256)");

function listenForAllDEXEvents() {
  try {
    _.keys(chains).forEach(key => {
      const provider = buildProvider(chains[key].rpcUrl);
      const address = xInfo[key as keyof typeof xInfo]?.factory;

      if (!!address) {
        logger("----- Initializing watch for %s -----", address);
        provider.on({ address, topics: [pairCreatedEventId] }, handlePairCreatedEvent(chains[key].rpcUrl, hexValue(parseInt(key))));
      }
    });
  } catch (error: any) {
    logger(error.message);
  }
}

function getPastDEXEvents() {
  try {
    _.keys(chains).forEach(async key => {
      const factory = xInfo[key as keyof typeof xInfo]?.factory;
      if (!!factory) {
        await getPastLogsForFactory(chains[key].rpcUrl, factory, hexValue(parseInt(key)));
        await getPastLogsForAllPairs(chains[key].rpcUrl, hexValue(parseInt(key)));
      }
    });
  } catch (error: any) {
    logger(error.message);
  }
}

export default function handleDEXEvents() {
  listenForAllDEXEvents();
  getPastDEXEvents();
}
