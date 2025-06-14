export interface IResponse<T> {
    code: number
    message: string
    data: T
}

export interface IUser {
    id: number
    username:string
    avatar: string
    email: string
    wallet_address: `0x${string}`
    role: string
    status: number
    is_verfied: number
    created_at: string
    [key: string]: any
}

/** 游戏卡片类型 */
export interface Game {
  name: string;
  imagePath: string;
}

/** 玩家订单类型 */
export interface Order {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  playerId: string | undefined;
  boosterId?: string;
}