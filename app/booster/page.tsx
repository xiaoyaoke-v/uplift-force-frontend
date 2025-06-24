"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Spin,
  Space,
  Tag,
  Button,
  Select,
  Input,
  Pagination,
  Modal,
  message,
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  RedoOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  getMyOrders,
  getAllOrders,
  type IOrder,
  type IOrdersParams,
  acceptOrder,
  completeOrder,
  cancelOrder,
} from "@/apis";
import { mainnet, sepolia, hardhat, arbitrum } from "viem/chains";
import { useAccount, useSignMessage } from "wagmi";
import {
  parseEther,
  parseAbi,
  createPublicClient,
  createWalletClient,
  custom,
  BaseError,
  ContractFunctionRevertedError,
} from "viem";

const { Option } = Select;

// Order status mapping - English
const ORDER_STATUSES = {
  posted: { color: "blue", text: "Posted" },
  accepted: { color: "orange", text: "Accepted" },
  confirmed: { color: "cyan", text: "Confirmed" },
  in_progress: { color: "processing", text: "In Progress" },
  completed: { color: "success", text: "Completed" },
  cancelled: { color: "default", text: "Cancelled" },
  failed: { color: "error", text: "Failed" },
};

// Game types mapping
const GAME_TYPES = {
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

// Service type mapping - English
const SERVICE_TYPES = {
  Boosting: "Boosting",
  "PLAY WITH": "Play With",
};

// Game mode mapping - English
const GAME_MODES = {
  RANKED_SOLO_5x5: "Solo Queue",
  RANKED_FLEX_SR: "Flex Queue",
};

export default function OrdersPage() {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [myOrders, setMyOrders] = useState<IOrder[]>([]);
  const [allOrders, setAllOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [myOrdersPage, setMyOrdersPage] = useState(1);
  const [allOrdersPage, setAllOrdersPage] = useState(1);
  const [myOrdersTotal, setMyOrdersTotal] = useState(0);
  const [allOrdersTotal, setAllOrdersTotal] = useState(0);
  const pageSize = 10;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [gameTypeFilter, setGameTypeFilter] = useState<string>("");

  const [publicClient, setPublicClient] = useState<any>(null);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [messageText, setMessageText] = useState<string>("");
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<{
    [key: number]: boolean;
  }>({});
  const [cancellingOrder, setCancellingOrder] = useState<{
    [key: number]: boolean;
  }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalType, setSuccessModalType] = useState<
    "accept" | "complete"
  >("accept");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<IOrder | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContactOrder, setSelectedContactOrder] = useState(null);
  const { isConnected, address } = useAccount();

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

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    if (!user.role || (user.role !== "player" && user.role !== "booster")) {
      console.error("Invalid user role:", user.role);
      router.push("/");
      return;
    }

    fetchOrders();
  }, [
    user,
    activeTab,
    myOrdersPage,
    allOrdersPage,
    statusFilter,
    gameTypeFilter,
  ]);

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

  // 只在组件初始挂载时设置默认 tab，之后不再干预
  useEffect(() => {
    if (user && user.role === "booster") {
      setActiveTab("all");
    }
  }, [user?.id]); // 使用 user.id 作为依赖，确保只在用户首次加载时执行一次

  // Get my orders
  const fetchMyOrders = async () => {
    try {
      const params: IOrdersParams = {
        page: myOrdersPage,
        page_size: pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (gameTypeFilter) params.game_type = gameTypeFilter;

      const data = await getMyOrders(params);

      if (data) {
        // 即使 orders 为 null 或空数组，也要更新状态
        setMyOrders(data.orders || []);
        setMyOrdersTotal(data.total || 0);
      } else {
        // 如果整个 data 为空，清空状态
        setMyOrders([]);
        setMyOrdersTotal(0);
        console.error("No data returned:", data);
        message.error("No data returned from server");
      }
    } catch (error) {
      // 发生错误时也要清空状态
      setMyOrders([]);
      setMyOrdersTotal(0);
      console.error("Failed to fetch my orders:", error);
      message.error("Failed to fetch my orders");
    }
  };

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

  // Get all orders
  const fetchAllOrders = async () => {
    try {
      const params: IOrdersParams = {
        page: allOrdersPage,
        page_size: pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (gameTypeFilter) params.game_type = gameTypeFilter;

      const data = await getAllOrders(params);

      if (data) {
        // 即使 orders 为 null 或空数组，也要更新状态
        setAllOrders(data.orders || []);
        setAllOrdersTotal(data.total || 0);
      } else {
        // 如果整个 data 为空，清空状态
        setAllOrders([]);
        setAllOrdersTotal(0);
        console.error("No data returned:", data);
        message.error("No data returned from server");
      }
    } catch (error) {
      // 发生错误时也要清空状态
      setAllOrders([]);
      setAllOrdersTotal(0);
      console.error("Failed to fetch all orders:", error);
      message.error("Failed to fetch all orders");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === "my") {
        await fetchMyOrders();
      } else {
        await fetchAllOrders();
      }
    } finally {
      setLoading(false);
    }
  };

  // 新增：强制刷新订单列表的函数，保持当前筛选条件
  const refreshOrdersWithCurrentFilters = async () => {
    console.log("Refreshing orders with current filters:", {
      activeTab,
      statusFilter,
      gameTypeFilter,
      page: activeTab === "my" ? myOrdersPage : allOrdersPage,
    });

    setLoading(true);
    try {
      if (activeTab === "my") {
        await fetchMyOrders();
      } else {
        await fetchAllOrders();
      }
    } catch (error) {
      console.error("Failed to refresh orders:", error);
      message.error("Failed to refresh orders");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("");
    setGameTypeFilter("");
    setMyOrdersPage(1);
    setAllOrdersPage(1);
  };

  // Get game info
  const getGameInfo = (gameType: string) => {
    return (
      GAME_TYPES[gameType] || {
        shortName: gameType.substring(0, 3),
        color: "#666666",
        icon: "🎮",
      }
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format amount - no rounding, remove trailing zeros
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return "0";
    return num.toString().replace(/\.?0+$/, "");
  };

  // 处理取消订单按钮点击
  const handleCancelOrderClick = (order: IOrder) => {
    setOrderToCancel(order);
    setCancelModalVisible(true);
  };

  // 确认取消订单
  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel || !publicClient || !walletClient || !address) {
      console.error("Invalid state for order cancellation");
      message.error(
        "Unable to cancel order. Please check your wallet connection."
      );
      return;
    }

    const orderId = orderToCancel.id;
    setCancellingOrder((prev) => ({ ...prev, [orderId]: true }));
    setCancelModalVisible(false);
    setMessageText("Preparing cancellation request...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_CANCEL_ORDER_ABI || "";

      if (!contractAddr || !contractAbiRaw) {
        console.error("Contract address or ABI is not defined");
        setMessageText("Contract configuration error");
        setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
      } catch (error) {
        console.error("Error parsing Cancel Order ABI:", error);
        setMessageText("Invalid ABI format");
        setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      const blockchainOrderId =
        orderToCancel.chain_order_id ||
        orderToCancel.blockchain_order_id ||
        orderToCancel.id;

      setMessageText("Simulating cancellation transaction...");
      const currentChain = await getCurrentChain();

      // 模拟合约调用
      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as `0x${string}`,
          abi: contractAbi,
          functionName: "cancelOrder",
          args: [BigInt(blockchainOrderId)],
          account: address,
          chain: currentChain,
        });
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(
            (err) => err instanceof ContractFunctionRevertedError
          );
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? "";
            console.log("Cancellation simulation error:", errorName);
          }
        }
        setMessageText(
          "Cancellation simulation failed. Please check the order status."
        );
        setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      setMessageText("Sending cancellation transaction...");

      // 执行合约调用
      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "cancelOrder",
        args: [BigInt(blockchainOrderId)],
        account: address,
        chain: currentChain,
      });

      console.log("Cancel order transaction hash:", txHash);
      setMessageText(
        `Cancellation transaction sent: ${txHash}. Waiting for confirmation...`
      );

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === "success") {
        setMessageText(
          "Cancellation transaction confirmed! Updating order status..."
        );

        try {
          // 调用后端取消订单接口
          await cancelOrder(orderId, "", txHash);
          setMessageText("Order cancelled successfully!");
          message.success("Order cancelled successfully!");

          // 刷新订单列表
          await refreshOrdersWithCurrentFilters();

          setTimeout(() => {
            setMessageText("");
          }, 3000);
        } catch (backendError) {
          console.error("Backend cancel order failed:", backendError);
          setMessageText(
            `Order cancellation failed: ${backendError.message || "Unknown error"}`
          );
          message.error(
            `Order cancellation failed: ${backendError.message || "Unknown error"}`
          );
        } finally {
          setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
        }
      } else {
        setMessageText("Cancellation transaction failed. Please try again.");
        message.error("Cancellation transaction failed. Please try again.");
        setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
      }
    } catch (error) {
      console.error("Error cancelling order on chain:", error);
      const errorMessage = `Error: ${error.message || "Failed to cancel order"}`;
      setMessageText(errorMessage);
      message.error(errorMessage);
      setCancellingOrder((prev) => ({ ...prev, [orderId]: false }));
    } finally {
      setOrderToCancel(null);
    }
  };

  // 监听合约事件的函数
  const listenToContractEvents = async (
    orderId: number,
    functionsTxHash: string
  ) => {
    if (!publicClient) return;

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const currentChain = await getCurrentChain();

      console.log("Setting up event listener for order:", orderId);

      // 更新事件 ABI - 增加 currentTxHash 参数
      const unwatch = publicClient.watchContractEvent({
        address: contractAddr as `0x${string}`,
        abi: parseAbi([
          "event OrderCompleted(uint256 indexed orderId, uint256 platformFee, uint256 boosterReward, bytes32 currentTxHash)",
          "event OrderFailed(uint256 indexed orderId, uint256 playerRefund, uint256 penaltyToPlayer, uint256 penaltyToPlatform, bytes32 currentTxHash)",
        ]),
        eventName: ["OrderCompleted", "OrderFailed"],
        args: {
          orderId: BigInt(orderId),
        },
        onLogs: async (logs: any[]) => {
          console.log("Order settlement event received for order:", orderId);

          for (const log of logs) {
            try {
              const settlementTxHash = log.transactionHash;

              if (log.eventName === "OrderCompleted") {
                const { platformFee, boosterReward, currentTxHash } = log.args;

                const platformFeeEth = (Number(platformFee) / 1e18).toFixed(6);
                const boosterRewardEth = (Number(boosterReward) / 1e18).toFixed(
                  6
                );

                setMessageText(
                  `Order completed successfully! Booster reward: ${boosterRewardEth} AVAX`
                );
                message.success(
                  "Order completed successfully! Payment processed."
                );

                // 调用后端接口更新订单状态为完成
                try {
                  await completeOrder(
                    orderId,
                    `Order completed via blockchain automation. Platform fee: ${platformFeeEth} AVAX, Booster reward: ${boosterRewardEth} AVAX. Functions TX: ${functionsTxHash}, Settlement TX: ${settlementTxHash}`,
                    settlementTxHash,
                    "completed"
                  );

                  // 显示成功动画
                  setTimeout(() => {
                    setMessageText("");
                    setSuccessModalType("complete");
                    setShowSuccessModal(true);

                    setTimeout(() => {
                      setShowSuccessModal(false);
                    }, 3000);
                  }, 1500);
                } catch (backendError) {
                  console.error(
                    "Failed to update backend order status:",
                    backendError
                  );
                  message.error(
                    "Order completed on blockchain but failed to update backend status"
                  );
                  setMessageText(
                    "Order completed on blockchain but failed to update backend status"
                  );
                } finally {
                  // 🔥 确保在完成后重置按钮状态
                  setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
                }

                refreshOrdersWithCurrentFilters();
              } else if (log.eventName === "OrderFailed") {
                const {
                  playerRefund,
                  penaltyToPlayer,
                  penaltyToPlatform,
                  currentTxHash,
                } = log.args;

                const playerRefundEth = (Number(playerRefund) / 1e18).toFixed(
                  6
                );
                const penaltyToPlayerEth = (
                  Number(penaltyToPlayer) / 1e18
                ).toFixed(6);
                const penaltyToPlatformEth = (
                  Number(penaltyToPlatform) / 1e18
                ).toFixed(6);

                setMessageText(
                  `Order failed! Player refund: ${playerRefundEth} AVAX. Penalties applied.`
                );
                message.error(
                  "Order verification failed! Refund and penalties processed."
                );

                // 调用后端接口更新订单状态为失败
                try {
                  await completeOrder(
                    orderId,
                    `Order failed via blockchain automation. Player refund: ${playerRefundEth} AVAX, Penalty to player: ${penaltyToPlayerEth} AVAX, Penalty to platform: ${penaltyToPlatformEth} AVAX. Functions TX: ${functionsTxHash}, Settlement TX: ${settlementTxHash}`,
                    settlementTxHash,
                    "failed"
                  );
                } catch (backendError) {
                  console.error(
                    "Failed to update backend order failure status:",
                    backendError
                  );
                  message.error(
                    "Order failed on blockchain but failed to update backend status"
                  );
                  setMessageText(
                    "Order failed on blockchain but failed to update backend status"
                  );
                } finally {
                  // 🔥 确保在失败后重置按钮状态
                  setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
                }

                refreshOrdersWithCurrentFilters();
              }
            } catch (eventError) {
              console.error("Error processing event:", eventError);
              message.error("Error processing blockchain event");
            }
          }

          // 停止监听
          unwatch();
        },
      });

      // 设置超时，150秒后停止监听（给 Chainlink Functions 足够时间执行）
      setTimeout(() => {
        unwatch();
        console.log("Event listening timeout for order:", orderId);
        setMessageText(
          "Verification timeout. Please refresh to check order status."
        );
        // 🔥 超时后重置按钮状态
        setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
      }, 150000);
    } catch (error) {
      console.error("Error setting up event listener:", error);
      message.error("Failed to set up blockchain event listener");
      // 🔥 出错后重置按钮状态
      setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // 更新的处理完成订单函数
  const handleCompleteOrder = async (order: any) => {
    if (!publicClient || !walletClient || !address) {
      console.error("Wallet not connected or clients not initialized");
      setMessageText("Please connect your wallet first");
      return;
    }

    const orderId = order.id;
    setCompletingOrder((prev) => ({ ...prev, [orderId]: true }));
    setMessageText("Preparing completion request...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_QUERY_RIOT_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_QUERY_RIOT_CONTRACT_COMPLETE_ORDER_ABI || "";

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
      } catch (error) {
        console.error("Error parsing Complete Order ABI:", error);
        setMessageText("Invalid ABI JSON format");
        setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or ABI is not defined");
        setMessageText("Contract configuration error");
        setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      const blockchainOrderId =
        order.chain_order_id || order.blockchain_order_id || order.id;
      const puuid = order.PUUID || "";
      const region = order.server_region || "";
      const target = order.target_rank || "";

      setMessageText("Simulating transaction...");
      const currentChain = await getCurrentChain();

      // 模拟合约调用
      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as `0x${string}`,
          abi: contractAbi,
          functionName: "requestPlayerData",
          args: [puuid, region, target, BigInt(blockchainOrderId)],
          account: address,
          chain: currentChain,
        });
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(
            (err) => err instanceof ContractFunctionRevertedError
          );
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? "";
            console.log("Simulation error:", errorName);
          }
        }
        setMessageText(
          "Transaction simulation failed. Please check the order status."
        );
        setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
        return;
      }

      setMessageText("Sending completion request...");

      // 🔥 注意：按钮状态保持禁用，将在事件监听中或超时后重置
      // 在发送交易之前就开始监听事件
      listenToContractEvents(blockchainOrderId, "");

      // 执行合约调用
      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "requestPlayerData",
        args: [puuid, region, target, BigInt(blockchainOrderId)],
        account: address,
        chain: currentChain,
      });

      console.log("Functions request transaction hash:", txHash);
      setMessageText(
        `Completion request sent: ${txHash}. Waiting for verification...`
      );

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 3,
      });

      if (receipt.status === "success") {
        setMessageText(
          "Verification request confirmed! Waiting for Chainlink Functions to process and complete the order..."
        );

        // 重新设置事件监听，传递 Functions 交易哈希
        listenToContractEvents(blockchainOrderId, txHash);
      } else {
        setMessageText("Transaction failed. Please try again.");
        message.error("Transaction failed. Please try again.");
        // 🔥 交易失败时重置按钮状态
        setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
      }
    } catch (error) {
      console.error("Error completing order on chain:", error);
      const errorMessage = `Error: ${error.message || "Failed to complete order"}`;
      setMessageText(errorMessage);
      message.error(errorMessage);
      // 🔥 出错时重置按钮状态
      setCompletingOrder((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAcceptOrder = async (order: any) => {
    if (!publicClient || !walletClient || !address) {
      console.error("Wallet not connected or clients not initialized");
      setMessageText("Please connect your wallet first");
      return;
    }

    setAcceptingOrder(true);
    setMessageText("Preparing transaction...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_ACCEPT_ORDER_ABI || "";

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
        console.log("Parsed ABI:", contractAbi);
      } catch (error) {
        console.error("Error parsing ABI:", error);
        setMessageText("Invalid ABI JSON format");
        setAcceptingOrder(false);
        return;
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or ABI is not defined");
        setMessageText("Contract configuration error");
        setAcceptingOrder(false);
        return;
      }

      // 计算15%的押金金额
      const totalAmountWei = parseEther(order.total_amount.toString());
      const depositAmount = (totalAmountWei * 15n) / 100n;

      // 使用区块链订单ID
      const blockchainOrderId =
        order.blockchain_order_id || order.chain_order_id || order.id;

      console.log("Accept order parameters:", {
        databaseOrderId: order.id,
        blockchainOrderId: blockchainOrderId,
        totalAmount: totalAmountWei.toString(),
        depositAmount: depositAmount.toString(),
      });

      setMessageText("Simulating transaction...");

      const currentChain = await getCurrentChain();

      // 模拟合约调用
      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as `0x${string}`,
          abi: contractAbi,
          functionName: "acceptOrder",
          args: [BigInt(blockchainOrderId)],
          account: address,
          value: depositAmount,
          chain: currentChain,
        });
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(
            (err) => err instanceof ContractFunctionRevertedError
          );
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? "";
            console.log("errorName:", errorName);
          }
        }
        // 如果模拟失败，直接返回
        setMessageText(
          "Transaction simulation failed. Please check the order status."
        );
        setAcceptingOrder(false);
        return;
      }

      console.log("模拟成功，可以继续执行交易");

      setMessageText("Sending transaction...");

      // 执行合约调用
      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "acceptOrder",
        args: [BigInt(blockchainOrderId)],
        account: address,
        value: depositAmount,
        chain: currentChain,
      });

      console.log("Transaction hash:", txHash);
      setMessageText(
        `Transaction sent: ${txHash}. Waiting for confirmation...`
      );

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      console.log("Transaction receipt:", receipt);

      if (receipt.status === "success") {
        setMessageText("Transaction confirmed! Updating order status...");

        try {
          // 调用后端接受订单接口，使用数据库订单ID
          await acceptOrder(order.id, txHash);
          setMessageText("Order accepted successfully!");

          // 刷新订单列表，保持当前筛选条件
          await refreshOrdersWithCurrentFilters();

          // 显示成功消息
          message.success("Order accepted successfully!");

          setTimeout(() => {
            setMessageText("");
            setSuccessModalType("accept");
            setShowSuccessModal(true);

            setTimeout(() => {
              setShowSuccessModal(false);
            }, 3000);
          }, 1500);
        } catch (backendError) {
          console.error("Backend accept order failed:", backendError);
          setMessageText(
            `Order acceptance failed: ${backendError.message || "Unknown error"}`
          );
          message.error(
            `Order acceptance failed: ${backendError.message || "Unknown error"}`
          );
        }
      } else {
        setMessageText("Transaction failed. Please try again.");
        message.error("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting order on chain:", error);
      const errorMessage = `Error: ${error.message || "Failed to accept order"}`;
      setMessageText(errorMessage);
      message.error(errorMessage);
    } finally {
      setAcceptingOrder(false);
    }
  };

  // 添加处理联系功能的函数
  const handleContact = (order: any) => {
    setSelectedContactOrder(order);
    setShowContactModal(true);
  };

  const handleCopyEmail = async (email: any) => {
    try {
      await navigator.clipboard.writeText(email);
      message.success("Email copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy email:", err);
      message.error("Failed to copy email");
    }
  };

  // Render order card
  const renderOrderCard = (order: IOrder) => {
    const gameInfo = getGameInfo(order.game_type);
    const statusInfo = ORDER_STATUSES[order.status];

    return (
      <Card
        key={order.id}
        className="order-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
          border: "1px solid rgba(0, 255, 255, 0.3)",
          borderRadius: "12px",
          marginBottom: "16px",
          transition: "all 0.3s ease",
        }}
        hoverable
      >
        {/* Order header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: `linear-gradient(45deg, ${gameInfo.color}, #00ffff)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              {gameInfo.shortName}
            </div>
            <div>
              <div
                style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}
              >
                #{order.order_no}
              </div>
              <div style={{ color: "#00ffff", fontSize: "12px" }}>
                {order.game_type} · {GAME_MODES[order.game_mode]}
              </div>
            </div>
          </div>
          <Tag color={statusInfo.color} style={{ fontWeight: "bold" }}>
            {statusInfo.text}
          </Tag>
        </div>

        {/* Order details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Service type */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#888",
                fontSize: "12px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Service
            </div>
            <div style={{ color: "#fff", fontWeight: "bold" }}>
              {SERVICE_TYPES[order.service_type]}
            </div>
          </div>

          {/* Current rank */}
          {order.current_rank && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                From Rank
              </div>
              <div style={{ color: "#fff", fontWeight: "bold" }}>
                {order.current_rank}
              </div>
            </div>
          )}

          {/* Target rank */}
          {order.target_rank && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                To Rank
              </div>
              <div style={{ color: "#fff", fontWeight: "bold" }}>
                {order.target_rank}
              </div>
            </div>
          )}

          {/* Price */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#888",
                fontSize: "12px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Amount
            </div>
            <div style={{ color: "#00ff00", fontWeight: "bold" }}>
              {formatAmount(order.total_amount)} AVAX
            </div>
          </div>

          {/* Server region */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#888",
                fontSize: "12px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Region
            </div>
            <div style={{ color: "#fff", fontWeight: "bold" }}>
              {order.server_region}
            </div>
          </div>

          {/* My role (only show in my orders page) */}
          {activeTab === "my" && order.my_role && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                My Role
              </div>
              <div style={{ color: "#ff00ff", fontWeight: "bold" }}>
                {order.my_role === "player" ? "Client" : "Booster"}
              </div>
            </div>
          )}

          {/* User info (only show in all orders page) */}
          {activeTab === "all" && (
            <>
              {order.player_username && (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Client
                  </div>
                  <div style={{ color: "#fff", fontWeight: "bold" }}>
                    {order.player_username}
                  </div>
                </div>
              )}

              {order.booster_username && (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Booster
                  </div>
                  <div style={{ color: "#fff", fontWeight: "bold" }}>
                    {order.booster_username}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Game account */}
        <div
          style={{
            marginBottom: "16px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            border: "1px solid rgba(0, 255, 255, 0.2)",
          }}
        >
          <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>
            Game Account
          </div>
          <div style={{ color: "#00ffff", fontWeight: "bold" }}>
            {order.game_account}
          </div>
        </div>

        {/* Requirements */}
        {order.requirements && (
          <div
            style={{
              color: "#ccc",
              fontSize: "14px",
              lineHeight: "1.4",
              marginBottom: "16px",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
            }}
          >
            <div
              style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}
            >
              Requirements
            </div>
            {order.requirements}
          </div>
        )}

        {/* Time information */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ClockCircleOutlined />
            Created: {formatDate(order.created_at)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ClockCircleOutlined />
            Deadline: {formatDate(order.deadline)}
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
          }}
        >
          {activeTab === "my" ? (
            <>
              {order.status === "in_progress" && (
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => handleContact(order)}
                  style={{
                    background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                    color: "#000",
                    border: "none",
                    borderRadius: "20px",
                    fontWeight: "bold",
                  }}
                >
                  Contact {order.my_role === "player" ? "Booster" : "Client"}
                </Button>
              )}

              {order.status === "in_progress" &&
                order.my_role === "booster" && (
                  <Button
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleCompleteOrder(order)}
                    disabled={completingOrder[order.id]}
                    style={{
                      background: completingOrder[order.id]
                        ? "rgba(0, 149, 255, 0.5)"
                        : "linear-gradient(45deg,rgb(0, 149, 255), #32cd32)",
                      color: "#000",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: "bold",
                      opacity: completingOrder[order.id] ? 0.7 : 1,
                      cursor: completingOrder[order.id]
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {completingOrder[order.id] ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #000",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                        Verifying...
                      </span>
                    ) : (
                      "Complete Order"
                    )}
                  </Button>
                )}

              {/* 取消订单按钮 - 只在代练的accepted/confirmed状态显示 */}
              {user?.role === "booster" &&
                order.my_role === "booster" &&
                (order.status === "accepted" ||
                  order.status === "confirmed") && (
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleCancelOrderClick(order)}
                    disabled={cancellingOrder[order.id]}
                    style={{
                      background: cancellingOrder[order.id]
                        ? "rgba(255, 77, 79, 0.5)"
                        : "linear-gradient(45deg, #ff4d4f, #ff7875)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: "bold",
                      opacity: cancellingOrder[order.id] ? 0.7 : 1,
                      cursor: cancellingOrder[order.id]
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {cancellingOrder[order.id] ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #fff",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                        Cancelling...
                      </span>
                    ) : (
                      "Cancel Order"
                    )}
                  </Button>
                )}

              {order.status === "completed" && order.my_role === "player" && (
                <>
                  <Button
                    size="small"
                    icon={<StarOutlined />}
                    style={{
                      background: "transparent",
                      color: "#ffa500",
                      border: "1px solid #ffa500",
                      borderRadius: "20px",
                    }}
                  >
                    Review
                  </Button>
                  <Button
                    size="small"
                    icon={<RedoOutlined />}
                    style={{
                      background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                      color: "#000",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    Reorder
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {order.status === "posted" && user?.role === "booster" ? (
                <Button
                  size="small"
                  style={{
                    background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                    color: "#000",
                    border: "none",
                    borderRadius: "20px",
                    fontWeight: "bold",
                  }}
                  onClick={() => handleAcceptOrder(order)}
                  disabled={acceptingOrder}
                >
                  {acceptingOrder ? "Processing..." : "Accept Order"}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </Card>
    );
  };

  // Safety check
  if (!user || !user.role) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const currentOrders = activeTab === "my" ? myOrders : allOrders;
  const currentTotal = activeTab === "my" ? myOrdersTotal : allOrdersTotal;
  const currentPage = activeTab === "my" ? myOrdersPage : allOrdersPage;
  const setCurrentPage =
    activeTab === "my" ? setMyOrdersPage : setAllOrdersPage;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <style jsx global>{`
        .ant-select-selector {
          background-color: rgba(30, 30, 63, 0.8) !important;
          border-color: rgba(0, 255, 255, 0.3) !important;
          color: white !important;
        }

        .ant-select-selection-placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .ant-select-selection-item {
          color: white !important;
        }

        .ant-select-arrow {
          color: rgba(0, 255, 255, 0.8) !important;
        }

        .ant-select-dropdown {
          background-color: rgba(30, 30, 63, 0.95) !important;
          border: 1px solid rgba(0, 255, 255, 0.3) !important;
        }

        .ant-select-item {
          color: white !important;
          background-color: transparent !important;
        }

        .ant-select-item:hover {
          background-color: rgba(0, 255, 255, 0.1) !important;
        }

        .ant-select-item-option-selected {
          background-color: rgba(0, 255, 255, 0.2) !important;
        }

        /* 隐藏 Modal 的默认白色背景和边框 */
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

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes bounce {
          0% {
            transform: scale(0.3) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(360deg);
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes successPulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(20px, 20px);
          }
        }

        @keyframes glitchLine1 {
          0%,
          100% {
            opacity: 0;
            transform: translateX(-100%);
          }
          50% {
            opacity: 1;
            transform: translateX(100%);
          }
        }

        @keyframes glitchLine2 {
          0%,
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
          60% {
            opacity: 1;
            transform: translateX(-100%);
          }
        }

        @keyframes iconPulse {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes ringExpand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @keyframes checkmarkGlow {
          0% {
            text-shadow: 0 0 5px #00ff00;
          }
          50% {
            text-shadow:
              0 0 10px #00ff00,
              0 0 20px #00ff00,
              0 0 30px #00ff00,
              0 0 40px #00ff00;
          }
          100% {
            text-shadow:
              0 0 10px #00ff00,
              0 0 20px #00ff00,
              0 0 30px #00ff00;
          }
        }

        @keyframes textGlow {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 0.8;
            transform: translateY(0);
          }
        }

        @keyframes particle1 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(30px, -20px) scale(1);
            opacity: 1;
          }
        }

        @keyframes particle2 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          60% {
            transform: translate(-25px, -30px) scale(1);
            opacity: 1;
          }
        }

        @keyframes particle3 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          40% {
            transform: translate(20px, 25px) scale(1);
            opacity: 1;
          }
        }

        @keyframes particle4 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          70% {
            transform: translate(-30px, 15px) scale(1);
            opacity: 1;
          }
        }

        @keyframes particle5 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          45% {
            transform: translate(35px, -15px) scale(1);
            opacity: 1;
          }
        }

        @keyframes particle6 {
          0%,
          100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          65% {
            transform: translate(-20px, -25px) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <Header />
      <Sidebar role={user.role as "player" | "booster"} />
      <div
        style={{
          marginLeft: "208px", // 52 * 4 = 208px (w-52 = 208px)
          padding: "24px",
          minHeight: "calc(100vh - 88px)", // 减去 Header 高度
          width: "calc(100% - 208px)", // 确保不会溢出
          boxSizing: "border-box", // 包含 padding 在宽度计算内
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a5e 100%)",
            border: "2px solid",
            borderImage: "linear-gradient(45deg, #00ffff, #ff00ff) 1",
            borderRadius: "15px",
            padding: "30px",
            maxWidth: "1200px",
            margin: "0 auto",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            width: "100%", // 确保容器占满可用宽度
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "24px", color: "#00ffff" }}>⚡</span>
              BOOST PROTOCOL
              <span style={{ fontSize: "24px", color: "#00ffff" }}>⚡</span>
            </h1>
            <p
              style={{
                color: "#00ffff",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Order Management System
            </p>
          </div>

          {/* Status message */}
          {messageText && (
            <div
              style={{
                background: "rgba(0, 255, 255, 0.1)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                textAlign: "center",
                color: "#00ffff",
              }}
            >
              {messageText}
            </div>
          )}

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "30px",
              justifyContent: "center",
            }}
          >
            <div
              onClick={() => setActiveTab("my")}
              style={{
                padding: "12px 30px",
                background:
                  activeTab === "my"
                    ? "linear-gradient(45deg, #00ffff, #ff00ff)"
                    : "rgba(255, 255, 255, 0.1)",
                border:
                  activeTab === "my"
                    ? "none"
                    : "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "25px",
                cursor: "pointer",
                transition: "all 0.3s",
                textTransform: "uppercase",
                fontWeight: "bold",
                letterSpacing: "1px",
                color: activeTab === "my" ? "#000" : "#fff",
              }}
            >
              My Orders
            </div>
            <div
              onClick={() => setActiveTab("all")}
              style={{
                padding: "12px 30px",
                background:
                  activeTab === "all"
                    ? "linear-gradient(45deg, #00ffff, #ff00ff)"
                    : "rgba(255, 255, 255, 0.1)",
                border:
                  activeTab === "all"
                    ? "none"
                    : "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "25px",
                cursor: "pointer",
                transition: "all 0.3s",
                textTransform: "uppercase",
                fontWeight: "bold",
                letterSpacing: "1px",
                color: activeTab === "all" ? "#000" : "#fff",
              }}
            >
              All Orders
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "24px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Select
              placeholder="Order Status"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 150 }}
            >
              {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.text}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Game Type"
              value={gameTypeFilter || undefined}
              onChange={setGameTypeFilter}
              allowClear
              style={{ width: 180 }}
            >
              {Object.keys(GAME_TYPES).map((game) => (
                <Option key={game} value={game}>
                  {game}
                </Option>
              ))}
            </Select>

            <Button
              onClick={resetFilters}
              style={{
                background: "transparent",
                color: "#00ffff",
                border: "1px solid #00ffff",
              }}
            >
              Reset Filters
            </Button>
          </div>

          {/* Order list */}
          <div
            style={{
              maxHeight: "600px",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            <Spin spinning={loading}>
              {currentOrders.length > 0 ? (
                currentOrders.map(renderOrderCard)
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px",
                    color: "#888",
                  }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      marginBottom: "20px",
                      opacity: 0.5,
                    }}
                  >
                    📋
                  </div>
                  <div>No orders found</div>
                </div>
              )}
            </Spin>
          </div>

          {/* Pagination */}
          {currentTotal > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "24px",
              }}
            >
              <Pagination
                current={currentPage}
                total={currentTotal}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* 取消订单确认模态框 */}
      <Modal
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setOrderToCancel(null);
        }}
        footer={null}
        width={400}
        style={{ top: "30%" }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a5e 100%)",
            border: "2px solid #ff4d4f",
            borderRadius: "15px",
            padding: "30px",
            textAlign: "center",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              color: "#ff4d4f",
              marginBottom: "20px",
            }}
          >
            ⚠️
          </div>

          <h3
            style={{
              color: "#ff4d4f",
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            Confirm Cancellation
          </h3>

          <p
            style={{
              color: "#fff",
              fontSize: "16px",
              lineHeight: "1.5",
              marginBottom: "25px",
            }}
          >
            Are you sure you want to cancel this order?
            <br />
            Cancelling this order will result in your deposit being forfeited as
            a penalty!
          </p>

          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={() => {
                setCancelModalVisible(false);
                setOrderToCancel(null);
              }}
              style={{
                background: "transparent",
                color: "#00ffff",
                border: "1px solid #00ffff",
                borderRadius: "20px",
                padding: "8px 20px",
                fontWeight: "bold",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancelOrder}
              style={{
                background: "linear-gradient(45deg, #ff4d4f, #ff7875)",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                padding: "8px 20px",
                fontWeight: "bold",
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* 成功模态框 - 支持不同类型 */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              position: "relative",
              background:
                "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
              border: "2px solid #00ffff",
              borderRadius: "20px",
              padding: "40px",
              textAlign: "center",
              boxShadow: `
                0 0 50px rgba(0, 255, 255, 0.5),
                inset 0 0 50px rgba(0, 255, 255, 0.1)
              `,
              animation:
                "successPulse 0.6s ease-out, float 3s ease-in-out infinite",
              minWidth: "300px",
              overflow: "hidden",
            }}
          >
            {/* Animated background grid */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
                animation: "gridMove 2s linear infinite",
                opacity: 0.3,
              }}
            />

            {/* Glitch effect lines */}
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #ff00ff, transparent)",
                animation: "glitchLine1 1.5s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "30%",
                left: 0,
                right: 0,
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, #00ffff, transparent)",
                animation: "glitchLine2 2s ease-in-out infinite",
              }}
            />

            {/* Success icon with pulse effect */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "60px",
                marginBottom: "20px",
                animation: "iconPulse 1s ease-out",
              }}
            >
              {/* Outer glow ring */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "100px",
                  height: "100px",
                  border: "2px solid #00ff00",
                  borderRadius: "50%",
                  animation: "ringExpand 1s ease-out",
                }}
              />

              {/* Check mark */}
              <div
                style={{
                  color: "#00ff00",
                  textShadow: `
                    0 0 10px #00ff00,
                    0 0 20px #00ff00,
                    0 0 30px #00ff00
                  `,
                  animation: "checkmarkGlow 1s ease-out",
                }}
              >
                ✓
              </div>
            </div>

            {/* Success text */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "24px",
                fontWeight: "bold",
                background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "10px",
                animation: "textGlow 1s ease-out",
              }}
            >
              {successModalType === "accept"
                ? "ORDER ACCEPTED!"
                : "ORDER COMPLETED!"}
            </div>

            {/* Subtitle */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                color: "#00ffff",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                opacity: 0.8,
                animation: "fadeInUp 1s ease-out 0.5s both",
              }}
            >
              {successModalType === "accept"
                ? "Transaction Confirmed"
                : "Verification Complete"}
            </div>

            {/* Particle effects */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "4px",
                  height: "4px",
                  background: "#00ffff",
                  borderRadius: "50%",
                  top: `${20 + i * 10}%`,
                  left: `${10 + i * 15}%`,
                  animation: `particle${i + 1} 3s ease-in-out infinite`,
                  boxShadow: "0 0 6px #00ffff",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showContactModal && selectedContactOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a5e 100%)",
              border: "2px solid #00ffff",
              borderRadius: "15px",
              padding: "30px",
              textAlign: "center",
              boxShadow: `
          0 0 30px rgba(0, 255, 255, 0.3),
          inset 0 0 30px rgba(0, 255, 255, 0.1)
        `,
              animation: "successPulse 0.4s ease-out",
              minWidth: "400px",
              maxWidth: "500px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background pattern */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
          `,
                backgroundSize: "20px 20px",
                opacity: 0.3,
              }}
            />

            {/* Header */}
            <div
              style={{ position: "relative", zIndex: 1, marginBottom: "25px" }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <MessageOutlined style={{ color: "#00ffff" }} />
                Contact Information
              </div>
              <div
                style={{
                  color: "#00ffff",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                Order #{selectedContactOrder.order_no}
              </div>
            </div>

            {/* Order Info */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(0, 255, 255, 0.2)",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  color: "#fff",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      marginBottom: "5px",
                    }}
                  >
                    {selectedContactOrder.my_role === "player"
                      ? "Booster"
                      : "Client"}
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedContactOrder.my_role === "player"
                      ? selectedContactOrder.booster_username
                      : selectedContactOrder.player_username}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      marginBottom: "5px",
                    }}
                  >
                    Service Type
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {SERVICE_TYPES[selectedContactOrder.service_type]}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "14px",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Contact Email
              </div>

              <div
                style={{
                  background: "rgba(0, 255, 255, 0.1)",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                  borderRadius: "8px",
                  padding: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    color: "#00ffff",
                    fontSize: "16px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    flex: 1,
                    textAlign: "left",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedContactOrder.my_role === "player"
                    ? selectedContactOrder.booster_email
                    : selectedContactOrder.player_email}
                </div>

                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() =>
                    handleCopyEmail(
                      selectedContactOrder.my_role === "player"
                        ? selectedContactOrder.booster_email
                        : selectedContactOrder.player_email
                    )
                  }
                  style={{
                    background: "linear-gradient(45deg, #00ffff, #ff00ff)",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    minWidth: "80px",
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Game Info */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(0, 255, 255, 0.2)",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "10px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#888", marginBottom: "3px" }}>Game</div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedContactOrder.game_type}
                  </div>
                </div>

                {selectedContactOrder.current_rank && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#888", marginBottom: "3px" }}>
                      From
                    </div>
                    <div style={{ fontWeight: "bold" }}>
                      {selectedContactOrder.current_rank}
                    </div>
                  </div>
                )}

                {selectedContactOrder.target_rank && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#888", marginBottom: "3px" }}>To</div>
                    <div style={{ fontWeight: "bold" }}>
                      {selectedContactOrder.target_rank}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#888", marginBottom: "3px" }}>
                    Amount
                  </div>
                  <div style={{ fontWeight: "bold", color: "#00ff00" }}>
                    {formatAmount(selectedContactOrder.total_amount)} AVAX
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                color: "#888",
                fontSize: "12px",
                lineHeight: "1.4",
                marginBottom: "20px",
                padding: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              📧 Use this email to coordinate order details, share game
              credentials, and communicate progress updates. Keep all
              communication professional and focused on the boost service.
            </div>

            {/* Close button */}
            <Button
              onClick={() => setShowContactModal(false)}
              style={{
                position: "relative",
                zIndex: 1,
                background: "transparent",
                color: "#00ffff",
                border: "1px solid #00ffff",
                borderRadius: "20px",
                padding: "8px 25px",
                fontWeight: "bold",
              }}
            >
              Close
            </Button>

            {/* Decorative elements */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                width: "20px",
                height: "20px",
                border: "2px solid #ff00ff",
                borderRadius: "50%",
                animation: "twinkle 2s ease-in-out infinite",
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: "15px",
                left: "15px",
                width: "15px",
                height: "15px",
                background: "#00ffff",
                borderRadius: "50%",
                animation: "twinkle 3s ease-in-out infinite",
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
