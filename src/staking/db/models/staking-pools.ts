import { DataTypes, FindOptions } from "sequelize";
import _ from "lodash";
import buildModel from "../../../shared/db";

export type StakingPoolModel = {
  id: string;
  tokenA: string;
  tokenB: string;
  tokenAAPY: number;
  tokenBAPY: number;
  chainId: string;
  createdAt?: any;
  updatedAt?: any;
};

const model = buildModel("StakingPool", {
  id: { type: DataTypes.STRING, primaryKey: true },
  tokenA: { type: DataTypes.STRING, allowNull: false },
  tokenB: { type: DataTypes.STRING, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false },
  tokenAAPY: { type: DataTypes.INTEGER, allowNull: false },
  tokenBAPY: { type: DataTypes.INTEGER, allowNull: false },
  tax: { type: DataTypes.INTEGER, allowNull: false }
});

function addStakingPool(id: string, tokenA: string, tokenB: string, tokenAAPY: number, tokenBAPY: number, tax: number, chainId: string) {
  try {
    return new Promise<StakingPoolModel>((resolve, reject) => {
      model
        .create({ id, tokenA, tokenB, chainId, tokenAAPY, tokenBAPY, tax })
        .then(m => resolve(m.toJSON()))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getAllStakingPools(opts?: FindOptions) {
  try {
    return new Promise<Array<StakingPoolModel>>((resolve, reject) => {
      model
        .findAll(opts)
        .then(ms => resolve(ms.map(m => m.toJSON())))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getStakingPool(pk: string) {
  try {
    return new Promise<StakingPoolModel | null>((resolve, reject) => {
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
  addStakingPool,
  getAllStakingPools,
  getStakingPool
});
