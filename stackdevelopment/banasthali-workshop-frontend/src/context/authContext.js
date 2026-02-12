"use client";

import React, {useContext, createContext, useState, useEffect} from "react";
import {useRouter} from "next/navigation";


const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const router = useRouter();
  const [user, setUser] = useState(false);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    const saveduser = localStorage.getItem("user");
    if (saveduser){
      setUser(JSON.parse(saveduser));
    }
    setLoading(false);
  },[])

  const loginauth = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData?.token);
    router.push('/dashboard');
  }

  const logout = () => {
    setUser(null);
    localStorage.clear();
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{user, loginauth, logout, loading}}>
      {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context){
    throw new Error(`useAuth is not functioning`);
  }
  return context;
}