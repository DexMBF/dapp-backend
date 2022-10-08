import { Model, ModelAttributes, ModelOptions, Sequelize } from "sequelize";
import { dbURI } from "../environment";
import logger from "../log";

const sequelize = new Sequelize(dbURI as string, {
  dialect: "postgres",
  logging: (sql, timing) => logger("%s in %d", sql, timing),
  define: {
    underscored: true
  }
});

export default function buildModel(name: string, def: ModelAttributes<Model<any, any>, any>, opts?: ModelOptions<Model<any, any>>) {
  return sequelize.define(name, def, opts);
}
