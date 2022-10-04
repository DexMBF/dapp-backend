import axios from "axios";
import { JsonRpcProvider } from "@ethersproject/providers";
import _ from "lodash";
import xInfo from "../assets/__chains__routers__factories.json";

type RpcRequestBody = {
  method: string;
  params: Array<any>;
};

export const buildProvider: (url: string) => JsonRpcProvider = _.ary((url: string) => {
  const chainId = _.keys(xInfo).find(key => xInfo[key as keyof typeof xInfo].url === url);
  return new JsonRpcProvider(url, parseInt(chainId!));
}, 1);

export const rpcCall: (chain: keyof typeof xInfo, body: RpcRequestBody) => Promise<any> = _.ary((chain: keyof typeof xInfo, body: RpcRequestBody) => {
  return new Promise<any>((resolve, reject) => {
    axios
      .post(xInfo[chain].url, { id: Math.floor(Math.random() * 4), jsonrpc: "2.0", ...body })
      .then(({ data }) => {
        if (data.result) resolve(data.result);
        else reject(data.error);
      })
      .catch(reject);
  });
}, 2);
