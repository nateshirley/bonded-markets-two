use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};
declare_id!("HviePMTxjaP7bWYRErxyZjruUnmVY36viYPphYF46nvL");

mod instructions;
pub mod state;
pub mod utils;
use {instructions::*, state::*, utils::*};

/*
doing sol is actually simpler

todo
-
*/

#[program]
pub mod bonded_markets_two {

    use super::*;
    //todo --- add unlocks
    //possibly in a separate program bc it's cooler
    pub fn make_market(
        ctx: Context<MakeMarket>,
        market_bump: u8,
        attribution_bump: u8,
        reserve_bump: u8,
        patrol_bump: u8,
        name: String,
        curve_config: CurveConfig,
    ) -> ProgramResult {
        instructions::make_market::handler(
            ctx,
            market_bump,
            attribution_bump,
            reserve_bump,
            patrol_bump,
            name,
            curve_config,
        )
    }

    pub fn seed_market(ctx: Context<SeedMarket>) -> ProgramResult {
        instructions::seed_market::handler(ctx)
    }

    pub fn buy(ctx: Context<Buy>, targets: u64) -> ProgramResult {
        instructions::buy::handler(ctx, targets)
    }

    pub fn sell(ctx: Context<Sell>, targets: u64) -> ProgramResult {
        instructions::sell::handler(ctx, targets)
    }
}
