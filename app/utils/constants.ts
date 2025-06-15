export const ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_platformTreasury",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "booster",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "boosterDeposit",
          "type": "uint256"
        }
      ],
      "name": "OrderAccepted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "cancelledBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "penaltyAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "penaltyReceiver",
          "type": "address"
        }
      ],
      "name": "OrderCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "platformFee",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "boosterReward",
          "type": "uint256"
        }
      ],
      "name": "OrderCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "childContract",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalAmountLocked",
          "type": "uint256"
        }
      ],
      "name": "OrderConfirmed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "playerDeposit",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "gameType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "gameMode",
          "type": "string"
        }
      ],
      "name": "OrderCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "playerRefund",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "penaltyToPlayer",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "penaltyToPlatform",
          "type": "uint256"
        }
      ],
      "name": "OrderFailed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [],
      "name": "BASIS_POINTS",
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
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "acceptOrder",
      "outputs": [],
      "stateMutability": "payable",
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
      "name": "boosterOrders",
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
          "name": "_totalAmount",
          "type": "uint256"
        }
      ],
      "name": "calculateDeposit",
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
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "cancelOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "completeOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "confirmOrder",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_totalAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_deadline",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_gameType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_gameMode",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_requirements",
          "type": "string"
        }
      ],
      "name": "createOrder",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "depositRate",
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
      "name": "emergencyWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "failOrder",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_booster",
          "type": "address"
        }
      ],
      "name": "getBoosterOrders",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_orderId",
          "type": "uint256"
        }
      ],
      "name": "getOrder",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "orderId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "booster",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "totalAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "playerDeposit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "boosterDeposit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "remainingAmount",
              "type": "uint256"
            },
            {
              "internalType": "enum BoostChainMainContract.OrderStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "childContract",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "acceptedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "confirmedAt",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "gameType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "gameMode",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "requirements",
              "type": "string"
            }
          ],
          "internalType": "struct BoostChainMainContract.Order",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerOrders",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "orderCounter",
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
      "name": "orders",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "orderId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "booster",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "playerDeposit",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "boosterDeposit",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "remainingAmount",
          "type": "uint256"
        },
        {
          "internalType": "enum BoostChainMainContract.OrderStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "childContract",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "acceptedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "confirmedAt",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "gameType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "gameMode",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "requirements",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
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
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
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
      "inputs": [],
      "name": "penaltyToPlatformRate",
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
      "name": "penaltyToVictimRate",
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
      "name": "platformFeeRate",
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
      "name": "platformTreasury",
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
      "name": "playerOrders",
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
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newRate",
          "type": "uint256"
        }
      ],
      "name": "setDepositRate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newRate",
          "type": "uint256"
        }
      ],
      "name": "setPlatformFeeRate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newTreasury",
          "type": "address"
        }
      ],
      "name": "setPlatformTreasury",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ]