import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { BondedMarketsTwo } from "../target/types/bonded_markets_two";
import {
  buy,
  buyWithNarration,
  createUser,
  makeMarket,
  requestAirdrop,
  sell,
  sellWithNarration,
  unlockCreatorShare,
} from "./helpers/execution";
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
import { BondedMarkets } from "./helpers/programConfig";

describe("bonded-markets-two", () => {
  // Configure the client to use the local cluster.
  //configure seed market or not

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const bondedMarkets = new BondedMarkets(provider.wallet);
  const program = bondedMarkets.program;
  let payer = web3.Keypair.generate();
  let reserveMint = DEFAULT_RESERVE_MINT;
  let reserveMintAuthority = web3.Keypair.generate();
  let ReserveToken: Token;

  let genesisMarket: Market;

  //using separate payer for config
  it("create reserve token", async () => {
    //create subscription mint account
    await requestAirdrop(payer.publicKey, provider);
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

  it("genesis config", async () => {
    let genesisConfig = await getNewMarketConfig("genesis");
    let userJoe = await createUser(
      bondedMarkets.program.provider,
      provider.wallet.publicKey,
      genesisConfig.targetMint.publicKey,
      reserveMint.publicKey
    );

    await ReserveToken.mintTo(
      userJoe.reserveTokenAccount.address,
      reserveMintAuthority,
      [],
      100000 * RESERVE_DECIMAL_MODIFIER //10 billy
    );

    genesisMarket = await makeMarket(
      program,
      genesisConfig,
      {
        reserveRatio: 50,
        initialPrice: new BN(0),
        maxSupply: new BN(90000),
      },
      provider.wallet.publicKey,
      1112
    );

    /*
    difference im thinking of doing is storing the seed vals in the market
    slope doens't make as much sense bc it won't be accurate when the treasury changes
    */
    //last thing is here
    await program.rpc.seedMarket({
      accounts: {
        seeder: provider.wallet.publicKey,
        market: genesisMarket.address,
        marketTargetMint: genesisMarket.targetMint,
        seederTargetTokenAccount: userJoe.targetTokenAccount.address,
        seederReserveTokenAccount: userJoe.reserveTokenAccount.address,
        marketReserve: genesisMarket.reserve.address,
        marketPatrol: genesisMarket.patrol.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [
        createAssociatedTokenAccountInstruction(
          genesisMarket.targetMint,
          userJoe.targetTokenAccount.address,
          provider.wallet.publicKey,
          provider.wallet.publicKey
        ),
      ],
    });

    await buyWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(90)
    );
    await buyWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(190)
    );
    await unlockCreatorShare(
      bondedMarkets.program,
      new BN(10),
      userJoe,
      genesisMarket
    );
    await sellWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(210)
    );
  });

  it("example with local wallet", async () => {
    let steveWallet = web3.Keypair.generate();
    let userSteve = await createUser(
      bondedMarkets.program.provider,
      steveWallet.publicKey,
      genesisMarket.targetMint,
      reserveMint.publicKey
    );
    await ReserveToken.mintTo(
      userSteve.reserveTokenAccount.address,
      reserveMintAuthority,
      [],
      100000 * RESERVE_DECIMAL_MODIFIER //10 billy
    );
    await buy(
      bondedMarkets.program,
      userSteve,
      genesisMarket,
      new BN(1),
      steveWallet //example with passing in wallet keypair for testing
    );
  });

  //come up with another way to get reserveTokens on devnet. either share keypairs, make new mint everytime, or use a smart contract faucet
  //i would just set up a faucet
  /*
    await ReserveToken.mintTo( 
      reserveTokenAccount.address,
      reserveMintAuthority,
      [],
      100000 * RESERVE_DECIMAL_MODIFIER //10 billy
    );
  */
});
