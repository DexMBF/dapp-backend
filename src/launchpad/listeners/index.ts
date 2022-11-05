import _ from "lodash";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { env } from "../../shared/environment";
import supportedChains from "../../shared/supportedChains.json";
import logger from "../../shared/log";
import saleCreators from "../assets/_sale_item_creators.json";
import { buildProvider } from "../../shared/utils";
import {
  handleTokenSaleItemCreatedEvent as handlePrivateTokenSaleItemCreatedEvent,
  getPastLogsForPrivateSaleCreator
} from "./handlers/private-token-sale";
import {
  handleTokenSaleItemCreatedEvent as handlePublicTokenSaleItemCreatedEvent,
  getPastLogsForPublicSaleCreator
} from "./handlers/public-token-sale";

const chains = supportedChains[env === "production" ? "mainnet" : "testnet"] as any;

// Event ID
const saleItemCreatedEventId = hashId(
  "TokenSaleItemCreated(bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address)"
);

function listenForAllSaleCreatorEvents() {
  try {
    _.keys(chains).forEach(key => {
      const provider = buildProvider(chains[key].rpcUrl);
      const publicSaleCreator = saleCreators[key as keyof typeof saleCreators].publicTokenSaleCreator;
      const privateSaleCreator = saleCreators[key as keyof typeof saleCreators].privateTokenSaleCreator;

      logger("----- Initializing watch for %s -----", publicSaleCreator);
      provider.on({ address: publicSaleCreator, topics: [saleItemCreatedEventId] }, handlePublicTokenSaleItemCreatedEvent(hexValue(parseInt(key))));

      logger("----- Initializing watch for %s -----", privateSaleCreator);
      provider.on({ address: privateSaleCreator, topics: [saleItemCreatedEventId] }, handlePrivateTokenSaleItemCreatedEvent(hexValue(parseInt(key))));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

function getPastSaleCreatorsEvents() {
  try {
    _.keys(chains).forEach(async key => {
      await getPastLogsForPublicSaleCreator(saleCreators[key as keyof typeof saleCreators].publicTokenSaleCreator, hexValue(parseInt(key)));
      await getPastLogsForPrivateSaleCreator(saleCreators[key as keyof typeof saleCreators].privateTokenSaleCreator, hexValue(parseInt(key)));
    });
  } catch (error: any) {
    logger(error.message);
  }
}

export default function handleSaleCreatorsEvents() {
  listenForAllSaleCreatorEvents();
  getPastSaleCreatorsEvents();
}
