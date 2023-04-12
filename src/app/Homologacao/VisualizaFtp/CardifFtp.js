require('dotenv').config({ path: './../../../../.env' })
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('./Credeciais.json');
const fs = require("fs");
const XLSX = require("xlsx");
let Client = require('ssh2-sftp-client');
let sftp = new Client();
var FileNameEntrada = [];
var FileNameConcluido = [];
const EntradaExcel = []
ExcelSheets = []

const config = {
  host: process.env.HOST_CARDIF,
  port: process.env.PORT_CARDIF,
  username: process.env.USER_CARDIF,
  password: process.env.PASSWORD_CARDIF
};

let client = new Client();
let remotePath = '/O0055CARDIF/ENTRADA/';
let localPath = process.env.PATH_GDRIVE +'Validação Campanhas/Cardif/CardiFTP_Entrada';

const getDoc = async () => {
  const doc = new GoogleSpreadsheet("1Mbs-0D_u6NCXLUkyFHOmZmCcPTHfUR4ANP5Xt9g6RdU");

  await doc.useServiceAccountAuth({
    client_email: credenciais.client_email,
    private_key: credenciais.private_key.replace(/\\n/g, '\n')
  })
  await doc.loadInfo();
  return doc;
}
getDoc().then(doc => {console.log(doc.title);});


let sheet;

async function downloadFilesFTP() {
  //const client = new SftpClient('upload-test');
  const dst = localPath;
  const src = remotePath;

  try {
    await client.connect(config);
    client.on('download', info => {
       //console.log(`Listener: Download ${info.source}`);
      /* PEGAR O NOME DOS ARQUIVOS EM EXCEL*/
      var nameFile = info.source;
      /* Separar os arquivos que estão em concluídos */
      if (nameFile.search('O0055CARDIF/ENTRADA//CONCLUIDOS') >= 0) {
        nameFile = nameFile.substring(33);
        nameFile = nameFile.replace('.xlsx', '')
        FileNameConcluido.push(nameFile);
      } else {
        nameFile = nameFile.substring(22);
        nameFile = nameFile.replace('.xlsx', '')

        /* Pegar Somente os de Entrada, que não atendem os requisitos abaixo*/
        if (nameFile.search('//') < 0 & nameFile.search('CARREGADO/') < 0 & nameFile.search('.txt') < 0) {
          FileNameEntrada.push(nameFile);
        }
      }
    });
    let rslt = await client.downloadDir(src, dst);

    return rslt;
  } finally {
    client.end();
  }
}

