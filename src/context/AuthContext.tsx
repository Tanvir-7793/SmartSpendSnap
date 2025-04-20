
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, signIn, signUp, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const formattedUser: User = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        setCurrentUser(formattedUser);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await signIn(email, password);
      const user: User = {
        uid: response.user.uid,
        email: response.user.email,
        displayName: response.user.displayName,
        photoURL: response.user.photoURL
      };
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<User> => {
    try {
      const response = await signUp(email, password);
      const user: User = {
        uid: response.user.uid,
        email: response.user.email,
        displayName: response.user.displayName,
        photoURL: response.user.photoURL
      };
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
