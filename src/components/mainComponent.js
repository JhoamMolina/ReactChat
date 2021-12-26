import React, {useEffect } from 'react';
import App from './App';
import Login from './Auth/Login'
import Register from './Auth/Register'
import { Routes, Route, useNavigate  } from 'react-router-dom';
import { getAuth, onAuthStateChanged} from 'firebase/auth'
import { useDispatch, useSelector} from 'react-redux';
import { setUser, clearUser } from '../actions';
import Spinner from '../Spinner';


let auth = getAuth();

const Root = () => {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector(state => state.user.isLoading) 
  const loginauth = useSelector(state => state.register.register)
  useEffect(() => {    
     onAuthStateChanged(auth, (user) =>{
      if(user) {
        dispatch(setUser(user))
        navigate("/");
      } else if(loginauth === 'register') {
        navigate('/register');
        dispatch(clearUser());
      } else {
        navigate('/login');
        dispatch(clearUser());
      }
    })
   },[navigate, dispatch, loginauth]) 

  return isLoading ? <Spinner /> : (
      <Routes>
        <Route exact path="/" element={<App />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/register" element={<Register />} />
      </Routes>
      )

}

export default (Root);
