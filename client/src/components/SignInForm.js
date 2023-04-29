import React from 'react';
import { Link } from 'react-router-dom';

class SignInForm extends React.Component {
    constructor(props){
      super(props);
      this.onChange = this.handleChange.bind(this);
      this.onSubmit = this.handleSubmit.bind(this);
  
      this.state = {
        body: {email: "", password: ""}, 
        error: ""
    };
    }

    componentWillReceiveProps(nextProps) {
		if (nextProps.serverErr !== null)
		{
		  this.setState({ error: nextProps.serverErr});
		} else {
            this.setState({ error: ""});
        }
	}
  
    handleChange (e) {
      var newBody = this.state.body;
      newBody[e.target.name] = e.target.value;
      this.setState({body: newBody});     
    }
  
    handleSubmit(e) {
        console.log(this.state.body);
		e.preventDefault();
		if (this.state.body.password.length >= 6) {			
            if (this.isValidEmail(this.state.body.email)) {
                this.setState({ error: "" });  
                this.props.signIn(this.state.body);
                  if (this.props.serverErr !== null)
                    this.setState({error: this.props.serverErr});  
                // this.setState({
                //     body: {email: "", password: ""}
                // });  
            } else {
                this.setState({error: "Введен некорректный email"});
            }
			
		} else {
			this.setState({error: "Длина пароля менее 6 символов"});
		}
    };  

	isValidEmail(email) {
		return /\S+@\S+\.\S+/.test(email);
	}
  
  
    render() {
      return (
        <form className="signInForm" name="SingIn" onSubmit={this.onSubmit}>
          <div className="form-inner">
                <h3>Авторизация</h3>          
                <input type="text" name="email" maxLength="50" placeholder="Электронная почта"  required 
                    onChange={this.onChange} value={this.state.body.email}/>  
                <input type="password" name="password" maxLength="50" placeholder="Пароль"  required 
                    onChange={this.onChange} value={this.state.body.password}/>                      

                <div className='before-sub-div'>
                    <p className='error-message'>{this.state.error}</p>
                </div>
                <input type="submit" className='signSub' value="Войти" /> 
                <p className='signPlaceholder'>Еще нет аккаунта?</p>
                <Link className='sign-placeholder-link' to="/signUp">Зарегистрироваться.</Link>
          </div>
      </form>
      );
    }
}

export default SignInForm;   