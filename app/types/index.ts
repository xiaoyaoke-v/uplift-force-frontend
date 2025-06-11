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