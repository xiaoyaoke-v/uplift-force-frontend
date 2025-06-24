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

// Order status mapping
export const ORDER_STATUSES: Record<string, { color: string; text: string }> = {
  posted: { color: "blue", text: "Posted" },
  accepted: { color: "orange", text: "Accepted" },
  confirmed: { color: "cyan", text: "Confirmed" },
  in_progress: { color: "processing", text: "In Progress" },
  completed: { color: "success", text: "Completed" },
  cancelled: { color: "default", text: "Cancelled" },
  failed: { color: "error", text: "Failed" },
};

// Game types mapping
export const GAME_TYPES: Record<string, { shortName: string; color: string; icon: string }> = {
  "League of Legends": {
    shortName: "LoL",
    color: "#C8AA6E",
    icon: "🏆",
  },
  Valorant: {
    shortName: "Val",
    color: "#FF4654",
    icon: "🎯",
  },
  "Honor of Kings": {
    shortName: "HoK",
    color: "#1E90FF",
    icon: "👑",
  },
  "Genshin Impact": {
    shortName: "GI",
    color: "#4A90E2",
    icon: "⚔️",
  },
  "World of Warcraft": {
    shortName: "WoW",
    color: "#F4C430",
    icon: "🐉",
  },
  "Diablo IV": {
    shortName: "D4",
    color: "#8B0000",
    icon: "🔥",
  },
};

// Service type mapping
export const SERVICE_TYPES: Record<string, string> = {
  Boosting: "Boosting",
  "PLAY WITH": "Play With",
};

// Game mode mapping
export const GAME_MODES: Record<string, string> = {
  RANKED_SOLO_5x5: "Solo Queue",
  RANKED_FLEX_SR: "Flex Queue",
};

// Rank order for sorting and comparison
export const RANK_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

// Game server regions
export const regionOptions = [
  { label: "BR1", value: "BR1" },
  { label: "EUN1", value: "EUN1" },
  { label: "EUW1", value: "EUW1" },
  { label: "JP1", value: "JP1" },
  { label: "KR", value: "KR" },
  { label: "LA1", value: "LA1" },
  { label: "LA2", value: "LA2" },
  { label: "ME1", value: "ME1" },
  { label: "NA1", value: "NA1" },
  { label: "OC1", value: "OC1" },
  { label: "RU", value: "RU" },
  { label: "SG2", value: "SG2" },
  { label: "TR1", value: "TR1" },
  { label: "TW2", value: "TW2" },
  { label: "VN2", value: "VN2" },
];

// List of supported games
export const games = [
  { name: "League of Legends", imagePath: "/assets/lol.jpg" },
  {
    name: "Honor of Kings",
    imagePath: "/assets/zympYphpKVhaHN1685523686230531.png",
  },
  {
    name: "LoL Mobile",
    imagePath: "/assets/lS2IgphpoLR7Nz1627293846210726.png",
  },
  {
    name: "Genshin Impact",
    imagePath: "/assets/U0lBQphpIpZJ4r1691047295230803.png",
  },
  {
    name: "Naruto Online",
    imagePath: "/assets/YRWCFphpsLACiz1609212217201229.jpg",
  },
  { name: "Valorant", imagePath: "/assets/w8eVLphpkcD8vY1688004090230629.jpg" },
  { name: "Diablo Ⅳ", imagePath: "/assets/diablo.jpg" },
  { name: "World of Warcraft", imagePath: "/assets/wow.jpg" },
];