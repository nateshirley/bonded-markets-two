use {
    crate::state::*,
    crate::utils::*,
    anchor_lang::prelude::*,
    anchor_spl::{associated_token, token},
};

pub fn handler(ctx: Context<Sell>, targets: u64) -> ProgramResult {
    verify_sell_amount(ctx.accounts.market_target_mint.supply, targets)?;
    let targets = unlock_adjusted_targets(&ctx.accounts.market, ctx.accounts.market_target_mint.supply, targets);


    // 1. burn the seller's tokens
    token::burn(
        ctx.accounts.into_burn_sellers_target_tokens_context(),
        targets,
    )?;

    // 2. calc sale value in reserve tokens
    let reserve_value = ctx.accounts.market.reserve_value_on_sell(
        targets,
        ctx.accounts.market_target_mint.supply,
        ctx.accounts.market_reserve.amount,
    );
    msg!("reserve_value {}", reserve_value);

    // 3. pay the seller in reserve tokens
    token::transfer(
        ctx.accounts
            .into_transfer_reserve_tokens_to_seller_context()
            .with_signer(&[&[
                MARKET_PATROL_SEED,
                ctx.accounts.market.target_mint.as_ref(),
                &[ctx.accounts.market.patrol.bump],
            ]]),
        reserve_value,
    )?;
    Ok(())
}

//these two are sort of the same thing
//u actually can't sell below the creator share. or u can but u get nothing in return
//so u might as well not be able to
/*
    if (market.targetTokenSupply - targets < market.preMine) {
        //selling into the premine portion
        targets = market.targetTokenSupply - market.preMine;
      }
 */
pub fn unlock_adjusted_targets( //need tighter model on the seed
    market: &Account<Market>,
    target_mint_supply: u64,
    targets: u64,) -> u64 {
        if target_mint_supply.checked_sub(targets).unwrap() < market.creator.amount_unlocked {
            target_mint_supply.checked_sub(market.creator.amount_unlocked).unwrap()
        } else {
            targets
        }
}

pub fn verify_sell_amount(
    target_mint_supply: u64,
    targets: u64,
) -> ProgramResult {
    if target_mint_supply.checked_sub(targets).unwrap() < 10 { //should be programmatic to match seed val
        return Err(ErrorCode::SellBelowMinSupply.into());
    }
    Ok(())
}

impl<'info> Sell<'info> {
    pub fn into_burn_sellers_target_tokens_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::Burn<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::Burn {
            to: self.seller_target_token_account.to_account_info(),
            mint: self.market_target_mint.to_account_info(),
            authority: self.seller.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    pub fn into_transfer_reserve_tokens_to_seller_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::Transfer {
            from: self.market_reserve.to_account_info(),
            to: self.seller_reserve_token_account.to_account_info(),
            authority: self.market_patrol.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    seller: Signer<'info>,
    #[account(
        mut, 
        constraint = seller_target_token_account.owner == seller.key()
    )] //ix validates mint
    seller_reserve_token_account: Account<'info, token::TokenAccount>,
    #[account(mut)] //ix validates owner/mint
    seller_target_token_account: Account<'info, token::TokenAccount>,
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
    token_program: Program<'info, token::Token>,
}


