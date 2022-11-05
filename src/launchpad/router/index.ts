import express, { Router } from "express";
import _ from "lodash";
import assert from "assert";
import { privateTokenSales, publicTokenSales } from "../db/models";

const getAllPublicSaleItems = async (req: express.Request, res: express.Response) => {
  try {
    const { query, params } = _.pick(req, ["query", "params"]);
    const allItemsCount = await publicTokenSales.countAllPublicSaleItems({ where: { chainId: params.chainId } });
    const allItems = await publicTokenSales.getAllPublicSaleItems({
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      where: { chainId: params.chainId }
    });
    const result = {
      items: allItems,
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
    const allItems = await privateTokenSales.getAllPrivateSaleItems({
      limit: 20,
      offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0,
      where: { chainId: params.chainId }
    });
    const result = {
      items: allItems,
      totalItems: allItemsCount
    };
    return res.status(200).json({ result });
  } catch (error: any) {}
};

const router = Router();

router.get("/public_sales/:chainId", getAllPublicSaleItems);
router.get("/private_sales/:chainId", getAllPrivateSaleItems);

export default router;
