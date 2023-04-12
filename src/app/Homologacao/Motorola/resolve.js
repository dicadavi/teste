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



    //Pegando todos os erros da MotorolaSalesNFE
    const sales = await SalesFunction.getSalesNFE(9573, "ERRO")

    //Criar Cabeçalho do comentário
    Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
    Comentario = Comentario.concat(Payloads.AddTexto("Resumo diario dos erros da Motorola feito via NodeJs", true, "yellow"))
    Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "StatusDetailID", "Totals"], []))

    //Vai somar validations iguais e informar quantos existem
    var erros = contador.findOcc(sales, "ValidationQuery", "StatusDetailID")

    lotesUnicos = separador.SepararLotes(erros, sales)
    console.log(lotesUnicos)
    erros.map(data => {
        //ADD Comentario
        Comentario = Comentario.concat(Payloads.AddTabela([], [data.ValidationQuery, data.StatusID.toString(), data.occurrence.toString()]))
    })

    body = JSON.stringify(
        {
            "comment": Comentario
        }

    )

    const idComentario = await taskComment.CreatTaskComent(clickupID, body, process.env.AUTHORIZATION_CLICKUP)
    console.log(idComentario)
    //Processar e paga os lotes
    await APIincentive.AllLotes(lotesUnicos, true)

    //console.log(body)
    // Zerar Body
    body = {}



    const newSales = await SalesFunction.getSalesNFE(9573, "ERRO")

    Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
    Comentario = Comentario.concat(Payloads.AddTexto("Erros permanecidos após correção automatico de Qualidade.", true, "green"))
    Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "StatusDetailID", "Totals"], []))

    //Vai somar validations iguais e informar quantos existem
    erros = contador.findOcc(newSales, "ValidationQuery", "StatusDetailID")

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
    RodaMeta()
}

async function RodaMeta() {
    //INICIAR VERIFICAÇÃO DA META----------------------
    Comentario = []
    lotesUnicos = []
    body = {}



    console.log("Rodando Sumary")
    await APIincentive.Sumary(14851)

    console.log("Pegando metas não pagas")
    const salesMeta = await SalesFunction.getSalesNFEMETA(9573)

    //Criar Cabeçalho do comentário
    Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
    Comentario = Comentario.concat(Payloads.AddTexto("Resumo diario dos erros das METAS da Motorola feito via NodeJs", true, "yellow"))
    Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "LotesDasVendas", "Totals"], []))

    //Vai somar validations iguais e informar quantos existem
    var erros = contador.findOcc(salesMeta, "ValidationQuery", "LotesDasVendas")

    lotesUnicos = separador.SepararLotes(erros, salesMeta)
    console.log(lotesUnicos)
    erros.map(data => {
        //ADD Comentario
        Comentario = Comentario.concat(Payloads.AddTabela([], [data.ValidationQuery, data.StatusID.toString(), data.occurrence.toString()]))
    })

    body = JSON.stringify(
        {
            "comment": Comentario
        }

    )

    const idComentario = await taskComment.CreatTaskComent(clickupID, body, process.env.AUTHORIZATION_CLICKUP)
    console.log(idComentario)
    //Processar e paga os lotes
    await APIincentive.AllLotes(lotesUnicos, true)

    //console.log(body)
    // Zerar Body
    body = {}



    const newSales = await SalesFunction.getSalesNFEMETA(9573)

    Comentario = Comentario.concat(Payloads.AddData(dayjs().format('DD-MM-YY HH:mm').toString()))
    Comentario = Comentario.concat(Payloads.AddTexto("Erros permanecidos após correção automatico de Qualidade.", true, "green"))
    Comentario = Comentario.concat(Payloads.AddTabela(["ValidationQuery", "LotesDasVendas", "Totals"], []))

    //Vai somar validations iguais e informar quantos existem
    erros = contador.findOcc(newSales, "ValidationQuery", "LotesDasVendas")

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