import React, { Component } from 'react'
import { Button, Dropdown, Grid, Header, Icon, Image, Input, Modal } from 'semantic-ui-react' 
import firebase from '../../firebase'
import { signOut, getAuth, updateProfile } from 'firebase/auth'
import { connect } from 'react-redux'
import AvatarEditor from 'react-avatar-editor'
import { getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import { getDatabase, ref as ref2, update } from 'firebase/database'

const auth = getAuth();
let storage = getStorage();
let db = getDatabase();

class UserPanel extends Component {

    state = {
        user: this.props.currentUser,
        modal: false,
        previewImage: '',
        croppedImage: '',
        blob: '',
        metadata: {
            contentType: 'image/jpeg'
        }
    }

    openModal = () => {
        this.setState({
            modal: true
        });
    }

    closeModal = () => {
        this.setState({
            modal: false
        });
    }

    dropDownOptions = () => [
        {
            key: "user",
            text: <span>Signed in as <strong>{this.state.user.displayName}</strong></span>,
            disabled: true
        },
        {
            key: "avatar",
            text: <span onClick={this.openModal}>Change Avatar</span>
        },
        {
            key: "signout",
            text: <span onClick={this.handleSignout}>Sign out</span>
        }
    ]

    handleSignout = () => {
        signOut(auth)
        .then(() => console.log('signed out'));
    }

    handleChange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        if(file) {
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                this.setState({
                    previewImage: reader.result
                })
            });
        }
    }

    handleCropImage = () => {
        if(this.AvatarEditor) {
            this.AvatarEditor.getImageScaledToCanvas().toBlob(blob => {
                let imageUrl = URL.createObjectURL(blob);
                this.setState({
                    croppedImage: imageUrl,
                    blob
                });
            });
        }
    }

    uploadCroppedImage = () => {
        const storageRef = ref(storage, `avatars/user/${auth.currentUser.uid}`)
        console.log(storageRef);
        uploadBytes(storageRef, this.state.blob, this.state.metadata).then(snap => {
            console.log(snap.ref);
            getDownloadURL(snap.ref).then(downloadURL => {
                this.setState({
                    uploadedCroppedImage: downloadURL
                }, () => 
                    this.changeAvatar())
                })
            })
        }

    changeAvatar = () => {
        const dbRef = ref2(db, `users/${this.state.user.uid}`)

        updateProfile(auth.currentUser, {
            photoURL: this.state.uploadedCroppedImage
        })
        .then(()=> {
            console.log('PhotoURL updated');
            this.closeModal();
        })
        .catch(err => {
            console.error(err);
        })

        update(dbRef, {avatar: this.state.uploadedCroppedImage})
        .then(() => {
            console.log('User avatar updated');
        })
        .catch(err => {
            console.error(err);
        })
    }

    render() {
        const {user, modal, previewImage, croppedImage} = this.state;
        const {primaryColor} = this.props;
        console.log(croppedImage);
        return (
            <Grid style={{ background: primaryColor }}>
                <Grid.Column>    
                    <Grid.Row style={{ padding: '1.2em', margin: 0}}>
                        {/* app header */}
                        <Header inverted floated="left" as="h2">
                            <Icon name="code" />
                                <Header.Content>
                                    LRJ_Chat
                                </Header.Content>
                        </Header>
                    </Grid.Row>
                {/*user dropdown*/}
                <Header style={{padding: '0.25em'}} as="h4" inverted>
                    <Dropdown trigger={
                        <span>
                            <Image src={user.photoURL} spaced="right" avatar />
                            {user.displayName}                        
                        </span>
                        } options={this.dropDownOptions()}/>
                </Header>

                {/* Change user avatar modal */ }
                <Modal basic open={modal} onClose={this.closeModal}>
                    <Modal.Header>Change Avatar</Modal.Header>
                    <Modal.Content>
                        <Input
                            onChange={this.handleChange} 
                            fluid
                            type="file"
                            label="New avatar"
                            name="previewImage"
                        />
                        <Grid centered stackable columns={2}>
                            <Grid.Row centered>
                                <Grid.Column className='ui center aligned grid'>
                                    {previewImage && (
                                        <AvatarEditor
                                            ref={node => (this.AvatarEditor = node)}
                                            image={previewImage}
                                            width={120}
                                            height={120}
                                            border={50}
                                            scale={1.2}
                                        />
                                    )}
                                </Grid.Column>
                                <Grid.Column>
                                    {croppedImage && (
                                        <Image 
                                            style={{margin: '3.5em auto'}}
                                            width={100}
                                            height={100}
                                            src={croppedImage}
                                        />
                                    )}
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        {croppedImage && <Button color="green" inverted onClick={this.uploadCroppedImage}> 
                            <Icon name="save"/> Change Avatar
                        </Button>}
                        <Button color="green" inverted onClick={this.handleCropImage}> 
                            <Icon name="image"/> Preview
                        </Button>
                        <Button color="red" inverted onClick={this.closeModal}> 
                            <Icon name="remove"/> Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
                </Grid.Column>
            </Grid>           
        )
    }
}

const mapStateToProps = state => ({
    currentUser: state.user.currentUser
})

export default connect(mapStateToProps, null)(UserPanel)