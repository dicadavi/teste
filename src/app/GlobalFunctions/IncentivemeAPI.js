require('dotenv').config({ path: './../../../.env' })
const axios = require('axios');

async function Processar(LoteID) {
  const options = {
    method: 'POST',
    headers: { 'authorization': process.env.AUTHORIZATION_INCENTIVEME },
    url: "https://api.incentive-me.com/api/validation-batches/" + LoteID + "/process",
    timeout: 180000,
  };



  try {
    const response = await axios(options);
    return response.data
  } catch (error) {
    console.error(error.response);
    //console.error("Lote:",LoteID,"Status:",error.response.status,"Mensagem do erro:",error.response.statusText)
    //   if (error.response.data) {
    //     console.log("Log API:",error.response.data.error.statusCode,error.response.data.error.message)
    //   }      
    //   // return error.response
  }
}

async function Pagar(LoteID) {
  const options = {
    method: 'POST',
    headers: { 'authorization': process.env.AUTHORIZATION_INCENTIVEME },
    url: "https://api.incentive-me.com/api/validation-batches/" + LoteID + "/pay",
    timeout: 180000,
  };



  try {
    const response = await axios(options);
    return response.data
  } catch (error) {
    console.error("Lote:", LoteID, error.response);
    //console.error("Lote:",LoteID,"Status:",error.response.status,"Mensagem do erro:",error.response.statusText)
    //   if (error.response.data) {
    //     console.log("Log API:",error.response.data.error.statusCode,error.response.data.error.message)
    //   }

  }
}

async function VerificarLote(LoteID) {
  const options = {
    method: 'GET',
    url: "http://localhost:8800/ValidationBudget/" + LoteID,
  };



  try {
    const response = await axios(options);
    return response.data
  } catch (error) {
    console.error(error);
  }
}



async function AllLotes(LotesAry, AlterarStatus = false) {
  // PROCESSAR TODOS OS LOTES 
  for (const item of LotesAry) {
    await Processar(item).then(data => {
      console.log(data)

    })
  }

  for (const item of LotesAry) {


    // VERIFICAR SE O LOTE PODE ENTRAR NO PROCESSO DE PAGAMENTO
    const verificarlote = await VerificarLote(item)
    notPayment = false

    // Tem vendas a serem pagas?
    if (verificarlote.length > 0) {

      //Tem Saldo insuficiente para pagar tudo?
      if (verificarlote[0].SaldoDisponivel != "Disponível") {
        notPayment = true
        return console.log("Saldo Indisponível, precisa conter:", verificarlote[0].SomaValorPorLote)

      }
      // Orçamento bloqueado ou limite não suficiciente?    
      else if (verificarlote[0]['OrçamentoDisponivel'] != "Disponível") {
        return console.log("Lite de orçamento não é suficiente, libere para pagar:", verificarlote[0].SomaValorPorLote)
      }
      //Pode Pagar
      else {

        await Pagar(item).then(data => {
          console.log(data)
        })

      }

    } else {
      if (AlterarStatus && notPayment == false) {
        await Pagar(item).then(data => {
          console.log(data)
        })

      } else {
        return console.log("Não temos vendas a serem pagas nesse lote")
      }

    }
  }



  return true
}



async function Sumary(LoteID) {
  const options = {
    method: 'POST',
    headers: { 'authorization': process.env.AUTHORIZATION_INCENTIVEME },
    url: `https://api.incentive-me.com/api/validation-batches/${LoteID}/update-summary`,
    timeout: 180000,
  };

  try {
    const response = await axios(options);
    return response.data
  } catch (error) {
    console.error("Lote:", LoteID, error.response);
  }
}
module.exports = { Processar, Pagar, VerificarLote, AllLotes, Sumary }