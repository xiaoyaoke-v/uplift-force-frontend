import { post, get } from '@/utils/request'
import { IResponse } from '@/types/api'

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

interface ICheckResponseData {
    is_registered: boolean
    wallet_address: `0x${string}`
}

interface ILoginResponseData {
    access_token: string
    refresh_token: string
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

export const check = (data: IAddress): Promise<IResponse<ICheckResponseData>> => {
    return post('/auth/checkWallet', {data})
}

export const login = (data: ISignature): Promise<IResponse<ILoginResponseData>> => {
    return post('/auth/login', {data})
}

export const logout = (): Promise<IResponse<null>> => {
    return post('/auth/logout')
}

export const refresh = (data: IRefreshParams): Promise<IResponse<IRefreshResponseData>> => {
    return post('/auth/refresh', {data})
}

export const register = (data: IRegisterParams): Promise<IResponse<IRegisterResponseData>> => {
    return post('/auth/register', {data})
}

export const verify = (): Promise<IResponse<IVerifyResponseData>> => {
    return post('/auth/verify')
}

export const profile = (): Promise<IResponse<IProfileResponseData>> => {
    return get('/auth/profile')
}
