import { post, get, put } from '@/utils/request'
import { type IUser, type Order } from '@/types'


interface IAddress {
    wallet_address: `0x${string}`
}

interface ISignature extends IAddress {
    message: string
    signature: string
}

interface IRefreshParams {
    refresh_token: string
}

interface IRegisterParams extends ISignature {
    email: string
    role: string
    username: string
} 

interface IRegisterStatus {
    is_registered: boolean
    wallet_address: `0x${string}`
}

interface IRefreshResponseData {
    access_token: string
    refresh_token: string
}

interface IRegisterResponseData {
    token: string
    refresh_token: string
    user: IUser
}

interface IVerifyResponseData {
    user_id: string
}

interface IProfileResponseData {
    id: string
    username: string
    email: string
    wallet_address: `0x${string}`
}

interface IUserInfo<IUser> {
    access_token: string
    expires_in: number
    is_new_user: string
    refresh_token: string
    user: IUser
}

interface ISubmitOrderParams {
    game: string;
    currentRank: string;
    desiredRank: string;
}

interface IAcceptOrderParams {
    orderId: string;
    boosterId: number;
}

interface IPlayerInfo {
    characterName: string
    tagLine: string
}

interface IRoleList {
    freshBlood: boolean
    hotStreak: boolean
    inactive: boolean
    leagueId: string
    leaguePoints: number
    losses: number
    puuid: string
    queueType: string
    rank: string
    summonerId: string
    tier: string
    veteran: boolean
    wins: number
}

interface ISummoner {
    gameName: string
    puuid: string
    tagLine: string
}

interface IPlayerAccount {
    leagueCount: number
    leagueEntries: IRoleList[]
    summoner: ISummoner
}

interface ICreateOrderParam {
  game_type: string;
  server_region: string;
  game_account: string;
  game_mode: string;
  service_type: string;
  current_rank: string; 
  target_rank: string;
  PUUID: string;
  requirements?: string;
  total_amount: string;
  deadline: string;
  tx_hash: string;
}

interface IOrder {
  id: number;
  order_no: string;
  player_id: number;
  booster_id?: number;
  chain_order_id?: number;
  game_type: string;
  server_region: string;
  game_account: string;
  game_mode: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
  service_type: 'Boosting' | 'PLAY WITH';
  current_rank?: string;
  target_rank?: string;
  PUUID?: string;
  requirements?: string;
  total_amount: string;
  player_deposit: string;
  remaining_amount: string;
  booster_deposit?: string;
  status: 'posted' | 'accepted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  contract_address?: string;
  deadline: string;
  deposit_tx_hash?: string;
  booster_deposit_tx_hash?: string;
  payment_tx_hash?: string;
  settlement_tx_hash?: string;
  posted_at: string;
  accepted_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // 扩展字段（从后端返回）
  my_role?: 'player' | 'booster';
  player_username?: string;
  booster_username?: string;
}

// 注意：返回的数据结构是 { code, message, data }，而不是我之前假设的 { success, data }
interface IApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface IOrdersResponse {
  orders: IOrder[];
  total: number;
  page: number;
  page_size: number;
}

interface IOrdersParams {
  page?: number;
  page_size?: number;
  status?: string;
  game_type?: string;
  game_mode?: string;
  role?: string;
  user_filter?: string;
}

export const check = (data: IAddress): Promise<IRegisterStatus> => {
    return post('/auth/checkWallet', {data})
}

export const login = (data: ISignature): Promise<IUserInfo<IUser>> => {
    return post('/auth/login', {data})
}

export const logout = (): Promise<void> => {
    return post('/auth/logout')
}

export const refresh = (data: IRefreshParams): Promise<IRefreshResponseData> => {
    return post('/auth/refresh', {data})
}

export const register = (data: IRegisterParams): Promise<IRegisterResponseData> => {
    return post('/auth/register', {data})
}

export const verify = (): Promise<IVerifyResponseData> => {
    return post('/auth/verify')
}

export const profile = (): Promise<IProfileResponseData> => {
    return get('/auth/profile')
}

export const getAvailableOrders = (): Promise<Order[]> => {
    return get('/orders/available');
}

export const getBoosterOrders = (boosterId: number): Promise<Order[]> => {
    return get(`/orders/booster/${boosterId}`);
}

export const getPlayerOrders = (playerId: number): Promise<Order[]> => {
    return get(`/orders/player/${playerId}`);
}

export const submitOrder = (data: ISubmitOrderParams): Promise<Order> => {
    return post('/orders/submit', { data });
}

export const acceptOrder = (orderId: number, txHash: string): Promise<null> => {
  return post(`/orders/accept`, { 
    data: {
      order_id: orderId, 
      tx_hash: txHash 
    }
  });
};

export const getPlayerInfo = ({characterName, tagLine}: IPlayerInfo): Promise<IPlayerAccount> => {
    return get('/riot/getWithRank', { params: {characterName, tagLine} });
}

export const createOrder = (data: ICreateOrderParam): Promise<null> => {
  return post('/orders', { data });
};


export const getMyOrders = (params: IOrdersParams): Promise<IApiResponse<IOrdersResponse>> => {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  return get(`/orders/my${queryString ? `?${queryString}` : ''}`);
}

export const getAllOrders = (params: IOrdersParams): Promise<IApiResponse<IOrdersResponse>> => {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  return get(`/orders${queryString ? `?${queryString}` : ''}`);
}

export const confirmOrder = (orderId: number, txHash: string): Promise<any> => {
  return post(`/orders/confirm`, { 
    data: {
      order_id: orderId, 
      tx_hash: txHash
    }
  });
};

export const completeOrder = (orderId: number, note?: string, txHash?: string, completionStatus?: string): Promise<any> => {
  return post(`/orders/complete`, { 
    data: {
      order_id: orderId,
      note: note || "",
      tx_hash: txHash || "",
      completion_status: completionStatus || ""
    }
  });
};

export const cancelOrder = (orderId: number, reason?: string, txHash?: string): Promise<any> => {
  return post(`/orders/cancel`, { 
    data: {
      order_id: orderId,
      reason: reason || "",
      tx_hash: txHash || ""
    }
  });
};

export type { IPlayerInfo, IPlayerAccount, ICreateOrderParam, IOrder, IOrdersResponse, IOrdersParams, IApiResponse };