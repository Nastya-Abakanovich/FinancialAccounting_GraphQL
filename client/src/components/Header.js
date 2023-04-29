import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {

  const navigate = useNavigate();   

  const exit = async () => {  
    console.log('exit'); 
      await fetch('/api/users/exit', {
          method: 'POST',
          credentials: 'include',
          body: ''
      })
      .then((response) => {
        console.log('exit');
          if (response.status === 200) {
              navigate("/signIn");
          }        
      })
      .catch((err) => {
          console.log(err.message);
      });
  };

  return (
    <header>
    {/* Трекер финансов */}
      <Link className="header-link" to="/">Дневник трат</Link>
      <Link className="header-link" to="/signUp">Регистрация</Link>
      <Link className="header-link" to="/signIn">Авторизация</Link>
      <a onClick={exit}>Выход</a>
    </header>
  );

}

export default Header;   