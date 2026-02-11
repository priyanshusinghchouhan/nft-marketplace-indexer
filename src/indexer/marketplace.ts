import { marketplaceContract } from "../config/contracts.js";
import { createListing, markListingSold, updateListingPrice, cancelListing } from "../services/listing.service.js";
import { logActivity } from "../services/activity.service.js";

export function startMarketplaceListener() {
  console.log("Listening to Marketplace events.....");

  marketplaceContract.on(
    "NFTListed",
    async (listingId, seller, nftContract, tokenId, price, event) => {
      try {
        await createListing({
          listingId: listingId.toString(),
          seller: seller.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          tokenId: tokenId.toString(),
          price: price.toString(),
        });

        await logActivity({
          type: "LISTED",
          wallet: seller.toLowerCase(),
          txHash: event.log.transactionHash,
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
        await markListingSold(listingId.toString());

        await logActivity({
          type: "SOLD",
          wallet: buyer.toLowerCase(),
          txHash: event.log.transactionHash,
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
        await cancelListing(listingId.toString());

        await logActivity({
          type: "CANCELLED",
          wallet: seller.toLowerCase(),
          txHash: event.log.transactionHash,
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
        await updateListingPrice(listingId.toString(), newPrice.toString());

        console.log("Indexed ListingPriceUpdated:", listingId.toString());
      } catch (e) {
        console.error("ListingPriceUpdated handler failed", e);
      }
    }
  );
}
