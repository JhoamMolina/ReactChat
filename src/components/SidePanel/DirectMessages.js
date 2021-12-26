import React, { Component } from 'react'
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { getDatabase, onValue, onChildAdded, ref, set, onDisconnect, onChildRemoved, off  } from 'firebase/database';
import { setCurrentChannel, setPrivateChannel } from '../../actions';

let db = getDatabase();

class DirectMessages extends Component {

    state = {
        activeChannel: '',
        user: this.props.currentUser,
        users: []
    }

    componentDidMount() {
        if(this.state.user) {
            this.addListeners(this.state.user.uid)
        }
    }

    componentWillUnmount() {
        this.removeListeners();
    }

    removeListeners = () => {
        off(ref(db, 'users'));
        off(ref(db, 'presence'));
        off(ref(db, ".info/connected"));
    }

    addListeners = currentUserUid => {
        let loadedUsers = [];
        const channelRef = ref(db, 'users');
        const connectedRef = ref(db, ".info/connected");
        const presenceRef = ('presence/' + currentUserUid);
        const presenceRef2 = ref(db, 'presence/' + currentUserUid);
        const presenceRef3 = ref(db, 'presence/');
        onChildAdded(channelRef, (snapshot) => {
            if(currentUserUid !== snapshot.key ){
                let user = snapshot.val();
                user['uid'] = snapshot.key;
                user['status'] = 'offline';
                loadedUsers.push(user);
                this.setState({
                    users: loadedUsers
                });
            }
        });
        onValue(connectedRef, snapshot => {
            console.log(snapshot.val())
            if(snapshot.val() === true) {
                set(ref(db, presenceRef), true)
                onDisconnect(presenceRef2).remove().catch((err) => {
                    if(err !== null){
                        console.log(err);
                    }
                })
            }
        });

        onChildAdded(presenceRef3, snapshot => {
            if(currentUserUid !== snapshot.key) {
                this.addStatusToUser(snapshot.key)
            }
        });
        onChildRemoved(presenceRef3, snapshot => {
            if(currentUserUid !== snapshot.key) {
                this.addStatusToUser(snapshot.key, false)
            }
        });
    }

    addStatusToUser = (userId, connected = true) => {
        const updatedUsers = this.state.users.reduce((acc, user) => {
            if(user.uid === userId){
                user['status'] = `${connected ? 'online' : 'offline'}`;
            }
            return acc.concat(user);
        }, []);
        this.setState({
            users: updatedUsers
        });
    }

    isUserOnline = user => {
        if(user.status === 'online') {
            return true
        } else {
            return false
        }        
    }

    changeChannel = (user) => {
        const channelId = this.getChannelId(user.uid)
        const channelData = {
            id: channelId,
            name: user.name,
        };
        this.props.setCurrentChannel(channelData);
        this.props.setPrivateChannel(true);
        this.setActiveChannel(user.uid);
    }

    setActiveChannel = userId => {
        this.setState({
            activeChannel: userId
        });
    }

    getChannelId = (userId) => {
        const currentUserId = this.state.user.uid;
        
        return userId < currentUserId ? 
            `${userId}/${currentUserId}` : `${currentUserId}/${userId}`
    }

    render() {
        const { users, activeChannel } = this.state;

        return (
            <Menu.Menu className='menu'>
                <Menu.Item>
                    <span>
                        <Icon name="mail" /> DIRECT MESSAGES
                    </span>{' '}
                    ({ users.length })
                </Menu.Item>
                {users.map(user => (
                    <Menu.Item
                        key={user.uid}
                        active={user.uid === activeChannel}
                        onClick={() => this.changeChannel(user)}
                        style={{opacity: 0.7, fontStyle: 'italic'}}
                    >
                        <Icon 
                            name="circle"
                            color={this.isUserOnline(user) ? 'green' : 'red'}
                        />
                        @ {user.name}
                    </Menu.Item>
               ))}
            </Menu.Menu>
        )
    }
}

export default connect(null, {setCurrentChannel, setPrivateChannel})(DirectMessages);