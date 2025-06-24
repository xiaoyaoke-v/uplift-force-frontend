"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Spin,
  Space,
  Tag,
  Modal,
  Modal as AntdModal,
  Select as AntdSelect,
} from "antd";
import {
  TrophyOutlined,
  SafetyOutlined,
  DollarOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  getPlayerOrders,
  submitOrder,
  getPlayerInfo,
  createOrder,
  ICreateOrderParam,
} from "@/apis";
import type { IPlayerInfo, IPlayerAccount } from "@/apis";
import GameCard from "@/components/ui/GameCard";
import PromoCard from "@/components/ui/PromoCard";
import type { Game } from "@/types";
import {
  parseEther,
  parseAbi,
  createPublicClient,
  createWalletClient,
  custom,
  ContractFunctionExecutionError,
} from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { mainnet, sepolia, hardhat, arbitrum } from "viem/chains";

const { Option } = Select;

interface Order {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  boosterId?: string;
}

const games: Game[] = [
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

const regionOptions = [
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

const RANK_ORDER = [
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

// 添加 Avalanche Fuji 链定义
const avalancheFuji = {
  id: 43113,
  name: "Avalanche Fuji Testnet",
  network: "avalanche-fuji",
  nativeCurrency: {
    decimals: 18,
    name: "AVAX",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  },
};

const chainMap = {
  1: mainnet, // 以太坊主网
  11155111: sepolia, // Sepolia 测试网
  31337: hardhat, // Hardhat 本地网络
  42161: arbitrum, // Arbitrum One
  43113: avalancheFuji, // Avalanche Fuji 测试网
};

export default function PlayerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address } = useAccount();

  // 表单相关状态
  const [selectedGame, setSelectedGame] = useState<string>("League of Legends");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [riotId, setRiotId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<IPlayerAccount | null>(null);
  const [playerError, setPlayerError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string>("Boosting");
  const [targetRank, setTargetRank] = useState<string | null>(null);
  const [extraInfo, setExtraInfo] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [publicClient, setPublicClient] = useState<any>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  // 新增：截止日期相关状态
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 初始化客户端
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
      setPublicClient(publicClient);
      setWalletClient(walletClient);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (user.role !== "player") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === "player") {
      fetchOrders();
    }
  }, [user]);

  // 获取当前链配置的函数
  const getCurrentChain = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const numericChainId = parseInt(chainId, 16);

        console.log("当前链ID:", numericChainId);

        const chain = chainMap[numericChainId];
        if (!chain) {
          console.warn(`不支持的链ID: ${numericChainId}`);
          // 返回默认链或者抛出错误
          return sepolia; // 或者你的默认链
        }

        return chain;
      } catch (error) {
        console.error("获取链ID失败:", error);
        return sepolia; // 默认链
      }
    }
    return sepolia; // 默认链
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetchedOrders = await getPlayerOrders(user!.id);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSearchPlayer = async () => {
    if (!riotId || !selectedRegion) return;

    setSearchLoading(true);
    setPlayerInfo(null);
    setPlayerError("");
    setSelectedIdx(null);
    setTargetRank(null);
    setPrice(null);

    try {
      const params: IPlayerInfo = {
        characterName: riotId,
        tagLine: selectedRegion,
      };
      const res = await getPlayerInfo(params);
      console.log("Player Info:", res);
      if (res.leagueCount === 0) {
        setPlayerError("No player information found");
      } else {
        setPlayerInfo(res);
      }
    } catch (e) {
      console.error("Search player failed:", e);
      setPlayerError("No player information found");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRankSelection = (idx: number) => {
    setSelectedIdx(idx);
    if (playerInfo && playerInfo.leagueEntries[idx]) {
      const currentTier =
        playerInfo.leagueEntries[idx].tier?.toUpperCase() || "IRON";
      const currentTierIdx = RANK_ORDER.indexOf(currentTier);
      setTargetRank(null);
      setPrice(null);
    }
  };

  // 新增：将日期转换为Unix时间戳的函数
  const getDeadlineTimestamp = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999); // 设置为当天的23:59:59
    return Math.floor(date.getTime() / 1000); // 转换为秒级时间戳
  };

  // 新增：生成可选日期选项（从明天开始的30天）
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      const displayString = date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      options.push({ value: dateString, label: displayString });
    }
    return options;
  };

  const handleCreateOrderOnChain = async () => {
    if (
      !playerInfo ||
      selectedIdx === null ||
      !targetRank ||
      !price ||
      !publicClient ||
      !walletClient ||
      !selectedDate
    ) {
      console.error(
        "Missing required order information or clients not initialized"
      );
      setMessage("Missing required information or wallet not connected");
      return;
    }

    setPlacingOrder(true);
    setMessage("Preparing transaction...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_CREATE_ORDER_ABI || "";

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
        console.log("Parsed ABI:", contractAbi);
      } catch (error) {
        console.error("Error parsing ABI:", error);
        setMessage("Invalid ABI JSON format");
        setPlacingOrder(false);
        return;
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or ABI is not defined");
        setMessage("Contract configuration error");
        setPlacingOrder(false);
        return;
      }

      // 准备合约参数
      const currentRank = getCurrentRank();
      const totalAmount = parseEther(price.toString()); // 将 AVAX 转换为 wei
      const partialAmount = (totalAmount * 15n) / 100n;
      const deadline = getDeadlineTimestamp(selectedDate); // 使用用户选择的日期
      const gameType = selectedGame;
      const gameMode = playerInfo.leagueEntries[selectedIdx].queueType;
      const requirements = extraInfo || "No additional requirements"; // 直接使用用户输入

      console.log("Contract call parameters:", {
        totalAmount: totalAmount.toString(),
        deadline,
        gameType,
        gameMode,
        requirements,
      });

      setMessage("Simulating transaction...");

      const currentChain = await getCurrentChain();
      // 模拟合约调用
      const { request } = await publicClient.simulateContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "createOrder",
        args: [
          totalAmount, // uint256 _totalAmount
          deadline, // uint256 _deadline
          gameType, // string memory _gameType
          gameMode, // string memory _gameMode
          requirements, // string memory _requirements
        ],
        account: address,
        value: partialAmount, // 发送对应的 AVAX
        chain: currentChain,
      });

      console.log("模拟成功，可以继续执行交易");

      setMessage("Sending transaction...");

      // 执行合约调用
      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "createOrder",
        args: [
          totalAmount, // uint256 _totalAmount
          deadline, // uint256 _deadline
          gameType, // string memory _gameType
          gameMode, // string memory _gameMode
          requirements, // string memory _requirements
        ],
        account: address,
        value: partialAmount, // 发送对应的 AVAX
        chain: currentChain,
      });

      console.log("Transaction hash:", txHash);
      setMessage(`Transaction sent: ${txHash}. Waiting for confirmation...`);

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1, // 等待1个确认
      });

      console.log("Transaction receipt:", receipt);

      if (receipt.status === "success") {
        setMessage("Transaction confirmed! Creating order record...");

        // 准备后端订单数据
        const orderData: ICreateOrderParam = {
          game_type: selectedGame,
          server_region: selectedRegion,
          game_account: riotId,
          game_mode: gameMode,
          service_type: selectedService,
          current_rank: currentRank || "",
          target_rank: targetRank,
          PUUID: playerInfo.summoner.puuid || "",
          requirements: extraInfo || undefined,
          total_amount: price.toString(),
          deadline: deadline.toString(),
          tx_hash: txHash,
        };

        console.log("Creating order with data:", orderData);

        try {
          // 调用后端创建订单
          await createOrder(orderData);
          setMessage("Order created successfully!");

          // 刷新订单列表
          await fetchOrders();

          // 成功后关闭弹窗并重置状态，然后显示成功提示
          setTimeout(() => {
            setIsModalOpen(false);
            setRiotId("");
            setPlayerInfo(null);
            setSelectedIdx(null);
            setTargetRank(null);
            setExtraInfo("");
            setPrice(null);
            setPlayerError("");
            setSelectedRegion("");
            setSelectedDate("");
            setMessage("");

            // 显示成功提示
            setShowSuccessModal(true);

            // 3秒后自动关闭成功提示
            setTimeout(() => {
              setShowSuccessModal(false);
            }, 3000);
          }, 1500);
        } catch (backendError) {
          console.error("Backend order creation failed:", backendError);
          setMessage(
            `Order record creation failed: ${backendError.message || "Unknown error"}`
          );
        }
      } else {
        setMessage("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error creating order on chain:", error);
      setMessage(`Error: ${error.message || "Failed to create order"}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  const calculatePrice = () => {
    if (!targetRank || selectedIdx === null || !playerInfo) return;

    const currentTier =
      playerInfo.leagueEntries[selectedIdx].tier?.toUpperCase() || "IRON";
    const fromIdx = RANK_ORDER.indexOf(currentTier);
    const toIdx = RANK_ORDER.indexOf(targetRank);
    const diff = Math.max(0, toIdx - fromIdx);
    const calculatedPrice = diff * 0.002;
    setPrice(calculatedPrice);
  };

  const getCurrentRank = () => {
    if (!playerInfo || selectedIdx === null) return null;
    return playerInfo.leagueEntries[selectedIdx].tier?.toUpperCase() || "IRON";
  };

  const getCurrentRankIndex = () => {
    const currentRank = getCurrentRank();
    if (!currentRank) return -1;
    return RANK_ORDER.indexOf(currentRank);
  };

  const getRankButtonStyle = (rank: string, index: number) => {
    const currentRankIdx = getCurrentRankIndex();
    const isCurrentRank = index === currentRankIdx;
    const isBelowCurrent = index < currentRankIdx;
    const isAboveCurrent = index > currentRankIdx;
    const isSelected = targetRank === rank;

    if (isCurrentRank) {
      // 当前段位 - 高亮显示但不可选
      return {
        className:
          "relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gradient-to-br from-yellow-600/60 to-orange-600/60 border-yellow-400 text-white cursor-not-allowed",
        disabled: true,
        label: "(CURRENT)",
      };
    } else if (isBelowCurrent) {
      // 低于当前段位 - 灰色不可选
      return {
        className:
          "relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-800/40 border-gray-700/50 text-gray-500 cursor-not-allowed opacity-50",
        disabled: true,
        label: "",
      };
    } else if (isAboveCurrent && isSelected) {
      // 高于当前段位且被选中
      return {
        className:
          "relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gradient-to-br from-pink-600/50 to-purple-600/50 border-pink-400 text-white shadow-lg shadow-pink-400/30 transform scale-105",
        disabled: false,
        label: "",
      };
    } else if (isAboveCurrent) {
      // 高于当前段位但未选中 - 可选择
      return {
        className:
          "relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-pink-400/70 hover:bg-pink-900/20 cursor-pointer",
        disabled: false,
        label: "",
      };
    }

    // 默认情况（如果没有选择当前段位）
    return {
      className:
        "relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-pink-400/70 hover:bg-pink-900/20 cursor-pointer",
      disabled: false,
      label: "",
    };
  };

  useEffect(() => {
    if (targetRank) {
      calculatePrice();
    }
  }, [targetRank, selectedIdx, playerInfo]);

  if (!user || user.role !== "player") {
    return <p>Access Denied or Loading User Data...</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Sidebar role={user.role as "player" | "booster"} />
      <main className="ml-52 flex-1 flex flex-col items-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] px-4 py-8">
        <div className="w-full max-w-none">
          {" "}
          {/* 移除宽度限制 */}
          {/* Promotional Sections */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Enhance Your Gaming Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <PromoCard
                icon={
                  <TrophyOutlined
                    style={{ fontSize: "48px", color: "#6ee7b7" }}
                  />
                }
                title="Professional Boosting"
                description="Experienced players help you rank up quickly and break through bottlenecks."
              />
              <PromoCard
                icon={
                  <SafetyOutlined
                    style={{ fontSize: "48px", color: "#3b82f6" }}
                  />
                }
                title="Safe & Reliable"
                description="Privacy protection and secure transactions for peace of mind."
              />
              <PromoCard
                icon={
                  <DollarOutlined
                    style={{ fontSize: "48px", color: "#9333ea" }}
                  />
                }
                title="Great Value"
                description="Reasonable prices and efficient service to help you achieve your goals."
              />
              <PromoCard
                icon={
                  <RocketOutlined
                    style={{ fontSize: "48px", color: "#e7b76e" }}
                  />
                }
                title="Fast Response"
                description="Quick matching and instant start to save your valuable time."
              />
            </div>
          </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Our Advantages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <PromoCard
                icon={
                  <TrophyOutlined
                    style={{ fontSize: "48px", color: "#e76e6e" }}
                  />
                }
                title="Top Players"
                description="Only the highest-level players are selected to ensure your experience."
              />
              <PromoCard
                icon={
                  <SafetyOutlined
                    style={{ fontSize: "48px", color: "#6ee7b7" }}
                  />
                }
                title="24/7 Support"
                description="Customer service is online around the clock to solve your problems at any time."
              />
              <PromoCard
                icon={
                  <DollarOutlined
                    style={{ fontSize: "48px", color: "#3b82f6" }}
                  />
                }
                title="Transparent Progress"
                description="View your order progress in real time, everything is under control."
              />
              <PromoCard
                icon={
                  <RocketOutlined
                    style={{ fontSize: "48px", color: "#9333ea" }}
                  />
                }
                title="Customized Service"
                description="Personalized boosting plans tailored to your needs."
              />
            </div>
          </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Popular Games Covered
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              {games.map((game) => (
                <Card
                  key={game.name}
                  className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg"
                >
                  <GameCard game={game} />
                </Card>
              ))}
            </div>
          </div>
          <div className="text-center mt-12">
            <Button
              type="primary"
              size="large"
              className="!bg-gradient-to-r !from-[#3b82f6] !to-[#9333ea] !text-white !font-extrabold !text-base !rounded-xl !py-5 !px-12 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              Order Now
            </Button>
          </div>
          {/* 赛博朋克风格表单弹窗 */}
          <Modal
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setRiotId("");
              setPlayerInfo(null);
              setSelectedIdx(null);
              setTargetRank(null);
              setExtraInfo("");
              setPrice(null);
              setPlayerError("");
              setSelectedRegion("");
              setSelectedDate("");
              setMessage("");
            }}
            footer={null}
            centered
            width={900}
            style={{ maxHeight: "90vh" }}
            bodyStyle={{
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "0",
              background:
                "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)",
              borderRadius: "16px",
              /* 隐藏滚动条但保持可滚动 */
              scrollbarWidth: "none" /* Firefox */,
              msOverflowStyle: "none" /* IE and Edge */,
            }}
            className="cyber-modal"
            maskStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="relative overflow-hidden">
              {/* 赛博朋克背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>

              {/* 标题 */}
              <div className="relative p-6 border-b border-cyan-500/30">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider">
                  ⚡ BOOST PROTOCOL ⚡
                </h2>
                <div className="text-center text-sm text-cyan-300/70 mt-2">
                  INITIALIZE RANK ENHANCEMENT SEQUENCE
                </div>
              </div>

              <div className="relative p-8 space-y-8">
                {/* 游戏选择 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                    <h3 className="text-xl font-bold text-cyan-300 tracking-wider">
                      SELECT GAME UNIVERSE
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {games.map((game) => {
                      const disabled = game.name !== "League of Legends";
                      return (
                        <button
                          key={game.name}
                          className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                            disabled
                              ? "bg-gray-900/50 border-gray-700/50 cursor-not-allowed opacity-40"
                              : selectedGame === game.name
                                ? "bg-gradient-to-br from-cyan-900/50 to-purple-900/50 border-cyan-400 shadow-lg shadow-cyan-400/30 transform scale-105"
                                : "bg-gray-900/30 border-gray-600/50 hover:border-purple-400/70 hover:bg-purple-900/20"
                          }`}
                          disabled={disabled}
                          onClick={() =>
                            !disabled && setSelectedGame(game.name)
                          }
                        >
                          <img
                            src={game.imagePath}
                            alt={game.name}
                            className="w-12 h-12 object-cover rounded-lg mb-2"
                          />
                          <span className="text-sm font-medium text-center text-gray-300">
                            {game.name}
                          </span>
                          {selectedGame === game.name && !disabled && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 服务器选择 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500"></div>
                    <h3 className="text-xl font-bold text-purple-300 tracking-wider">
                      SELECT REGION NODE
                    </h3>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {regionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`relative py-3 px-2 rounded-lg border-2 font-bold transition-all duration-300 ${
                          selectedRegion === opt.value
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg shadow-pink-400/30 transform scale-105"
                            : "bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-purple-400/70 hover:bg-purple-900/20 hover:text-purple-300"
                        }`}
                        onClick={() => setSelectedRegion(opt.value)}
                      >
                        {opt.label}
                        {selectedRegion === opt.value && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 玩家信息查询 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-orange-500"></div>
                    <h3 className="text-xl font-bold text-pink-300 tracking-wider">
                      PLAYER IDENTIFICATION
                    </h3>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="ENTER RIOT ID..."
                        value={riotId}
                        onChange={(e) => setRiotId(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900/60 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:bg-gray-900/80 outline-none transition-all font-mono tracking-wider"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400">
                        {riotId && "●"}
                      </div>
                    </div>
                    <button
                      onClick={handleSearchPlayer}
                      disabled={searchLoading || !riotId || !selectedRegion}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold tracking-wider hover:from-blue-600 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/30"
                    >
                      {searchLoading ? "SCANNING..." : "SCAN PLAYER"}
                    </button>
                  </div>

                  {playerError && (
                    <div className="text-red-400 text-center py-4 bg-red-900/20 border border-red-500/30 rounded-lg font-mono">
                      ERROR: {playerError}
                    </div>
                  )}

                  {playerInfo && (
                    <div className="bg-gradient-to-br from-gray-900/60 to-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                      <div className="text-center text-2xl font-bold mb-6 text-cyan-300 tracking-wider">
                        PLAYER: {playerInfo.summoner.gameName}
                      </div>
                      <div className="mb-4">
                        <h4 className="font-bold mb-4 text-purple-300 tracking-wider">
                          SELECT CURRENT RANK
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {playerInfo.leagueEntries.map((entry, idx) => {
                            const tier =
                              entry.tier?.toUpperCase() || "UNRANKED";
                            const isSelected = selectedIdx === idx;
                            return (
                              <div
                                key={entry.queueType}
                                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? "bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-cyan-400 shadow-lg shadow-cyan-400/30 transform scale-105"
                                    : "bg-gray-900/40 border-gray-600/50 hover:border-purple-400/70 hover:bg-purple-900/20"
                                }`}
                                onClick={() => handleRankSelection(idx)}
                              >
                                <div className="text-center">
                                  <div className="font-bold text-sm mb-3 text-purple-300 tracking-wider">
                                    {entry.queueType}
                                  </div>
                                  <div className="text-xl font-bold text-cyan-300">
                                    {entry.tier} {entry.rank}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 服务类型选择 */}
                {playerInfo && selectedIdx !== null && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-500"></div>
                      <h3 className="text-xl font-bold text-orange-300 tracking-wider">
                        SELECT SERVICE PROTOCOL
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <button
                        className={`relative py-6 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${
                          selectedService === "Boosting"
                            ? "bg-gradient-to-br from-orange-600/50 to-red-600/50 border-orange-400 text-white shadow-lg shadow-orange-400/30 transform scale-105"
                            : "bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-orange-400/70 hover:bg-orange-900/20"
                        }`}
                        onClick={() => setSelectedService("Boosting")}
                      >
                        RANK BOOSTING
                        {selectedService === "Boosting" && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                      <button
                        className="py-6 rounded-xl font-bold text-lg border-2 bg-gray-900/20 border-gray-700/30 text-gray-500 cursor-not-allowed relative overflow-hidden"
                        disabled
                      >
                        <span className="relative z-10">PLAY WITH</span>
                        <div className="absolute inset-0 bg-red-900/20"></div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 目标段位选择 - 修改后的版本 */}
                {playerInfo && selectedIdx !== null && selectedService && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-pink-500"></div>
                      <h3 className="text-xl font-bold text-red-300 tracking-wider">
                        TARGET RANK PROTOCOL
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {RANK_ORDER.map((rank, index) => {
                        const style = getRankButtonStyle(rank, index);
                        return (
                          <button
                            key={rank}
                            className={style.className}
                            disabled={style.disabled}
                            onClick={() =>
                              !style.disabled && setTargetRank(rank)
                            }
                          >
                            <div className="flex flex-col items-center">
                              <span>
                                {rank.charAt(0) + rank.slice(1).toLowerCase()}
                              </span>
                              {style.label && (
                                <span className="text-xs mt-1 opacity-80">
                                  {style.label}
                                </span>
                              )}
                            </div>
                            {targetRank === rank && !style.disabled && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 截止日期选择 */}
                {targetRank && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500"></div>
                      <h3 className="text-xl font-bold text-blue-300 tracking-wider">
                        DEADLINE CONFIGURATION
                      </h3>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {getDateOptions().map((option) => (
                        <button
                          key={option.value}
                          className={`relative py-4 px-3 rounded-xl border-2 font-bold text-sm transition-all duration-300 ${
                            selectedDate === option.value
                              ? "bg-gradient-to-br from-blue-600/50 to-cyan-600/50 border-cyan-400 text-white shadow-lg shadow-cyan-400/30 transform scale-105"
                              : "bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-cyan-400/70 hover:bg-cyan-900/20 hover:text-cyan-300"
                          }`}
                          onClick={() => setSelectedDate(option.value)}
                        >
                          {option.label}
                          {selectedDate === option.value && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 额外信息 */}
                {selectedDate && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-500"></div>
                      <h3 className="text-xl font-bold text-purple-300 tracking-wider">
                        ADDITIONAL PARAMETERS
                      </h3>
                    </div>
                    <textarea
                      className="w-full p-6 bg-gray-900/60 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:bg-gray-900/80 outline-none resize-vertical font-mono tracking-wider"
                      style={{
                        scrollbarWidth: "none" /* Firefox */,
                        msOverflowStyle: "none" /* IE and Edge */,
                      }}
                      rows={4}
                      placeholder="ENTER SPECIAL REQUIREMENTS OR NOTES..."
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                    />
                  </div>
                )}

                {/* 价格显示和下单 */}
                {price !== null && selectedDate && (
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-purple-900/40 border-2 border-purple-500/50 rounded-xl p-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                    <div className="text-center">
                      <div className="text-sm text-purple-300 mb-2 tracking-wider font-mono">
                        BOOST PROTOCOL COST
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6 tracking-wider">
                        {price} AVAX
                      </div>
                      {/* 显示消息 */}
                      {message && (
                        <div className="mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                          <div className="text-blue-300 text-sm font-mono">
                            {message}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleCreateOrderOnChain}
                        disabled={placingOrder || !isConnected} // 钱包连接检查
                        className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white font-bold text-xl rounded-xl hover:from-red-600 hover:via-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/40 tracking-wider"
                      >
                        {placingOrder
                          ? "INITIALIZING PROTOCOL..."
                          : !isConnected
                            ? "CONNECT WALLET FIRST"
                            : "⚡ EXECUTE BOOST PROTOCOL ⚡"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal>
          {/* 成功提示模态框 */}
          <Modal
            open={showSuccessModal}
            onCancel={() => setShowSuccessModal(false)}
            footer={null}
            centered
            mask={true}
            maskStyle={{
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(8px)",
            }}
            style={{
              top: 0,
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(30, 30, 63, 0.95) 0%, rgba(42, 42, 94, 0.95) 100%)",
                border: "2px solid",
                borderImage: "linear-gradient(45deg, #00ffff, #ff00ff) 1",
                borderRadius: "20px",
                padding: "40px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* 背景动画效果 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 70%)",
                  animation: "cyberpulse 2s infinite",
                  zIndex: -1,
                }}
              ></div>

              {/* 顶部霓虹线条 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background:
                    "linear-gradient(90deg, #00ffff, #ff00ff, #00ff88, #00ffff)",
                  backgroundSize: "300% 100%",
                  animation: "neonFlow 3s linear infinite",
                }}
              ></div>

              {/* 创建成功图标 */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "0 auto 20px",
                  background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  color: "#000",
                  fontWeight: "bold",
                  animation: "spinBounce 1.5s ease-out",
                  boxShadow:
                    "0 10px 30px rgba(0, 255, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2)",
                }}
              >
                ⚡
              </div>

              {/* 主标题 */}
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  animation: "textGlow 2s ease-in-out infinite alternate",
                }}
              >
                BOOST PROTOCOL
              </div>

              {/* 副标题 */}
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #00ff88, #00ffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                ACTIVATED ✨
              </div>

              {/* 描述文字 */}
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                  fontFamily: "monospace",
                }}
              >
                Order created successfully!
                <br />
                <span style={{ color: "#00ffff" }}>
                  Your boost request has been submitted to the network.
                </span>
              </div>

              {/* 状态指示器 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  color: "#00ff88",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#00ff88",
                    borderRadius: "50%",
                    animation: "statusPulse 1.5s infinite",
                  }}
                ></div>
                <span>Awaiting booster assignment...</span>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#00ff88",
                    borderRadius: "50%",
                    animation: "statusPulse 1.5s infinite 0.5s",
                  }}
                ></div>
              </div>

              {/* 装饰性进度条 */}
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "30%",
                    height: "100%",
                    background: "linear-gradient(90deg, #00ffff, #ff00ff)",
                    borderRadius: "2px",
                    animation: "progressGlow 2s ease-in-out infinite",
                  }}
                ></div>
              </div>

              {/* 装饰性元素 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                  opacity: 0.7,
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#00ffff",
                    borderRadius: "50%",
                    animation: "orbitTwinkle 2s infinite",
                  }}
                ></div>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#ff00ff",
                    borderRadius: "50%",
                    animation: "orbitTwinkle 2s infinite 0.6s",
                  }}
                ></div>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#00ff88",
                    borderRadius: "50%",
                    animation: "orbitTwinkle 2s infinite 1.2s",
                  }}
                ></div>
              </div>

              {/* 边角装饰 */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  width: "20px",
                  height: "20px",
                  border: "2px solid #00ffff",
                  borderRight: "none",
                  borderBottom: "none",
                  opacity: 0.6,
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  width: "20px",
                  height: "20px",
                  border: "2px solid #ff00ff",
                  borderLeft: "none",
                  borderBottom: "none",
                  opacity: 0.6,
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
                  left: "15px",
                  width: "20px",
                  height: "20px",
                  border: "2px solid #00ff88",
                  borderRight: "none",
                  borderTop: "none",
                  opacity: 0.6,
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
                  right: "15px",
                  width: "20px",
                  height: "20px",
                  border: "2px solid #ffff00",
                  borderLeft: "none",
                  borderTop: "none",
                  opacity: 0.6,
                }}
              ></div>
            </div>
          </Modal>
          <style jsx global>{`
            /* 隐藏 Modal 的默认样式 */
            .ant-modal {
              background: transparent !important;
            }

            .ant-modal-content {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }

            .ant-modal-body {
              padding: 0 !important;
            }

            .ant-modal-close {
              color: #00ffff !important;
              font-size: 18px !important;
              top: 10px !important;
              right: 10px !important;
              z-index: 1000 !important;
              background: rgba(0, 0, 0, 0.5) !important;
              border-radius: 50% !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 1px solid rgba(0, 255, 255, 0.3) !important;
              transition: all 0.3s ease !important;
            }

            .ant-modal-close:hover {
              background: rgba(0, 255, 255, 0.2) !important;
              transform: scale(1.1) !important;
            }

            /* 动画效果 */
            @keyframes cyberpulse {
              0%,
              100% {
                opacity: 0.5;
                transform: scale(1) rotate(0deg);
              }
              50% {
                opacity: 0.8;
                transform: scale(1.05) rotate(180deg);
              }
            }

            @keyframes neonFlow {
              0% {
                background-position: 0% 50%;
              }
              100% {
                background-position: 300% 50%;
              }
            }

            @keyframes spinBounce {
              0% {
                transform: scale(0.3) rotate(0deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.2) rotate(180deg);
                opacity: 1;
              }
              100% {
                transform: scale(1) rotate(360deg);
                opacity: 1;
              }
            }

            @keyframes textGlow {
              0% {
                filter: drop-shadow(0 0 5px #00ffff);
              }
              100% {
                filter: drop-shadow(0 0 15px #ff00ff)
                  drop-shadow(0 0 25px #00ffff);
              }
            }

            @keyframes statusPulse {
              0%,
              100% {
                opacity: 0.3;
                transform: scale(1);
              }
              50% {
                opacity: 1;
                transform: scale(1.3);
              }
            }

            @keyframes progressGlow {
              0%,
              100% {
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
              }
              50% {
                box-shadow:
                  0 0 20px rgba(255, 0, 255, 0.8),
                  0 0 30px rgba(0, 255, 255, 0.6);
              }
            }

            @keyframes orbitTwinkle {
              0%,
              100% {
                opacity: 0.3;
                transform: scale(1) translateY(0px);
              }
              50% {
                opacity: 1;
                transform: scale(1.5) translateY(-5px);
              }
            }
          `}</style>
          <style jsx global>{`
            /* 去掉Modal的黑框 */
            .cyber-modal .ant-modal-content {
              background: transparent !important;
              border-radius: 16px !important;
              overflow: hidden !important;
              box-shadow: 0 0 50px rgba(139, 92, 246, 0.3) !important;
              border: none !important;
              padding: 0 !important;
            }
            .cyber-modal .ant-modal-header {
              display: none !important;
            }
            .cyber-modal .ant-modal-close {
              color: #22d3ee !important;
              font-size: 20px !important;
              top: 16px !important;
              right: 16px !important;
              z-index: 1000 !important;
              background: rgba(0, 0, 0, 0.3) !important;
              border-radius: 50% !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 1px solid rgba(34, 211, 238, 0.3) !important;
            }
            .cyber-modal .ant-modal-close:hover {
              background: rgba(34, 211, 238, 0.2) !important;
            }
            .cyber-modal .ant-modal-body {
              padding: 0 !important;
            }

            /* 完全隐藏滚动条 */
            .cyber-modal .ant-modal-body::-webkit-scrollbar {
              display: none !important;
            }

            /* 为textarea也隐藏滚动条 */
            textarea::-webkit-scrollbar {
              display: none !important;
            }

            /* 成功提示模态框样式 */
            .success-modal .ant-modal-content {
              background: transparent !important;
              border-radius: 16px !important;
              overflow: hidden !important;
              box-shadow: 0 0 50px rgba(16, 185, 129, 0.4) !important;
              border: none !important;
              padding: 0 !important;
            }
            .success-modal .ant-modal-header {
              display: none !important;
            }
            .success-modal .ant-modal-close {
              color: #10b981 !important;
              font-size: 20px !important;
              top: 16px !important;
              right: 16px !important;
              z-index: 1000 !important;
              background: rgba(0, 0, 0, 0.3) !important;
              border-radius: 50% !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 1px solid rgba(16, 185, 129, 0.3) !important;
            }
            .success-modal .ant-modal-close:hover {
              background: rgba(16, 185, 129, 0.2) !important;
            }
            .success-modal .ant-modal-body {
              padding: 0 !important;
            }
          `}</style>
        </div>
      </main>
    </div>
  );
}
