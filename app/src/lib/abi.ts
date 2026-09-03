// 由 contracts/scripts/compile.mjs 生成，不要手改

export const daziescrowAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sbtAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BadDeadline",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BadDeposit",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BadStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlineNotPassed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlinePassed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotArbiter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PayoutFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SelfMatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongCode",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "who",
        "type": "address"
      }
    ],
    "name": "CheckedIn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "breacher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "toKeeper",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "toSafetyFund",
        "type": "uint256"
      }
    ],
    "name": "Slashed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      }
    ],
    "name": "TeamCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "host",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "scene",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deposit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "meetAt",
        "type": "uint64"
      }
    ],
    "name": "TeamCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "raisedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "TeamDisputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      }
    ],
    "name": "TeamExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "guest",
        "type": "address"
      }
    ],
    "name": "TeamJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "hostKept",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "guestKept",
        "type": "bool"
      }
    ],
    "name": "TeamResolved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COMPENSATION_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLASH_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "arbiter",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "counterpartCode",
        "type": "string"
      }
    ],
    "name": "checkIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "scene",
        "type": "uint8"
      },
      {
        "internalType": "uint64",
        "name": "meetAt",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "checkinDeadline",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
      }
    ],
    "name": "createTeam",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
      }
    ],
    "name": "joinTeam",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "raiseDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hostKept",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "guestKept",
        "type": "bool"
      }
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "safetyFund",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sbt",
    "outputs": [
      {
        "internalType": "contract IDaziSBT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      }
    ],
    "name": "settleAfterDeadline",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "teamCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "teams",
    "outputs": [
      {
        "internalType": "address",
        "name": "host",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "guest",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "scene",
        "type": "uint8"
      },
      {
        "internalType": "enum DaziEscrow.Status",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "hostCheckedIn",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "guestCheckedIn",
        "type": "bool"
      },
      {
        "internalType": "uint96",
        "name": "deposit",
        "type": "uint96"
      },
      {
        "internalType": "uint64",
        "name": "meetAt",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "checkinDeadline",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "hostCodeHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "guestCodeHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "who",
        "type": "address"
      }
    ],
    "name": "teamsOf",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const dazisbtAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "MinterAlreadySet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoSuchToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotMinter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Soulbound",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Locked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "locked",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "scene",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "kept",
        "type": "bool"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minter",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "records",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "teamId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "scene",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "kept",
        "type": "bool"
      },
      {
        "internalType": "uint64",
        "name": "mintedAt",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "recordsOf",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "ids",
        "type": "uint256[]"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "teamId",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "scene",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "kept",
            "type": "bool"
          },
          {
            "internalType": "uint64",
            "name": "mintedAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct DaziSBT.Record[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "escrow",
        "type": "address"
      }
    ],
    "name": "setMinter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;
