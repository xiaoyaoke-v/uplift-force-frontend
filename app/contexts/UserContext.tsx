'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getToken } from '@/utils/token';
import {type IUser } from '@/types'

interface IUserContext {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
}

const UserContext = createContext<IUserContext | null>(null);

export function UserProvider({ children }: {children: ReactNode}) {
  const [user, setUser] = useState<IUser | null>(null);

  return (
    <UserContext.Provider value={{ user,setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 