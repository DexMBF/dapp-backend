import { Model, ModelAttributes, ModelOptions, Sequelize } from "sequelize";

const sequelize = new Sequelize();

export default function buildModel(name: string, def: ModelAttributes<Model<any, any>, any>, opts?: ModelOptions<Model<any, any>>) {
  return sequelize.define(name, def, opts);
}
