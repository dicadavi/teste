const ftp = require("basic-ftp")
require('dotenv').config({ path: './../../../../.env' })
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credenciais = require('./Credeciais.json');
const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery')
const fs = require("fs");
const XLSX = require("xlsx");
// Setting Global follow-redirects maxBodyLength
var followRedirects = require('follow-redirects');
followRedirects.maxBodyLength = 100 * 1024 * 1024; // 100 MB
var EntradaExcel = []
ExcelSheets = []


async function ExportFile() {
  let localPath = process.env.PATH_GDRIVE
  const client = new ftp.Client()
  client.ftp.verbose = true
  try {
    await client.access({
      host: process.env.HOST_OI,
      user: process.env.USER_OI,
      password: process.env.PASSWORD_OI,
    })
    // Exportar aquivos do FPT para Drive
    await client.downloadToDir(localPath + "Validação Campanhas/Oi/Oi_Entrada/PDVZANDO", "/incentevendas")
  }
  catch (err) {
    console.log(err)
  }
  return client.close()
}

const getDoc = async () => {
  const doc = new GoogleSpreadsheet("1RN9jgtFW3bo3notYnFqpWJ4nVcGyP_JAivFv9Hwetg8");

  await doc.useServiceAccountAuth({
    client_email: credenciais.client_email,
    private_key: credenciais.private_key.replace(/\\n/g, '\n')
  })
  await doc.loadInfo();
  return doc;
}

