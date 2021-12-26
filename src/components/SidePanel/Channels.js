import React, { Component } from 'react';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';
import { getDatabase,set, ref, child, push, onChildAdded, off, onValue, remove } from "firebase/database";
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import firebase from '../../firebase'

const database = getDatabase();

class Channels extends Component {

    state = {
        user: this.props.currentUser,
        channels: [],
        channelName: '',
        channel: null,
        notificacions: [],
        channelDetails: '',
        modal: false,
        firstLoad: true,
        activeChannel: ""
    }

    componentDidMount() {
        this.addListeners();
    }

    componentWillUnmount() {
        this.removeListeners();
      }



    removeListeners = () => {
        const channelRef = ref(database, 'channels');
        off(channelRef);
        this.state.channels.forEach(channel => {
            const ref2 = ref(database, `messages/${channel.id}`);
            off(ref2)
        })
    };

    addListeners = () => {
        let loadedChannels = [];
        const channelRef = ref(database, 'channels');
        onChildAdded(channelRef, (snapshot) => {
            loadedChannels.push(snapshot.val());
            this.setState({
                channels: loadedChannels
            }, () => this.setFirstChannel());
            this.addNotifiacionListener(snapshot.key);
        })
    }

    addNotifiacionListener = channelId => {
        const reference = ref(database, 'messages/' + channelId)
        onValue(reference, snapshot => {
            if(this.state.channel) {
                console.log(snapshot.size);
                this.handleNotifiacions(channelId, this.state.channel.id, this.state.notificacions, snapshot);
            }
        })
    }

    handleNotifiacions = (channelId, currentChannelId, notificacions, snap) => {
        let lastTotal = 0;

        let index = notificacions.findIndex(notificacion => notificacion.id === channelId);

        if(index !== -1) {
            if(channelId !== currentChannelId) {
                lastTotal = notificacions[index].total;

                if(snap.size - lastTotal > 0) {
                    notificacions[index].count = snap.size - lastTotal;
                }
            }
            notificacions[index].lastKnownTotal = snap.size;
        } else {
            notificacions.push({
                id: channelId,
                total: snap.size,
                lastKnownTotal: snap.size,
                count: 0
            });
        }

        this.setState({
            notificacions
        })
    }

    closeModal = () => {
        this.setState({
            modal: false
        })
    }

    openModal = () => {
        this.setState({
            modal: true
        })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if(this.isFormValid(this.state)) {
            this.addChannel();
        }
    }

    setFirstChannel = ()  => {
        const firstChannel = this.state.channels[0];
        if(this.state.firstLoad && this.state.channels.length > 0) {
            this.props.setCurrentChannel(firstChannel);
            this.setActiveChannel(firstChannel);
            this.setState({
                channel: firstChannel
            })
        }
        this.setState({
            firstLoad: false
        });
    }

    addChannel = () => {
        const { channelName, channelDetails, user} = this.state;

        const key = push(child(ref(database),'channels')).key;

        const newChannel = {
            id: key,
            name: channelName,
            details: channelDetails,
            cratedBy: {
                user: user.displayName,
                avatar: user.photoURL
            }
        };

        set(ref(database, 'channels/' + key), newChannel)
        .then(() => {
            this.setState({
                channelName: '',
                channelDetails: ''
            });
            this.closeModal();
            console.log('Channel Added');
        })
        .catch(err => {
            console.log(err);
        })


    }

    isFormValid = ({ channelName, channelDetails }) => {
        return channelName && channelDetails;
    }

    handleChange = (event) =>  {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    displayChannels = (channels) => {
        return (
            channels.length > 0 && channels.map(channel => (
                <Menu.Item
                    key={channel.id}
                    onClick={() => this.changeChannel(channel)}
                    name={channel.name}
                    style={{opacity: 0.7}}
                    active={channel.id === this.state.activeChannel}
                >
                    {this.getNotificacionCount(channel) && (
                        <Label color="red">{this.getNotificacionCount(channel)}</Label>
                    )}
                    # {channel.name}
                </Menu.Item>
            )
        ));
    }

    setActiveChannel = (channel) => {
        this.setState({
            activeChannel: channel.id
        })

    }

    changeChannel = channel => {
        const typingRef = ref(database, `typing/${this.state.channel.id}/${this.state.user.uid}`)

        this.setActiveChannel(channel);
        remove(typingRef)
        this.clearNotificacions();
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
        this.setState({
            channel
        })
    }

    clearNotificacions = () => {
        let index = this.state.notificacions.findIndex(notificacion => notificacion.id === 
            this.state.channel.id);
        
        if(index !== -1) {
            let updatedNotificacions = [...this.state.notificacions];
            updatedNotificacions[index].total = this.state.notificacions[index].lastKnownTotal;
            updatedNotificacions[index].count = 0;
            this.setState({
                notificacions: updatedNotificacions
            });
        }
    }

    getNotificacionCount = channel => {
        let count = 0;

        this.state.notificacions.forEach(notificacion => {
            if(notificacion.id === channel.id) {
                count = notificacion.count;
            }
        });

        if(count > 0) return count;
    }


    render() {
        const { channels, modal } = this.state;

        return (
            <>
            <Menu.Menu className='menu'>
                <Menu.Item>
                    <span>
                        <Icon name="exchange" /> CHANNELS
                    </span>{' '}
                    ({channels.length}) <Icon name="add" onClick={this.openModal} />
                </Menu.Item>
                {this.displayChannels(channels)}
            </Menu.Menu>

            <Modal basic open={modal} onClose={this.closeModal}>
                <Modal.Header>Add a Channel</Modal.Header>
                <Modal.Content>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Field>
                            <Input
                                fluid
                                label="Name of Channel"
                                name="channelName"
                                onChange={this.handleChange}
                                />
                        </Form.Field>
                        <Form.Field>
                            <Input
                                fluid
                                label="About the Channel"
                                name="channelDetails"
                                onChange={this.handleChange}
                                />
                        </Form.Field>
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button color="green" inverted onClick={this.handleSubmit}>
                        <Icon name="checkmark" /> Add
                    </Button>
                    <Button color="red" inverted onClick={this.closeModal}>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>
            </>
        );
    }
}

export default connect(null, {setCurrentChannel, setPrivateChannel})(Channels);