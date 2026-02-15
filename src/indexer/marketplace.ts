import { marketplaceContract } from "../config/contracts.js";
import { createListing, markListingSold, updateListingPrice, cancelListing } from "../services/listing.service.js";
import { logActivity } from "../services/activity.service.js";

export function startMarketplaceListener() {
  console.log("Listening to Marketplace events.....");

  marketplaceContract.on(
    "NFTListed",
    async (listingId, seller, nftContract, tokenId, price, event) => {
      try {
        const { blockNumber, index: logIndex, transactionHash: txHash } = event.log;
        await createListing({
          listingId: listingId.toString(),
          seller: seller.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          tokenId: tokenId.toString(),
          price: price.toString(),
          blockNumber,
          logIndex,
          txHash,
        });

        await logActivity({
          type: "LISTED",
          wallet: seller.toLowerCase(),
          txHash,
        });

        console.log("Indexed NFTListed:", listingId.toString());
      } catch (e) {
        console.error("NFTListed handler failed", e);
      }
    }
  );

  marketplaceContract.on(
    "NFTSold",
    async (listingId, buyer, seller, price, event) => {
      try {
        const { blockNumber, index: logIndex, transactionHash: txHash } = event.log;
        await markListingSold(listingId.toString(), blockNumber, logIndex, txHash);

        await logActivity({
          type: "SOLD",
          wallet: buyer.toLowerCase(),
          txHash,
        });

        console.log("Indexed NFTSold:", listingId.toString());
      } catch (e) {
        console.error("NFTSold handler failed", e);
      }
    }
  );

  marketplaceContract.on(
    "ListingCancelled",
    async (listingId, seller, event) => {
      try {
        const { blockNumber, index: logIndex, transactionHash: txHash } = event.log;
        await cancelListing(listingId.toString(), blockNumber, logIndex, txHash);

        await logActivity({
          type: "CANCELLED",
          wallet: seller.toLowerCase(),
          txHash,
        });

        console.log("Indexed ListingCancelled:", listingId.toString());
      } catch (e) {
        console.error("ListingCancelled handler failed", e);
      }
    }
  );

  marketplaceContract.on(
    "ListingPriceUpdated",
    async (listingId, newPrice, event) => {
      try {
        const { blockNumber, index: logIndex, transactionHash: txHash } = event.log;
        await updateListingPrice(listingId.toString(), newPrice.toString(), blockNumber, logIndex, txHash);

        console.log("Indexed ListingPriceUpdated:", listingId.toString());
      } catch (e) {
        console.error("ListingPriceUpdated handler failed", e);
      }
    }
  );
}
