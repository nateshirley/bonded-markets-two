import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { BondedMarketsTwo } from "../target/types/bonded_markets_two";
import { makeMarket } from "./helpers/execution";
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
import { getNewMarketConfig } from "./helpers/instructionConfig";

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

    let marketConfig = await getNewMarketConfig("yeezy");
    let creator = await createUser(
      web3.Keypair.generate(),
      marketConfig.targetMint.publicKey
    );
    let yeezy = await makeMarket(
      marketConfig,
      {
        reserveRatio: 50,
        initialPrice: new BN(0),
        maxSupply: new BN(90000),
      },
      creator.wallet.publicKey,
      1112,
      creator.wallet
    );

    await program.rpc.seedMarket({
      accounts: {
        seeder: creator.wallet.publicKey,
        market: yeezy.address,
        marketTargetMint: yeezy.targetMint,
        seederTargetTokenAccount: creator.targetTokenAccount.address,
        seederReserveTokenAccount: creator.reserveTokenAccount.address,
        marketReserve: yeezy.reserve.address,
        marketPatrol: yeezy.patrol.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [
        createAssociatedTokenAccountInstruction(
          yeezy.targetMint,
          creator.targetTokenAccount.address,
          creator.wallet.publicKey,
          creator.wallet.publicKey
        ),
      ],
      signers: [creator.wallet],
    });

    await buyWithNarration(creator, yeezy, new BN(90));
    //await buy(creator, yeezy, new BN(40));

    await program.rpc.unlockCreatorShare(new BN(10), {
      accounts: {
        creator: creator.wallet.publicKey,
        market: yeezy.address,
        marketTargetMint: yeezy.targetMint,
        creatorTargetTokenAccount: creator.targetTokenAccount.address,
        marketPatrol: yeezy.patrol.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [creator.wallet],
    });
    await buyWithNarration(creator, yeezy, new BN(190));

    await sell(creator, yeezy, new BN(50));
  });

  const sell = async (user: User, market: Market, targets: BN) => {
    const tx = await program.rpc.sell(targets, {
      accounts: {
        seller: user.wallet.publicKey,
        sellerReserveTokenAccount: user.reserveTokenAccount.address,
        sellerTargetTokenAccount: user.targetTokenAccount.address,
        market: market.address,
        marketPatrol: market.patrol.address,
        marketTargetMint: market.targetMint,
        marketReserve: market.reserve.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [user.wallet],
    });
  };

  const buyWithNarration = async (user: User, market: Market, targets: BN) => {
    let preReserveBalance = await provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
    console.log("\n BUY---");
    await buy(user, market, targets);
    let postReserveBalance = await provider.connection.getTokenAccountBalance(
      user.reserveTokenAccount.address
    );
    let totalCost =
      preReserveBalance.value.uiAmount - postReserveBalance.value.uiAmount;
    let averagePrice = totalCost / targets.toNumber();
    console.log("total cost: ", totalCost, "reserve tokens");
    console.log("price per token: ", averagePrice);
    console.log("");
  };

  const buy = async (user: User, market: Market, targets: BN) => {
    const tx = await program.rpc.buy(targets, {
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
      100000 * RESERVE_DECIMAL_MODIFIER //10 billy
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
