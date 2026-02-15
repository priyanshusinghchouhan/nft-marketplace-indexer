import { prisma } from "../db/index.js";

const MARKETPLACE_DEFAULT_START_BLOCK = 10160002;
const NFT_DEFAULT_START_BLOCK = 10141793;

export async function getLastIndexedBlockForListings(): Promise<number | null> {
  const result = await prisma.listing.aggregate({
    _max: { lastUpdatedBlock: true },
  });
  return result._max.lastUpdatedBlock ?? null;
}

export async function getLastIndexedBlockForNFTs(): Promise<number | null> {
  const result = await prisma.nFT.aggregate({
    _max: { lastUpdatedBlock: true },
  });
  return result._max.lastUpdatedBlock ?? null;
}

export { MARKETPLACE_DEFAULT_START_BLOCK, NFT_DEFAULT_START_BLOCK };
