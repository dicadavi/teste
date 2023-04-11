const SalesFunction = require('../../../../GlobalFunctions/GetSalesQuery');
const taskComment = require('../../../../GlobalFunctions/CreateTaskComment');
const Payloads = require('../../../../Payloads/TabelaClickup');
const contador = require('../../../../GlobalFunctions/CountValidation');
const separador = require('../../../../GlobalFunctions/SepararLotesUnicos')
const APIincentive = require('../../../../GlobalFunctions/IncentivemeAPI')
require('dotenv').config({ path: './../../../../.env' })
const dayjs = require('dayjs')
var Comentario = []
let lotesUnicos = []
var body
const clickupID = "864ecc55p"

async function Rodar() {



    //Pegando todos os erros da PositivoSales
    await SalesFunction.getSalesNFE(3, "ERRO").then(data => {

        //console.log(data)
        Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
        Comentario = Comentario.concat(Payloads.AddTexto("Resumo diario dos erros da Positivo feito via NodeJs", true, "yellow"))
        Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "StatusDetailID", "Totals"], []))

        //Vai somar validations iguais e informar quantos existem
        const erros = contador.findOcc(data, "ValidationQuery", "StatusDetailID")

        lotesUnicos = separador.SepararLotes(erros, data)
        console.log(lotesUnicos)
        erros.map(data => {
            //ADD Comentario
            Comentario = Comentario.concat(Payloads.AddTabela([], [data.ValidationQuery, data.StatusID.toString(), data.occurrence.toString()]))
            //console.log(data)
        })

        body = JSON.stringify(
            {
                "comment": Comentario
            }

        )
    })
    const idComentario = await taskComment.CreatTaskComent(clickupID, body, process.env.AUTHORIZATION_CLICKUP)
    console.log(idComentario)
    //Processar e paga os lotes
    await APIincentive.AllLotes(lotesUnicos, true)

    //console.log(body)
    // Zerar Body
    body = {}
    console.log("zerou:", body)


    const newSales = await SalesFunction.getSalesNFE(3, "ERRO")

    Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
    Comentario = Comentario.concat(Payloads.AddTexto("Erros permanecidos após correção automatico de Qualidade.", true, "green"))
    Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "StatusDetailID", "Totals"], []))

    //Vai somar validations iguais e informar quantos existem
    const erros = contador.findOcc(newSales, "ValidationQuery", "StatusDetailID")

    lotesUnicos = separador.SepararLotes(erros, newSales)
    console.log(lotesUnicos)
    erros.map(data => {
        //ADD Comentario
        Comentario = Comentario.concat(Payloads.AddTabela([], [data.ValidationQuery, data.StatusID.toString(), data.occurrence.toString()]))
        //console.log(data)
    })


    var body2 = JSON.stringify(
        {
            "comment": Comentario
        }

    )


    console.log("Pagamento realizado, atualizando comentário")
    //Atualiza o comentário com os erros que permaneceram
    await taskComment.UpdateTaskComent(idComentario.id, body2, process.env.AUTHORIZATION_CLICKUP)


}


Rodar()