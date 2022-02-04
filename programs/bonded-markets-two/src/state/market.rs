use anchor_lang::prelude::*;
use std::convert::TryFrom;

/*
1. max supply = max avail to purchase from the curve
make sure they aren't passing in too big of max supply to exceed u64 max
less than 100 bill? idk
*/

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
//22
//1
//= 225

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct CurveConfig {
    pub reserve_ratio: u8,
    pub initial_price: u64,
    pub initial_slope: u32,
    pub max_supply: Option<u64>,
}
//size = 22

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct Creator {
    pub wallet: Pubkey,
    pub share: u16, //percentage out of 10000 aka basis points
    pub targets_unlocked: u64,
}
//32 + 4 + 8 = 44

#[derive(Copy, Clone, Default, AnchorSerialize, AnchorDeserialize)]
pub struct Pda {
    pub address: Pubkey,
    pub bump: u8,
}
//size = 33
impl MarketMath for Market {
    //quanitity of outstanding supply sold by the curve
    fn curve_sales(&self, target_mint_supply: u64) -> u64 {
        target_mint_supply
            .checked_sub(self.creator.targets_unlocked)
            .unwrap()
    }
    fn support_balance(&self, curve_sales: u64) -> u64 {
        self.curve_config
            .initial_price
            .checked_mul(curve_sales)
            .unwrap()
    }
    fn curve_balance(&self, curve_sales: u64, reserve_balance: u64) -> u64 {
        reserve_balance
            .checked_sub(self.support_balance(curve_sales))
            .unwrap()
    }
    fn support_value(&self, targets: u64) -> u64 {
        targets
            .checked_mul(self.curve_config.initial_price)
            .unwrap()
    }
    //TRASH MATH SECTION

    //reserve value = reserve_ratio * slope * targets^(1/reserve_ratio)
    fn reserve_value_on_zero_buy(&self, targets: u32) -> u64 {
        let reserve_ratio = self.curve_config.reserve_ratio as f64 / 100.0;
        let initial_slope = self.curve_config.initial_slope as f64 / 10_000_000.0;
        let value = reserve_ratio
            * initial_slope
            * f64::try_from(targets).unwrap().powf(1.0 / reserve_ratio);
        msg!("value is {}", value);
        value as u64
    }

    //reserveValue = curveBalance * ((1 + targets / curveSupply)^(1/reserveRatio) - 1)
    fn reserve_value_on_seeded_buy(
        &self,
        targets: u64,
        target_mint_supply: u64,
        reserve_balance: u64,
    ) -> u64 {
        let curve_sales = self.curve_sales(target_mint_supply);
        let curve_balance = self.curve_balance(curve_sales, reserve_balance);
        msg!("curve balance: {}", curve_balance);
        let base = 1 + targets / curve_sales;
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
        let curve_sales = self.curve_sales(target_mint_supply);
        let curve_balance = self.curve_balance(curve_sales, reserve_balance);
        msg!("curve balance: {}", curve_balance);
        let base = 1 - targets / curve_sales;
        msg!("base {}", base);
        let ex = 1 - base.pow(100 / self.curve_config.reserve_ratio as u32);
        msg!("ex: {}", ex);
        let whole = curve_balance * ex;
        msg!("whole: {}", whole);
        whole.checked_add(self.support_value(targets)).unwrap(); //computes to zero bc of trash math
        1 //returning 1 as a stand-in
    }
    fn max_creator_unlock_now(&self, target_mint_supply: u128) -> u64 {
        let creator_share = u128::from(self.creator.share);
        let max =
            u64::try_from(creator_share.checked_mul(target_mint_supply).unwrap() / 10000).unwrap();
        msg!(
            "max unlock now {} for target supply {}",
            max,
            target_mint_supply
        );
        max
    }
    fn max_creator_unlock_ever(&self) -> u64 {
        let max_supply = u128::from(self.curve_config.max_supply.unwrap_or(0));
        let creator_share = u128::from(self.creator.share);
        let max = u64::try_from(max_supply * creator_share / 10000).unwrap();
        msg!("max unlock ever {} ", max,);
        max
    }
}

pub trait MarketMath {
    fn curve_sales(&self, target_mint_supply: u64) -> u64;
    fn support_balance(&self, curve_sales: u64) -> u64;
    fn curve_balance(&self, curve_sales: u64, reserve_balance: u64) -> u64;
    fn support_value(&self, targets: u64) -> u64;
    fn reserve_value_on_zero_buy(&self, targets: u32) -> u64;
    fn reserve_value_on_seeded_buy(
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
