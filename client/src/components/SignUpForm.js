import React from 'react';
import { Link } from 'react-router-dom';

class SignUpForm extends React.Component {
    constructor(props){
      super(props);
      this.onChange = this.handleChange.bind(this);
      this.onSubmit = this.handleSubmit.bind(this);
  
      	this.state = {
			body: {name: "", email: "", password: "", repeatPassword: ""}, 
			error: ""
    	};
    }

	componentWillReceiveProps(nextProps) {
		if (nextProps.serverErr !== null)
		{
		  this.setState({ error: nextProps.serverErr});
		}
	}
  
    handleChange (e) {
      var newBody = this.state.body;
      newBody[e.target.name] = e.target.value;
      this.setState({body: newBody});  
    }
  
    handleSubmit(e) {
		e.preventDefault();
		if (this.state.body.password.length >= 6) {
			if (this.state.body.password === this.state.body.repeatPassword) {
				if (this.isValidEmail(this.state.body.email)) {
					this.setState({ error: "" });  
					this.props.signUp(this.state.body);

				} else {
					this.setState({error: "Введен некорректный email"});
				}
			} else {
				this.setState({error: "Пароль повторен не верно"});
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
        <form className="signUpForm" name="SingUp" onSubmit={this.onSubmit}>
          	<div className="form-inner">
                <h3>Регистрация</h3>          
                <input type="text" name="name" maxLength="50" placeholder="Никнейм"  required 
                    onChange={this.onChange} value={this.state.body.name}/> 
                <input type="text" name="email" maxLength="50" placeholder="Электронная почта"  required 
                    onChange={this.onChange} value={this.state.body.email}/>  
                <input type="password" name="password" maxLength="50" placeholder="Пароль(не менее 6 символов)"  required 
                    onChange={this.onChange} value={this.state.body.password}/>  
                <input type="password" name="repeatPassword" maxLength="50" placeholder="Повторите пароль"  required 
                    onChange={this.onChange} value={this.state.body.repeatPassword}/>  

				<div className='before-sub-div'>
					<p className='error-message'>{this.state.error}</p>
                </div>				
                <input type="submit" className='signSub' value="Зарегистрироваться" /> 
                <p className='signPlaceholder'>Уже есть аккаунт?</p>
                <Link className='sign-placeholder-link' to="/signIn">Авторизоваться.</Link>
          	</div>
      	</form>
      );
    }
}

export default SignUpForm;   