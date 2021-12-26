import React, { useState } from 'react';
import { Grid, Form, Segment, Button , Header, Message, Icon} from 'semantic-ui-react';
import { Link, Navigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useDispatch } from 'react-redux';
import { setLogin } from '../../actions'
import firebase from '../../firebase'
import { useNavigate  } from 'react-router-dom';


const auth = getAuth() 

    const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [value,setValue] = useState();
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    

    const isFormValid = () => {
       if(email && password) {
           return true;
       } else {
           return false;
       }   
    }

    const refresh = ()=>{
        // it re-renders the component
       setValue({});
    }

    const displayErros = () => {
        return <p>{errors.at(-1)}</p>
    }


    const handleChange = (event) => {
        if(event.target.name === 'email') {
            setEmail(event.target.value)
        } else {
            setPassword(event.target.value)
        }
    }

    const handleSubmit = (event) => {


        event.preventDefault();
        if(isFormValid()) {
            setErrors(null);
            setLoading(true)
            console.log(errors) 
        signInWithEmailAndPassword(auth, email, password)
        .then(signedInUser => {
            console.log(signedInUser);
        })
        .catch(err => {
            if(err.message === "Firebase: Error (auth/user-not-found).") {
                dispatch(setLogin('register'));
                setErrors(errors.concat(err.message));
                setLoading(false);
            } else {
                setErrors(errors.concat(err.message));
                setLoading(false);
            }

        });
    }

}



    const hanldeinputError = (inputName) => {
        if(errors){
            return (
                errors.some(error =>    
                error.toLowerCase().includes(inputName)) ? 'error' : ''
            )
        }
    }


    const handleChangeUrl = () => {
        console.log("hello");
        dispatch(setLogin('register'));
    }
   
        return (
            <Grid textAlign='center' verticalAlign='middle' className='app'>
                <Grid.Column style={{ maxWidth: 450}}>
                    <Header as="h1" icon color="violet" textAlign='center'>
                        <Icon name="code branch" color="violet" />
                        Logging to LRJ_CHAT
                    </Header>
                    <Form onSubmit={handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input fluid name="email" icon="mail" iconPosition='left' value={email}
                            placeholder="Email Address" onChange={handleChange} type="email" 
                            className={hanldeinputError('email')}/>

                            <Form.Input fluid name="password" icon="lock" iconPosition='left' value={password}
                            placeholder="Password" onChange={handleChange} type="password"
                            className={hanldeinputError('password')}/>        

                            <Button disabled={loading} className={loading ? 'loading' : ''} color="violet" fluid size="large">Submit</Button>  

                            
                        </Segment>
                    </Form>
                    {errors && errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {displayErros()}
                        </Message>
                    )}
                    <Message>Don't have an account <Link to="/register"><span onClick={handleChangeUrl}>Register</span></Link></Message>

                </Grid.Column>
            </Grid>
        )
    }

export default Login;