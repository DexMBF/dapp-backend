import { DataTypes, FindOptions } from "sequelize";
import _ from "lodash";
import buildModel from "../../../shared/db";

export type PairModel = {
  id: string;
  token0: string;
  token1: string;
  chainId: string;
  createdAt?: any;
  updatedAt?: any;
};

const model = buildModel("Pair", {
  id: { type: DataTypes.STRING, primaryKey: true },
  token0: { type: DataTypes.STRING, allowNull: false },
  token1: { type: DataTypes.STRING, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

function addPair(id: string, token0: string, token1: string, chainId: string) {
  try {
    return new Promise<PairModel>((resolve, reject) => {
      model
        .create({ id, token0, token1, chainId })
        .then(m => resolve(m.toJSON()))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getAllPairs(opts?: FindOptions) {
  try {
    return new Promise<Array<PairModel>>((resolve, reject) => {
      model
        .findAll(opts)
        .then(ms => resolve(ms.map(m => m.toJSON())))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getPair(pk: string) {
  try {
    return new Promise<PairModel | null>((resolve, reject) => {
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
  addPair,
  getAllPairs,
  getPair
});
