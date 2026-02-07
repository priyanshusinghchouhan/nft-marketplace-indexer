import { marketplaceContract } from "../config/contracts.js";

export function startMarketplaceListener() {
    console.log("Listening to Marketplace events.....");

    // "NFTListed"
    marketplaceContract.on(
        "NFTListed",
        async(listingId, seller, nftContract, tokenId, price, event) => {
            console.log("NFTListed", {
                listingId: listingId.toString(),
                seller,
                nftContract,
                tokenId: tokenId.toString(),
                price: price.toString(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
            });
        }
    );


    // "NFTSold"
    marketplaceContract.on(
        "NFTSold",
        async(listingId, buyer, seller, price, event) => {
            console.log("NFTSold", {
                listingId: listingId.toString(),
                seller,
                buyer,
                price: price.toString(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
            });
        }
    );


    // "ListingCancelled"
    marketplaceContract.on(
        "ListingCancelled",
        async(listingId, seller, event) => {
            console.log("ListingCancelled", {
                listingId: listingId.toString(),
                seller,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
            });
        }
    );


    // "ListingPriceUpdated"
    marketplaceContract.on(
        "ListingPriceUpdated",
        async(listingId, newPrice, event) => {
            console.log("ListingPriceUpdated", {
                listingId: listingId.toString(),
                newPrice: newPrice.toString(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber,
            });
        }
    );
}