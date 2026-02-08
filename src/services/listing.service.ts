import { prisma } from "../db/index.js";

export async function createListing(data: {
    listingId: string;
    seller: string;
    nftContract: string;
    tokenId: string;
    price: string;
}) {
    return prisma.listing.upsert({
        where: {listingId: data.listingId},
        update: {
            price: data.price,
            status: "ACTIVE",
        },
        create: {
            listingId: data.listingId,
            seller: data.seller.toLowerCase(),
            nftContract: data.nftContract.toLowerCase(),
            tokenId: data.tokenId,
            price: data.price,
            status: "ACTIVE"
        },
    });
}


export async function markListingSold(listingId: string) {
    console.log("Peeedddrrrriiii");
    return prisma.listing.updateMany({
        where: {listingId},
        data: { status: "SOLD"},
    });
}


export async function cancelListing(listingId: string) {
    return prisma.listing.updateMany({
        where: {listingId},
        data: { status: "CANCELLED"},
    });
}

export async function updateListingPrice(listingId: string, newPrice: string) {
    return prisma.listing.updateMany({
        where: { listingId },
        data: { price: newPrice },
    });
}


export async function getActiveListing() {
    return prisma.listing.findMany({
        where: {
            status: "ACTIVE",
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            listingId: true,
            seller: true,
            nftContract: true,
            tokenId: true,
            price: true,
            createdAt: true
        }
    });
}