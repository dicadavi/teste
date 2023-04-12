const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery');
const taskComment = require('../../../../GlobalFunctions/CreateTaskComment');
const Payloads = require('../../../../Payloads/TabelaClickup');
const contador = require('../../../../GlobalFunctions/CountValidation');
require('dotenv').config({ path: './../../../../.env' })
const dayjs = require('dayjs')
const clickupID = "864ecc55p"

var Comentario = []



//Pegando todos os erros da CardifSales
SalesFunction.getCardifSales("ERRO").then(data => {


  Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
  Comentario = Comentario.concat(Payloads.AddTexto("Resumo diario dos erros da CARDIF feito via NodeJs",true,'yellow'))
  Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery","StatusDetailID","Totals"],[]))

  //Vai somar validations iguais e informar quantos existem
  const erros = contador.findOcc(data, "ValidationQuery","StatusID")

  erros.map(data => {
    Comentario = Comentario.concat(Payloads.AddTabela([],[data.ValidationQuery,data.StatusID.toString(),data.occurrence.toString()]))
  //console.log()
  })

  const body = JSON.stringify(
    {
      "comment": Comentario
    }

  )


  taskComment.CreatTaskComent(clickupID, body,process.env.AUTHORIZATION_CLICKUP).then(data => {
    console.log(data)
  })


})