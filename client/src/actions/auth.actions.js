import { REGISTER_FAIL, REGISTER_SUCCESS, SET_ALERT } from "../actions/types";
import axios from "axios";
import { setAlert } from "../actions/alert.actions";

export const registerUser = ({ name, email, password }) => async (dispatch) => {
  try {
    const requestBody = { name, email, password };
    const response = await axios.post("http://localhost:5000/api/users", requestBody);
    dispatch({
      type: REGISTER_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    const errors = error.response.data.errors;
    errors.forEach((error) => {
      dispatch(setAlert(error.msg, "danger"));
    });
    dispatch({
      type: REGISTER_FAIL,
    });
  }
};
