import { REGISTER_FAIL, REGISTER_SUCCESS } from "../actions/types";

const initialState = {
  token: localStorage.getItem("token"),
  isAuthenticated: null,
  loading: true,
  user: null,
};

const AuthReducer = () => (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case REGISTER_SUCCESS:
      localStorage.setItem("token", payload.token);
      return {
        ...state,
        isAuthenticated: true,
        token: payload.token,
        loading: false,
      };
    case REGISTER_FAIL:
      localStorage.removeItem("token");
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        loading: false,
      };
    default:
      return state;
  }
};

export default AuthReducer;