downloadFilesFTP()
  .then(msg => {
    console.log(FileNameConcluido);
    console.log(FileNameEntrada)
    //Percorrer todos os arquivos baixados e adicionar os dados no array EntradaExcel
    for (const item of FileNameEntrada) {
      getexcel(item);
    }
    getCardifSales().then(function (value) {
      //console.log(value); // Success!

      //Percorrer em arquivo em arquivo
      for (let ii = 0; ii < FileNameEntrada.length; ii++) {

        console.log(FileNameEntrada[ii])
        
        //Verificar os Contratos por aquivo. 
        for (let i = 0; i < EntradaExcel[ii].length; i++) {
          var Proposta = value.filter(function (obj) { return obj.input == EntradaExcel[ii][i]['Numero da Proposta']; })
          var bilhete = value.filter(function (obj) { return obj.input == EntradaExcel[ii][i].Bilhete; })
          if (bilhete.length > 0) {//Tem bilhete igual? Sucesso
            ExcelSheets.push({
              Produto: EntradaExcel[ii][i].Produto,
              Contrato: EntradaExcel[ii][i].Contrato,
              Bilhete: EntradaExcel[ii][i].Bilhete,
              Numero_da_Proposta: EntradaExcel[ii][i]['Numero da Proposta'],
              CPF_CNPJ: EntradaExcel[ii][i]['CPF / CNPJ'],
              Valor_do_Prêmio: EntradaExcel[ii][i]['Valor do Prêmio'],
              Chassi: EntradaExcel[ii][i]['Número do Chassi'],
              Tipo_da_Venda: EntradaExcel[ii][i]['Tipo da Venda '],
              Identificação_do_DN: EntradaExcel[ii][i]['Identificação do DN '],
              Cardif_Sale: bilhete[0].id,
              SaleID: bilhete[0].saleId,
              FileName: FileNameEntrada[ii],
              Encontrado: true
            })          
            //console.log(bilhete[0].id)
          } else if (Proposta.length > 0) {// Tem Proposta Igual? SUcesso!
            ExcelSheets.push({
              Produto: EntradaExcel[ii][i].Produto,
              Contrato: EntradaExcel[ii][i].Contrato,
              Bilhete: EntradaExcel[ii][i].Bilhete,
              Numero_da_Proposta: EntradaExcel[ii][i]['Numero da Proposta'],
              CPF_CNPJ: EntradaExcel[ii][i]['CPF / CNPJ'],
              Valor_do_Prêmio: EntradaExcel[ii][i]['Valor do Prêmio'],
              Chassi: EntradaExcel[ii][i]['Número do Chassi'],
              Tipo_da_Venda: EntradaExcel[ii][i]['Tipo da Venda '],
              Identificação_do_DN: EntradaExcel[ii][i]['Identificação do DN '],
              Cardif_Sale: Proposta[0].id,
              SaleID: Proposta[0].saleId,
              FileName: FileNameEntrada[ii],
              Encontrado: true
            })            
          }
          else {
            ExcelSheets.push({
              Produto: EntradaExcel[ii][i].Produto,
              Contrato: EntradaExcel[ii][i].Contrato,
              Bilhete: EntradaExcel[ii][i].Bilhete,
              Numero_da_Proposta: EntradaExcel[ii][i]['Numero da Proposta'],
              CPF_CNPJ: EntradaExcel[ii][i]['CPF / CNPJ'],
              Valor_do_Prêmio: EntradaExcel[ii][i]['Valor do Prêmio'],
              Chassi: EntradaExcel[ii][i]['Número do Chassi'],
              Tipo_da_Venda: EntradaExcel[ii][i]['Tipo da Venda '],
              Identificação_do_DN: EntradaExcel[ii][i]['Identificação do DN '],
              Cardif_Sale:'',
              SaleID: '',
              FileName: FileNameEntrada[ii],
              Encontrado: false
            })       
              //console.log('Falha: ',EntradaExcel[ii][i]['Numero da Proposta'],EntradaExcel[ii][i].Bilhete, FileNameEntrada[ii])
          }

        }
      }

      AtualizarExcel(ExcelSheets)


    }, function (reason) {
      console.log(reason); // Error!
    });


    // console.log(EntradaExcel.length)
    // var index= FileNameEntrada[1]
    // console.log(index)
    // console.log(EntradaExcel[1].length)
  })
  .catch(err => {
    console.log(`main error: ${err.message}`);
  });




function getexcel(Filename) {
  // Read the file into memory

  var workbook = XLSX.readFile( process.env.PATH_GDRIVE + 'Validação Campanhas/Cardif/CardiFTP_Entrada/' + Filename + '.xlsx');


  // Convert the XLSX to JSON
  let worksheets = {};
  for (const sheetName of workbook.SheetNames) {
    // Some helper functions in XLSX.utils generate different views of the sheets:
    //     XLSX.utils.sheet_to_csv generates CSV
    //     XLSX.utils.sheet_to_txt generates UTF16 Formatted Text
    //     XLSX.utils.sheet_to_html generates HTML
    //     XLSX.utils.sheet_to_json generates an array of objects
    //     XLSX.utils.sheet_to_formulae generates a list of formulae
    worksheets = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  // Show the data as JSON
  json = JSON.stringify(worksheets)
  var data = JSON.parse(json);
  EntradaExcel.push(data)
  // console.log(data);

}


//Função que verificar se existe a Venda por input
async function getCardifSales() {
  try {
    const response = await axios.get('http://localhost:8800/cardif/sales/');
    return response.data
  } catch (error) {
    console.error(error);
  }
}

// getCardifSales('46420').then(function(value) {
//     console.log(value); // Success!
//   }, function(reason) {
//     console.log(reason); // Error!
//   });



function AtualizarExcel(objRows) {
  //Atualizar Informações 
  getDoc().then(doc => {
    sheet = doc.sheetsByIndex[0];
    sheet.clearRows()
    sheet.addRows(objRows).then(rows => {
      console.log(rows.length,' linhas adicionadas')
      
    })

  })

}


