import React from 'react';

class InputForm extends React.Component {
    constructor(props){
      super(props);
      this.onChange = this.handleChange.bind(this);
      this.onSubmit = this.handleSubmit.bind(this);
      this.onPickedFile = this.handlePickedFile.bind(this);
  
      this.state = {
        body: {sum: "", category: "", description: "", date: this.setDefaultDate(""), type: "expenses", filename: null}, 
        selectedFile: null, 
        inputKey: 0,
        isAdd: true};
    }
  
    setDefaultDate(strdate){ 
      let date ; 
      if(strdate === "") {
        date = new Date();
      } else {
        date = new Date(strdate);
      }
      date.setMilliseconds(3 * 60 * 60 * 1000);
      return date.toISOString().substring(0, 10);
    }
  
    // componentWillReceiveProps(nextProps) {
    //   alert("will");
    //   if (nextProps.updItem !== null)
    //   {
    //     console.log(nextProps.updItem);
    //     this.setState({body: {
    //       sum: nextProps.updItem.sum / 100, 
    //       category: nextProps.updItem.category, 
    //       description: nextProps.updItem.description, 
    //       date: this.setDefaultDate(nextProps.updItem.date), 
    //       type: nextProps.updItem.income === 1 ? "income" : "expenses", 
    //       spending_id: nextProps.updItem.spending_id,
    //       filename: null},
    //     isAdd: false});
    //   }
    // }

    componentDidMount(){      
      if (this.props.updItem !== null)
      {
        console.log(this.props.updItem);
        this.setState({body: {
          sum: this.props.updItem.sum / 100, 
          category: this.props.updItem.category, 
          description: this.props.updItem.description, 
          date: this.setDefaultDate(this.props.updItem.date), 
          type: this.props.updItem.income === 1 ? "income" : "expenses", 
          spending_id: this.props.updItem.spending_id,
          filename: null},
        isAdd: false});
      }
   }
  
      handlePickedFile(e) {
          this.setState({selectedFile: e.target.files[0]});
      console.log(e.target.files[0]);
      };
  
    handleChange (e) {
      var newBody = this.state.body;
      newBody[e.target.name] = e.target.value;
      this.setState({body: newBody});     
    }
  
    handleSubmit(e) {
      e.preventDefault();
      
      if (this.state.isAdd) {
        this.props.addItems(this.state.body, this.state.selectedFile);
      } else {
        this.props.updateItems(this.state.body, this.state.selectedFile);
      }
  
      this.setState({
        body: {sum: "", category: "", description: "", date: this.setDefaultDate(""), type: "expenses", filename: null}, 
        selectedFile: null, 
        inputKey: Date.now(),
        isAdd: true
      });  
    };  
  
    render() {
      return (
        <form className="inputDataForm" name="inputData" onSubmit={this.onSubmit}>
          <div className="form-inner">
              <h3>Введите данные</h3>
              <input type="number" step="0.01" min="0" max="42949672.90" name="sum" placeholder="Сумма" required 
                onChange={this.onChange} value={this.state.body.sum}/>            
              <input type="text" name="category" maxLength="50" placeholder="Категория"  required 
                onChange={this.onChange} value={this.state.body.category}/>         
              <input type="date" id="datePicker" name="date" placeholder="Дата" max="9999-12-31" required 
                onChange={this.onChange} value={this.state.body.date}/>   
              <textarea placeholder="Описание..." rows="6" name="description" required 
                onChange={this.onChange} value={this.state.body.description}></textarea>  
              <input type="radio" id="radio-1" name="type" value="expenses" 
                checked={this.state.body.type === "expenses"} onChange={this.onChange}/>      
              <label htmlFor="radio-1">Расходы</label>  
              <input type="radio" id="radio-2" name="type" value="income" 
                checked={this.state.body.type === "income"} onChange={this.onChange}/>      
              <label htmlFor="radio-2">Доходы</label>
              <input type="file" name="fileToUpload" key={this.state.inputKey} onChange={this.onPickedFile}/>
              <div className='before-sub-div'> </div>	
              <input type="submit" value="Добавить" /> 
          </div>
      </form>
      );
    }
}

export default InputForm;   