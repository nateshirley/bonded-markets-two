use anchor_lang::prelude::*;
use std::convert::TryFrom;

#[account]
pub struct Market {
    pub name: String,
    pub creator: Creator,
    pub curve_config: CurveConfig,
    pub target_mint: Pubkey,
    pub reserve_mint: Pubkey,
    pub reserve: Pda, //derivable as pda
    pub patrol: Pda,  //derivable as pda -- can mint new tokens and transer out of treasury
    pub bump: u8,     //this is assuming base is sol
}
//8
//20 for str
//44
//32 * 2
//33 * 2
//26
//1
//= 229

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct CurveConfig {
    pub reserve_ratio: u8,
    pub pre_mine: u64,
    pub initial_price: u64,
    pub max_supply: Option<u64>,
}
//size = 26

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct Creator {
    pub wallet: Pubkey,
    pub creator_share: u16, //percentage out of 10000 aka basis points
    pub amount_unlocked: u64,
}
//32 + 4 + 8 = 44

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct Pda {
    pub address: Pubkey,
    pub bump: u8,
}
//size = 33
impl MarketMath for Market {
    fn curve_supply(&self, target_mint_supply: u64) -> u64 {
        target_mint_supply
            .checked_sub(self.curve_config.pre_mine)
            .unwrap()
    }
    fn support_balance(&self, curve_supply: u64) -> u64 {
        self.curve_config
            .initial_price
            .checked_mul(curve_supply)
            .unwrap()
    }
    fn curve_balance(&self, curve_supply: u64, reserve_balance: u64) -> u64 {
        reserve_balance
            .checked_sub(self.support_balance(curve_supply))
            .unwrap()
    }
    fn support_value(&self, targets: u64) -> u64 {
        targets
            .checked_mul(self.curve_config.initial_price)
            .unwrap()
    }
    //TRASH MATH SECTION
    //reserveValue = curveBalance * ((1 + targets / curveSupply)^(1/reserveRatio) - 1)
    fn reserve_value_on_buy(
        &self,
        targets: u64,
        target_mint_supply: u64,
        reserve_balance: u64,
    ) -> u64 {
        let curve_supply = self.curve_supply(target_mint_supply);
        let curve_balance = self.curve_balance(curve_supply, reserve_balance);
        msg!("curve balance: {}", curve_balance);
        let base = 1 + targets / curve_supply;
        msg!("base {}", base);
        let ex = base.pow(100 / self.curve_config.reserve_ratio as u32) - 1;
        msg!("ex: {}", ex);
        let whole = curve_balance * ex;
        msg!("whole {}", whole);
        whole.checked_add(self.support_value(targets)).unwrap()
    }
    //more trash math
    //reserveValue = curveBalance * (1 - (1 - targets / curveSupply)^ (1/reserveRatio)))
    fn reserve_value_on_sell(
        &self,
        targets: u64,
        target_mint_supply: u64,
        reserve_balance: u64,
    ) -> u64 {
        let curve_supply = self.curve_supply(target_mint_supply);
        let curve_balance = self.curve_balance(curve_supply, reserve_balance);
        msg!("curve balance: {}", curve_balance);
        let base = 1 - targets / curve_supply;
        msg!("base {}", base);
        let ex = 1 - base.pow(100 / self.curve_config.reserve_ratio as u32);
        msg!("ex: {}", ex);
        let whole = curve_balance * ex;
        msg!("whole: {}", whole);
        whole.checked_add(self.support_value(targets)).unwrap()
    }
    fn max_creator_unlock_now(&self, target_mint_supply: u128) -> u64 {
        let creator_share = u128::from(self.creator.creator_share);
        u64::try_from(creator_share.checked_mul(target_mint_supply).unwrap() / 10000).unwrap()
    }
    //if we do this then u have to have a max supply. yeah that's fine
    //technically u could have max supply if creator share is 0? sure
    fn max_creator_unlock_ever(&self) -> u64 {
        let max_supply = u128::from(self.curve_config.max_supply.unwrap_or(0));
        let creator_share = u128::from(self.creator.creator_share);
        let big_creator_share: u128 = max_supply * creator_share;
        let accurate_share = big_creator_share / 10000;
        u64::try_from(accurate_share).unwrap()
    }
}

pub trait MarketMath {
    fn curve_supply(&self, target_mint_supply: u64) -> u64;
    fn support_balance(&self, curve_supply: u64) -> u64;
    fn curve_balance(&self, curve_supply: u64, reserve_balance: u64) -> u64;
    fn support_value(&self, targets: u64) -> u64;
    fn reserve_value_on_buy(
        &self,
        targets: u64,
        target_mint_supply: u64,
        reserve_balance: u64,
    ) -> u64;
    fn reserve_value_on_sell(
        &self,
        targets: u64,
        target_mint_supply: u64,
        reserve_balance: u64,
    ) -> u64;
    fn max_creator_unlock_now(&self, target_mint_supply: u128) -> u64;
    fn max_creator_unlock_ever(&self) -> u64;
}
