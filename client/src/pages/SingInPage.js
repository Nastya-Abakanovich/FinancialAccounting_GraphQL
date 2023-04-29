import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SignInForm from '../components/SignInForm';

function SignInPage() {

    const [err, setErr] = useState(null); 
    const navigate = useNavigate();   
  
    const signIn = async (body) => { 
        const formData = new FormData();        
        formData.append('email', body.email);
        formData.append('password', body.password);
    
        await fetch('/api/users/login', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
        .then((response) => {
            
            if (response.status === 400 || response.status === 403) {
                setErr('Неверно указан email или пароль');
            } else {
                setErr(null);
                navigate("/");
            }          
        })
        .catch((err) => {
            console.log(err.message);
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