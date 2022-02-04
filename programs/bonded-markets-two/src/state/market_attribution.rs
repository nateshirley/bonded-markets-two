use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct MarketAttribution {
    pub target_mint: Pubkey,
}
