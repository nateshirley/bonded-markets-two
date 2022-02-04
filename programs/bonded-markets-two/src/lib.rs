use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};
declare_id!("HviePMTxjaP7bWYRErxyZjruUnmVY36viYPphYF46nvL");

mod instructions;
pub mod state;
pub mod utils;
use {instructions::*, state::*, utils::*};

/*
doing sol is actually simpler than current (if i want to change later)

todo
- math
- unlock


changes
- max supply is max supply bought from the curve
- u can't sell below the seedValue or the creatorUnlock -- both are worth 0
- floor supply to sell then is seedValue + creator_unlock
- most u can sell is mintSupply - targets - (seedValue + creator_unlock)
- seedSupply
- if we are doing one curve i can fix all other values
//vars to consider
- seed targets
- creator unlock
- max curve supply
*/

#[program]
pub mod bonded_markets_two {

    use super::*;
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_bump: u8,
        attribution_bump: u8,
        reserve_bump: u8,
        patrol_bump: u8,
        name: String,
        curve_config: CurveConfig,
        creator_share: u16,
    ) -> ProgramResult {
        instructions::create_market::handler(
            ctx,
            market_bump,
            attribution_bump,
            reserve_bump,
            patrol_bump,
            name,
            curve_config,
            creator_share,
        )
    }

    pub fn buy(ctx: Context<Buy>, targets: u64) -> ProgramResult {
        instructions::buy::handler(ctx, targets)
    }

    pub fn sell(ctx: Context<Sell>, targets: u64) -> ProgramResult {
        instructions::sell::handler(ctx, targets)
    }

    pub fn unlock_creator_share(ctx: Context<UnlockCreatorShare>, targets: u64) -> ProgramResult {
        instructions::unlock_creator_share::handler(ctx, targets)
    }
}
