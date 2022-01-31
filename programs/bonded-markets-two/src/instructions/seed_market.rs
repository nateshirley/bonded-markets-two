use {crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

pub fn handler(ctx: Context<SeedMarket>) -> ProgramResult {
    // 1. seed the reserve pool
    token::transfer(ctx.accounts.into_fund_reserve_context(), 5)?;

    // 2. mint targets to the seeder (sets slope)
    token::mint_to(
        ctx.accounts
            .into_mint_targets_to_seeder_context()
            .with_signer(&[&[
                &MARKET_PATROL_SEED[..],
                ctx.accounts.market.target_mint.as_ref(),
                &[ctx.accounts.market.patrol.bump],
            ]]),
        10,
    )?;
    //recreating 1, 0.5 relationship for reserve ratio = 0.5
    //in future make it programmatic
    Ok(())
}

impl<'info> SeedMarket<'info> {
    pub fn into_fund_reserve_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::Transfer {
            from: self.seeder_reserve_token_account.to_account_info(),
            to: self.market_reserve.to_account_info(),
            authority: self.seeder.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    pub fn into_mint_targets_to_seeder_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.market_target_mint.to_account_info(),
            to: self.seeder_target_token_account.to_account_info(),
            authority: self.market_patrol.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct SeedMarket<'info> {
    seeder: Signer<'info>,
    #[account(
        constraint = market.target_mint == market_target_mint.key(),
        constraint = market.reserve.address == market_reserve.key(),
        constraint = market.patrol.address == market_patrol.key(),
    )]
    market: Account<'info, Market>,
    #[account(
        mut,
        constraint = market_target_mint.supply == 0,
    )]
    market_target_mint: Account<'info, token::Mint>,
    #[account(mut)]
    seeder_target_token_account: Box<Account<'info, token::TokenAccount>>,
    #[account(mut)]
    seeder_reserve_token_account: Box<Account<'info, token::TokenAccount>>,
    #[account(mut)]
    market_reserve: Account<'info, token::TokenAccount>,
    market_patrol: UncheckedAccount<'info>,
    token_program: Program<'info, token::Token>,
}
