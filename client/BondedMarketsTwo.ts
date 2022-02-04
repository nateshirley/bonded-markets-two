export type BondedMarketsTwo = {
  "version": "0.1.0",
  "name": "bonded_markets_two",
  "instructions": [
    {
      "name": "createMarket",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "attribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "reserveMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "patrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marketBump",
          "type": "u8"
        },
        {
          "name": "attributionBump",
          "type": "u8"
        },
        {
          "name": "reserveBump",
          "type": "u8"
        },
        {
          "name": "patrolBump",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "curveConfig",
          "type": {
            "defined": "CurveConfig"
          }
        },
        {
          "name": "creatorShare",
          "type": "u16"
        }
      ]
    },
    {
      "name": "buy",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "buyerReserveTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketReserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sell",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellerReserveTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketReserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockCreatorShare",
      "accounts": [
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "creator",
            "type": {
              "defined": "Creator"
            }
          },
          {
            "name": "curveConfig",
            "type": {
              "defined": "CurveConfig"
            }
          },
          {
            "name": "targetMint",
            "type": "publicKey"
          },
          {
            "name": "reserveMint",
            "type": "publicKey"
          },
          {
            "name": "reserve",
            "type": {
              "defined": "Pda"
            }
          },
          {
            "name": "patrol",
            "type": {
              "defined": "Pda"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "marketAttribution",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetMint",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CurveConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reserveRatio",
            "type": "u8"
          },
          {
            "name": "initialPrice",
            "type": "u64"
          },
          {
            "name": "initialSlope",
            "type": "u32"
          },
          {
            "name": "maxSupply",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "Creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "share",
            "type": "u16"
          },
          {
            "name": "targetsUnlocked",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Pda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CurveDoesNotExist",
      "msg": "curve does not exist"
    },
    {
      "code": 6001,
      "name": "InvalidMarketPatrol",
      "msg": "market patrol not canonical bump"
    },
    {
      "code": 6002,
      "name": "GreedyCreatorUnlock",
      "msg": "creator trying to unlock beyond max amount"
    },
    {
      "code": 6003,
      "name": "ExcessiveCreatorShare",
      "msg": "creator share must be <= 40% aka 4000"
    },
    {
      "code": 6004,
      "name": "InfiniteSupplyRequiresZeroCreatorShare",
      "msg": "creator share must be 0 if using infinite supply"
    },
    {
      "code": 6005,
      "name": "BuyExceedsMaxCurveSupply",
      "msg": "buying this amount will exceed the market's max supply"
    },
    {
      "code": 6006,
      "name": "ZeroTargetSale",
      "msg": "selling for zero return. below curve minimum"
    },
    {
      "code": 6007,
      "name": "ZeroTargetBuy",
      "msg": "buying zero targets, likely hit max supply"
    }
  ]
};

export const IDL: BondedMarketsTwo = {
  "version": "0.1.0",
  "name": "bonded_markets_two",
  "instructions": [
    {
      "name": "createMarket",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "attribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "reserveMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "patrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marketBump",
          "type": "u8"
        },
        {
          "name": "attributionBump",
          "type": "u8"
        },
        {
          "name": "reserveBump",
          "type": "u8"
        },
        {
          "name": "patrolBump",
          "type": "u8"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "curveConfig",
          "type": {
            "defined": "CurveConfig"
          }
        },
        {
          "name": "creatorShare",
          "type": "u16"
        }
      ]
    },
    {
      "name": "buy",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "buyerReserveTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketReserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sell",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellerReserveTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketReserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockCreatorShare",
      "accounts": [
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketTargetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTargetTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketPatrol",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "targets",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "creator",
            "type": {
              "defined": "Creator"
            }
          },
          {
            "name": "curveConfig",
            "type": {
              "defined": "CurveConfig"
            }
          },
          {
            "name": "targetMint",
            "type": "publicKey"
          },
          {
            "name": "reserveMint",
            "type": "publicKey"
          },
          {
            "name": "reserve",
            "type": {
              "defined": "Pda"
            }
          },
          {
            "name": "patrol",
            "type": {
              "defined": "Pda"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "marketAttribution",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetMint",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CurveConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reserveRatio",
            "type": "u8"
          },
          {
            "name": "initialPrice",
            "type": "u64"
          },
          {
            "name": "initialSlope",
            "type": "u32"
          },
          {
            "name": "maxSupply",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "Creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "share",
            "type": "u16"
          },
          {
            "name": "targetsUnlocked",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Pda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CurveDoesNotExist",
      "msg": "curve does not exist"
    },
    {
      "code": 6001,
      "name": "InvalidMarketPatrol",
      "msg": "market patrol not canonical bump"
    },
    {
      "code": 6002,
      "name": "GreedyCreatorUnlock",
      "msg": "creator trying to unlock beyond max amount"
    },
    {
      "code": 6003,
      "name": "ExcessiveCreatorShare",
      "msg": "creator share must be <= 40% aka 4000"
    },
    {
      "code": 6004,
      "name": "InfiniteSupplyRequiresZeroCreatorShare",
      "msg": "creator share must be 0 if using infinite supply"
    },
    {
      "code": 6005,
      "name": "BuyExceedsMaxCurveSupply",
      "msg": "buying this amount will exceed the market's max supply"
    },
    {
      "code": 6006,
      "name": "ZeroTargetSale",
      "msg": "selling for zero return. below curve minimum"
    },
    {
      "code": 6007,
      "name": "ZeroTargetBuy",
      "msg": "buying zero targets, likely hit max supply"
    }
  ]
};
