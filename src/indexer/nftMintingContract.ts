import { nftMintingContract } from "../config/contracts.js";

export function startNFTTransferListener() {
  console.log("Listening to ERC721 events...");

  // Transfer 
  nftMintingContract.on(
    "Transfer",
    async (from, to, tokenId, event) => {
      const isMint =
        from === "0x0000000000000000000000000000000000000000";

      console.log("Transfer", {
        from,
        to,
        tokenId: tokenId.toString(),
        isMint,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      });
    }
  );

  // NFTMinted
  nftMintingContract.on(
    "NFTMinted",
    async (minter, tokenId, event) => {
      console.log("NFTMinted", {
        minter,
        tokenId: tokenId.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      });
    }
  );
}
