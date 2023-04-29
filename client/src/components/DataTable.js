import React from 'react';
import Moment from 'moment';
import { FiTrash, FiEdit, FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi';

class DataTable extends React.Component {
    constructor(props){
      super(props);
      var items = props.items;
      this.state = {items: items, sortField: "", sortOrder: "asc"};
    }
  
    // static getDerivedStateFromProps(props, state) {
    //   // Any time the current user changes,
    //   // Reset any parts of state that are tied to that user.
    //   // In this simple example, that's just the email.
    //   if (props.items !== null && props.items !== state.items) {
    //     if (this.state.sortField !== "") {
    //       let sorted = props.items.slice();
    //       sorted = sorted.sort((a, b) =>    
    //         a[state.sortField].toString().localeCompare(b[state.sortField].toString(), "ru", {
    //           numeric: true,
    //         }) * (state.sortOrder === "asc" ? 1 : -1)        
    //       );
    //       return {
    //         items: props.items,
    //         sortField: state.sortField, 
    //         sortOrder: state.sortOrder
    //       };
    //     }
    //     else
    //       return {
    //         items: props.items,
    //         sortField: state.sortField, 
    //         sortOrder: state.sortOrder
    //       };
    //   }
    //   return null;
    // }

    componentWillReceiveProps(nextProps) {
      if (this.state.sortField !== "") {
        let sorted = nextProps.items.slice();
        sorted = sorted.sort((a, b) =>    
          a[this.state.sortField].toString().localeCompare(b[this.state.sortField].toString(), "ru", {
            numeric: true,
          }) * (this.state.sortOrder === "asc" ? 1 : -1)        
        );
        this.setState({items: sorted}); }
      else
        this.setState({items: nextProps.items});
    }
  
    handleSortingChange (newField) {
      let newSortOrder = "";
      if (newField === this.state.sortField) {
        if (this.state.sortOrder === "asc") {
          newSortOrder = "desc";
        }
        else {
          newSortOrder = "asc";
          newField = "";
        }
      } else {
        newSortOrder = "asc";
      }
      this.handleSorting(newField, newSortOrder);
      this.setState({sortField: newField, sortOrder: newSortOrder});  
    };
  
    handleSorting(newField, newSortOrder) {
      if (newField !== "") {
        let sorted = this.props.items.slice();
        sorted = sorted.sort((a, b) => 
          a[newField].toString().localeCompare(b[newField].toString(), "ru", 
          {numeric: true,}) * (newSortOrder === "asc" ? 1 : -1)
        );
        this.setState({items: sorted});
      } else {
        this.setState({items: this.props.items});
      }
    };
  
    viewSortingRow(currField) {
      if (this.state.sortField === currField) {
        if (this.state.sortOrder === 'asc')
          return <FiChevronDown />;
        else 
        return <FiChevronUp />;
      } else {
        return "";
      }
    };
  
    render() {
      return (
        <div>
          <table>  
            <thead>
              <tr>
                <td width="130px" onClick={() => this.handleSortingChange("sum")}>Сумма {this.viewSortingRow("sum")}</td>
                <td width="150px" onClick={() => this.handleSortingChange("category")}>Категория {this.viewSortingRow("category")}</td>
                <td width="400px" onClick={() => this.handleSortingChange("description")}>Описание {this.viewSortingRow("description")}</td>
                <td width="100px" onClick={() => this.handleSortingChange("date")}>Дата {this.viewSortingRow("date")}</td>
                <td width="100px" onClick={() => this.handleSortingChange("income")}>Тип {this.viewSortingRow("income")}</td>
                <td width="100px">Файл</td>
                <td width="40px"></td>
                <td width="40px"></td>
              </tr> 
            </thead>
            <tbody>       
              {this.state.items.map((item) => (  
                <tr key={item.spending_id}>       
                <td>{item.sum/100} BYN</td>
                <td>{item.category}</td>
                <td>{item.description}</td>
                <td>{Moment(item.date).format('DD.MM.YYYY')}</td>
                <td>{item.income ? "Доходы" : "Расходы"}</td>
                <td><a href={"http://localhost:5000/api/" + item.filename} target="_blank" >{item.filename}</a>
                  {item.filename != null ? <FiX onClick={() => this.props.deleteFile(item.spending_id)} /> : null }              
                </td>
                <td><FiTrash onClick={() => this.props.onClickDelete(item.spending_id)} /></td>
                <td><FiEdit onClick={() => this.props.onClickUpdate(item)}/></td> 
                </tr>  
              ))} 
            </tbody>  
          </table>
        </div>
      );
    }
  }
  export default DataTable; 