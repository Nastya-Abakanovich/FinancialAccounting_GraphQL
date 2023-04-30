import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {

  const navigate = useNavigate();   

  const exit = async () => {  
    console.log('exit'); 
    document.cookie = 'token=0; max-age=-1; path=/;';
    document.cookie = 'id=0; max-age=-1; path=/;';
    navigate("/signIn")
    window.location.reload();  
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