import { combineReducers } from 'redux';
import * as actionsTypes from '../actions/types';


const initialUserState = {
    currentUser: null,
    isLoading: true
}

const user_reducer = (state = initialUserState, action) => {
    switch(action.type) {
        case actionsTypes.SET_USER:
            return {
                currentUser: action.payload.currentUser,
                isLoading: false
            };
        case actionsTypes.CLEAR_USER:
            return {
                ...state,
                isLoading: false
            }        
    default:
        return state;
    }
}

const initialChannelState = {
    currentChannel: null,
    isPrivateChannel: false,
    userPosts: null
}

const channel_reducer = (state = initialChannelState, action) => {
    switch(action.type) {
        case actionsTypes.SET_CURRENT_CHANNEL:
            return {
                ...state,
                currentChannel: action.payload.currentChannel
            };
        case actionsTypes.SET_PRIVATE_CHANNEL:
            return {
                ...state,
                isPrivateChannel: action.payload.isPrivateChannel
            };
        case actionsTypes.SET_USER_POSTS:
            return {
                ...state,
                userPosts: action.payload.userPosts
            }
        default:
            return state;
    }
}

const initialColorState = {
    primaryColor: '#4c3c4c',
    secondaryColor: '#eee'
}

const colors_reducer = (state = initialColorState, action) => {
    switch(action.type) {
        case actionsTypes.SET_COLOR:
            return {
                primaryColor: action.payload.primaryColor,
                secondaryColor: action.payload.secondaryColor
            }
        default: 
            return state;
    }
}

const initialLoginStatate = {
    register: "login"
}

const login_reducer = (state = initialLoginStatate, action) => {
    switch(action.type) {
        case actionsTypes.SET_REGISTER:
            return {
                register: action.payload.register
            }
        default:
            return state;
    }
}


const rootReducer = combineReducers({
    user: user_reducer,
    channel: channel_reducer,
    colors: colors_reducer,
    register: login_reducer
});

export default rootReducer;