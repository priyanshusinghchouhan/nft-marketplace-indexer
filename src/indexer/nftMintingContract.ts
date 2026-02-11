import { NFT_ADDRESS, nftMintingContract } from "../config/contracts.js";
import { logActivity } from "../services/activity.service.js";
import { upsertNFT } from "../services/nft.service.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function startNFTTransferListener() {
  console.log("Listening to ERC721 events...");

  // Transfer
  nftMintingContract.on(
    "Transfer",
    async (from, to, tokenId, event) => {
      const tokenIdStr = tokenId.toString();
      if (to.toLowerCase() === ZERO_ADDRESS) return;

      let tokenURI: string | undefined = undefined;
      if (from === ZERO_ADDRESS) {
        try {
          tokenURI = await nftMintingContract.tokenURI(tokenId);
        } catch {
          tokenURI = undefined;
        }
      }

      if (from === ZERO_ADDRESS) {
        await logActivity({
          type: "MINTED",
          wallet: to,
          txHash: event.log.transactionHash,
        });
      } else {
        await logActivity({
          type: "TRANSFER",
          wallet: to,
          txHash: event.log.transactionHash,
        });
      }

      await upsertNFT({
        contractAddress: NFT_ADDRESS.toLowerCase(),
        owner: to.toLowerCase(),
        tokenId: tokenIdStr,
        tokenURI,
      });

      console.log("Indexed NFT", {
        tokenId: tokenIdStr,
        owner: to,
        isMint: from === ZERO_ADDRESS,
        txHash: event.log.transactionHash,
      });
    },
  );
}
