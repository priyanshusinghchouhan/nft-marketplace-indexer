import { Contract } from "ethers";
import { provider } from "./alchemy.js";

import { NFTMarketplaceABI, NFT_CONTRACT_ABI } from "../abis/abi.js";

export const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as string;
export const NFT_ADDRESS = process.env.NFT_ADDRESS as string;

export const marketplaceContract = new Contract(
    MARKETPLACE_ADDRESS,
    NFTMarketplaceABI,
    provider
)

export const nftMintingContract = new Contract(
    NFT_ADDRESS,
    NFT_CONTRACT_ABI,
    provider
)