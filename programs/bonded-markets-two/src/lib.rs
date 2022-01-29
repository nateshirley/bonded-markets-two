use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};
declare_id!("HviePMTxjaP7bWYRErxyZjruUnmVY36viYPphYF46nvL");

pub mod instructions;
pub mod state;
pub mod utils;
use {instructions::*, state::*, utils::*};

/*
so the difference would be
pulling in from the market
u would have token accounts instead
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
    ) -> ProgramResult {
        create_market::handler(
            ctx,
            market_bump,
            attribution_bump,
            reserve_bump,
            patrol_bump,
            name,
            curve_config,
        )
    }

    pub fn buy(ctx: Context<Buy>, amount: u64) -> ProgramResult {
        //make sure it doesn't go to zero
        let market_patrol_seeds = &[
            &MARKET_PATROL_SEED[..],
            ctx.accounts.market.target_mint.as_ref(),
            &[ctx.accounts.market.patrol.bump],
        ];

        //10 token 5 in reserve

        let reserve_value = reserve_value_to_buy_target(
            amount,
            &*ctx.accounts.market,
            &ctx.accounts.market_target_mint,
            &ctx.accounts.market_reserve,
        );
        // 1) calc purchase price in reserve tokens
        // 2) transfer from buyer's wallet to market reserve
        // 3) mint tokens to buyer

        Ok(())
    }
}
/*
  const buy = (targets: number, market: Market, user: User) => {
  console.log("");
  console.log("BUYING");
  console.log("targets received:", targets);
  let reserveChange = reserveValueOnBuy(targets, market);
  console.log("total cost to user: ", reserveChange);
  market.reserveBalance += reserveChange;
  market.targetTokenSupply += targets;
  user.reserveTokenBalance -= reserveChange;
  user.targetTokenBalance += targets;
  console.log("price per token: ", reserveChange / targets, "reserve");
  printMarketStatus(market);
};

const supportValue = (targets: number, market: Market) => {
  return targets * market.initialPrice;
};

const reserveValueOnBuy = (targets: number, market: Market) => {
  let curveSupply = market.targetTokenSupply - market.preMine;
  console.log("curve supp", curveSupply);
  let supportBalance = market.initialPrice * curveSupply;
  console.log("support balance", supportBalance);
  let curveBalance = market.reserveBalance - supportBalance;
  let base = 1 + targets / curveSupply;
  let ex = Math.pow(base, 1 / market.reserveRatio) - 1;
  let whole = curveBalance * ex;
  console.log("whole", whole);
  return whole + supportValue(targets, market);
};
  */
pub fn reserve_value_to_buy_target(
    amount: u64,
    market: &Account<Market>,
    target_mint: &Account<token::Mint>,
    reserve: &Account<token::TokenAccount>,
) -> u64 {
    let curve_supply = target_mint
        .supply
        .checked_sub(market.curve_config.pre_mine)
        .unwrap();
    let support_balance = market
        .curve_config
        .initial_price
        .checked_mul(curve_supply)
        .unwrap();
    let curve_balance = reserve.amount.checked_sub(support_balance).unwrap();
    let one: u64 = 1;
    let base = one
        .checked_add(amount)
        .unwrap()
        .checked_div(curve_supply)
        .unwrap();
    let a = 100 / market.curve_config.reserve_ratio as u32;
    let ex = base.checked_pow(a).unwrap();
    let whole = curve_balance.checked_mul(ex).unwrap();
    whole
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    buyer: Signer<'info>,
    #[account(mut)]
    buyer_reserve_token_account: Account<'info, token::TokenAccount>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::authority = buyer,
        associated_token::mint = market_target_mint,
        constraint = buyer_target_token_account.owner == buyer.key(),
    )]
    buyer_target_token_account: Account<'info, token::TokenAccount>,
    #[account(
        constraint = market.target_mint == market_target_mint.key(),
        constraint = market.patrol.address == market_patrol.key(),
        constraint = market.reserve.address == market_reserve.key(),
    )]
    market: Box<Account<'info, Market>>,
    market_patrol: AccountInfo<'info>,
    #[account(mut)]
    market_target_mint: Account<'info, token::Mint>,
    #[account(mut)]
    market_reserve: Box<Account<'info, token::TokenAccount>>,
    rent: Sysvar<'info, Rent>,
    associated_token_program: Program<'info, associated_token::AssociatedToken>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}

//im just gonna rip it with both...fuck it
//tradeoff is u are creating 8 more
