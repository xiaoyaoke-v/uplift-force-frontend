import { post, get } from '@/utils/request'
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

export const acceptOrder = (data: IAcceptOrderParams): Promise<Order> => {
    return post('/orders/accept', { data });
}

export const getPlayerInfo = ({characterName, tagLine}: IPlayerInfo): Promise<IPlayerAccount> => {
    return get('/riot/getWithRank', { params: {characterName, tagLine} });
}

export const createOrder = (data: ICreateOrderParam): Promise<null> => {
  return post('/orders', { data });
};

export type { IPlayerInfo, IPlayerAccount };