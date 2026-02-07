import { startMarketplaceListener } from "./marketplace.js";
import { startNFTTransferListener } from "./nftMintingContract.js";

export async function startIndexer() {
    console.log("Starting Indexer....");

    startMarketplaceListener();
    startNFTTransferListener();

    console.log("Indexer started");
}