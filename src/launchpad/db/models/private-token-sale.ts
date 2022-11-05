import { DataTypes, FindOptions } from "sequelize";
import _ from "lodash";
import buildModel from "../../../shared/db";

export type PrivateTokenSaleItemModel = {
  id: string;
  token: string;
  tokensForSale: string;
  hardCap: string;
  softCap: string;
  presaleRate: string;
  minContribution: string;
  maxContribution: string;
  startTime: string;
  daysToLast: number;
  proceedsTo: string;
  endTime: string;
  admin: string;
  chainId: string;
  createdAt?: any;
  updatedAt?: any;
};

const model = buildModel("PrivateTokenSale", {
  id: { type: DataTypes.STRING, primaryKey: true },
  token: { type: DataTypes.STRING, allowNull: false },
  tokensForSale: { type: DataTypes.BIGINT, allowNull: false },
  hardCap: { type: DataTypes.BIGINT, allowNull: false },
  softCap: { type: DataTypes.BIGINT, allowNull: false },
  presaleRate: { type: DataTypes.BIGINT, allowNull: false },
  minContribution: { type: DataTypes.BIGINT, allowNull: false },
  maxContribution: { type: DataTypes.BIGINT, allowNull: false },
  startTime: { type: DataTypes.BIGINT, allowNull: false },
  daysToLast: { type: DataTypes.INTEGER, allowNull: false },
  proceedsTo: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.BIGINT, allowNull: false },
  admin: { type: DataTypes.BIGINT, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

function addPrivateTokenSaleItem(
  id: string,
  token: string,
  tokensForSale: string,
  chainId: string,
  hardCap: string,
  softCap: string,
  presaleRate: string,
  minContribution: string,
  maxContribution: string,
  startTime: string,
  daysToLast: number,
  proceedsTo: string,
  endTime: string,
  admin: string
) {
  try {
    return new Promise<PrivateTokenSaleItemModel>((resolve, reject) => {
      model
        .create({
          id,
          token,
          tokensForSale,
          chainId,
          hardCap,
          softCap,
          presaleRate,
          minContribution,
          maxContribution,
          startTime,
          daysToLast,
          proceedsTo,
          endTime,
          admin
        })
        .then(m => resolve(m.toJSON()))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getAllPrivateSaleItems(opts?: FindOptions) {
  try {
    return new Promise<Array<PrivateTokenSaleItemModel>>((resolve, reject) => {
      model
        .findAll(opts)
        .then(ms => resolve(ms.map(m => m.toJSON())))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getPrivateSaleItem(pk: string) {
  try {
    return new Promise<PrivateTokenSaleItemModel | null>((resolve, reject) => {
      model
        .findByPk(pk)
        .then(m => resolve(m?.toJSON() || null))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export default _.merge(model, {
  addPrivateTokenSaleItem,
  getAllPrivateSaleItems,
  getPrivateSaleItem
});
