const ftp = require("basic-ftp") 
require('dotenv').config({ path: './../../../../.env' })
// ESM: import * as ftp from "basic-ftp"

async function example() {
  let localPath = process.env.PATH_GDRIVE
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
          host: process.env.HOST_OI,
          user: process.env.USER_OI,
          password: process.env.PASSWORD_OI,
        })
        // Download
        await client.downloadToDir(localPath+"Validação Campanhas/Oi/Oi_Entrada/PDVZANDO", "/incentevendas")
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}


example()



// ------------------------------------------------------- SFTP

require('dotenv').config({ path: '../../../../.env' })
const fs = require("fs");
const XLSX = require("xlsx");
let Client = require('ssh2-sftp-client');
//let sftp = new Client();
const config = {
    host: '',    
    username: '',
    password: ''
    
  };
  
  let client = new Client();
  let remotePath = '/incentevendas';
  let localPath = process.env.PATH_GDRIVE +'Validação Campanhas/Oi/Oi_Entrada';



 
  
  client.connect({config}).then(() => {
    return client.list(remotePath);
  }).then(data => {
    console.log(data, 'the data info');
  }).catch(err => {
    console.log(err, 'catch error');
  });


  async function downloadFilesFTP() {
    //const client = new SftpClient('upload-test');
    const dst = localPath;
    const src = remotePath;
  
    try {
      await client.connect(config);
      client.on('download', info => {
         console.log(`Listener: Download ${info.source}`);

        });

        let rslt = await client.downloadDir(src, dst);

        return rslt;
      } finally {
        client.end();
      }
    }



  //   downloadFilesFTP()
  // .then(msg => {
  //   console.log(msg)

  // })
  // .catch(err => {
  //   console.log(`main error: ${err.message}`);
  // });
