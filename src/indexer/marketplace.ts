import { marketplaceContract } from "../config/contracts.js";
import { createListing, markListingSold, updateListingPrice, cancelListing } from "../services/listing.service.js";

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

            console.log("Indexed NFTListed: ", listingId.toString());
        }
    );


    // "NFTSold"
    marketplaceContract.on(
        "NFTSold",
        async(listingId) => {
            await markListingSold(listingId.toString());
            console.log("Indexed NFTSold: ", listingId.toString());
        }
    );


    // "ListingCancelled"
    marketplaceContract.on(
        "ListingCancelled",
        async(listingId) => {
            await cancelListing(listingId.toString());
            console.log("Indexed ListingCancelled: ", listingId.toString());
        }
    );


    // "ListingPriceUpdated"
    marketplaceContract.on(
        "ListingPriceUpdated",
        async(listingId, newPrice) => {
            await updateListingPrice(listingId.toString(), newPrice.toString());
            console.log("Indexed ListingPriceUpdated: ", listingId.toString());

        }
    );
}