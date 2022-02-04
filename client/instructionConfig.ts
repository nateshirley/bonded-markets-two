import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { BN, Program, Provider } from "@project-serum/anchor";
import idl from "../target/idl/bonded_markets.json";
import * as find from "./findAccount";
import { NewMarketConfig } from "./interfaces";

export const getNewMarketConfig = async (
  name: string
): Promise<NewMarketConfig> => {
  let targetMint = web3.Keypair.generate();
  return {
    name: name,
    targetMint: targetMint,
    market: await find.findMarket(targetMint.publicKey),
    attribution: await find.findMarketAttribution(name),
    reserve: await find.findReserve(targetMint.publicKey),
    patrol: await find.findMarketPatrol(targetMint.publicKey),
  };
};
