import React, { Component } from 'react';
import { Grid, Form, Segment, Button , Header, Message, Icon} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import firebase from '../../firebase'
import { getDatabase, ref , set} from "firebase/database";

const database = getDatabase();
const auth = getAuth();

class Login extends Component {

    state = {
        email: '',
        password: '',
        errors: [],
        loading: false,
    }

    isFormValid = ({email, password}) => email && password;   


    displayErros = (errors) => {
        return errors.map((error, i) =>  <p key={i}>{error.message}</p>)
    }


    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value

        })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if(this.isFormValid(this.state)) {
            this.setState({errors: [], loading: true});
        signInWithEmailAndPassword(auth, this.state.email, this.state.password)
        .then(signedInUser => {
            console.log(signedInUser);
        })
        .catch(err => {
            console.log(err);
            this.setState({
                errors: this.state.errors.concat(err.message),
                loading: false
            });
        });
    }
}



    hanldeinputError = (errors, inputName) => {
        return errors.some(error => 
            error.message.toLowerCase().includes(inputName)) ? 'error' : '' 
    }





    render() {

        const {email, password, errors, loading } = this.state;

        return (
            <Grid textAlign='center' verticalAlign='middle' className='app'>
                <Grid.Column style={{ maxWidth: 450}}>
                    <Header as="h1" icon color="violet" textAlign='center'>
                        <Icon name="code branch" color="violet" />
                        Loging to DevChat
                    </Header>
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input fluid name="email" icon="mail" iconPosition='left' value={email}
                            placeholder="Email Address" onChange={this.handleChange} type="email" 
                            className={this.hanldeinputError(errors, 'email')}/>

                            <Form.Input fluid name="password" icon="lock" iconPosition='left' value={password}
                            placeholder="Password" onChange={this.handleChange} type="password"
                            className={this.hanldeinputError(errors, 'password')}/>        

                            <Button disabled={loading} className={loading ? 'loading' : ''} color="violet" fluid size="large">Submit</Button>  

                            
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this.displayErros(errors)}
                        </Message>
                    )}
                    <Message>Don't have an account <Link to="/register">Register</Link></Message>

                </Grid.Column>
            </Grid>
        )
    }
}

export default Login;