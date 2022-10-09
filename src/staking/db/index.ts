import _ from "lodash";
import { SyncOptions } from "sequelize";
import log from "../../shared/log";
import * as models from "./models";

type SyncOpts = {
  [key: string]: SyncOptions | undefined;
};

export default function syncAll(opts?: SyncOpts) {
  _.each(models, model => {
    if (!!model.sync) {
      model.sync(opts?.[model.tableName] || opts?.[model.name] || {}).then(() => {
        log("---------- Syncing table %s ----------", model.tableName);
      });
    }
  });
}
