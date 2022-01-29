import { PublicKey, Keypair } from "@solana/web3.js";
import * as SPLToken from "@solana/spl-token";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import * as assert from "assert";
import { getProgram } from "./programConfig";
import { getNewMarketConfig } from "./instructionConfig";
import { CurveConfig, Market } from "./interfaces";
import { DEFAULT_RESERVE_MINT } from "./defaultConstants";

const provider = anchor.Provider.env();
const program = getProgram(provider.wallet);

export const createMarket = async (
  name: string,
  curveConfig: CurveConfig
): Promise<Market> => {
  let config = await getNewMarketConfig(name);
  console.log(config.targetMint.publicKey.toBase58());
  console.log(DEFAULT_RESERVE_MINT.publicKey.toBase58());
  const tx = await program.rpc.createMarket(
    config.market.bump,
    config.attribution.bump,
    config.reserve.bump,
    config.patrol.bump,
    name,
    curveConfig,
    {
      accounts: {
        payer: provider.wallet.publicKey,
        creator: provider.wallet.publicKey,
        market: config.market.address,
        attribution: config.attribution.address,
        targetMint: config.targetMint.publicKey,
        reserveMint: DEFAULT_RESERVE_MINT.publicKey,
        reserve: config.reserve.address,
        patrol: config.patrol.address,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [config.targetMint],
    }
  );
  //await printMarket(config.market.address);
  let storedMarket = await program.account.market.fetch(config.market.address);
  console.log("CREATED MARKET", name, "at", config.market.address.toBase58());
  console.log("curve config", storedMarket.curveConfig);
  return {
    name: name,
    creator: provider.wallet.publicKey,
    curveConfig: curveConfig,
    targetMint: storedMarket.targetMint,
    reserveMint: storedMarket.reserveMint,
    reserve: storedMarket.reserve,
    patrol: storedMarket.patrol,
    address: config.market.address,
    bump: storedMarket.bump,
  };
};
