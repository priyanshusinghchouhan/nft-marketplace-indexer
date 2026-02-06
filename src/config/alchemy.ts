import { JsonRpcProvider } from "ethers";

export const provider = new JsonRpcProvider(
    process.env.ALCHEMY_RPC
);