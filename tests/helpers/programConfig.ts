import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { BN, Program, Provider } from "@project-serum/anchor";
import idl from "../../target/idl/bonded_markets_two.json";

import { Connection, Commitment } from "@solana/web3.js";
import { BondedMarketsTwo } from "../../target/types/bonded_markets_two";

//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"
//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"

let localnet = true;
const endpoint = () => {
  if (localnet) {
    return "http://127.0.0.1:8899";
  } else {
    return "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/";
  }
};
export const getConnection = () => {
  const commitment: Commitment = "processed";
  return new Connection(endpoint(), commitment);
};
export const getProvider = (withWallet: any) => {
  const commitment: Commitment = "processed";
  let confirmOptions = { preflightCommitment: commitment };
  let wallet: any = withWallet;
  const provider = new Provider(getConnection(), wallet, confirmOptions);
  return provider;
};
export const getProgram = (wallet: any): Program<BondedMarketsTwo> => {
  if (localnet) {
    return anchor.workspace.BondedMarketsTwo as Program<BondedMarketsTwo>;
  } else {
    const provider = getProvider(wallet);
    let myIdl: any = idl;
    return new Program(myIdl, BONDED_MARKETS_PROGRAM_ID, provider);
  }
};

export const BONDED_MARKETS_PROGRAM_ID = new web3.PublicKey(
  "HviePMTxjaP7bWYRErxyZjruUnmVY36viYPphYF46nvL"
);
