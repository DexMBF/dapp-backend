import { Op } from "sequelize";
import express, { Router } from "express";
import _ from "lodash";
import { multisig } from "../db/models";

const fetchAllMultiSigWalletsForUser = async (req: express.Request, res: express.Response) => {
  try {
    const { params, query } = _.pick(req, ["params", "query"]);
    const length = await multisig.countMultisigWallets({ where: { chainId: params.chainId, signatories: { [Op.contains]: [params.signatory] } } });
    const items = _.map(
      await multisig.getAllMultisigWallets({
        where: { chainId: params.chainId, signatories: { [Op.contains]: [params.signatory] } },
        limit: 20,
        offset: query.page ? _.subtract(parseInt(query.page as string), 1) * 20 : 0
      }),
      item => item.id
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

const router = Router();

router.get("/wallets/:chainId/:signatory", fetchAllMultiSigWalletsForUser);

export default router;
