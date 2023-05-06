import React, {useEffect, useState} from 'react';
import InputForm from '../components/InputForm';
import DataTable from '../components/DataTable';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { gql, useApolloClient } from '@apollo/client';

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

const GET_FILE = gql`
  query GetFile ($id: Int!){
    getFile(id: $id) {
      filename
      file
    }
  }
`;

const ADD = gql`
  mutation Add($sum: Int!, $category: String!, $description: String!, $date: String!, $type: Boolean!, $filename: String, $fileToUpload: String) {
    add (sum: $sum, category: $category, description: $description, date: $date, type: $type, filename: $filename, fileToUpload: $fileToUpload ) {
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

const UPDATE = gql`
  mutation Update($sum: Int!, $category: String!, $description: String!, $date: String!, $type: Boolean!, $spending_id: Int!, $filename: String, $fileToUpload: String) {
    update (sum: $sum, category: $category, description: $description, date: $date, type: $type, spending_id: $spending_id, filename: $filename, fileToUpload: $fileToUpload ) {
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
  mutation Delete($id: Int!) {
    delete(id: $id)
  }
`;

const DELETE_FILE = gql`
mutation DeleteFile($id: Int!) {
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

    const openFile = async (id) => {
      client.query({
        query: GET_FILE,
        variables: {id},
      })
      .then(result => {
        if (result.data && result.data.getFile) {
          const byteCharacters = atob(result.data.getFile.file);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const fileBlob = new Blob([byteArray]);
          
          const fileType = result.data.getFile.filename.split('.').pop().toLowerCase();
          const fileUrlObject = URL.createObjectURL(fileBlob);
          const newWindow = window.open('', '_blank');
          
          if (fileType === 'jpg' || fileType === 'png' || fileType === 'gif') {
            newWindow.document.write(`<img src="${fileUrlObject}" />`);
          } else if (fileType === 'mp4' || fileType === 'avi' || fileType === 'mov') {
            newWindow.document.write(`<video src="${fileUrlObject}" autoplay controls></video>`);
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              const text = reader.result;
              newWindow.document.write(text);
            };
            reader.readAsText(fileBlob);
          }
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    };

    const deleteItem = async (id) => {
      client.mutate({
        mutation: DELETE,
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
      client.mutate({
        mutation: DELETE_FILE,
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
      var tmpDate = new Date(body.date);
      const base64 = selectedFile !== null? await fileToBase64(selectedFile) : null;
      client.mutate({
        mutation: ADD,
        variables: {
          sum: body.sum * 1, 
          category: body.category, 
          description: body.description, 
          date: tmpDate.getTime().toString(), 
          type: body.type === "income",
          filename: selectedFile !== null ? selectedFile.name : null,  
          fileToUpload: base64},
      })
      .then(result => {
        console.log('res')
        if (result.data && result.data.add) {
          const newBody = { ...result.data.add };
          newBody["sum"] *= 100;
          newBody["date"] = new Date(newBody["date"] * 1);
          setItems((items) => [...items, newBody]);
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    };
  
    const updateItems = async (body, selectedFile) => { 
      var tmpDate = new Date(body.date);
      const base64 = selectedFile !== null? await fileToBase64(selectedFile) : null;
      client.mutate({
        mutation: UPDATE,
        variables: {
          sum: body.sum * 1, 
          category: body.category, 
          description: body.description, 
          date: tmpDate.getTime().toString(), 
          type: body.type === "income",
          spending_id: body.spending_id,
          filename: selectedFile !== null ? selectedFile.name : null,  
          fileToUpload: base64},
      })
      .then(result => {
        
        if (result.data && result.data.update) {

          setUpdItem(null);
          var data = result.data.update;
          if (data.filename !== null)
            setItems(prevItems => prevItems.map(item => item.spending_id === data.spending_id ? 
              { ...item, sum: data.sum * 100, user_id: data.user_id, category: data.category, 
                description: data.description, income: data ? 1 : 0, date: new Date(data.date * 1), 
                filename: data.filename} : item));
          else
            setItems(prevItems => prevItems.map(item => item.spending_id === data.spending_id ? 
              { ...item, sum: data.sum * 100, user_id: data.user_id, category: data.category, 
                description: data.description, income: data.type ? 1 : 0, date: new Date(data.date * 1)} : item));
        }
      })
      .catch(error => {
        console.error(error);
        if (error.message.toLowerCase().includes('forbidden')) {
          navigate('/signIn');
        }
      });
    };

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(';base64,')[1]);
        reader.onerror = error => reject(error);
      });
    }

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
            openFile={openFile}
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