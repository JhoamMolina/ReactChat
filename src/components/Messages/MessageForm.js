import React, { Component } from 'react'
import { Button, ButtonGroup, Segment, Input } from 'semantic-ui-react'
import { v4 as uuidv4 } from 'uuid';
import { getStorage, getDownloadURL, ref as ref2, uploadBytesResumable  } from "firebase/storage";
import { Timestamp } from "firebase/firestore";
import { set, getDatabase, ref, push , child, remove } from 'firebase/database';
import * as firebase from 'firebase/app'
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css'

import FileModal from './FileModal';
import ProgressBar from './ProgressBar'


let db = getDatabase();
const storage = getStorage();



class MessageForm extends Component {

    state = {
        uploadState: '',
        uploadTask: null,
        message: '',
        loading: false,
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        errors: [],
        modal: false,
        percentUpload: 0,
        emojiPicker: false
    }

    componentWillUnmount() {
        if(this.state.uploadTask !== null) {
            this.state.uploadTask.cancel();
            this.setState({
                uploadTask: null
            });
        }
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

    createMessage = (fileUrl = null) => {
        const message = {
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            },
            timestamp: Timestamp.now(new Date().getTime()),
        };
        if(fileUrl !== null) {
            message['image'] = fileUrl;
        } else {
            message['content'] = this.state.message;
        }
        return message;
    }

    sendMessage = () => {
        const { getMessageRef} = this.props
        const { message, channel, errors, user } = this.state;
        const typingRef = ref(db, `typing/${channel.id}/${user.uid}`)


        if(message) {
            this.setState({
                loading: true
            });
        set(ref(db, getMessageRef() + channel.id + '/' + push(child(ref(db),getMessageRef())).key), 
            this.createMessage())
        .then(() => {
            this.setState({
                loading: false, message: ''
            });
            remove(typingRef);
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

    sendFileMessage = (fileUrl, refToRecieved) => {
        set(ref(db, refToRecieved), 
            this.createMessage(fileUrl))
        .then(() => {
            this.setState({
                uploadState: 'done'
            });
        })
        .catch(err => {
            console.log(err);
            this.setState({
                errors: this.state.errors.concat(err)
            })
        })
    }

    getPath = () => {
        if(this.props.isPrivateChannel) {
            return `chat/private/${this.state.channel.id}`;
        } else {
            return 'chat/public'; 
        }
    }

    
    uploadFile = (file,metadata) => {
        const pathToUpload = this.state.channel.id;
        const filePath = `${this.getPath()}${uuidv4()}.jpg`
        const storageRef = ref2(storage, filePath);
        const refToPass = (this.props.getMessageRef() + pathToUpload + '/' + push(child(ref(db),this.props.getMessageRef())).key)

        this.setState({
            uploadState: 'uploading',
            uploadTask: uploadBytesResumable(storageRef, file, metadata)
        },
        () => {
            this.state.uploadTask.on('state_changed', 
                (snapshot) => {
                    const percentUpload = Math.round(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    this.setState({ percentUpload });
                },
                    error => {
                        console.error(error);
                        this.setState({
                            errors: this.state.errors.concat(error),
                            uploadState: 'error',
                            uploadTask: null 
                        });
                    },
                    () => {
                        getDownloadURL(this.state.uploadTask.snapshot.ref).then((downloadURL) => {
                            this.sendFileMessage(downloadURL, refToPass);
                    })
                    .catch(error => {
                        console.error(error);
                        this.setState({
                            errors: this.state.errors.concat(error),
                            uploadState: 'error',
                            uploadTask: null 
                        });
                    })
                })
            }
        )
    }

    handleKeyDown = (event) => {
        if(event.ctrlKey && event.keyCode === 13) {
            this.sendMessage();
        }

        const { message, channel, user } = this.state;
        const typingRef = ref(db, `typing/${channel.id}/${user.uid}`)

        if(message) {
            set(typingRef, user.displayName)
        } else {
            remove(typingRef)
        }
    }

    hanldeTogglePicker = () => {
        this.setState({
            emojiPicker: !this.state.emojiPicker
        });
    }

    handleAddEmoji = (emoji) => {
        const oldMessage = this.state.message;
        const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons}`);
        this.setState({
            message: newMessage,
            emojiPicker: false
        });
        setTimeout(() => this.messageInputRef.focus(), 0);
    }

    colonToUnicode = (message) => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
            x = x.replace(/:/g, "");
            let emoji = emojiIndex.emojis[x];
            if(typeof emoji !== "undefined") {
                let unicode = emoji.native;
                if(typeof unicode !== "undefined") {
                    return unicode;
                }
            }
            x = "." + x + ":";
            return x
        });
    };

    render() {
        const { errors, message, loading, modal, uploadState, percentUpload, emojiPicker } = this.state
        return (
            <Segment className='message__form'>
                {emojiPicker && (
                    <Picker
                        set="apple"
                        onSelect={this.handleAddEmoji}
                        className="emojipicker"
                        title='Pick Your emoji'
                        emoji='point_up'
                    />
                )}
                <Input
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    value={message}
                    ref={node => (this.messageInputRef = node)}
                    style={{ marginBottom: '0.7em'}}
                    label={
                        <Button 
                            icon={emojiPicker ? 'close': 'add'}
                            content={emojiPicker ?  'Close' : null} 
                            onClick={this.hanldeTogglePicker} 
                        />}
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
                        disabled={uploadState === 'uploading'}
                        onClick={this.openModal}
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                    />
                </ButtonGroup>
                <FileModal 
                        uploadFile={this.uploadFile}
                        modal={modal}
                        closeModal={this.closeModal}
                    />
                <ProgressBar 
                    uploadState={uploadState}
                    percentUpload={percentUpload}
                />
            </Segment>
        )
    }
}

export default MessageForm
