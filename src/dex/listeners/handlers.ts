import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi } from "quasar-v1-core/artifacts/contracts/QuasarFactory.sol/QuasarFactory.json";
import { propagateLastBlockNumberForFactory } from "../cache";
import { PairModel, pairs } from "../db/models";
import { watchPair } from "./helpers/pairs";

const factoryAbiInterface = new Interface(abi);

function pushPairToDB(pair: string, token0: string, token1: string, chainId: string) {
  return new Promise<PairModel>((resolve, reject) => {
    pairs.addPair(pair, token0, token1, chainId).then(resolve).catch(reject);
  });
}

// Factory event handlers
export const handlePairCreatedEvent = (url: string, chainId: string) => {
  return async (log: any) => {
    const { args } = factoryAbiInterface.parseLog(log);
    const [token0, token1, pair] = args;

    await pushPairToDB(pair, token0, token1, chainId);
    await propagateLastBlockNumberForFactory(hexValue(log.blockNumber), chainId);
    watchPair(url, pair, chainId);
  };
};
