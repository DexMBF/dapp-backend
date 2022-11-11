import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import { privateTokenSales, publicTokenSales } from "../db/models";
import rank from "../assets/rank.json";
import details from "../assets/details.json";
import { id } from "@ethersproject/hash";

const getAllPublicSaleItems = async (req: express.Request, res: express.Response) => {
  try {
    const { query, params } = _.pick(req, ["query", "params"]);
    const allItemsCount = await publicTokenSales.countAllPublicSaleItems({ where: { chainId: params.chainId } });
    const r = rank[parseInt(params.chainId) as unknown as keyof typeof rank];
    const d = details[parseInt(params.chainId) as unknown as keyof typeof details];
    const allItems = await publicTokenSales.getAllPublicSaleItems({
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      where: { chainId: params.chainId }
    });
    const result = {
      items: allItems.map(i => ({
        ...i,
        rank: r ? (r.gold.includes(i.id) ? "gold" : r.silver.includes(i.id) ? "silver" : r.bronze.includes(i.id) ? "bronze" : "unknown") : "unknown",
        details: d ? d[i.id as keyof typeof d] : null
      })),
      totalItems: allItemsCount
    };
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllPrivateSaleItems = async (req: express.Request, res: express.Response) => {
  try {
    const { query, params } = _.pick(req, ["query", "params"]);
    const allItemsCount = await privateTokenSales.countAllPrivateSaleItems({ where: { chainId: params.chainId } });
    const r = rank[parseInt(params.chainId) as unknown as keyof typeof rank];
    const d = details[parseInt(params.chainId) as unknown as keyof typeof details];
    const allItems = await privateTokenSales.getAllPrivateSaleItems({
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      where: { chainId: params.chainId }
    });
    const result = {
      items: allItems.map(i => ({
        ...i,
        rank: r ? (r.gold.includes(i.id) ? "gold" : r.silver.includes(i.id) ? "silver" : r.bronze.includes(i.id) ? "bronze" : "unknown") : "unknown",
        details: d ? d[i.id as keyof typeof d] : null
      })),
      totalItems: allItemsCount
    };
    return res.status(200).json({ result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const router = Router();

router.get("/public_sales/:chainId", getAllPublicSaleItems);
router.get("/private_sales/:chainId", getAllPrivateSaleItems);

export default router;
