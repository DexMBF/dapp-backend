import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { abi as pairAbi } from "quasar-v1-core/artifacts/contracts/QuasarPair.sol/QuasarPair.json";
import { propagateLastBlockNumberForFactory, propagateLastBlockNumberForPairs, propagateSwapEventData, propagateSyncEventData } from "../../cache";
import { buildProvider } from "../../utils";
import logger from "../../../shared/log";

const pairAbiInterface = new Interface(pairAbi);

// Events hashes
const syncHash = hashId("Sync(uint112,uint112)");
const swapHash = hashId("Swap(address,uint256,uint256,uint256,uint256,address)");

const handleSyncEvent = (pair: string, chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = pairAbiInterface.parseLog(log);
      const [reserve0, reserve1] = args;
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
      await propagateLastBlockNumberForFactory(hexValue(log.blockNumber), chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

export const watchPair = (url: string, pair: string, chainId: string) => {
  try {
    const provider = buildProvider(url);

    provider.on({ address: pair, topics: [syncHash] }, handleSyncEvent(pair, chainId));
    provider.on({ address: pair, topics: [swapHash] }, handleSwapEvent(pair, chainId));
  } catch (error: any) {
    logger(error.message);
  }
};
