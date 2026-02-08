import { marketplaceContract } from "../config/contracts.js";
import { createListing, markListingSold, updateListingPrice, cancelListing } from "../services/listing.service.js";
import { logActivity } from "../services/activity.service.js";

export function startMarketplaceListener() {
    console.log("Listening to Marketplace events.....");

    // "NFTListed"
    marketplaceContract.on(
        "NFTListed",
        async(listingId, seller, nftContract, tokenId, price, event) => {
            await createListing({
                listingId: listingId.toString(),
                seller,
                nftContract,
                tokenId: tokenId.toString(),
                price: price.toString(),
            });

            await logActivity({
                type: "LISTED",
                wallet: seller,
                txHash: event.transactionHash,
            })

            console.log("Indexed NFTListed: ", listingId.toString());
        }
    );


    // "NFTSold"
    marketplaceContract.on(
        "NFTSold",
        async(listingId, buyer, seller, price, event) => {
            await markListingSold(listingId.toString());
            console.log("Indexed NFTSold: ", listingId.toString());

            await logActivity({
                type: "SOLD",
                wallet: buyer,
                txHash: event.transactionHash
            })
        }
    );


    // "ListingCancelled"
    marketplaceContract.on(
        "ListingCancelled",
        async(listingId, seller, event) => {
            await cancelListing(listingId.toString());
            console.log("Indexed ListingCancelled: ", listingId.toString());

            await logActivity({
                type: "CANCELLED",
                wallet: seller,
                txHash: event.transactionHash
            })
        }
    );


    // "ListingPriceUpdated"
    marketplaceContract.on(
        "ListingPriceUpdated",
        async(listingId, newPrice, event) => {
            await updateListingPrice(listingId.toString(), newPrice.toString());
            console.log("Indexed ListingPriceUpdated: ", listingId.toString());
        }
    );
}