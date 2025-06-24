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
  EyeOutlined,
  MessageOutlined,
  RedoOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  getMyOrders,
  getAllOrders,
  confirmOrder,
  cancelOrder,
  type IOrder,
  type IOrdersParams,
} from "@/apis";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import {
  parseAbi,
  parseEther,
  BaseError,
  ContractFunctionRevertedError,
} from "viem";
import { 
  ORDER_STATUSES, 
  GAME_TYPES, 
  SERVICE_TYPES, 
  GAME_MODES 
} from "@/utils/constants";

const { Option } = Select;

export default function OrdersPage() {
  const { user } = useUser();
  const router = useRouter();

  // Blockchain hooks
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

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

  // Payment state
  const [confirmingOrder, setConfirmingOrder] = useState<{
    [key: number]: boolean;
  }>({});
  const [messageText, setMessageText] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContactOrder, setSelectedContactOrder] = useState<IOrder | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<{
    [key: number]: boolean;
  }>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<IOrder | null>(
    null
  );

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

    // If user is booster, default to 'all' tab
    if (user.role === "booster") {
      setActiveTab("all");
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

  // Helper function to get current chain
  const getCurrentChain = async () => {
    if (!publicClient) throw new Error("Public client not available");
    return publicClient.chain;
  };

  // Refresh orders with current filters
  const refreshOrdersWithCurrentFilters = async () => {
    if (activeTab === "my") {
      await fetchMyOrders();
    } else {
      await fetchAllOrders();
    }
  };

  // Handle confirm order (pay final amount - 85%)
  const handleConfirmOrder = async (order: IOrder) => {
    if (!publicClient || !walletClient || !address) {
      console.error("Wallet not connected or clients not initialized");
      setMessageText("Please connect your wallet first");
      return;
    }

    setConfirmingOrder((prev) => ({ ...prev, [order.id]: true }));
    setMessageText("Preparing transaction...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_CONFIRME_ORDER_ABI || "";

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
        console.log("Parsed ABI:", contractAbi);
      } catch (error) {
        console.error("Error parsing ABI:", error);
        setMessageText("Invalid ABI JSON format");
        setConfirmingOrder((prev) => ({ ...prev, [order.id]: false }));
        return;
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or ABI is not defined");
        setMessageText("Contract configuration error");
        setConfirmingOrder((prev) => ({ ...prev, [order.id]: false }));
        return;
      }

      // 计算85%的尾款金额
      const totalAmountWei = parseEther(order.total_amount.toString());
      const finalPaymentAmount = (totalAmountWei * 85n) / 100n;

      // 使用区块链订单ID
      const blockchainOrderId = order.chain_order_id || order.id;

      console.log("Confirm order parameters:", {
        databaseOrderId: order.id,
        blockchainOrderId: blockchainOrderId,
        totalAmount: totalAmountWei.toString(),
        finalPaymentAmount: finalPaymentAmount.toString(),
      });

      setMessageText("Simulating transaction...");

      const currentChain = await getCurrentChain();

      // 模拟合约调用
      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddr as `0x${string}`,
          abi: contractAbi,
          functionName: "confirmOrder",
          args: [BigInt(blockchainOrderId)],
          account: address,
          value: finalPaymentAmount,
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
        setConfirmingOrder((prev) => ({ ...prev, [order.id]: false }));
        return;
      }

      console.log("模拟成功，可以继续执行交易");

      setMessageText("Sending transaction...");

      // 执行合约调用
      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: "confirmOrder",
        args: [BigInt(blockchainOrderId)],
        account: address,
        value: finalPaymentAmount,
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
          // 调用后端确认订单接口，使用数据库订单ID
          await confirmOrder(order.id, txHash);
          setMessageText("Order confirmed successfully!");

          // 刷新订单列表，保持当前筛选条件
          await refreshOrdersWithCurrentFilters();

          // 显示成功消息
          message.success("Order confirmed successfully!");

          setTimeout(() => {
            setMessageText("");
            setShowSuccessModal(true);

            setTimeout(() => {
              setShowSuccessModal(false);
            }, 3000);
          }, 1500);
        } catch (backendError: unknown) {
          let errorMessage = "An unknown error occurred";
          if (backendError instanceof Error) {
            errorMessage = backendError.message;
          }
          message.error(errorMessage);
          setMessageText(errorMessage);
        }
      } else {
        setMessageText("Transaction failed. Please try again.");
        message.error("Transaction failed. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error confirming order on chain:", error);
      let errorMessage = "Failed to confirm order";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      setMessageText(errorMessage);
      message.error(errorMessage);
    } finally {
      setConfirmingOrder((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  // Get my orders
  const fetchMyOrders = async () => {
    try {
      const params: IOrdersParams = {
        page: myOrdersPage,
        page_size: pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (gameTypeFilter) params.game_type = gameTypeFilter;

      const response = await getMyOrders(params);

      if (response && response.data) {
        setMyOrders(response.data.orders || []);
        setMyOrdersTotal(response.data.total || 0);
      } else {
        setMyOrders([]);
        setMyOrdersTotal(0);
      }
    } catch (error: unknown) {
      setMyOrders([]);
      setMyOrdersTotal(0);
      console.error("Failed to fetch my orders:", error);
      message.error("Failed to fetch my orders");
    }
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

      const response = await getAllOrders(params);

      if (response && response.data) {
        setAllOrders(response.data.orders || []);
        setAllOrdersTotal(response.data.total || 0);
      } else {
        setAllOrders([]);
        setAllOrdersTotal(0);
      }
    } catch (error: unknown) {
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

  // 3. 添加取消订单处理函数（在其他函数后面添加）
  const handleCancelOrderClick = (order: IOrder) => {
    setSelectedCancelOrder(order);
    setShowCancelModal(true);
  };

  const handleCancelOrder = async (order: IOrder) => {
    if (!publicClient || !walletClient || !address) {
      console.error("Wallet not connected or clients not initialized");
      message.error("Please connect your wallet first");
      return;
    }

    setCancelingOrder((prev) => ({ ...prev, [order.id]: true }));
    setMessageText("Preparing cancellation transaction...");

    try {
      const contractAddr = process.env.NEXT_PUBLIC_MAIN_CONTRACT_ADDR;
      const contractAbiRaw =
        process.env.NEXT_PUBLIC_MAIN_CONTRACT_CANCEL_ORDER_ABI || "";

      let contractAbi;
      try {
        contractAbi = parseAbi([contractAbiRaw]);
        console.log("Parsed Cancel ABI:", contractAbi);
      } catch (error) {
        console.error("Error parsing cancel ABI:", error);
        setMessageText("Invalid cancel ABI JSON format");
        setCancelingOrder((prev) => ({ ...prev, [order.id]: false }));
        return;
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or cancel ABI is not defined");
        setMessageText("Contract configuration error");
        setCancelingOrder((prev) => ({ ...prev, [order.id]: false }));
        return;
      }

      // 使用区块链订单ID
      const blockchainOrderId =
        order.chain_order_id || order.id;

      console.log("Cancel order parameters:", {
        databaseOrderId: order.id,
        blockchainOrderId: blockchainOrderId,
        orderStatus: order.status,
      });

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
        console.log("Cancel simulation successful");
      } catch (err) {
        if (err instanceof BaseError) {
          const revertError = err.walk(
            (err) => err instanceof ContractFunctionRevertedError
          );
          if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? "";
            console.log("Cancel errorName:", errorName);
          }
        }
        setMessageText(
          "Cancellation simulation failed. Please check the order status."
        );
        setCancelingOrder((prev) => ({ ...prev, [order.id]: false }));
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

      console.log("Cancel transaction hash:", txHash);
      setMessageText(
        `Cancellation transaction sent: ${txHash}. Waiting for confirmation...`
      );

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      console.log("Cancel transaction receipt:", receipt);

      if (receipt.status === "success") {
        setMessageText("Transaction confirmed! Updating order status...");

        try {
          // 调用后端取消订单接口
          await cancelOrder(order.id, "User requested cancellation", txHash);
          setMessageText("Order cancelled successfully!");

          // 刷新订单列表，保持当前筛选条件
          await refreshOrdersWithCurrentFilters();

          // 显示成功消息
          message.success("Order cancelled successfully!");

          // 关闭模态框
          setShowCancelModal(false);

          setTimeout(() => {
            setMessageText("");
          }, 2000);
        } catch (backendError: unknown) {
          let errorMessage = "An unknown error occurred";
          if (backendError instanceof Error) {
            errorMessage = backendError.message;
          }
          message.error(errorMessage);
          setMessageText(errorMessage);
        }
      } else {
        setMessageText("Cancellation transaction failed. Please try again.");
        message.error("Cancellation transaction failed. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error cancelling order on chain:", error);
      let errorMessage = "Failed to cancel order";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      setMessageText(errorMessage);
      message.error(errorMessage);
    } finally {
      setCancelingOrder((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleContact = (order: IOrder) => {
    setSelectedContactOrder(order);
    setShowContactModal(true);
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
          {/* {activeTab === 'my' && order.my_role && (
            <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                My Role
            </div>
            <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>
                {order.my_role === 'player' ? 'Client' : 'Booster'}
            </div>
            </div>
        )} */}

          {/* User info - show in both tabs */}
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

        {/* Pay final amount button for accepted orders in My Orders tab */}
        {activeTab === "my" && order.status === "accepted" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Button
              onClick={() => handleConfirmOrder(order)}
              disabled={confirmingOrder[order.id]}
              style={{
                background: "linear-gradient(45deg, #00ff00, #00cc00)",
                color: "#000",
                border: "none",
                borderRadius: "20px",
                fontWeight: "bold",
                padding: "8px 24px",
                height: "auto",
                fontSize: "14px",
                transition: "all 0.3s ease",
                opacity: confirmingOrder[order.id] ? 0.7 : 1,
                cursor: confirmingOrder[order.id] ? "not-allowed" : "pointer",
              }}
            >
              {confirmingOrder[order.id] ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #000",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  Processing...
                </span>
              ) : (
                `Pay Final Amount (${formatAmount((parseFloat(order.total_amount) * 0.85).toString())} AVAX)`
              )}
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            flexWrap: "wrap", // 添加换行支持
          }}
        >
          {activeTab === "my" ? (
            <>
              {/* Cancel Order Button for posted and accepted orders */}
              {(order.status === "posted" || order.status === "accepted") && (
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleCancelOrderClick(order)}
                  disabled={cancelingOrder[order.id]}
                  style={{
                    background: "transparent",
                    color: "#ff4444",
                    border: "1px solid #ff4444",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    opacity: cancelingOrder[order.id] ? 0.7 : 1,
                  }}
                >
                  {cancelingOrder[order.id] ? "Cancelling..." : "Cancel Order"}
                </Button>
              )}

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
                  Contact {user?.role === "player" ? "Booster" : "Client"}
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
                >
                  Accept Order
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

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
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
              0 0 30px #00ff00;
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

          {/* Message display */}
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
                fontSize: "14px",
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

      {/* Custom Cyberpunk Success Modal */}
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
          onClick={() => setShowSuccessModal(false)}
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
            onClick={(e) => e.stopPropagation()}
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
              PAYMENT SUCCESSFUL
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
              Transaction Confirmed
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: "20px",
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid #00ffff",
                color: "#00ffff",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = "#00ffff";
                target.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = "transparent";
                target.style.color = "#00ffff";
              }}
            >
              Close
            </button>

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

      {/* Contact Information Modal - 添加这个模态框，与成功模态框并列 */}
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
            zIndex: 1001, // 确保在成功模态框之上
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
                    {user?.role === "player" ? "Booster" : "Client"}
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {user?.role === "player"
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
                  {user?.role === "player"
                    ? selectedContactOrder.booster_username
                    : selectedContactOrder.player_username}
                </div>
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

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && selectedCancelOrder && (
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
            zIndex: 1002,
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #1e1e3f 0%, #2a2a5e 100%)",
              border: "2px solid #ff4444",
              borderRadius: "15px",
              padding: "30px",
              textAlign: "center",
              boxShadow: `
                0 0 30px rgba(255, 68, 68, 0.3),
                inset 0 0 30px rgba(255, 68, 68, 0.1)
              `,
              animation: "successPulse 0.4s ease-out",
              minWidth: "400px",
              maxWidth: "500px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning background pattern */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(255, 68, 68, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 68, 68, 0.05) 1px, transparent 1px)
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
                  color: "#ff4444",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <ExclamationCircleOutlined style={{ color: "#ff4444" }} />
                Cancel Order Confirmation
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
                Order #{selectedCancelOrder.order_no}
              </div>
            </div>

            {/* Order Info */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 68, 68, 0.2)",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "15px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#888", marginBottom: "3px" }}>Game</div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedCancelOrder.game_type}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#888", marginBottom: "3px" }}>
                    Status
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: ORDER_STATUSES[selectedCancelOrder.status].color,
                    }}
                  >
                    {ORDER_STATUSES[selectedCancelOrder.status].text}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#888", marginBottom: "3px" }}>
                    Amount
                  </div>
                  <div style={{ fontWeight: "bold", color: "#00ff00" }}>
                    {formatAmount(selectedCancelOrder.total_amount)} AVAX
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background:
                  selectedCancelOrder.status === "posted"
                    ? "rgba(0, 255, 0, 0.1)"
                    : "rgba(255, 68, 68, 0.1)",
                border:
                  selectedCancelOrder.status === "posted"
                    ? "1px solid rgba(0, 255, 0, 0.3)"
                    : "1px solid rgba(255, 68, 68, 0.3)",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color:
                    selectedCancelOrder.status === "posted"
                      ? "#00ff00"
                      : "#ff4444",
                  marginBottom: "10px",
                }}
              >
                {selectedCancelOrder.status === "posted"
                  ? "✓ Deposit Refund"
                  : "⚠️ Penalty Warning"}
              </div>

              <div
                style={{
                  color: "#fff",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                {selectedCancelOrder.status === "posted"
                  ? "Your deposit will be refunded to your wallet. Are you sure you want to cancel this order?"
                  : "Warning: Cancelling an accepted order will result in your deposit being forfeited as a penalty. This action cannot be undone. Are you sure you want to continue?"}
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                gap: "15px",
                justifyContent: "center",
              }}
            >
              <Button
                onClick={() => setShowCancelModal(false)}
                style={{
                  background: "transparent",
                  color: "#888",
                  border: "1px solid #888",
                  borderRadius: "20px",
                  padding: "8px 25px",
                  fontWeight: "bold",
                }}
              >
                Keep Order
              </Button>

              <Button
                onClick={() => {
                  setShowCancelModal(false);
                  handleCancelOrder(selectedCancelOrder);
                }}
                disabled={cancelingOrder[selectedCancelOrder.id]}
                style={{
                  background:
                    selectedCancelOrder.status === "posted"
                      ? "linear-gradient(45deg, #00ff00, #00cc00)"
                      : "linear-gradient(45deg, #ff4444, #cc0000)",
                  color: "#000",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 25px",
                  fontWeight: "bold",
                  opacity: cancelingOrder[selectedCancelOrder.id] ? 0.7 : 1,
                }}
              >
                {cancelingOrder[selectedCancelOrder.id]
                  ? "Processing..."
                  : selectedCancelOrder.status === "posted"
                    ? "Yes, Cancel & Refund"
                    : "Yes, Cancel (Forfeit Deposit)"}
              </Button>
            </div>

            {/* Decorative warning elements */}
            <div
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                width: "20px",
                height: "20px",
                border: "2px solid #ff4444",
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
                background: "#ff4444",
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
