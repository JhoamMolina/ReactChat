import React, { Component } from 'react'
import { Dropdown, Grid, Header, Icon, Image } from 'semantic-ui-react' 
import firebase from '../../firebase'
import { signOut, getAuth } from 'firebase/auth'
import { connect } from 'react-redux'

const auth = getAuth();

class UserPanel extends Component {

    state = {
        user: this.props.currentUser
    }

    dropDownOptions = () => [
        {
            key: "user",
            text: <span>Signed in as <strong>{this.state.user.displayName}</strong></span>,
            disabled: true
        },
        {
            key: "avatar",
            text: <span>Change Avatar</span>
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

    render() {
        const {user} = this.state;
        return (
            <Grid style={{ background: '#4c3c4c' }}>
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
                </Grid.Column>
            </Grid>
        )
    }
}

const mapStateToProps = state => ({
    currentUser: state.user.currentUser
})

export default connect(mapStateToProps, null)(UserPanel)