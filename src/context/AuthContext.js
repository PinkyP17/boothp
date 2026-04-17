import { createContext, useContext, useReducer, useMemo } from "react";

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
          // TODO: Replace with real API call to POST /api/v1/auth/login
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (!email || !password) {
            throw new Error("Email and password are required");
          }

          const mockUser = { id: 1, email, name: email.split("@")[0] };
          const mockToken = "mock-jwt-token";

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: mockUser, token: mockToken },
          });
        } catch (error) {
          dispatch({ type: "AUTH_ERROR", payload: error.message });
        }
      },

      signup: async (name, email, password) => {
        dispatch({ type: "SET_LOADING" });
        try {
          // TODO: Replace with real API call to POST /api/v1/auth/signup
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (!name || !email || !password) {
            throw new Error("All fields are required");
          }

          const mockUser = { id: 1, email, name };
          const mockToken = "mock-jwt-token";

          dispatch({
            type: "SIGNUP_SUCCESS",
            payload: { user: mockUser, token: mockToken },
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
