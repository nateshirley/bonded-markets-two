use anchor_lang::prelude::*;
#[error]
pub enum ErrorCode {
    #[msg("curve does not exist")]
    CurveDoesNotExist,
    #[msg("market patrol not canonical bump")]
    InvalidMarketPatrol,
    #[msg("creator trying to unlock beyond max amount")]
    GreedyCreatorUnlock,
    #[msg("creator share must be <= 40% aka 4000")]
    ExcessiveCreatorShare,
    #[msg("creator share must be 0 if using infinite supply")]
    InfiniteSupplyRequiresZeroCreatorShare,
    #[msg("buying this amount will exceed the market's max supply")]
    BuyExceedsMaxSupply,
    #[msg("selling this amount will go below the market's min supply")]
    SellBelowMinSupply,
}
