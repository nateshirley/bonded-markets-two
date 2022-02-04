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
import { getBondedMarketsProgram } from "./programConfig";
import { getNewMarketConfig } from "./instructionConfig";
import { CurveConfig, Market, NewMarketConfig, User } from "./interfaces";
import { DEFAULT_RESERVE_MINT } from "./defaultConstants";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
} from "./tokenHelpers";
import { BondedMarkets as BondedMarketsType } from "./BondedMarketsType";

export const buy = async (
  program: Program<BondedMarketsType>,
  user: User,
  market: Market,
  targets: BN,
  buyerSignature?: Keypair //only need to pass in for testing, otherwise it auto signs with provider's wallet
) => {
  let signers = [];
  if (buyerSignature) {
    signers.push(buyerSignature);
  }
  const tx = await program.rpc.buy(targets, {
    accounts: {
      buyer: user.walletPubkey,
      buyerReserveTokenAccount: user.reserveTokenAccount.address,
      buyerTargetTokenAccount: user.targetTokenAccount.address,
      market: market.address,
      marketPatrol: market.patrol.address,
      marketTargetMint: market.targetMint,
      marketReserve: market.reserve.address,
      rent: web3.SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    },
    signers: signers,
  });
  return tx;
};

export const sell = async (
  program: Program<BondedMarketsType>,
  user: User,
  market: Market,
  targets: BN,
  sellerSignature?: Keypair
) => {
  let signers = [];
  if (sellerSignature) {
    signers.push(sellerSignature);
  }
  const tx = await program.rpc.sell(targets, {
    accounts: {
      seller: user.walletPubkey,
      sellerReserveTokenAccount: user.reserveTokenAccount.address,
      sellerTargetTokenAccount: user.targetTokenAccount.address,
      market: market.address,
      marketPatrol: market.patrol.address,
      marketTargetMint: market.targetMint,
      marketReserve: market.reserve.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers: signers,
  });
  return tx;
};

export const buyWithNarration = async (
  program: Program<BondedMarketsType>,
  user: User,
  market: Market,
  targets: BN,
  buyerSignature?: Keypair
) => {
  let preReserveBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
  console.log("\n BUY---");
  await buy(program, user, market, targets, buyerSignature);
  let postReserveBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
  let totalCost =
    preReserveBalance.value.uiAmount - postReserveBalance.value.uiAmount;
  let averagePrice = totalCost / targets.toNumber();
  console.log("total cost: ", totalCost, "reserve tokens");
  console.log("price per token: ", averagePrice);
  console.log("");
};

export const sellWithNarration = async (
  program: Program<BondedMarketsType>,
  user: User,
  market: Market,
  targets: BN,
  sellerSignature?: Keypair
) => {
  let preReserveBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
  let preTargetBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.targetTokenAccount.address
    );
  console.log("\n SELL---");
  await sell(program, user, market, targets, sellerSignature);
  let postReserveBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
  let postTargetBalance =
    await program.provider.connection.getTokenAccountBalance(
      user.targetTokenAccount.address
    );
  let totalReservePrice =
    postReserveBalance.value.uiAmount - preReserveBalance.value.uiAmount;
  let targetsLost =
    preTargetBalance.value.uiAmount - postTargetBalance.value.uiAmount;
  let averagePrice = totalReservePrice / targetsLost;
  console.log(
    "total sale price: ",
    totalReservePrice,
    "reserve tokens in exchange for",
    targetsLost,
    "targets"
  );
  console.log("price per token: ", averagePrice);
  console.log("");
};

export const unlockCreatorShare = async (
  program: Program<BondedMarketsType>,
  creator: User,
  market: Market,
  targets: BN,
  creatorSignature?: Keypair
) => {
  let signers = [];
  if (creatorSignature) {
    signers.push(creatorSignature);
  }
  await program.rpc.unlockCreatorShare(targets, {
    accounts: {
      creator: creator.walletPubkey,
      market: market.address,
      marketTargetMint: market.targetMint,
      creatorTargetTokenAccount: creator.targetTokenAccount.address,
      marketPatrol: market.patrol.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers: signers,
  });
};

//takes a wallet and creates reserveTokenAccount, sets targetTokenAccountAddress. pays with provider wallet
export const createUser = async (
  provider: anchor.Provider,
  walletPubkey: PublicKey,
  targetMint: PublicKey,
  reserveMint: PublicKey
): Promise<User> => {
  //airdropping devnet sol in case they don't have it
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(
      walletPubkey,
      1 * web3.LAMPORTS_PER_SOL
    ),
    "confirmed"
  );
  let reserveTokenAccount = await findAssociatedTokenAccount(
    walletPubkey,
    reserveMint
  );
  //create reserve token account
  await provider.send(
    new web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        reserveMint,
        reserveTokenAccount.address,
        walletPubkey,
        provider.wallet.publicKey
      )
    )
  );
  return {
    walletPubkey: walletPubkey,
    reserveTokenAccount: reserveTokenAccount,
    targetTokenAccount: await findAssociatedTokenAccount(
      walletPubkey,
      targetMint
    ),
  };
};

export const createMarket = async (
  program: Program<BondedMarketsType>,
  marketConfig: NewMarketConfig,
  curveConfig: CurveConfig,
  creator: PublicKey,
  creatorShare: number, //basis points below 40% aka 0-4000
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
  const tx = await program.rpc.createMarket(
    marketConfig.market.bump,
    marketConfig.attribution.bump,
    marketConfig.reserve.bump,
    marketConfig.patrol.bump,
    marketConfig.name,
    curveConfig,
    creatorShare,
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
    creator: creator,
    curveConfig: curveConfig,
    targetMint: storedMarket.targetMint,
    reserveMint: storedMarket.reserveMint,
    reserve: storedMarket.reserve,
    patrol: storedMarket.patrol,
    address: marketConfig.market.address,
    bump: storedMarket.bump,
  };
};

export const requestAirdrop = async (
  to: PublicKey,
  provider: anchor.Provider
) => {
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(to, 5 * web3.LAMPORTS_PER_SOL),
    "confirmed"
  );
};
