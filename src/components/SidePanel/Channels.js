import React, { Component } from 'react';
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react';
import { getDatabase,set, ref, child, push, onChildAdded } from "firebase/database";
import { connect } from 'react-redux';
import { setCurrentChannel } from '../../actions';
import firebase from '../../firebase'

const database = getDatabase();

class Channels extends Component {

    state = {
        user: this.props.currentUser,
        channels: [],
        channelName: '',
        channelDetails: '',
        modal: false,
        firstLoad: true,
        activeChannel: ""
    }

    componentDidMount() {
        this.addListeners();
    }

    addListeners = () => {
        let loadedChannels = [];
        const channelRef = ref(database, 'channels');
        onChildAdded(channelRef, (snapshot) => {
            loadedChannels.push(snapshot.val());
            this.setState({
                channels: loadedChannels
            }, () => this.setFirstChannel());
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
        this.setActiveChannel(channel);
        this.props.setCurrentChannel(channel);
    }


    render() {
        const { channels, modal } = this.state;

        return (
            <>
            <Menu.Menu style={{ paddingBottom: '2em' }}>
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

export default connect(null, {setCurrentChannel})(Channels);