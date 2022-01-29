use {crate::id, crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

pub fn handler(
    ctx: Context<CreateMarket>,
    market_bump: u8,
    _attribution_bump: u8,
    reserve_bump: u8,
    patrol_bump: u8,
    name: String,
    curve_config: CurveConfig,
) -> ProgramResult {
    verify_market_patrol(&ctx.accounts, patrol_bump)?;

    ctx.accounts.market.name = name;
    ctx.accounts.market.creator = ctx.accounts.creator.key();
    ctx.accounts.market.curve_config = curve_config;
    ctx.accounts.market.target_mint = ctx.accounts.target_mint.key();
    ctx.accounts.market.reserve_mint = ctx.accounts.reserve_mint.key();
    ctx.accounts.market.reserve = Pda {
        address: ctx.accounts.reserve.key(),
        bump: reserve_bump,
    };
    ctx.accounts.market.patrol = Pda {
        address: ctx.accounts.patrol.key(),
        bump: patrol_bump,
    };
    ctx.accounts.market.bump = market_bump;

    //put some money in the reserve
    //1 token issues, 10.5
    //10 token 5 in reserve
    //
    //0.5 plus initial price (aka 5)
    //inital would be

    Ok(())
}

pub fn verify_market_patrol(accounts: &CreateMarket, patrol_bump: u8) -> ProgramResult {
    let (expected_patrol, expected_patrol_bump) = Pubkey::find_program_address(
        &[MARKET_PATROL_SEED, accounts.target_mint.key().as_ref()],
        &id(),
    );
    if accounts.patrol.key() == expected_patrol && patrol_bump == expected_patrol_bump {
        Ok(())
    } else {
        Err(ErrorCode::InvalidMarketPatrol.into())
    }
}

#[derive(Accounts)]
#[instruction(market_bump: u8, attribution_bump: u8, reserve_bump: u8, patrol_bump: u8, name: String)]
pub struct CreateMarket<'info> {
    payer: Signer<'info>,
    creator: Signer<'info>,
    #[account(
        init,
        seeds = [MARKET_SEED, target_mint.key().as_ref()],
        bump = market_bump,
        payer = payer,
        space = 217, //math in market struct
    )]
    market: Account<'info, Market>,
    #[account(
        init,
        seeds = [MARKET_ATTRIBUTION_SEED, name.clone().to_seed_format().as_bytes()],
        bump = attribution_bump,
        payer = payer,
    )]
    attribution: Account<'info, MarketAttribution>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = patrol,
    )]
    target_mint: Box<Account<'info, token::Mint>>, //must also be signer
    reserve_mint: Account<'info, token::Mint>,
    #[account(
       init,
        seeds = [RESERVE_SEED, target_mint.key().as_ref()],
        bump = reserve_bump,
        payer = payer,
        token::authority = patrol,
        token::mint = reserve_mint,
    )]
    reserve: Box<Account<'info, token::TokenAccount>>,
    patrol: UncheckedAccount<'info>, //validated in ix
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}
