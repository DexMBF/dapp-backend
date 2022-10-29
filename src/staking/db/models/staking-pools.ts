import { CountOptions, DataTypes, FindOptions } from "sequelize";
import _ from "lodash";
import buildModel from "../../../shared/db";

export type StakingPoolModel = {
  id: string;
  tokenA: string;
  tokenB: string;
  tokenAAPY: number;
  tokenBAPY: number;
  chainId: string;
  tax: number;
  owner: string;
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
  tax: { type: DataTypes.INTEGER, allowNull: false },
  owner: { type: DataTypes.STRING, allowNull: false }
});

function addStakingPool(
  id: string,
  tokenA: string,
  tokenB: string,
  tokenAAPY: number,
  tokenBAPY: number,
  tax: number,
  owner: string,
  chainId: string
) {
  try {
    return new Promise<StakingPoolModel>((resolve, reject) => {
      model
        .create({ id, tokenA, tokenB, chainId, tokenAAPY, tokenBAPY, tax, owner })
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

function countAllStakingPools(opts?: Omit<CountOptions<any>, "group">) {
  try {
    return new Promise<number>((resolve, reject) => {
      model.count(opts).then(resolve).catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function updateStakingPoolById(id: string, update: any) {
  return new Promise<StakingPoolModel>((resolve, reject) => {
    model
      .update(update, { where: { id }, returning: true })
      .then(([, rows]) => rows.map(model => model.toJSON()))
      .then(rows => resolve(rows[0]))
      .catch(reject);
  });
}

export default _.merge(model, {
  addStakingPool,
  getAllStakingPools,
  getStakingPool,
  updateStakingPoolById,
  countAllStakingPools
});
