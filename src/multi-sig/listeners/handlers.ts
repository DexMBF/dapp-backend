import assert from "assert";
import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi as actionsAbi } from "vefi-multi-sig/artifacts/contracts/MultiSigActions.sol/MultiSigActions.json";
import { getLastBlockNumberForMultiSigAction, propagateLastBlockNumberForMultiSigAction } from "../cache";
import { multisig } from "../db/models";
import actions from "../assets/__actions__.json";
import logger from "../../shared/log";
import { rpcCall } from "../../shared/utils";

const multisigActionsAbiInterface = new Interface(actionsAbi);

export const handleMultiSigDeployedEvent = (chainId: string) => {
  return async (log: any) => {
    const { args } = multisigActionsAbiInterface.parseLog(log);
    const [wallet, signatories, requiredConfirmations] = args;
    logger("----- New multisig wallet created %s -----", wallet);
    await multisig.addMultiSigWallet(wallet, signatories, requiredConfirmations, chainId);
    propagateLastBlockNumberForMultiSigAction(log.blockNumber, chainId);
  };
};

export const getPastLogsForMultiSigAction = async (action: string, chainId: string) => {
  try {
    assert.equal(action, actions[parseInt(chainId) as unknown as keyof typeof actions], "actions do not match");
    logger("----- Retrieving last propagated block for multi-sig actions %s -----", action);
    let lastPropagatedBlockForAction = await getLastBlockNumberForMultiSigAction(chainId);
    const blockNumber = await rpcCall(parseInt(chainId), { method: "eth_blockNumber", params: [] });
    logger("----- Last propagated block for multi-sig actions %s is %d -----", action, lastPropagatedBlockForAction);

    if (lastPropagatedBlockForAction === 0) {
      lastPropagatedBlockForAction = parseInt(blockNumber);
      await propagateLastBlockNumberForMultiSigAction(blockNumber, chainId);
    }

    const logs = await rpcCall(parseInt(chainId), {
      method: "eth_getLogs",
      params: [{ fromBlock: hexValue(lastPropagatedBlockForAction + 1), toBlock: blockNumber, address: action, topics: [] }]
    });

    logger("----- Iterating logs for multi-sig actions %s -----", action);
    for (const log of logs) {
      {
        const { args, name } = multisigActionsAbiInterface.parseLog(log);

        switch (name) {
          case "MultiSigDeployed": {
            const [wallet, signatories, requiredConfirmations] = args;
            logger("----- New multisig wallet created %s -----", wallet);
            await multisig.addMultiSigWallet(wallet, signatories, requiredConfirmations, chainId);
            propagateLastBlockNumberForMultiSigAction(log.blockNumber, chainId);
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
