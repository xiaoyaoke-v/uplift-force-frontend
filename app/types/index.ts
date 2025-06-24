export interface IResponse<T> {
    code: number
    message: string
    data: T
}

export interface IUser {
    id: number
    username: string
    avatar: string
    email: string
    wallet_address: `0x${string}`
    role: string
    status: number
    is_verified: number
    created_at: string
}

/** 游戏卡片类型 */
export interface Game {
  name: string;
  imagePath: string;
}

/** 玩家订单类型 */
export interface IOrder {
  id: number;
  chain_order_id: string;
  order_no: string;
  player_id: number;
  player_username: string;
  booster_id?: number;
  booster_username?: string;
  game_type: string;
  server_region: string;
  game_account: string;
  game_mode: string;
  service_type: 'Boosting' | 'PLAY WITH';
  current_rank: string;
  target_rank: string;
  total_amount: string;
  deadline: string;
  status: 'posted' | 'accepted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  requirements?: string;
  PUUID?: string;
  tx_hash: string;
  created_at: string;
  updated_at: string;
  my_role?: 'player' | 'booster'; // This field seems to be added client-side
}