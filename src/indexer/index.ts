import { provider } from "../config/alchemy.js";
import {
  getLastIndexedBlockForListings,
  getLastIndexedBlockForNFTs,
  MARKETPLACE_DEFAULT_START_BLOCK,
  NFT_DEFAULT_START_BLOCK,
} from "../services/indexer-state.service.js";
import { backfillMarketplaceFromBlock } from "./marketplace-backfill.js";
import { backFillERC721TransfersFromBlock } from "./nft-contract-backfill.js";
import { startMarketplaceListener } from "./marketplace.js";
import { startNFTTransferListener } from "./nftMintingContract.js";

const MAX_GAP_BLOCKS = 2000;

async function runGapFill() {
  const latestBlock = await provider.getBlockNumber();

  const lastListingBlock = await getLastIndexedBlockForListings();
  const fromListing = (lastListingBlock ?? MARKETPLACE_DEFAULT_START_BLOCK) + 1;
  if (fromListing <= latestBlock) {
    const toListing = Math.min(latestBlock, fromListing + MAX_GAP_BLOCKS - 1);
    await backfillMarketplaceFromBlock(fromListing, toListing);
  }

  const lastNFTBlock = await getLastIndexedBlockForNFTs();
  const fromNFT = (lastNFTBlock ?? NFT_DEFAULT_START_BLOCK) + 1;
  if (fromNFT <= latestBlock) {
    const toNFT = Math.min(latestBlock, fromNFT + MAX_GAP_BLOCKS - 1);
    await backFillERC721TransfersFromBlock(fromNFT, toNFT);
  }
}

export async function startIndexer() {
  console.log("Starting Indexer....");

  await runGapFill();

  startMarketplaceListener();
  startNFTTransferListener();

  console.log("Indexer started");
}