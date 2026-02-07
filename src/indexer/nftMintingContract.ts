import { NFT_ADDRESS, nftMintingContract } from "../config/contracts.js";
import { upsertNFT } from "../services/nft.service.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function startNFTTransferListener() {
  console.log("Listening to ERC721 events...");

  // Transfer 
  nftMintingContract.on(
    "Transfer",
    async (from, to, tokenId, event) => {
      const tokenIdStr = tokenId.toString();
      if(to === ZERO_ADDRESS) return;

      let tokenURI: string | undefined = undefined;
      if(from === ZERO_ADDRESS) {
        try{
          tokenURI = await nftMintingContract.tokenURI(tokenId);
        } catch {
          tokenURI = undefined;
        }
      }

      await upsertNFT({
        contractAddress: NFT_ADDRESS.toLowerCase(),
        owner: to.toLowerCase(),
        tokenId: tokenIdStr,
        tokenURI
      });

      console.log("Indexed NFT", {
        tokenId: tokenIdStr,
        owner: to,
        isMint: from === ZERO_ADDRESS,
        txHash: event.transactionHash,
      });
    }
  );
}
