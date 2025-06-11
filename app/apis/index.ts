import { post, get } from '@/utils/request'
import { type IUser } from '@/types'


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
    access_token: string
    refresh_token: string
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

export const check = (data: IAddress): Promise<IRegisterStatus> => {
    return post('/auth/checkWallet', {data})
}

export const login = (data: ISignature): Promise<IUser> => {
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
