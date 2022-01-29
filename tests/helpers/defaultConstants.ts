import * as web3 from "@solana/web3.js";

export const RESERVE_DECIMALS = 0;
export const RESERVE_DECIMAL_MODIFIER = 10 ** RESERVE_DECIMALS;
export const TARGET_DECIMALS = 0;
export const TARGET_DECIMAL_MODIFIER = 10 ** TARGET_DECIMALS;
export const DEFAULT_RESERVE_MINT = web3.Keypair.generate();
