import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {gql, useApolloClient } from '@apollo/client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SignInForm from '../components/SignInForm';

const LOGIN = gql`
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      userId
      token
    }
  }
`;

function SignInPage() {
    const [err, setErr] = useState(null); 
    const navigate = useNavigate(); 
    const client = useApolloClient();
  
    const signIn = async (body) => { 
      client.query({
        query: LOGIN,
        variables: {email: body.email, password: body.password},
      })
      .then(result => {
         if (result.data && result.data.login) {
          var tokenData = result.data.login;
          console.log(tokenData);

          if (tokenData.token !== 'Login error') {
            if (tokenData.token === 'Invalid password' || tokenData.token === 'User not found') {
                setErr('Неверно указан email или пароль');
            } else {
                document.cookie = tokenData.token + '; max-age=3600; path=/;';
                document.cookie = tokenData.userId + '; max-age=3600; path=/;';
                console.log(document.cookie);
                setErr(null);
  
                navigate("/");
                window.location.reload();                    
            }
          } else {
            console.log('Ошибка :\\ ');
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
                <SignInForm
                    signIn={signIn}
                    serverErr={err}
                />
            </div>  
            <Footer/>  
        </div>
    )
  }
  
  export default SignInPage; 