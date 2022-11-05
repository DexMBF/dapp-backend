import { Interface } from "@ethersproject/abi";
import { hexValue } from "@ethersproject/bytes";
import { abi } from "vefi-token-launchpad-staking/artifacts/contracts/TokenSaleCreator.sol/TokenSaleCreator.json";
import assert from "assert";
import { publicTokenSales } from "../db/models";
import { rpcCall } from "../../shared/utils";
import logger from "../../shared/log";

const saleCreatorAbiInterface = new Interface(abi);