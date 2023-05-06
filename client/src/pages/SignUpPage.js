import React, {useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SignUpForm from '../components/SignUpForm';
import { useNavigate } from 'react-router-dom';
import {gql, useApolloClient } from '@apollo/client';

const REGISTER = gql`
  query Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      userId
      token
    }
  }
`;

function SignUpPage() {
    const [err, setErr] = useState(null);
    const navigate = useNavigate(); 
    const client = useApolloClient();
  
    const signUp = async (body) => { 
    client.query({
        query: REGISTER,
        variables: {name: body.name, email: body.email, password: body.password},
      })
      .then(result => {
         if (result.data && result.data.register) {
          var tokenData = result.data.register;
          console.log(tokenData);

        if (tokenData.token !== 'Register error') {
            if (tokenData.token === 'Email already exist') {
                setErr('Аккаунт с таким email существует');
            } else {
                console.log('Регистрация прошла успешно!');
                alert('Регистрация прошла успешно!');
                document.cookie = tokenData.token + '; max-age=3600; path=/;';
                document.cookie = tokenData.userId + '; max-age=3600; path=/;';
                setErr(null);

                navigate("/");
                window.location.reload();                    
            }
        }
      }})
      .catch(error => {
        console.error(error);
      });
    };
  
    return (
        <div className="wrapper">
            <Header/>
            <div className="sign-content">
                <SignUpForm
                    signUp={signUp}
                    serverErr={err}
                />
            </div>  
            <Footer/>  
        </div>
    )
  }
  
  export default SignUpPage; 