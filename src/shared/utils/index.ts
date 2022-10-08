import axios from "axios";
import { JsonRpcProvider } from "@ethersproject/providers";
import _ from "lodash";
import chainInfo from "../supportedChains.json";
import { env } from "../environment";

type RpcRequestBody = {
  method: string;
  params: Array<any>;
};

const chain = chainInfo[env === "production" ? "mainnet" : "testnet"] as any;

export const buildProvider: (url: string) => JsonRpcProvider = _.ary((url: string) => {
  const chainId = _.keys(chain).find(k => chain[k].rpcUrl === url);
  return new JsonRpcProvider(url, parseInt(chainId!));
}, 1);

export const rpcCall: (c: keyof typeof chain, body: RpcRequestBody) => Promise<any> = _.ary((c: keyof typeof chain, body: RpcRequestBody) => {
  return new Promise<any>((resolve, reject) => {
    axios
      .post((chain[c] as any).rpcUrl, { id: Math.floor(Math.random() * 4), jsonrpc: "2.0", ...body })
      .then(({ data }) => {
        if (data.result) resolve(data.result);
        else reject(data.error);
      })
      .catch(reject);
  });
}, 2);
