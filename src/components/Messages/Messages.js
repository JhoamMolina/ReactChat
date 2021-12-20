import React, { Component } from 'react';
import {Segment, Comment} from 'semantic-ui-react';
import firebase from '../../firebase'
import { ref, getDatabase, onChildAdded } from 'firebase/database';

import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message'


let database = getDatabase();

class Messages extends Component {

    
    state = {
        messagesRef: ref(database, 'messages'),
        messages: [],
        messagesLoading: true,
        channel: this.props.currentChannel,
        user: this.props.currentUser
    }

    componentDidMount() {
        const {channel, user } = this.state;

        if(channel && user) {
            this.addListeners(channel.id);
        }
    }

    addListeners = (channelId) => {
        this.addMessageListener(channelId);
    }

    addMessageListener = (channelId) => {
        const updatedRef = ref(database, 'messages' + '/' + channelId);
        let loadedMessages = [];
        onChildAdded(updatedRef, (snapshot) => {
            loadedMessages.push(snapshot.val());
            this.setState({
                messages: loadedMessages,
                messagesLoading: false
            })
        })
    }

    displayMessages = (messages) => {
        return (
            messages.length > 0 && messages.map(message => (
                <Message 
                key={message.timestamp.seconds}
                message={message}
                user={this.state.user} />
            ))
    )
}
    render() {
        const {messagesRef, channel, user, messages} = this.state

        return (
            <>
                <MessagesHeader />

                <Segment>
                    <Comment.Group className='messages'>
                        {this.displayMessages(messages)}
                    </Comment.Group>
                </Segment>

                <MessageForm 
                    messagesRef={messagesRef}
                    currentChannel={channel}
                    currentUser={user}
                />
            </>
        )
    }
}

export default Messages;