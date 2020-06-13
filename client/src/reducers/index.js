import { combineReducers } from "redux";
import AlertReducer from "./alert.reducer";
import AuthReducer from "./auth.reducer";

export default combineReducers({
  alert: AlertReducer,
  auth: AuthReducer,
});
