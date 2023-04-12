// // require('dotenv').config({ path: '../../../../.env' })

// // let Client = require('ssh2-sftp-client');
// // let sftp = new Client();
// // const fs = require('fs');

// // sftp.connect({
// //   host: process.env.HOST_METLIFE,
// //   username: process.env.USER_METLIFE,
// //   privateKey: fs.readFileSync(process.env.KEY_METLIFE)
// // }).then(() => {
// //   return sftp.list('/Remessa');
// // }).then(dados => {
// //   console.log(dados, 'Retorno dos dados');
// // }).catch(err => {
// //   console.log(err, 'Erro');
// // });



// require('dotenv').config({ path: '../../../../.env' })
// const fs = require("fs");
// const XLSX = require("xlsx");
// let Client = require('ssh2-sftp-client');
// //let sftp = new Client();
// const config = {
//     host: process.env.HOST_METLIFE,
//     username: process.env.USER_METLIFE,
//     privateKey: fs.readFileSync(process.env.KEY_METLIFE)
    
//   };
  
//   let client = new Client();
//   let remotePath = '/Remessa';
//   let localPath = process.env.PATH_GDRIVE +'Validação Campanhas/Metlife/Metlife Entrada';



 
  
//   client.connect({config}).then(() => {
//     return client.list(remotePath);
//   }).then(data => {
//     console.log(data, 'the data info');
//   }).catch(err => {
//     console.log(err, 'catch error');
//   });


//   async function downloadFilesFTP() {
//     //const client = new SftpClient('upload-test');
//     const dst = localPath;
//     const src = remotePath;
  
//     try {
//       await client.connect(config);
//       client.on('download', info => {
//          console.log(`Listener: Download ${info.source}`);

//         });

//         let rslt = await client.downloadDir(src, dst);

//         return rslt;
//       } finally {
//         client.end();
//       }
//     }



//     downloadFilesFTP()
//   .then(msg => {
//     console.log(msg)

//   })
//   .catch(err => {
//     console.log(`main error: ${err.message}`);
//   });


//---------------------------------------------------------------------------------------------------------
require('dotenv').config({ path: './../../../../.env' })
var xlsx = require("xlsx");
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('./Credeciais.json');
let Client = require('ssh2-sftp-client');
let sftp = new Client();
const fs = require('fs');

sftp.connect({
  host: process.env.HOST_METLIFE,
  username: process.env.USER_METLIFE,
  privateKey: fs.readFileSync(process.env.KEY_METLIFE)
}).then(() => {
  return sftp.list('/Remessa');
}).then(dados => {
  console.log(dados, 'Retorno dos dados');
  const cdfFiles = dados.filter(file => file.name.endsWith('.CDF'));
  console.log("Filtro realizado",cdfFiles)


  cdfFiles.forEach(file => {
    sftp.get(`/Remessa/${file.name}`, process.env.PATH_GDRIVE +`Validação Campanhas/Metlife/Metlife Entrada/Arquivos CDF - FTP/${file.name}`);
  });
}).catch(err => {
  console.log(err, 'Erro');
})



//const client = new Client();
const remotePath = '/Remessa';
let localPath = process.env.PATH_GDRIVE +'Validação Campanhas/Metlife/Metlife Entrada';
const PATHFolderCDFId ='1sLm2DCMKBekH4MDrdD_kNxMOea2QPE4j'
const PATHFolderCDFConvertedId='1GZMzgbBnt9Z95fBdWSI6RzdfV7jZm-10'
//lê a planilha específica gerada
const getDoc = async () => {
  const doc = new GoogleSpreadsheet("1P3a4mVegnc_Nx8aknDkfoUUI-zUDYBpUauj9WHJl630");

  await doc.useServiceAccountAuth({
    client_email: credenciais.client_email,
    private_key: credenciais.private_key.replace(/\\n/g, '\n')
  })
  await doc.loadInfo();
  return doc;
}
getDoc().then(doc => {
  console.log("doc:",doc.title);

});


  
 


  function uploadFileToGoogleDrive(filePath, PATHFolderCDFId) {
    const fileMetadata = {
      name: filePath,
      parents: [PATHFolderCDFId], //ID da pasta desejada
      mimeType: 'application/cdf'
    };
  
    const media = {
      mimeType: 'application/cdf',
      body: fs.createReadStream(filePath)
    };
  
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, (err, file) => {
      if (err) throw err;
  
      console.log(`File ${file.data.id} uploaded to Google Drive.`);
    });
  }



  //---------------- funcionou 

  /*.then(() => {
    return sftp.get('/Remessa/GM.LTM.EMI.01.00461.CDF', process.env.PATH_GDRIVE +'Validação Campanhas/Metlife/Metlife Entrada/Arquivos CDF - FTP/GM.LTM.EMI.01.00461.CDF');
  })
 
  */