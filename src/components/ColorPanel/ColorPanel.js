import React, { Component } from 'react'
import {Sidebar, Menu, Divider, Button, Modal, Label, Icon, Segment} from 'semantic-ui-react'
import { SliderPicker } from 'react-color'
import { connect } from 'react-redux'
import firebase from '../../firebase'
import { getDatabase, ref, child, push, update, onChildAdded, off } from 'firebase/database'
import { setColors } from '../../actions'

let db = getDatabase();

class ColorPanel extends Component {
    state = {
        modal: false,
        primary: '',
        secondary: '',
        user: this.props.currentUser,
        UserColors: []
    }

    componentDidMount() {
        if(this.state.user){
            this.addListener(this.state.user.uid);
        }
    }

    componentWillUnmount() {
        this.removeListener();
    }

    removeListener = () => {
        const colorsRef = ref(db, `users/${this.state.user.uid}/colors`)
        off(colorsRef)
    }
    
    addListener = userId => {
        let UserColors = [];
        const colorsRef = ref(db, `users/${userId}/colors`)
        onChildAdded(colorsRef, (snapshot) => {
            UserColors.unshift(snapshot.val());
            this.setState({
                UserColors
            });
        });
    };

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
    
    handleChangePrimary = color => this.setState({ primary: color.hex }); 

    handleChangeSecondary = color => this.setState({ secondary: color.hex }); 

    handleSaveColors = () => {
        if(this.state.primary && this.state.secondary){
            this.saveColors(this.state.primary, this.state.secondary)
        }
    }

    saveColors = (primary, secondary) => {
        const key = push(child(ref(db),'colors')).key;
        update(ref(db, `users/${this.state.user.uid}/colors/${key}`), {primary, secondary})
        .then(() => {
            console.log('colors added')
            this.closeModal();
        })
        .catch(err => console.error(err));
    };

    displayUserColors = (colors) => (
        colors.length > 0 && colors.map((color, i) => (
            <React.Fragment key={i}>
                <Divider />
                <div 
                    className='color__container' 
                    onClick={() => this.props.setColors(color.primary, color.secondary)}
                >
                    <div className='color__square' style={{background: color.primary}}>
                        <div className='color__overlay' style={{background: color.secondary}}>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        ))
    )

    render() {
        const { modal, primary, secondary, UserColors } = this.state

        return (
            <Sidebar
                as={Menu}
                icon="labeled"
                inverted
                vertical
                visible
                width='very thin'
            >
                <Divider />
                <Button icon="add" size="small" color="blue" onClick={this.openModal}/>
                {this.displayUserColors(UserColors)}                
                {/* Color picker Modal */}
                <Modal basic open={modal} onClose={this.closeModal}>
                    <Modal.Header>Choose App Colors</Modal.Header>
                    <Modal.Content>
                        <Segment inverted>
                            <Label content="Primary Color" />
                            <SliderPicker color={primary} onChangeComplete={this.handleChangePrimary}/>
                        </Segment>
                        <Segment inverted>    
                            <Label content="Secondary Color" />
                            <SliderPicker color={secondary} onChangeComplete={this.handleChangeSecondary} />
                        </Segment>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color="green" inverted onClick={this.handleSaveColors}>
                            <Icon name="checkmark" /> Save Colors
                        </Button>
                        <Button color="red" inverted onClick={this.closeModal}>
                            <Icon name="remove" /> Cancel
                        </Button>
                    </Modal.Actions>
                </Modal>
            </Sidebar>
        )
    }
}

export default connect(null, {setColors})(ColorPanel);