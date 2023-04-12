const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('../VisualizaFtp/Credeciais.json');
const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery');



const getDoc = async () => {
  const doc = new GoogleSpreadsheet("1Mbs-0D_u6NCXLUkyFHOmZmCcPTHfUR4ANP5Xt9g6RdU");

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



SalesFunction.getCardifSales("-").then(data => {

  //console.log(data[3].ValidationQuery.match('\{[0-9]*\}')[0].replace('{','').replace('}',''))// Tem que criar um replace para recortar o código 
  AtualizarExcel(data)

})
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