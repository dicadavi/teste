const SalesFunction = require('../../Global Functions/CardifSales');
const taskComment = require('../../Global Functions/CreateTaskComment');
const Payloads = require('../../Payloads/TabelaClickup');
const contador = require('../../Global Functions/CountValidation');
require('dotenv').config({ path: './../../../../.env' })


var Comentario = []



//Pegando todos os erros da CardifSales
SalesFunction.getCardifSales("ERRO").then(data => {


  Comentario = Comentario.concat(Payloads.AddData("30/03"))
  Comentario = Comentario.concat(Payloads.AddTexto("Resumo diario dos erros da CARDIF feito via NodeJs"))
  Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery","StatusDetailID","Totals"],[]))

  //Vai somar validations iguais e informar quantos existem
  const erros = contador.findOcc(data, "ValidationQuery")

  erros.map(data => {
    Comentario = Comentario.concat(Payloads.AddTabela([],[data.ValidationQuery,data.StatusID.toString(),data.occurrence.toString()]))
  //console.log()
  })

  const body = JSON.stringify(
    {
      "comment": Comentario
    }

  )


  taskComment.CreatTaskComent("864e9z5a0", body,process.env.AUTHORIZATION_CLICKUP).then(data => {
    console.log(data)
  })


})
