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
import { CurveConfig, Market, NewMarketConfig } from "./interfaces";
import { DEFAULT_RESERVE_MINT } from "./defaultConstants";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
} from "./tokenHelpers";

const provider = anchor.Provider.env();
const program = getProgram(provider.wallet);

export const seedMarket = async () => {};

export const makeMarket = async (
  marketConfig: NewMarketConfig,
  curveConfig: CurveConfig,
  creator: PublicKey,
  creatorPair?: Keypair
): Promise<Market> => {
  let creatorTargetTokenAccount = await findAssociatedTokenAccount(
    creator,
    marketConfig.targetMint.publicKey
  );
  let creatorReserveTokenAccount = await findAssociatedTokenAccount(
    creator,
    DEFAULT_RESERVE_MINT.publicKey
  );
  let signers = [marketConfig.targetMint];
  if (creatorPair) {
    signers.push(creatorPair);
  }
  console.log(marketConfig.targetMint.publicKey.toBase58());
  console.log(DEFAULT_RESERVE_MINT.publicKey.toBase58());
  const tx = await program.rpc.makeMarket(
    marketConfig.market.bump,
    marketConfig.attribution.bump,
    marketConfig.reserve.bump,
    marketConfig.patrol.bump,
    marketConfig.name,
    curveConfig,
    {
      accounts: {
        payer: creator,
        creator: creator,
        market: marketConfig.market.address,
        attribution: marketConfig.attribution.address,
        targetMint: marketConfig.targetMint.publicKey,
        reserveMint: DEFAULT_RESERVE_MINT.publicKey,
        reserve: marketConfig.reserve.address,
        patrol: marketConfig.patrol.address,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: signers,
    }
  );
  //await printMarket(config.market.address);
  let storedMarket = await program.account.market.fetch(
    marketConfig.market.address
  );
  console.log(
    "CREATED MARKET",
    marketConfig.name,
    "at",
    marketConfig.market.address.toBase58()
  );
  console.log("curve config", storedMarket.curveConfig);
  return {
    name: marketConfig.name,
    creator: provider.wallet.publicKey,
    curveConfig: curveConfig,
    targetMint: storedMarket.targetMint,
    reserveMint: storedMarket.reserveMint,
    reserve: storedMarket.reserve,
    patrol: storedMarket.patrol,
    address: marketConfig.market.address,
    bump: storedMarket.bump,
  };
};
