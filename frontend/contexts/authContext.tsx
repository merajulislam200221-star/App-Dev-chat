import { login, register } from "@/services/authSerrvice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AuthContextProps,
  DecodedTokenProps,
  UserProps,
} from "../utilis/types";
import {
  connectSocket,
  disconnectSocket,
} from "@/socket/socket";

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);

  const router = useRouter();

  const gotoHomePage = () => {
    setTimeout(() => {
      router.replace("/(main)/home");
    }, 1500);
  };

  const gotoWelcomePage = () => {
    setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 1500);
  };

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");

      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedTokenProps>(storedToken);

          const currentTime = Math.floor(Date.now() / 1000);

          if (decoded.exp && decoded.exp < currentTime) {
            await AsyncStorage.removeItem("token");
            gotoWelcomePage();
            return;
          }

          setToken(storedToken);

          setUser(decoded.user);

          await connectSocket();

          gotoHomePage();
        } catch (error) {
          console.log("Failed to decode token:", error);
          gotoWelcomePage();
        }
      } else {
        gotoWelcomePage();
      }
    };

    loadToken();
  }, []);

  const updateToken = async (token: string) => {
    if (token) {
      setToken(token);

      await AsyncStorage.setItem("token", token);

      const decoded = jwtDecode<DecodedTokenProps>(token);

      console.log("LOG decoded token:", decoded);

      setUser(decoded.user);

      console.log("LOG user:", decoded.user);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password);

    await updateToken(response.token);

    await connectSocket();

    router.replace("/(main)/home");
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    avatar?: string | null
  ) => {
    const response = await register(
      email,
      password,
      name,
      avatar
    );

    await updateToken(response.token);

    await connectSocket();

    router.replace("/(main)/home");
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);

    await AsyncStorage.removeItem("token");

    disconnectSocket();

    router.replace("/(auth)/welcome");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        signIn,
        signUp,
        signOut,
        updateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);