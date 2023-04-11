const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('../VisualizaFtp/Credeciais.json');
const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery');
// Setting Global follow-redirects maxBodyLength
var followRedirects = require('follow-redirects');
followRedirects.maxBodyLength = 100 * 1024 * 1024; // 100 MB



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
  console.log(doc.title);
});


let sheet;
async function Rodar() {
  // GET Sales from Query
const sales = await SalesFunction.getSalesMetlife("-")
AtualizarExcel(sales)

}

function AtualizarExcel(objRows) {
  //Atualizar Informações 
  getDoc().then(doc => {
    sheet = doc.sheetsByIndex[1];
    sheet.clearRows()
    sheet.addRows(objRows).then(rows => {
      console.log(rows.length, ' linhas adicionadas')

    })

  })

}

Rodar()