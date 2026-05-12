import { createContext, useContext, useReducer, useMemo, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoring: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: true, error: null };

    case "LOGIN_SUCCESS":
    case "SIGNUP_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "RESTORE_TOKEN":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isRestoring: false,
      };

    case "RESTORE_DONE":
      return { ...state, isRestoring: false };

    case "LOGOUT":
      return { ...initialState, isRestoring: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore token from SecureStore on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        const userJson = await SecureStore.getItemAsync("auth_user");
        if (token && userJson) {
          dispatch({
            type: "RESTORE_TOKEN",
            payload: { token, user: JSON.parse(userJson) },
          });
        } else {
          dispatch({ type: "RESTORE_DONE" });
        }
      } catch {
        dispatch({ type: "RESTORE_DONE" });
      }
    })();
  }, []);

  const actions = useMemo(
    () => ({
      login: async (email, password) => {
        dispatch({ type: "SET_LOADING" });
        try {
          if (!email || !password) {
            throw new Error("Email and password are required");
          }

          const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            const msg = data.errors
              ? Object.values(data.errors).join(", ")
              : data.message || "Invalid email or password";
            throw new Error(msg);
          }

          const user = { id: data.userId, email: data.email };
          await SecureStore.setItemAsync("auth_token", data.token);
          await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, token: data.token },
          });
        } catch (error) {
          dispatch({ type: "AUTH_ERROR", payload: error.message });
        }
      },

      signup: async (name, email, password) => {
        dispatch({ type: "SET_LOADING" });
        try {
          if (!name || !email || !password) {
            throw new Error("All fields are required");
          }

          const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            const msg = data.errors
              ? Object.values(data.errors).join(", ")
              : data.message || "Signup failed";
            throw new Error(msg);
          }

          const user = { id: data.userId, email: data.email, name };
          await SecureStore.setItemAsync("auth_token", data.token);
          await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
          dispatch({
            type: "SIGNUP_SUCCESS",
            payload: { user, token: data.token },
          });
        } catch (error) {
          dispatch({ type: "AUTH_ERROR", payload: error.message });
        }
      },

      logout: async () => {
        await SecureStore.deleteItemAsync("auth_token");
        await SecureStore.deleteItemAsync("auth_user");
        dispatch({ type: "LOGOUT" });
      },

      clearError: () => {
        dispatch({ type: "CLEAR_ERROR" });
      },
    }),
    [],
  );

  return (
    <AuthContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
