import { Interface } from "@ethersproject/abi";
import { pairs } from "../db/models";

const factoryAbiInterface = new Interface("");

// Factory event handlers
export const handlePairCreatedEvent = (url: string) => {
  return async (log: any) => {};
};