async function Getexcel(Filename) {
  // Read the file into memory

  var workbook = XLSX.readFile(process.env.PATH_GDRIVE + 'Validação Campanhas/Oi/Oi_Entrada/PDVZANDO/' + Filename + '.xlsx');


  // Convert the XLSX to JSON
  let worksheets = [];
  for (const sheetName of workbook.SheetNames) {
    console.log(sheetName)
    // Some helper functions in XLSX.utils generate different views of the sheets:
    //     XLSX.utils.sheet_to_csv generates CSV
    //     XLSX.utils.sheet_to_txt generates UTF16 Formatted Text
    //     XLSX.utils.sheet_to_html generates HTML
    //     XLSX.utils.sheet_to_json generates an array of objects
    //     XLSX.utils.sheet_to_formulae generates a list of formulae
    worksheets.push(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
  }

  // Show the data as JSON
  json = JSON.stringify(worksheets[0])
  var data = JSON.parse(json);
  EntradaExcel.push(data)
  //console.log(data);
  //console.log(worksheets);

}

async function AtualizarExcel(objRows, index = 0) {
  //Atualizar Informações 
  getDoc().then(doc => {
    sheet = doc.sheetsByIndex[index];
    sheet.clearRows()
    sheet.addRows(objRows).then(rows => {
      console.log(rows.length, ' linhas adicionadas')
    })
  })
}



async function ExecuteFunctions() {
  /***Exportar vendas do FTP***/
  await ExportFile()

  getDoc().then(data => console.log(data.title));

  /*** LER EXCEL FIBRA***/
  await Getexcel("!BOV_1065_519188_20230201_20230228_174056 - ENVIADO PROCESSAR")
  //console.log(EntradaExcel[0].NUMERO_PEDIDO)

  /***ACESSAR SALES DA CTMBOV***/
  const sales = await SalesFunction.getCTMBOV()
  //console.log(sales)

  /*** VERIFICAR SE O ARQUIVO ESTÁ DENTRO NA BOV ***/
  EntradaExcel[0].map(data => {

    let filtro = sales.filter(function (obj) { return obj.NUMERO_PEDIDO == data.NUMERO_PEDIDO; })
    if (filtro.length > 0) {

      ExcelSheets.push({
        NUMERO_PEDIDO: data.NUMERO_PEDIDO,
        PRODUTO_VOIP: data.PRODUTO_VOIP,
        PRODUTO_BL: data.PRODUTO_BL,
        PRODUTO_TV: data.PRODUTO_TV,
        TIPO: data.TIPO,
        DATA_PEDIDO: data.DATA_PEDIDO,
        STATUS: data.STATUS,
        DATA_STATUS: data.DATA_STATUS,
        DD_MM: data['DD/MM'],
        DIA: data.DIA,
        MES: data.MÊS,
        DATA: data.DATA,
        CLUSTER: data.CLUSTER,
        MOTIVO_SITUACAO_PEDIDO: data.MOTIVO_SITUACAO_PEDIDO,
        ALTERADO_POR: data.ALTERADO_POR,
        MOTIVO_RETIRADA: data.MOTIVO_RETIRADA,
        NUM_IDENTIDADE: data.NUM_IDENTIDADE,
        NOME_CLIENTE: data.NOME_CLIENTE,
        UNIDADE_NEGOCIO: data.UNIDADE_NEGOCIO,
        SEGMENTO_MERCADO: data.SEGMENTO_MERCADO,
        SEGMENTO_RELACIONAMENTO: data.SEGMENTO_RELACIONAMENTO,
        DE_PARA: data.DE_PARA,
        CTMBOV_ID: filtro[0].id,
        Encontrado: true
      })
    } else {
      //console.log('Não encontrado',data.NUMERO_PEDIDO)
      ExcelSheets.push({
        NUMERO_PEDIDO: data.NUMERO_PEDIDO,
        PRODUTO_VOIP: data.PRODUTO_VOIP,
        PRODUTO_BL: data.PRODUTO_BL,
        PRODUTO_TV: data.PRODUTO_TV,
        TIPO: data.TIPO,
        DATA_PEDIDO: data.DATA_PEDIDO,
        STATUS: data.STATUS,
        DATA_STATUS: data.DATA_STATUS,
        DD_MM: data['DD/MM'],
        DIA: data.DIA,
        MES: data.MÊS,
        DATA: data.DATA,
        CLUSTER: data.CLUSTER,
        MOTIVO_SITUACAO_PEDIDO: data.MOTIVO_SITUACAO_PEDIDO,
        ALTERADO_POR: data.ALTERADO_POR,
        MOTIVO_RETIRADA: data.MOTIVO_RETIRADA,
        NUM_IDENTIDADE: data.NUM_IDENTIDADE,
        NOME_CLIENTE: data.NOME_CLIENTE,
        UNIDADE_NEGOCIO: data.UNIDADE_NEGOCIO,
        SEGMENTO_MERCADO: data.SEGMENTO_MERCADO,
        SEGMENTO_RELACIONAMENTO: data.SEGMENTO_RELACIONAMENTO,
        DE_PARA: data.DE_PARA,
        CTMBOV_ID: '',
        Encontrado: false
      })
    }
  })
  AtualizarExcel(ExcelSheets, 0)

  /*** LER EXCEL PAGSEGUROS***/
  EntradaExcel = []
  ExcelSheets = []
  await Getexcel("!2023-02 - PAGSEGUROS (000) - ENVIADO PROCESSAR")
  // console.log(EntradaExcel[0])

  /***ACESSAR SALES DA CTMBOV***/
  const salesPagSeguro = await SalesFunction.getPagSeguros()
  //console.log(salesPagSeguro[0])


  /*** VERIFICAR SE O ARQUIVO ESTÁ DENTRO NA Presale ***/
  EntradaExcel[0].map(data => {
    dia = data.DATA_BOV.substring(6, 8)
    mes = data.DATA_BOV.substring(4, 6)
    ano = data.DATA_BOV.substring(0, 4)

    let Identification = data.CODIGO_SAP;
    let Identification2 = data.CPF_CNPJ;
    let Identification3 = data.PRODUTO;
    let Identification4 = dia + '/' + mes + '/' + ano;
    let FinalIdentification = Identification + " " + Identification2 + " " + Identification3 + " " + Identification4
    let filtro = salesPagSeguro.filter(function (obj) { return obj.sourceIdentification == FinalIdentification; })
    if (filtro.length > 0) {

      ExcelSheets.push({
        DATA_BOV: data.DATA_BOV,
        DATA: data.DATA,
        ANO: data.ANO,
        PRODUTO: data.PRODUTO,
        INDICADOR: data.INDICADOR,
        GRUPO_CANAL: data.GRUPO_CANAL,
        FILIAL: data.FILIAL,
        REGIONAL: data.REGIONAL,
        PDV_AGRUPADOR: data.PDV_AGRUPADOR,
        CODIGO_SAP: data.CODIGO_SAP,
        N4: data.N4,
        N5: data.N5,
        CPF_CNPJ: data.CPF_CNPJ,
        MEI: data.MEI,
        RAZAO_SOCIAL_PARC: data.RAZAO_SOCIAL_PARC,
        QTD: data.QTD,
        LOGIN_VENDEDOR: data.LOGIN_VENDEDOR,
        DDD_FIXO: data.DDD_FIXO,
        WEEK: data.WEEK,
        SAFRA_GROSS: data.SAFRA_GROSS,
        CANAL: data.CANAL,
        AFILIADO: data.AFILIADO,
        CPF: data.CPF,
        NOME: data.NOME,
        PreSaleID: filtro[0].id,
        SaleID: filtro[0].saleId,
        Encontrado: true
      })
    } else {
      //console.log('Não encontrado',data.NUMERO_PEDIDO)
      ExcelSheets.push({
        DATA_BOV: data.DATA_BOV,
        DATA: data.DATA,
        ANO: data.ANO,
        PRODUTO: data.PRODUTO,
        INDICADOR: data.INDICADOR,
        GRUPO_CANAL: data.GRUPO_CANAL,
        FILIAL: data.FILIAL,
        REGIONAL: data.REGIONAL,
        PDV_AGRUPADOR: data.PDV_AGRUPADOR,
        CODIGO_SAP: data.CODIGO_SAP,
        N4: data.N4,
        N5: data.N5,
        CPF_CNPJ: data.CPF_CNPJ,
        MEI: data.MEI,
        RAZAO_SOCIAL_PARC: data.RAZAO_SOCIAL_PARC,
        QTD: data.QTD,
        LOGIN_VENDEDOR: data.LOGIN_VENDEDOR,
        DDD_FIXO: data.DDD_FIXO,
        WEEK: data.WEEK,
        SAFRA_GROSS: data.SAFRA_GROSS,
        CANAL: data.CANAL,
        AFILIADO: data.AFILIADO,
        CPF: data.CPF,
        NOME: data.NOME,
        PreSaleID: '',
        SaleID: '',
        Encontrado: false
      })
    }
  })
  AtualizarExcel(ExcelSheets, 2)

}


ExecuteFunctions()