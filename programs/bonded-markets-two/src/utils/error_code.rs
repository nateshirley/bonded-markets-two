use anchor_lang::prelude::*;
#[error]
pub enum ErrorCode {
    #[msg("curve does not exist")]
    CurveDoesNotExist,
    #[msg("market patrol not canonical bump")]
    InvalidMarketPatrol,
    #[msg("creator trying to unlock beyond max amount")]
    GreedyCreatorUnlock,
}
