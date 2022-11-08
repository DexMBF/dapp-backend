import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi } from "vefi-token-launchpad-staking/artifacts/contracts/TokenSaleCreator.sol/TokenSaleCreator.json";
import assert from "assert";
import _ from "lodash";
import { publicTokenSales } from "../../db/models";
import { rpcCall } from "../../../shared/utils";
import logger from "../../../shared/log";
import { getLastBlockNumberForPublicSaleCreator, propagateLastBlockNumberForPublicSaleCreator } from "../../cache";
import saleCreators from "../../assets/_sale_item_creators.json";

const saleCreatorAbiInterface = new Interface(abi);

export const handleTokenSaleItemCreatedEvent = (chainId: string) => {
  return async (log: any) => {
    try {
      const { args } = saleCreatorAbiInterface.parseLog(log);
      const [
        saleId,
        token,
        tokensForSale,
        hardCap,
        softCap,
        presaleRate,
        minContributionEther,
        maxContributionEther,
        startTime,
        endTime,
        proceedsTo,
        admin
      ] = args;

      logger("----- Creating public sale item: %s -----", saleId);

      await publicTokenSales.addPublicTokenSaleItem(
        saleId,
        token,
        parseInt(tokensForSale.toString()),
        chainId,
        parseInt(hardCap.toString()),
        parseInt(softCap.toString()),
        parseInt(presaleRate.toString()),
        parseInt(minContributionEther.toString()),
        parseInt(maxContributionEther.toString()),
        _.multiply(parseInt(startTime.toString()), 1000),
        proceedsTo,
        _.multiply(parseInt(endTime.toString()), 1000),
        admin
      );
      await propagateLastBlockNumberForPublicSaleCreator(log.blockNumber, chainId);
    } catch (error: any) {
      logger(error.message);
    }
  };
};

export const getPastLogsForPublicSaleCreator = async (saleCreator: string, chainId: string) => {
  try {
    assert.equal(
      saleCreator,
      saleCreators[parseInt(chainId) as unknown as keyof typeof saleCreators].publicTokenSaleCreator,
      "sale creator addresses do not match"
    );
    logger("----- Retrieving last propagated block for sale creator %s -----", saleCreator);
    let lastPropagatedBlockForSaleCreator = await getLastBlockNumberForPublicSaleCreator(chainId);
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });
    logger("----- Last propagated block for sale creator %s is %d -----", saleCreator, lastPropagatedBlockForSaleCreator);

    if (lastPropagatedBlockForSaleCreator === 0) {
      lastPropagatedBlockForSaleCreator = parseInt(blockNumber);
      await propagateLastBlockNumberForPublicSaleCreator(blockNumber, chainId);
    }

    const logs = await rpcCall(parseInt(chainId), {
      method: "eth_getLogs",
      params: [{ fromBlock: hexValue(lastPropagatedBlockForSaleCreator + 1), toBlock: blockNumber, address: saleCreator, topics: [] }]
    });

    logger("----- Iterating logs for sale creator %s -----", saleCreator);
    for (const log of logs) {
      {
        const { args, name } = saleCreatorAbiInterface.parseLog(log);

        switch (name) {
          case "TokenSaleItemCreated": {
            const [
              saleId,
              token,
              tokensForSale,
              hardCap,
              softCap,
              presaleRate,
              minContributionEther,
              maxContributionEther,
              startTime,
              endTime,
              proceedsTo,
              admin
            ] = args;

            logger("----- Creating public sale item: %s -----", saleId);

            await publicTokenSales.addPublicTokenSaleItem(
              saleId,
              token,
              parseInt(tokensForSale.toString()),
              chainId,
              parseInt(hardCap.toString()),
              parseInt(softCap.toString()),
              parseInt(presaleRate.toString()),
              parseInt(minContributionEther.toString()),
              parseInt(maxContributionEther.toString()),
              _.multiply(parseInt(startTime.toString()), 1000),
              proceedsTo,
              _.multiply(parseInt(endTime.toString()), 1000),
              admin
            );
            await propagateLastBlockNumberForPublicSaleCreator(log.blockNumber, chainId);
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  } catch (error: any) {
    logger(error.message);
  }
};
