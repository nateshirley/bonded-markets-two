use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub name: String,
    pub creator: Pubkey, //wallet of creator
    pub curve_config: CurveConfig,
    pub target_mint: Pubkey,
    pub reserve_mint: Pubkey,
    pub reserve: Pda, //derivable as pda
    pub patrol: Pda,  //derivable as pda -- can mint new tokens and transer out of treasury
    pub bump: u8,     //this is assuming base is sol
}
//8
//20 for str
//32 * 3
//33 * 2
//26
//1
//= 217

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct CurveConfig {
    pub reserve_ratio: u8,
    pub pre_mine: u64,
    pub initial_price: u64,
    pub max_supply: Option<u64>,
}
//size = 26

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct Pda {
    pub address: Pubkey,
    pub bump: u8,
}
//size = 33
