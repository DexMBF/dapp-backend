import { DataTypes, FindOptions } from "sequelize";
import _ from "lodash";
import buildModel from "../../../shared/db";

export type MultiSignatureWalletModel = {
  id: string;
  signatories: Array<string>;
  requiredConfirmations: number;
  chainId: string;
};

const model = buildModel("MultiSignatureWallet", {
  id: { type: DataTypes.STRING, primaryKey: true },
  signatories: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
  requiredConfirmations: { type: DataTypes.INTEGER, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

function addMultiSigWallet(id: string, signatories: Array<string>, requiredConfirmations: number, chainId: string) {
  try {
    return new Promise<MultiSignatureWalletModel>((resolve, reject) => {
      model
        .create({ id, signatories, requiredConfirmations, chainId })
        .then(m => resolve(m.toJSON()))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getAllMultisigWallets(opts?: FindOptions) {
  try {
    return new Promise<Array<MultiSignatureWalletModel>>((resolve, reject) => {
      model
        .findAll(opts)
        .then(ms => resolve(ms.map(m => m.toJSON())))
        .catch(reject);
    });
  } catch (error: any) {
    return Promise.reject(error);
  }
}

function getMultisigWallet(pk: string) {
  try {
    return new Promise<MultiSignatureWalletModel | null>((resolve, reject) => {
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
  addMultiSigWallet,
  getAllMultisigWallets,
  getMultisigWallet
});
