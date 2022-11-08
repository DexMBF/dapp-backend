import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import { stakingPools } from "../db/models";
import specialStakingPools from "../assets/__special__staking__pools.json";
import { getAllStakeEventsByChainId } from "../cache";

const fetchAllStakingPools = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const length = await stakingPools.countAllStakingPools({ where: { chainId: params.chainId } });
    const items = _.map(
      await stakingPools.getAllStakingPools({
        limit: 20,
        offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
        where: { chainId: params.chainId }
      }),
      pool => pool.id
    );

    const result = {
      totalItems: length,
      items
    };
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchAllSpecialStakingPools = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const pools = specialStakingPools[parseInt(params.chainId) as unknown as keyof typeof specialStakingPools];
    const p = !!pools ? pools : [];
    const result = {
      totalItems: p.length,
      items: p.slice(query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0, query.page ? parseInt(query.page as string) * 20 : 20)
    };
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchAllStakingPoolsByOwner = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const length = await stakingPools.countAllStakingPools({ where: { chainId: params.chainId, owner: params.owner } });
    const items = _.map(
      await stakingPools.getAllStakingPools({
        where: { chainId: params.chainId, owner: params.owner },
        limit: 20,
        offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0
      }),
      pool => pool.id
    );

    const result = {
      totalItems: length,
      items
    };

    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const fetchAllUsersStakes = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    let result: any = await getAllStakeEventsByChainId(params.chainId);

    if (query.page) {
      assert(parseInt(query.page as string) > 0, "pagination must begin at 1");
    }

    result = _.filter(result, ev => ev.staker.toLowerCase() === params.staker.toLowerCase());

    const length = result.length;
    result = {
      totalItems: length,
      items: result.slice(query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0, query.page ? parseInt(query.page as string) * 20 : 20)
    };
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/pools/:chainId", fetchAllStakingPools);
router.get("/pools/:chainId/:owner", fetchAllStakingPoolsByOwner);
router.get("/stakes/:chainId/:staker", fetchAllUsersStakes);
router.get("/special/:chainId", fetchAllSpecialStakingPools);

export default router;
