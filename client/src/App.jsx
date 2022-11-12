import React, {Component} from 'react';
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import Web3 from "web3";

import { EthProvider } from "./contexts/EthContext";
import Intro from "./components/Intro/";
import Setup from "./components/Setup";
import Demo from "./components/Demo";
import Footer from "./components/Footer";
import "./App.css";

var Tx = require("ethereumjs-tx").Transaction

const rpcURL = "http://localhost:7545";
const web3 = new Web3(rpcURL);

const abi = SimpleStorageContract["abi"];
const contractAddress = "0x9D5B65B1449439EdF5aA15D0361B5F08f357111F";
const contract = new web3.eth.Contract(abi, contractAddress);

const account = "0x8203d59a52D665C8ad172e714607b0b0a95c7726";
const pk = "4601f314ef99d52d00a83dc904fafd31be44df322dede65fab9ce4a7e9e0cced";
const privateKey = Buffer.from(pk, "hex");


const ipfsAPI = require("ipfs-api");
const ipfs = ipfsAPI({
  host: "localhost",
  port: "5001",
  protocol: "http"
});

let saveDataToIPFS = (reader) => {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(reader.result);
    ipfs.add(buffer).then((response) => {
      console.log(response);
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err);
      reject(err);
    })
  })
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      blockChainHash: null,
      web3: null,
      address: null,
      dataHash: null,
      isSuccess: false
    }
  }

  componentDidMount() {
    ipfs.swarm.peers(function(err, res) {
      if (err) {
        console.error(err);
      } else {
        console.log(res);
      }
    });

}

  render() {
    return (
      <div className="App">
        <div style={{marginTop:10}}>smart contract address:</div>
        <div>{contractAddress}</div>
        <div style={{marginTop: 10}}>upload data to IPFS: </div>
        <div>
          <label id="label_file">select data</label>
          <input type="file" rel="file" id="file" name="file" mutiple="multiple"/>
        </div>
        <button style={{marginTop: 10}} onClick={() => {
          let file = document.getElementById("file").files[0];
          let reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onloadend = function(e) {
            console.log(reader);
            saveDataToIPFS(reader).then((hash) => {
              console.log(hash);
              this.setState({dataHash: hash});
            });
          }.bind(this);

        }}>begin to upload</button>


        <div style={{marginTop:10}}>dataHash: {this.state.dataHash}</div>
        <button onClick={() => {
          // contract.methods.balanceOf(account).call((err, result) => { console.log(result) });
          web3.eth.getTransactionCount(account, (err, txCount) => {
            // build a write transaction
            const txObject = {
              nonce: web3.utils.toHex(txCount),
              gasLimit: web3.utils.toHex(800000),
              gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
              to: contractAddress,
              data: contract.methods.write(this.state.dataHash).encodeABI()
            };
            const tx = new Tx(txObject);
            tx.sign(privateKey);

            const serializedTx = tx.serialize();
            const raw = "0x" + serializedTx.toString("hex");

            web3.eth.sendSignedTransaction(raw, (err, txHash) => {
              if (err) {  // if the transaction failure
                console.error("err: ", err);
              } else {
                console.log("txHash: ", txHash);
                console.log("data hash was already write into the blockchain");
                this.setState({isSuccess: true});
              }
            });
          });

        }}>write the data hash in the blockchain</button>

        {
          this.state.isSuccess
            ? <div style={{marginTop: 10}}>
                <div>data hash is write to blockchain successfully!</div>
                <button onClick={() => {
                  // get data from blockchain
                  contract.methods.read().call((err, val) => {
                    if (err) {
                      console.error("err: ", err);
                    } else {
                      console.log(val);
                      this.setState({blockChainHash: val});
                    }
                  });
                }}>read the hash from bloackchain</button>
              </div>
            : <div/>
        }
        {
          this.state.blockChainHash
            ? <div style={{marginTop:10}}>
                <div>从区块链读取到的哈希值：{this.state.blockChainHash}</div>
              </div>
            : <div/>
        }



      </div>
    );
  }

}

//
// function App() {
//   return (
//     <EthProvider>
//       <div id="App" >
//         <div className="container">
//           <Intro />
//           <hr />
//           <Setup />
//           <hr />
//           <Demo />
//           <hr />
//           <Footer />
//         </div>
//       </div>
//     </EthProvider>
//   );
// }

export default App;
