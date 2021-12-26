import React, { Component } from 'react'
import { Menu, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions'
import { getDatabase, off, onChildAdded, onChildRemoved, ref } from 'firebase/database'

let db = getDatabase();

class Starred extends Component {

    state = {
        user: this.props.currentUser,
        activeChannel: '',
        starredChannels: []
    }


    displayChannels = (starredChannels) => {
        return (
            starredChannels.length > 0 && starredChannels.map(channel => (
                <Menu.Item
                    key={channel.id}
                    onClick={() => this.changeChannel(channel)}
                    name={channel.name}
                    style={{opacity: 0.7}}
                    active={channel.id === this.state.activeChannel}
                >
                    # {channel.name}
                </Menu.Item>
            )
        ));
    }

    componentDidMount(){
        console.log(this.props)
        if(this.state.user) {
            this.addListeners(this.state.user.uid);    
        }
    }

    componentWillUnmount(){
        this.removeListener();
    }

    removeListener = () => {
        off(ref(db, `users/${this.state.user.uid}/starred`))
    }

    addListeners = (userId) => {
        const channelRef = ref(db, `users/${userId}/starred`)

        onChildAdded(channelRef, snapshot => {
            const starredChannel = {id: snapshot.key, ...snapshot.val()};
            this.setState({
                starredChannels: [...this.state.starredChannels, starredChannel]
            });
        });
        onChildRemoved(channelRef, snapshot => {
            const channelToRemove = {id: snapshot.key, ...snapshot.val() };
            const filteredChannels = this.state.starredChannels.filter(channel => {
                return channel.id !== channelToRemove.id;
            });
            this.setState({
                starredChannels: filteredChannels
            });
        });
    }

    setActiveChannel = (channel) => {
        this.setState({
            activeChannel: channel.id
        })

    }

    changeChannel = channel => {
        this.setActiveChannel(channel);
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
    }

    render() {
        const {starredChannels} = this.state
        return (
            <Menu.Menu className='menu'>
                <Menu.Item>
                    <span>
                        <Icon name="star" /> STARRED
                    </span>{' '}
                    ({starredChannels.length})
                </Menu.Item>
                {this.displayChannels(starredChannels)}
            </Menu.Menu>
        )
    }
}

export default connect(null, {setCurrentChannel, setPrivateChannel})(Starred)
