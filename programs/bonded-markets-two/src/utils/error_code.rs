use anchor_lang::prelude::*;
#[error]
pub enum ErrorCode {
    #[msg("curve does not exist")]
    CurveDoesNotExist,
    #[msg("market patrol not canonical bump")]
    InvalidMarketPatrol,
}
