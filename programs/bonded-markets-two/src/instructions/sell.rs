use {
    crate::state::*,
    crate::utils::*,
    anchor_lang::prelude::*,
    anchor_spl::{token},
};

pub fn handler(ctx: Context<Sell>, targets: u64) -> ProgramResult {
    // 1. adjust sale amount to reflect curve reserves
    let targets = curve_adjusted_targets(&ctx.accounts.market, ctx.accounts.market_target_mint.supply, targets);
    require_nonzero_sale(&targets)?;

    // 2. burn the seller's tokens
    token::burn(
        ctx.accounts.into_burn_sellers_target_tokens_context(),
        targets,
    )?;

    // 3. calc sale value in reserve tokens
    let reserve_value = ctx.accounts.market.reserve_value_on_sell(
        targets,
        ctx.accounts.market_target_mint.supply,
        ctx.accounts.market_reserve.amount,
    );
    msg!("reserve_value {}", reserve_value);
    // 4. pay the seller in reserve tokens
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

pub fn curve_adjusted_targets( 
    market: &Account<Market>,
    target_mint_supply: u64,
    targets: u64,) -> u64 {
        let max_targets = max_targets_sellable(market, target_mint_supply);
        msg!("max targets on sale, {}", max_targets);
        if targets > max_targets {
            msg!("adjusting targets to sell curve's max");
            max_targets
        } else {
            targets
        }
}

pub fn require_nonzero_sale(targets: &u64) -> ProgramResult {
    if *targets < 1 { 
        Err(ErrorCode::ZeroTargetSale.into())
    } else {
        Ok(())
    }
}

//the amount eligible to leave the curve right now (for a nonzero price)
//seed supply and creator unlock are both worth 0. can't exit from curve
pub fn max_targets_sellable(
    market: &Account<Market>,
    target_mint_supply: u64) -> u64 {
        msg!("target supply {}", target_mint_supply);
        msg!("seed targets {}", market.seed_targets());
        msg!("creator unlock {}", market.creator.targets_unlocked);
        target_mint_supply.checked_sub(market.seed_targets() + market.creator.targets_unlocked).unwrap()
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


