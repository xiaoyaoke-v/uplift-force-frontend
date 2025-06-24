import { post, get, put } from '@/utils/request'
import { type IUser, type IOrder, type IResponse } from '@/types'


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

export const getAvailableOrders = (): Promise<IOrder[]> => {
    return get('/orders/available');
}

export const getBoosterOrders = (boosterId: number): Promise<IOrder[]> => {
    return get(`/orders/booster/${boosterId}`);
}

export const getPlayerOrders = async (
  playerId: number
): Promise<IOrder[]> => {
  const response: IResponse<IOrdersResponse> = await get(`/orders/player/${playerId}`);
  return response.data.orders;
}

export const submitOrder = (data: ISubmitOrderParams): Promise<IOrder> => {
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


export const getMyOrders = (params: IOrdersParams): Promise<IResponse<IOrdersResponse>> => {
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

export const getAllOrders = (params: IOrdersParams): Promise<IResponse<IOrdersResponse>> => {
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

export type { IPlayerInfo, IPlayerAccount, ICreateOrderParam, IOrdersResponse, IOrdersParams, IResponse, IOrder };