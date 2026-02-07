import { prisma } from "../db";

export async function upsertNFT(data: {
    contractAddress: string;
    tokenId: string;
    owner: string;
    tokenURI?: string
}) {
    return prisma.nFT.upsert({
        where: {
            contractAddress_tokenId: {
                contractAddress: data.contractAddress,
                tokenId: data.tokenId,
            }
        },
        update: {
          owner: data.owner.toLowerCase(),
          tokenURI: data.tokenURI,
        },
        create : {
            contractAddress: data.contractAddress,
            tokenId: data.tokenId,
            owner: data.owner.toLowerCase(),
            tokenURI: data.tokenURI
        }
    });
}