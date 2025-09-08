'use client';
import { error } from 'console';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Mode } from 'fs';

type User = { 
  id?: number;
  username?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage token on mount (in-house)
  // loading from localStorage (on client only)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user){localStorage.setItem('user', JSON.stringify(user));}
    else{localStorage.removeItem('user');}
  }, [user]);

  useEffect(() => {
    if (token){localStorage.setItem('token', token);}
    else{localStorage.removeItem('token');}
  }, [token]);

  // useEffect(() => {console.log('✅ user state updated:', user);}, [user]);
  // useEffect(() => {console.log('✅ token state updated:', token);}, [token]);

  // Define isLoggedIn: either in-house token/user or Google session user
  // const isLoggedIn = !!token;
  const isLoggedIn = !loading && !!token;

  // Polling every 1 min to check token age
  useEffect(()=>{
    if(!token) return;
    const interval = setInterval(()=>{
      // decoding jwt payload
      // jwt = <HEADER>.<PAYLOAD>.<SIGNATURE>
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp*1000;
      const timeRemaining = expiryTime - Date.now();
      // refreshing if token expires in <5mins
      if (timeRemaining < 5 * 60 * 1000){refreshToken();}
    }, 60*1000) //every 1min
    return () => clearInterval(interval);
  }, [token])
  const refreshToken = async ()=>{
    try{
      const response = await fetch('http://localhost:3001/api/refresh-token', {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`,},
      })
      const data = await response.json();
      if(response.ok && data.token){
        setToken(data.token);
        localStorage.setItem('token', data.token);
        console.log('🔄 Token refreshed');
      }
      else{console.warn('❌ Failed to refresh token');logout();}
    }
    catch(error){console.error('Error refreshing token:', error);logout();}
  }

  const logout = () => {
    // Clear in-house auth
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };


  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, loading, setUser, setToken, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context){throw new Error('useAuth must be used within an AuthProvider');}
  return context;
};