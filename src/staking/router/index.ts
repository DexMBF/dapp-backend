import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import fs from "fs";
import path from "path";
import { Interface } from "@ethersproject/abi";
import { hexStripZeros } from "@ethersproject/bytes";
import { abi as stakingPoolAbi } from "vefi-token-launchpad-staking/artifacts/contracts/StakingPool.sol/StakingPool.json";
import { abi as erc20Abi } from "vefi-token-launchpad-staking/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import chains from "../../shared/supportedChains.json";
import { env } from "../../shared/environment";
import { stakingPools } from "../db/models";
import { rpcCall } from "../../shared/utils";
import { getAllStakeEvents } from "../cache";

// Chain
const chain = chains[env === "production" ? "mainnet" : "testnet"] as any;

// ABIs
const stakingPoolAbiInterface = new Interface(stakingPoolAbi);
const erc20AbiInterface = new Interface(erc20Abi);

const fetchAllStakingPools = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    let result = await stakingPools.getAllStakingPools({
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      where: { chainId: params.chainId }
    });

    result = await Promise.all(
      _.map(result, async model => {
        const symbolHash = erc20AbiInterface.getSighash("symbol()");
        let tokenASymbolCall = await rpcCall(parseInt(params.chainId), {
          method: "eth_call",
          params: [{ to: model.tokenA, data: symbolHash }, "latest"]
        });
        let tokenBSymbolCall = await rpcCall(parseInt(params.chainId), {
          method: "eth_call",
          params: [{ to: model.tokenB, data: symbolHash }, "latest"]
        });
        [tokenASymbolCall] = erc20AbiInterface.decodeFunctionResult("symbol()", tokenASymbolCall);
        [tokenBSymbolCall] = erc20AbiInterface.decodeFunctionResult("symbol()", tokenBSymbolCall);
        return {
          ...model,
          tokenASymbol: tokenASymbolCall,
          tokenBSymbol: tokenBSymbolCall
        };
      })
    );

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchAllStakingPoolsByOwner = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    let result = await stakingPools.getAllStakingPools({
      where: { chainId: params.chainId, owner: params.owner },
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0
    });

    result = await Promise.all(
      _.map(result, async model => {
        const symbolHash = erc20AbiInterface.getSighash("symbol()");
        let tokenASymbolCall = await rpcCall(parseInt(params.chainId), {
          method: "eth_call",
          params: [{ to: model.tokenA, data: symbolHash }, "latest"]
        });
        let tokenBSymbolCall = await rpcCall(parseInt(params.chainId), {
          method: "eth_call",
          params: [{ to: model.tokenB, data: symbolHash }, "latest"]
        });
        [tokenASymbolCall] = erc20AbiInterface.decodeFunctionResult("symbol()", tokenASymbolCall);
        [tokenBSymbolCall] = erc20AbiInterface.decodeFunctionResult("symbol()", tokenBSymbolCall);
        return {
          ...model,
          tokenASymbol: tokenASymbolCall,
          tokenBSymbol: tokenBSymbolCall
        };
      })
    );

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchAllUsersStakes = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    let result = await getAllStakeEvents();

    if (query.page) {
      assert(parseInt(query.page as string) > 0, "pagination must begin at 1");
    }

    result = _.filter(result, ev => ev.staker.toLowerCase() === params.staker.toLowerCase() && ev.chainId === params.chainId).slice(
      query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      query.page ? parseInt(query.page as string) * 20 : 20
    );
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/pools/:chainId", fetchAllStakingPools);
router.get("/pools/:chainId/:owner", fetchAllStakingPoolsByOwner);
router.get("/stakes/:chainId/:staker", fetchAllUsersStakes);

export default router;
