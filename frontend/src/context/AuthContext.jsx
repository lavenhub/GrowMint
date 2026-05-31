import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const loadStoredUser = () => {
  try {
    const stored = localStorage.getItem('spectra_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

const persistUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('spectra_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('spectra_user');
    }
  } catch (error) {
    // ignore storage errors
  }
};

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(loadStoredUser);

  const setUser = (value) => {
    setUserState(value);
    persistUser(value);
  };

  const switchRole = (role) => {
    if (role === 'teacher') {
      setUser({
        id: 'teach-1',
        name: 'Prof. Kabir',
        role: 'teacher',
        email: 'kabir.faculty@dtu.edu',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kabir',
      });
    } else {
      setUser({
        id: 'std-1',
        name: 'Aarav Sharma',
        role: 'student',
        email: 'aarav.sharma@dtu.edu',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
