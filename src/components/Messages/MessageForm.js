import React, { Component } from 'react'
import { Button, ButtonGroup, Segment, Input } from 'semantic-ui-react'
import uuidv4 from 'uuid'
import { getStorage } from "firebase/storage";
import { Timestamp } from "firebase/firestore";
import { set, getDatabase, ref, push , child } from 'firebase/database';
import * as firebase from 'firebase/app'
import FileModal from './FileModal';


let db = getDatabase();
const storage = getStorage();
class MessageForm extends Component {

    state = {
        message: '',
        loading: false,
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        errors: [],
        modal: false
    }

    openModal = () => {
        this.setState({
            modal: true
        })
    }

    closeModal = () => {
        this.setState({
            modal: false
        });
    }


    handleChange = (event) => {
        this.setState ({
            [event.target.name]: event.target.value
        });
    }

    createMessage = () => {
        const message = {
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            },
            content: this.state.message,
            timestamp: Timestamp.now(new Date().getTime()),
        }
        console.log(message);
        return message;
    }

    sendMessage = () => {
        const { message, channel, errors } = this.state;
        const key = push(child(ref(db),'messages')).key;

        if(message) {
            this.setState({
                loading: true
            });
        set(ref(db, 'messages/' + channel.id + '/' + key), 
            this.createMessage())
        .then(() => {
            this.setState({
                loading: false, message: ''
            });
        })
        .catch(err => {
            console.log(err);
            this.setState({
                loading: false,
                errors: errors.concat(err)
            });
        });
        } else {
            this.setState({
                errors: errors.concat({message: 'Add a message'})
            });
        }
    }   

    
    uploadFile = (file,metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.me
    }



    render() {
        const { errors, message, loading, modal } = this.state

        return (
            <Segment className='message__form'>
                <Input
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    value={message}
                    style={{ marginBottom: '0.7em'}}
                    label={<Button icon={'add'}                         onClick={this.openModal}/>}
                    labelPosition="left"
                    className={
                        errors.some(error => error.message.includes('message')) ? 'error' : ''
                    }
                    placeholder="write your message"
                />
                <ButtonGroup icon widths="2">
                    <Button
                        onClick={this.sendMessage}
                        disabled={loading}
                        color="orange"
                        content="Add Reply"
                        labelPosition='left'
                        icon="edit"
                    />
                    <Button
                        color="teal"
                        onClick={this.openModal}
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                    />
                    <FileModal 
                        uploadFile={this.uploadFile}
                        modal={modal}
                        closeModal={this.closeModal}
                    />
                </ButtonGroup>
            </Segment>
        )
    }
}

export default MessageForm
