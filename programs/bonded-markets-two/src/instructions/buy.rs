use {
    crate::state::*,
    crate::utils::*,
    anchor_lang::prelude::*,
    anchor_spl::{associated_token, token},
};

pub fn handler(ctx: Context<Buy>, targets: u64) -> ProgramResult {
    //todo --- make sure it doesn't go to zero

    // 1) calc purchase price in reserve tokens
    let reserve_value = ctx.accounts.market.reserve_value_on_buy(
        targets,
        ctx.accounts.market_target_mint.supply,
        ctx.accounts.market_reserve.amount,
    );
    msg!("reserve_value {}", reserve_value);
    //panic!();
    // 2) transfer from buyer's wallet to market reserve
    token::transfer(
        ctx.accounts.into_receive_base_tokens_from_buyer_context(),
        reserve_value,
    )?;
    // 3) mint tokens to buyer
    token::mint_to(
        ctx.accounts
            .into_mint_target_tokens_to_buyer_context()
            .with_signer(&[&[
                MARKET_PATROL_SEED,
                ctx.accounts.market.target_mint.as_ref(),
                &[ctx.accounts.market.patrol.bump],
            ]]),
        targets,
    )?;

    Ok(())
}

impl<'info> Buy<'info> {
    pub fn into_mint_target_tokens_to_buyer_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.market_target_mint.to_account_info(),
            to: self.buyer_target_token_account.to_account_info(),
            authority: self.market_patrol.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    pub fn into_receive_base_tokens_from_buyer_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::Transfer {
            from: self.buyer_reserve_token_account.to_account_info(),
            to: self.market_reserve.to_account_info(),
            authority: self.buyer.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
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
