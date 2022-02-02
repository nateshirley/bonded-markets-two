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

possibilities for the unlock
- mint the premine on market creation and dump all the locked tokens in a locked treasury
- don't mint any unlocked tokens until the creator actually unlocks them
- this is slightly less transparent? but also maybe more transparent bc u don't have locked tokens that may/may not ever enter circulation
- i think it's better for price for the tokens to be unlocked directly rather than to preMint them
- this means the market would actually just have a creatorShare (like a number )
*/

#[program]
pub mod bonded_markets_two {

    use super::*;
    //todo --- add unlocksd
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
    /*
      //premin
    //creatorShare
    //p easy to do this math
    //just take the share, divide it by
    let preMinePercentage = market.preMine / market.maxSupply;
    let maxEligibleRightNow = preMinePercentage * market.targetTokenSupply;
    if (
      creator.amountUnlocked + amount <= maxEligibleRightNow &&
      creator.amountUnlocked + amount <= market.preMine
    ) {
      //transfer to the wallet
      //update amount unlocked
      creator.amountUnlocked += amount;
    }
    */
    pub fn unlock_creator_share(ctx: Context<UnlockCreatorShare>, amount: u64) -> ProgramResult {
        //mint the tokens to the creator

        ctx.accounts.market.creator.amount_unlocked = ctx
            .accounts
            .market
            .creator
            .amount_unlocked
            .checked_add(amount)
            .unwrap();

        Ok(())
    }
}

pub fn verify_unlock_amount(
    market: Account<Market>,
    target_mint_supply: u64,
    amount: u64,
) -> ProgramResult {
    if market.creator.amount_unlocked.checked_add(amount).unwrap()
        < market.max_creator_unlock_now(u128::from(target_mint_supply))
    {
        Err(ErrorCode::GreedyCreatorUnlock.into())
    } else {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UnlockCreatorShare<'info> {
    creator: Signer<'info>,
    market: Account<'info, Market>,
    market_target_mint: Account<'info, token::Mint>,
}
