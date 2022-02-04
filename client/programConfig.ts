import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { BN, Program, Provider } from "@project-serum/anchor";
import idl from "./bonded_markets_idl.json";

import { Connection, Commitment } from "@solana/web3.js";
import { BondedMarkets as BondedMarketsType } from "./BondedMarketsType";

//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"

let localnet = true;
const endpoint = () => {
  if (localnet) {
    return "http://127.0.0.1:8899";
  } else {
    return "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"; //nate's private rpc node
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

export const getBondedMarketsProgram = (
  wallet: any
): Program<BondedMarketsType> => {
  const provider = getProvider(wallet);
  let BondedMarketsIdl: any = idl;
  return new Program(BondedMarketsIdl, BONDED_MARKETS_PROGRAM_ID, provider);
};

export const BONDED_MARKETS_PROGRAM_ID = new web3.PublicKey(
  "3WCf7VFEebTDAzLdDyZsNsETcS4qrmSpiMsCib2m2rQw"
);

export class BondedMarkets {
  static programId = BONDED_MARKETS_PROGRAM_ID;
  public program: Program<BondedMarketsType>;
  constructor(wallet: any) {
    this.program = getBondedMarketsProgram(wallet);
  }
}
