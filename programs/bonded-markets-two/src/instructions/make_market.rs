use {crate::id, crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

const MAX_CREATOR_SHARE: u16 = 5000;

pub fn handler(
    ctx: Context<MakeMarket>,
    market_bump: u8,
    _attribution_bump: u8,
    reserve_bump: u8,
    patrol_bump: u8,
    name: String,
    curve_config: CurveConfig,
    creator_share: u16,
) -> ProgramResult {
    // optional: can move verify_curve_config and market_patrol_is_canonical into an `access_control func
    verify_curve_config(curve_config, creator_share)?;
    let market = &mut ctx.accounts.market;
    market.name = name;
    market.creator = Creator {
        wallet: ctx.accounts.creator.key(),
        share: creator_share,
        targets_unlocked: 0,
    };
    market.curve_config = curve_config;
    market.target_mint = ctx.accounts.target_mint.key();
    market.reserve_mint = ctx.accounts.reserve_mint.key();
    market.reserve = Pda {
        address: ctx.accounts.reserve.key(),
        bump: reserve_bump,
    };

    market.patrol = Pda {
        address: ctx.accounts.patrol.key(),
        bump: patrol_bump,
    };
    market.bump = market_bump;

    Ok(())
}

pub fn verify_curve_config(curve_config: CurveConfig, creator_share: u16) -> ProgramResult {
    if creator_share > MAX_CREATOR_SHARE {
        return Err(ErrorCode::ExcessiveCreatorShare.into());
    }
    if curve_config.max_supply == None && creator_share != 0 {
        //if using infinite supply, creator share must be 0
        return Err(ErrorCode::InfiniteSupplyRequiresZeroCreatorShare.into());
    }
    Ok(())
}

pub fn market_patrol_is_canoncial(
    target_mint: Pubkey,
    passed_patrol: Pubkey,
    passed_bump: u8,
) -> bool {
    let (expected_patrol, expected_patrol_bump) =
        Pubkey::find_program_address(&[MARKET_PATROL_SEED, target_mint.as_ref()], &id());
    passed_patrol == expected_patrol && passed_bump == expected_patrol_bump
}

#[derive(Accounts)]
#[instruction(market_bump: u8, attribution_bump: u8, reserve_bump: u8, patrol_bump: u8, name: String)]
pub struct MakeMarket<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    creator: Signer<'info>,
    #[account(
        init,
        seeds = [MARKET_SEED, target_mint.key().as_ref()],
        bump = market_bump,
        payer = payer,
        space = 221, //math in market struct
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
    #[account(
        constraint = market_patrol_is_canoncial(target_mint.key(), patrol.key(), patrol_bump)
    )]
    patrol: UncheckedAccount<'info>, //validated in ix
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}
