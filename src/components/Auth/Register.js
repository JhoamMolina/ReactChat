import React, { Component } from 'react';
import { Grid, Form, Segment, Button , Header, Message, Icon} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile  } from "firebase/auth";
import md5 from 'md5'
import firebase from '../../firebase'
import { getDatabase, ref , set} from "firebase/database";

const database = getDatabase();
const auth = getAuth();

class Register extends Component {

    state = {
        username: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        errors: [],
        loading: false,
    }

    isFormValid = () => {
        let errors = [];
        let error;
        
        if(this.isFormEmpty(this.state)) {
            error = {message: 'Fill in all field'};
            this.setState({errors: errors.concat(error)});
            return false;

        }else if(!this.isPasswordValid(this.state)) {
            error = {message: 'Password is invalid'};
            this.setState({errors: errors.concat(error)});
            return false;
        }else {
            return true
        }
    }

    isFormEmpty = ({username, email, password, passwordConfirmation}) => {
        return !username.length || !email.length || !password.length ||
        !passwordConfirmation.length
    }
    
    isPasswordValid = ({password, passwordConfirmation}) => {
        if(password.length < 6 || passwordConfirmation.length < 6){
            return false;
        }else if(password !== passwordConfirmation) {
            return false;
        }else {
            return true;
        }
    }

    displayErros = (errors) => {
        return errors.map((error, i) =>  <p key={i}>{error.message}</p>)
    }


    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value

        })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if(this.isFormValid()) {
            this.setState({errors: [], loading: true})
            createUserWithEmailAndPassword(auth, this.state.email, this.state.password)
            .then(createdUser => {
                console.log(createdUser);
                updateProfile(auth.currentUser, {
                    displayName: this.state.username,
                    photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
                })
                .then(() => {
                    this.saveUser(createdUser).then(() => {
                        console.log('user saved')
                    })
                })
                .catch(err => {
                    console.log(err);
                    this.setState({ erros: this.state.errors.concat(err), loading: false});
                })

            })
            .catch(err => {
                console.log(err)
                this.setState({errors: this.state.errors.concat(err/* {message: 'The email address is already in use by another account'} */), loading: false}) 
            });
    }
}
    saveUser = (createdUser) => {
        return set(ref(database, 'users/' + createdUser.user.uid), {
            name: createdUser.user.displayName,
            avatar: createdUser.user.photoURL
        });
    }

    hanldeinputError = (errors, inputName) => {
        return errors.some(error => 
            error.message.toLowerCase().includes(inputName)) ? 'error' : '' 
    }





    render() {

        const {username, email, password, passwordConfirmation, errors, loading } = this.state;

        return (
            <Grid textAlign='center' verticalAlign='middle' className='app'>
                <Grid.Column style={{ maxWidth: 450}}>
                    <Header as="h1" icon color="orange" textAlign='center'>
                        <Icon name="puzzle piece" color="orange" />
                        Register for DevChat
                    </Header>
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input fluid name="username" icon="user" iconPosition='left' value={username}
                            placeholder="Username" onChange={this.handleChange} type="text" />

                            <Form.Input fluid name="email" icon="mail" iconPosition='left' value={email}
                            placeholder="Email Address" onChange={this.handleChange} type="email" 
                            className={this.hanldeinputError(errors, 'email')}/>

                            <Form.Input fluid name="password" icon="lock" iconPosition='left' value={password}
                            placeholder="Password" onChange={this.handleChange} type="password"
                            className={this.hanldeinputError(errors, 'password')}/>     

                            <Form.Input fluid name="passwordConfirmation" icon="repeat" iconPosition='left' value={passwordConfirmation}
                            placeholder="Password Confirmation" onChange={this.handleChange} type="password"
                            className={this.hanldeinputError(errors, 'password')}/>    

                            <Button disabled={loading} className={loading ? 'loading' : ''} color="orange" fluid size="large">Submit</Button>  

                            
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this.displayErros(errors)}
                        </Message>
                    )}
                    <Message>Already a user? <Link to="/login">Login</Link></Message>

                </Grid.Column>
            </Grid>
        )
    }
}

export default Register;