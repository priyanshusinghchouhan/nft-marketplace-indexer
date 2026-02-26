import { WebSocketProvider } from "ethers";

export const provider = new WebSocketProvider(
    process.env.ALCHEMY_RPC!
);