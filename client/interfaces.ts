import { BN } from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

export interface User {
  walletPubkey: PublicKey;
  reserveTokenAccount: Pda;
  targetTokenAccount: Pda;
}
export interface Pda {
  address: PublicKey;
  bump: number;
}
export interface Market {
  name: string;
  creator: PublicKey;
  curveConfig: CurveConfig;
  targetMint: PublicKey;
  reserveMint: PublicKey;
  reserve: Pda;
  patrol: Pda;
  address: PublicKey;
  bump: number;
}
export interface NewMarketConfig {
  name: string;
  targetMint: Keypair;
  market: Pda;
  attribution: Pda;
  reserve: Pda;
  patrol: Pda;
}

export interface CurveConfig {
  reserveRatio: number;
  initialPrice: BN;
  initialSlope: number;
  maxSupply?: BN;
}
