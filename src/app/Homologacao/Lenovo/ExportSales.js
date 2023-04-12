const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('../VisualizaFtp/Credeciais.json');
const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery');
// Setting Global follow-redirects maxBodyLength
var followRedirects = require('follow-redirects');
followRedirects.maxBodyLength = 100 * 1024 * 1024; // 100 MB



const getDoc = async () => {
  const doc = new GoogleSpreadsheet("1MTL_OACdStAcK9DW8zU3orwMEGBaUCdKUkfdp4Zf5e0");

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



SalesFunction.getSalesNFE(12623,'-').then(data => {

  //console.log(data[3].ValidationQuery.match('\{[0-9]*\}')[0].replace('{','').replace('}',''))// Tem que criar um replace para recortar o código 
  //console.log(data)
   AtualizarExcel(data)

})
function AtualizarExcel(objRows) {
  //Atualizar Informações 
  getDoc().then(doc => {
    sheet = doc.sheetsByIndex[0];
    sheet.clearRows()
    sheet.addRows(objRows).then(rows => {
      console.log(rows.length, ' linhas adicionadas')

    })

  })

}