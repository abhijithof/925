import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UserData {
  name: string;
  age: number;
  gender: string;
  contact?: string;
}

interface UserContextType {
  userData: UserData;
  setUserData: (data: UserData) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    age: 0,
    gender: '',
    contact: ''
  });

  const clearUserData = () => {
    setUserData({
      name: '',
      age: 0,
      gender: '',
      contact: ''
    });
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};