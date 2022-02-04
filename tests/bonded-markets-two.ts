import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import {
  buy,
  buyWithNarration,
  createMarket,
  createUser,
  requestAirdrop,
  sell,
  sellWithNarration,
  unlockCreatorShare,
} from "../client/execution";
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
} from "../client/defaultConstants";
import { Market, User } from "../client/interfaces";

import { getNewMarketConfig } from "../client/instructionConfig";
import { BondedMarkets } from "../client/programConfig";

describe("bonded-markets-two", () => {
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

    genesisMarket = await createMarket(
      program,
      genesisConfig,
      {
        reserveRatio: 50,
        initialPrice: new BN(0),
        initialSlope: 20, //out of 10_000_000
        maxSupply: new BN(90000),
      },
      provider.wallet.publicKey,
      1112
    );

    await buyWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(1000)
    );
    await buyWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(2000)
    );
    await unlockCreatorShare(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(10)
    );
    await sellWithNarration(
      bondedMarkets.program,
      userJoe,
      genesisMarket,
      new BN(1)
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
