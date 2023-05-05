import React, {useEffect, useState} from 'react';
import InputForm from '../components/InputForm';
import DataTable from '../components/DataTable';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import {gql, useApolloClient } from '@apollo/client';

const GET_DATA = gql`
  query {
    getData {
      user_id
      spending_id
      sum
      date
      category
      description
      income
      filename
    }
  }
`;

const DELETE = gql`
  query Delete($id: Int!) {
    delete(id: $id)
  }
`;

const DELETE_FILE = gql`
  query DeleteFile($id: Int!) {
    deleteFile(id: $id)
  }
`;

function HomePage() {
    const [items, setItems] = useState(null);
    const [updItem, setUpdItem] = useState(null);
    const navigate = useNavigate(); 
    const client = useApolloClient();
    
    useEffect(() => {
      client.query({
        query: GET_DATA,
        variables: {},
      })
      .then(result => {
        if (result.data && result.data.getData !== null) {
          const newData = result.data.getData.map(item => {
            return {
              ...item,
              date: new Date(item.date * 1)
            };
          });
          setItems(newData);
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    }, [])
  
    const deleteItem = async (id) => {
      client.query({
        query: DELETE,
        variables: {id},
      })
      .then(result => {
        if (result.data && result.data.delete) {
          setItems(actualItems => actualItems.filter(data => data.spending_id !== id));
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    };
  
    const deleteFile = async (id) => { 
      client.query({
        query: DELETE_FILE,
        variables: {id},
      })
      .then(result => {
        if (result.data && result.data.deleteFile) {
          console.log('deleteFile OK')
          setItems(prevItems => prevItems.map(item => item.spending_id === id ? { ...item, filename: null } : item));
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    };
  
    const fillForm = async (item) => {
      setUpdItem(item);
      console.log(item);
      console.log(updItem);
    };
  
    const addItems = async (body, selectedFile) => { 
//       const formData = new FormData();        
//       formData.append('sum', body.sum);
//       formData.append('category', body.category);
//       formData.append('description', body.description);
//       formData.append('date', body.date);
//       formData.append('type', body.type);
//       formData.append('fileToUpload', selectedFile);
  
//       await fetch('/api', {
//           method: 'POST',
//           body: formData
//       })
//       .then((response) => response.json())
//       .then((data) => {
//         body["spending_id"] = data.spending_id;
//         body["sum"] *= 100;
//         if (selectedFile !== null)
//           body["filename"] = selectedFile.name;
//         else
//           body["filename"] = null;
//         setItems((items) => [...items, body]);
//       })
//       .catch((err) => {
//         console.log(err.message);
//       });
    };
  
    const updateItems = async (body, selectedFile) => { 
//       const formData = new FormData();        
//       formData.append('sum', body.sum);
//       formData.append('category', body.category);
//       formData.append('description', body.description);
//       formData.append('date', body.date);
//       formData.append('type', body.type);
//       formData.append('spending_id', body.spending_id);
//       formData.append('fileToUpload', selectedFile);
  
//       await fetch('/api', {
//           method: 'PUT',
//           body: formData
//       })
//       .then((response) => {
//         response.json();
//         setUpdItem(null);
//         if (response.status === 200) {          
//           if (selectedFile !== null)
//             setItems(prevItems => prevItems.map(item => item.spending_id === body.spending_id ? 
//               { ...item, sum: body.sum * 100, user_id: 1, category: body.category, 
//                 description: body.description, income: body.type === "income" ? 1 : 0, date: new Date(body.date), 
//                 filename: selectedFile.name} : item));
//           else
//           setItems(prevItems => prevItems.map(item => item.spending_id === body.spending_id ? 
//             { ...item, sum: body.sum * 100, user_id: 1, category: body.category, 
//               description: body.description, income: body.type === "income" ? 1 : 0, date: new Date(body.date)} : item));
//         }
//       })
//       .catch((err) => {
//         console.log(err.message);
//       });
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