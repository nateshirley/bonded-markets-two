use {crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

pub fn handler(ctx: Context<UnlockCreatorShare>, amount: u64) -> ProgramResult {
    // 1. make sure they aren't trying to unlock too much
    verify_unlock_amount(
        &ctx.accounts.market,
        ctx.accounts.market_target_mint.supply,
        amount,
    )?;
    // 2. mint tokens to the creator
    token::mint_to(
        ctx.accounts
            .into_unlock_tokens_for_creator_context()
            .with_signer(&[&[
                MARKET_PATROL_SEED,
                ctx.accounts.market.target_mint.as_ref(),
                &[ctx.accounts.market.patrol.bump],
            ]]),
        amount,
    )?;
    // 3. update the creator's amount unlocked
    ctx.accounts.market.creator.amount_unlocked = ctx
        .accounts
        .market
        .creator
        .amount_unlocked
        .checked_add(amount)
        .unwrap();

    Ok(())
}

pub fn verify_unlock_amount(
    market: &Account<Market>,
    target_mint_supply: u64,
    amount: u64,
) -> ProgramResult {
    if market.creator.amount_unlocked.checked_add(amount).unwrap()
        > market.max_creator_unlock_now(u128::from(target_mint_supply))
    {
        Err(ErrorCode::GreedyCreatorUnlock.into())
    } else {
        Ok(())
    }
}

impl<'info> UnlockCreatorShare<'info> {
    pub fn into_unlock_tokens_for_creator_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.market_target_mint.to_account_info(),
            to: self.creator_target_token_account.to_account_info(),
            authority: self.market_patrol.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct UnlockCreatorShare<'info> {
    creator: Signer<'info>,
    #[account(
        mut,
        constraint = market.target_mint == market_target_mint.key(),
        constraint = market.creator.wallet == creator.key(),
        constraint = market.patrol.address == market_patrol.key(),
    )]
    market: Account<'info, Market>,
    #[account(mut)]
    market_target_mint: Account<'info, token::Mint>,
    #[account(
        mut,
        constraint = creator_target_token_account.owner == creator.key()
    )] //token program checks mint
    creator_target_token_account: Box<Account<'info, token::TokenAccount>>,
    market_patrol: UncheckedAccount<'info>,
    token_program: Program<'info, token::Token>,
}
