import React, { Component } from 'react';
import {Segment, Comment} from 'semantic-ui-react';
import firebase from '../../firebase'
import { ref, getDatabase, onChildAdded, update, remove, onValue, onChildRemoved, onDisconnect, off } from 'firebase/database';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions';


import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message'
import Typing from './Typing';
import Skeleton from './Skeleton';





let database = getDatabase();

class Messages extends Component {

    
    state = {
        privateChannel: this.props.isPrivateChannel,
        privateMessagesRef: ref(database, 'privateMessages'),
        messagesRef: ref(database, 'messages'),
        messages: [],
        messagesLoading: true,
        channel: this.props.currentChannel,
        isChannelStarred: false,
        user: this.props.currentUser,
        numUniqueUsers: '',
        searchTerm: '',
        searchLoading: false,
        searchResults: [],
        typingUsers: [],
        listeners: []
    }

    componentDidMount() {
        const {channel, user, listeners } = this.state;

        if(channel && user) {
            this.removeListeners(listeners);
            this.addListeners(channel.id);
            this.addUserStarsListener(channel.id, user.uid)
        }
    }

    componentWillUnmount() {
        const connectedRef = ref(database, ".info/connected");
        this.removeListeners(this.state.listeners);
        off(connectedRef);
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.messagesEnd) {
            this.scrollToBottom()
        }
    }

    removeListeners = (listeners) => {
        listeners.forEach(listener => {
            off(listener.ref)
        })
    }

    addToListeners = (id, ref, event) => {
        const index = this.state.listeners.findIndex(listener => {
            return listener.id === id && listener.ref === ref && listener.event === event;
        })

        if(index === -1) {
            const newListener = {id, ref, event};
            this.setState({
                listeners: this.state.listeners.concat(newListener)
            });
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({
            behavior: 'smooth'
        });
    }

    addUserStarsListener = (channelId, userId) => {
        onValue(ref(database, `users/${userId}/starred`), (snapshot) => {
            if(snapshot.val() !== null) {
                const channelIds = Object.keys(snapshot.val());
                const prevStarred = channelIds.includes(channelId);
                this.setState({
                    isChannelStarred: prevStarred
                });
            }
        },
        {
            onlyOnce: true
        });
    }

    addListeners = (channelId) => {
        this.addMessageListener(channelId);
        this.addTypingListeners(channelId);
    }

    addTypingListeners = (channelId) => {
        let typingUsers = [];
        const typingRef = ref(database, `typing/${channelId}`)
        const typingRef2 = ref(database, `typing/${channelId}/${this.state.user.uid}`)
        const connectedRef = ref(database, ".info/connected");
        onChildAdded(typingRef, (snapshot) => {
            if(snapshot.key !== this.state.user.uid) {
                typingUsers = typingUsers.concat({
                    id: snapshot.key,
                    name: snapshot.val()
                })
                this.setState({
                    typingUsers
                });
            }
        });
        this.addToListeners(channelId, typingRef, 'onChildAdded')

        onChildRemoved(typingRef, (snapshot) => {
            const index = typingUsers.findIndex(user => user.id === snapshot.key);
            if(index !== -1) {
                typingUsers = typingUsers.filter(user => user.id !== snapshot.key);
                this.setState({
                    typingUsers
                });
            }
        })
        this.addToListeners(channelId, typingRef, 'onChildRemoved')

        onValue(connectedRef, (snapshot) => {
            if(snapshot.val() === true) {
                onDisconnect(typingRef2)
                .remove(err => {
                    if(err !== null) {
                        console.error(err);
                    }
                })
            }
        })
        this.addToListeners(channelId, connectedRef, 'onValue')
    }

    addMessageListener = (channelId) => {
        const updatedRef = ref(database, this.getMessageRef() + channelId);
        let loadedMessages = [];
        onChildAdded(updatedRef, (snapshot) => {
            loadedMessages.push(snapshot.val());
            this.setState({
                messages: loadedMessages,
                messagesLoading: false
            });
            this.countUniqueUser(loadedMessages);
            this.countUserPosts(loadedMessages);
        });
        this.addToListeners(channelId, updatedRef, 'onChildAdded')
    }


    getMessageRef = () => {
        const {privateChannel} = this.state;
        return privateChannel ? ('privateMessages/') : ('messages/');

    }

    countUserPosts = (messages) => {
        let userPosts = messages.reduce((acc, message) => {
            if(message.user.name in acc) {
                acc[message.user.name].count += 1;
            } else {
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1
                }
            }
            return acc;
        }, {});
        this.props.setUserPosts(userPosts);
    }

    countUniqueUser = (messages) => {
        const uniqueUsers = messages.reduce((acc, message) => {
            if(!acc.includes(message.user.name)) {
                acc.push(message.user.name);
            }
            return acc
        }, []);
        const plural = uniqueUsers > 1 || uniqueUsers.length === 0;
        const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
        this.setState({
            numUniqueUsers 
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

    handleSearchChange = (event) => {
        this.setState({
            searchTerm: event.target.value,
            searchLoading: true
        }, () => this.handleSearchMessages());
    }

    handleSearchMessages = () => {
        const channelMessages = [...this.state.messages];
        const regex = new RegExp(this.state.searchTerm, 'gi');
        const searchResults = channelMessages.reduce((acc, message) => {
            if((message.content && message.content.match(regex)) || message.user.name.match(regex)) {
                acc.push(message);
            }
            return acc;
        }, []);
        this.setState({
            searchResults
        });
        setTimeout(() => this.setState({
            searchLoading: false
        }), 1000)
    }

    displayChannelName = channel => {
        return (
            channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` :
            ''
        )
    }

    handleStar = () => {
        this.setState(prevState => ({
            isChannelStarred: !prevState.isChannelStarred
        }), () => this.starChannel());
    }

    starChannel = () => {
        console.log(this.state.channel);
        if(this.state.isChannelStarred) {
           update(ref(database, `users/${this.state.user.uid}/starred`), {
               [this.state.channel.id]: {
                   name: this.state.channel.name,
                   details: this.state.channel.details,
                   createdBy: {
                       name: this.state.channel.cratedBy.user,
                       avatar: this.state.channel.cratedBy.avatar
                   }
               }
           });
        } else {
            remove(ref(database, `users/${this.state.user.uid}/starred/${this.state.channel.id}`))
            .catch(err => {
                if(err !== null) {
                    console.log(err)
                }
            });
        }
    }

    displayTypingUsers = (users) => (
        users.length > 0 &&
        users.map(user => (
            <div 
                style={{ display: "flex", alignItems: "center", marginBottom: '0.2em'}}
                key={user.id}
            >
                <span className='user__typing'>{user.name} is typing</span> <Typing />
            </div>
        ))
    )

    displayMessageSkeleton = (loading) => (
        loading ? (
            <React.Fragment>
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i}/>
                ))}
            </React.Fragment>
        ) : null
    )
    
    render() {
        const {messagesRef, channel, user, messages, numUniqueUsers, 
                searchResults, searchTerm, searchLoading, privateChannel, 
                isChannelStarred, typingUsers, messagesLoading} = this.state

        return (
            <>
                <MessagesHeader 
                    channelName={this.displayChannelName(channel)}
                    numUniqueUsers={numUniqueUsers}
                    handleSearchChange={this.handleSearchChange}
                    searchLoading={searchLoading}
                    isPrivateChannel={privateChannel}
                    handleStar={this.handleStar}
                    isChannelStarred={isChannelStarred}
                />

                <Segment>
                    <Comment.Group className='messages'>
                        {this.displayMessageSkeleton(messagesLoading)}
                        {searchTerm ? this.displayMessages(searchResults) :
                        this.displayMessages(messages)}
                        {this.displayTypingUsers(typingUsers)}
                        <div ref={node => (this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>

                <MessageForm 
                    messagesRef={messagesRef}
                    currentChannel={channel}
                    currentUser={user}
                    isPrivateChannel={privateChannel}
                    getMessageRef={this.getMessageRef}
                />
            </>
        )
    }
}

export default connect(null, {setUserPosts})(Messages);