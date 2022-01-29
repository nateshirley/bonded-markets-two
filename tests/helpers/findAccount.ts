import { PublicKey, Keypair } from "@solana/web3.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import { BONDED_MARKETS_PROGRAM_ID } from "./programConfig";

export const findMarket = async (targetMint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("market"), targetMint.toBuffer()],
    BONDED_MARKETS_PROGRAM_ID
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findMarketAttribution = async (name: string) => {
  return PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("attribution"),
      anchor.utils.bytes.utf8.encode(name),
    ],
    BONDED_MARKETS_PROGRAM_ID
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};

export const findReserve = async (targetMint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("reserve"), targetMint.toBuffer()],
    BONDED_MARKETS_PROGRAM_ID
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findMarketPatrol = async (targetMint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("market_patrol"), targetMint.toBuffer()],
    BONDED_MARKETS_PROGRAM_ID
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
