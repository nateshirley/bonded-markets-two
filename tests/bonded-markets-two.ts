import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { BondedMarketsTwo } from "../target/types/bonded_markets_two";
import { createMarket } from "./helpers/execution";
import * as web3 from "@solana/web3.js";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  MintLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  RESERVE_DECIMALS,
  DEFAULT_RESERVE_MINT,
  RESERVE_DECIMAL_MODIFIER,
} from "./helpers/defaultConstants";
import { Market, User } from "./helpers/interfaces";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
} from "./helpers/tokenHelpers";

describe("bonded-markets-two", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace
    .BondedMarketsTwo as Program<BondedMarketsTwo>;
  let payer = web3.Keypair.generate();
  let reserveMint = DEFAULT_RESERVE_MINT;
  let reserveMintAuthority = web3.Keypair.generate();
  let ReserveToken: Token;

  it("create reserve token", async () => {
    //create subscription mint account
    await performAirdrops();
    let transaction = new web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: reserveMint.publicKey,
        space: MintLayout.span,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          MintLayout.span
        ),
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        reserveMint.publicKey,
        RESERVE_DECIMALS,
        reserveMintAuthority.publicKey,
        null
      )
    );
    await web3.sendAndConfirmTransaction(provider.connection, transaction, [
      payer,
      reserveMint,
    ]);
    ReserveToken = new Token(
      provider.connection,
      reserveMint.publicKey,
      TOKEN_PROGRAM_ID,
      payer
    );
  });

  it("Is initialized!", async () => {
    // Add your test here.

    let yeezy = await createMarket("yeezy", {
      reserveRatio: 50,
      preMine: new BN(0),
      initialPrice: new BN(0),
      maxSupply: new BN(100000),
    });
    let firstUser = await createUser(web3.Keypair.generate(), yeezy.targetMint);
    await buy(firstUser, yeezy, new BN(100));
  });

  const buy = async (user: User, market: Market, amount: BN) => {
    const tx = await program.rpc.buy(amount, {
      accounts: {
        buyer: user.wallet.publicKey,
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
      signers: [user.wallet],
    });
  };
  const createUser = async (
    wallet: Keypair,
    targetMint: PublicKey
  ): Promise<User> => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        wallet.publicKey,
        5 * web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
    let reserveTokenAccount = await findAssociatedTokenAccount(
      wallet.publicKey,
      reserveMint.publicKey
    );
    let targetTokenAccount = await findAssociatedTokenAccount(
      wallet.publicKey,
      targetMint
    );
    await web3.sendAndConfirmTransaction(
      provider.connection,
      new web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          reserveMint.publicKey,
          reserveTokenAccount.address,
          wallet.publicKey,
          wallet.publicKey
        )
      ),
      [wallet]
    );
    await ReserveToken.mintTo(
      reserveTokenAccount.address,
      reserveMintAuthority,
      [],
      1000 * RESERVE_DECIMAL_MODIFIER //10 billy
    );
    return {
      wallet: wallet,
      reserveTokenAccount: reserveTokenAccount,
      targetTokenAccount: targetTokenAccount,
    };
  };

  const performAirdrops = async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        payer.publicKey,
        5 * web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
  };
});
