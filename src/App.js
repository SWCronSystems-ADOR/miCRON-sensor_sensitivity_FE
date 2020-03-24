import React,{Component} from 'react';
import {api,port} from './api'
import axios from 'axios'
import './App.css'

class Sensitivity extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      firstFlag: false,
      secondFlag: false,
      dataReceived: false,
      sensorMin: 0,
      sensorMax: 2,
      sensorConfig: [],
      crownSolarNames: {},
      valueForAll: 0,
      hubName: '',
      sideName: '',
      sensorTable:[]
    }
  }

  componentDidMount(){
      console.log(api,port)
    axios.get(`http://${api}${port}/crown_solar/min_max/`)
    .then(res=>{
      this.setState({
        sensorMin: res.data[0],
        sensorMax: res.data[1]
      })
    })
    axios.get(`http://${api}${port}/crown_solar/get_crown_names/`)
    .then(res=>{
      this.setState({
        firstFlag: true,
        crownSolarNames: res.data
      })
    })
  }
  
  handleHubName=(e)=>{
    let name = e.target.value
    this.setState({hubName:name,secondFlag:true})
    axios.get(`http://${api}${port}/crown_solar/get_config_details/${name}/`)
    .then(res=>{
      this.setState({sensorConfig:res.data})
    })
  }

  setConfig=()=>{
    let arr = []
    let a = document.querySelectorAll("#config")
    for(let i=0;i<a.length;i++)
    {
      arr.push(a[i].value)
    }
    axios.get(`http://${api}${port}/crown_solar/set_config_details/${this.state.hubName}/${arr[0]}-${arr[1]}-${arr[2]}-${arr[3]}/`)
    .then(
      axios.get(`http://${api}${port}/crown_solar/get_config_details/${this.state.hubName}/`)
    .then(res=>{
      this.setState({sensorConfig:res.data})
    })
    )
  }

  handleSide=(e)=>{
    if(e){
      console.log(e.target.value)
      this.setState({sideName:e.target.value,dataReceived:false},()=>{
        if(this.state.hubName&&this.state.sideName){
          axios.get(`http://${api}${port}/crown_solar/fetch_details/${this.state.hubName}/${this.state.sideName}/`)
          .then(res=>{
            this.setState({sensorTable:res.data,dataReceived:true})
          })
        }
      })
    }
    else{
      setTimeout(()=>{
        axios.get(`http://${api}${port}/crown_solar/fetch_details/${this.state.hubName}/${this.state.sideName}/`)
        .then(res=>{
          this.setState({sensorTable:res.data,dataReceived:true})
        })
        document.getElementById("controller_loader").style.display = "none"
      },500)
    }
  }

  changeInputForAll=(e)=>{
    this.setState({valueForAll:e.target.value})
  }

  setForAll=()=>{
    let all = document.querySelector("#setForAll").value
    if(all>=parseInt(this.state.sensorMin)&&all<=parseInt(this.state.sensorMax)){
      document.querySelector("#sensorAllError").innerHTML = ""
      axios.get(`http://${api}${port}/crown_solar/set_for_all/${this.state.hubName}/${this.state.sideName}/${this.state.valueForAll}/`)
      .then(res=>{
        if(res.data==="False")
        {
          document.querySelector("#hubError").style.display = "block"
          this.setState({dataReceived:false},()=>{
            document.getElementById("controller_loader").style.display = "block"
            this.handleSide()
          })
        }
        else{
          document.querySelector("#hubError").style.display = "none"
          this.setState({dataReceived:false},()=>{
            document.getElementById("controller_loader").style.display = "block"
            this.handleSide()
          })
        }
      })
    }
    else{
      document.querySelector("#sensorAllError").innerHTML = "Please check your value"
    }
  }

  onSubmit=()=>{
    let errorFlag = false
    let sensorArray = []
    let sensorValue = document.querySelectorAll("#sensorValues")
    let errorValue = document.querySelectorAll("#sensorError")
    for(let i=0;i<sensorValue.length;i++)
    {
      errorValue[i].style.color = "white"
      if(sensorValue[i].value<=parseInt(this.state.sensorMin) || sensorValue[i].value>=parseInt(this.state.sensorMax))
      {
        console.log(i)
        errorValue[i].style.color = "red"
        errorFlag = true
      }
      sensorArray.push(sensorValue[i].value)
    }
    if(!errorFlag&&sensorArray.length>0)
    {
      axios.post(`http://${api}${port}/crown_solar/set_for_each/${this.state.hubName}/${this.state.sideName}/`, {
        sensorArray: sensorArray
      })
      .then(res=>{
        console.log(res.data)
      })
    }
    window.scrollTo({top:0,behavior:"auto"})
  }
  render(){
    return(
      <div id="main_controller">
        <p id="heading_controller">Hub Sensitivity Controller</p>
        {this.state.firstFlag?
        <div>
          Hub Name: 
          <select id="hubName" onChange={this.handleHubName}>
          <option value="" disabled selected>Select your option</option>
          {Object.keys(this.state.crownSolarNames).map((x)=>
          <option key={x} value={x}>{this.state.crownSolarNames[x]}</option>
          )}
        </select>
        {this.state.secondFlag?<div>
          <div id="default_values">
          <span className="sensor_count">Right Sensor Count: <input id="config" min="0" max="250" type="number" defaultValue={this.state.sensorConfig[0]}></input></span>
          <span className="sensor_count">Left Sensor Count: <input id="config" min="0" max="250" type="number" defaultValue={this.state.sensorConfig[1]}></input></span>
          <span className="sensor_count">Lower Limit Temperature: <input id="config" type="number" defaultValue={this.state.sensorConfig[2]}></input></span>
          <span className="sensor_count">Upper Limit Temparature: <input id="config" type="number" defaultValue={this.state.sensorConfig[3]}></input></span>
          <button onClick={this.setConfig}>Set Values</button>
          <br />
          </div>
          Chain Side:
          <select id="sideName" onChange={this.handleSide} >
          <option value="" disabled selected>Select your option</option>
            <option>Left</option>
            <option>Right</option>
          </select>
          {this.state.dataReceived&&this.state.sensorTable.length>0?
          <div>
            <p id="controller_min_max">Min value: {this.state.sensorMin} || Max value: {this.state.sensorMax}</p>
            <p id="hubError" style={{display:"none"}}>Error in Connecting to HUB</p>
            Set all sensors to : <input id="setForAll" type="number" min={this.state.sensorMin} max={this.state.sensorMax} onChange={this.changeInputForAll}></input> <button onClick={this.setForAll}>Set for all sensors</button><p id="sensorAllError"></p>
            <div id="table">
            {this.state.sensorTable.map((index,x)=>
            <div id="elements" key={x}>
              Sensor Number {x+1}: <input type="number" id="sensorValues" min={this.state.sensorMin} max={this.state.sensorMax} defaultValue={index}></input><p id="sensorError">Please Check your value</p>
              </div>)}
            </div>
          </div>
          :null}
        </div>:null}
        </div>
        :null}
        <p id="controller_loader" style={{display:"none"}}>Loading...</p>
        {/* <div id="loader" style={{display:"none"}}></div> */}
        <button id="submit" onClick={this.onSubmit}>Submit</button>
      </div>
    )
  }
}

export default Sensitivity;
