import { createContext, useContext, useReducer, useMemo } from "react";
import { API_BASE_URL } from "../config/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
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

    case "LOGOUT":
      return { ...initialState };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

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

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: { id: data.userId, email: data.email },
              token: data.token,
            },
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

          dispatch({
            type: "SIGNUP_SUCCESS",
            payload: {
              user: { id: data.userId, email: data.email, name },
              token: data.token,
            },
          });
        } catch (error) {
          dispatch({ type: "AUTH_ERROR", payload: error.message });
        }
      },

      logout: () => {
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
