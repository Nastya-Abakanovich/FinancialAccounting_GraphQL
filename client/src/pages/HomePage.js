import React, {useEffect, useState} from 'react';
import InputForm from '../components/InputForm';
import DataTable from '../components/DataTable';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const [items, setItems] = useState(null);
    const [updItem, setUpdItem] = useState(null);
    const navigate = useNavigate(); 
    
    useEffect(() => {
      fetch("/api", {method: "GET"})
        .then((response) => {
            
            if (response.status === 401) {
              navigate('/signIn'); 
            }
            return response.json();
        })
        .then(data => { 
          if (data) {
            setItems(data.items) 
            console.log(data.user)
          }
        })
    }, [])
  
    const deleteItem = async (id) => {
      await fetch('/api/' + id,{ method: 'DELETE',})
      .then((response) => {
          if (response.status === 200) {
            setItems(actualItems => actualItems.filter(data => data.spending_id !== id));
          }
      }); 
    };
  
    const deleteFile = async (id) => { 
      const formData = new FormData();        
      formData.append('spending_id', id);
  
      await fetch('/api/deleteFile', {
        method: 'PUT',
        body: formData
      })
      .then((response) => {
        response.json();
        if (response.status === 200) {              
          setItems(prevItems => prevItems.map(item => item.spending_id === id ? { ...item, filename: null } : item));
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
    };
  
    const fillForm = async (item) => {
      setUpdItem(item);
      console.log(item);
      console.log(updItem);
    };
  
    const addItems = async (body, selectedFile) => { 
      const formData = new FormData();        
      formData.append('sum', body.sum);
      formData.append('category', body.category);
      formData.append('description', body.description);
      formData.append('date', body.date);
      formData.append('type', body.type);
      formData.append('fileToUpload', selectedFile);
  
      await fetch('/api', {
          method: 'POST',
          body: formData
      })
      .then((response) => response.json())
      .then((data) => {
        body["spending_id"] = data.spending_id;
        body["sum"] *= 100;
        if (selectedFile !== null)
          body["filename"] = selectedFile.name;
        else
          body["filename"] = null;
        setItems((items) => [...items, body]);
      })
      .catch((err) => {
        console.log(err.message);
      });
    };
  
    const updateItems = async (body, selectedFile) => { 
      const formData = new FormData();        
      formData.append('sum', body.sum);
      formData.append('category', body.category);
      formData.append('description', body.description);
      formData.append('date', body.date);
      formData.append('type', body.type);
      formData.append('spending_id', body.spending_id);
      formData.append('fileToUpload', selectedFile);
  
      await fetch('/api', {
          method: 'PUT',
          body: formData
      })
      .then((response) => {
        response.json();
        setUpdItem(null);
        if (response.status === 200) {          
          if (selectedFile !== null)
            setItems(prevItems => prevItems.map(item => item.spending_id === body.spending_id ? 
              { ...item, sum: body.sum * 100, user_id: 1, category: body.category, 
                description: body.description, income: body.type === "income" ? 1 : 0, date: new Date(body.date), 
                filename: selectedFile.name} : item));
          else
          setItems(prevItems => prevItems.map(item => item.spending_id === body.spending_id ? 
            { ...item, sum: body.sum * 100, user_id: 1, category: body.category, 
              description: body.description, income: body.type === "income" ? 1 : 0, date: new Date(body.date)} : item));
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
    };

    function ShowPage() {
      if (items !== null) {
        return (
        <div className="content">
          <InputForm 
            addItems={addItems}
            updateItems={updateItems}
            updItem={updItem}
          />
          <DataTable 
            items={items}
            onClickDelete={deleteItem}
            onClickUpdate={fillForm}
            deleteFile={deleteFile}
          />   
        </div> )   
      } else {
            return <p></p> 
      }
    }
  
    return (
        <div className="wrapper">
            <Header/>
            <ShowPage/>             
            <Footer/>  
        </div>
    )
  }
  
  export default HomePage; 