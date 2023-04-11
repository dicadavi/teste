const queryCampaign = require('./GetSalesQuery')

async function ValidationCampaing(CampaignID, arryClickup) {
    const query = await queryCampaign.getCampaignValidation(CampaignID)
    var response = []
    arryClickup.map(data => {
        /****ACEITE*****/
        if (data.name == 'Aceite') {
            if (data.value == query[0].Aceite) {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Aceite, validation: true })
            } else {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Aceite, validation: false })
            }
        }
        /****APLICATIVO*****/
        else if (data.name == 'Aplicativo') {
            if (data.value == query[0].Aplicativo) {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Aplicativo, validation: true })
            } else {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Aplicativo, validation: false })
            }
        }
        /****CLIENTE*****/
        else if (data.name == 'Cliente') {
            if (data.value == query[0].Cliente) {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Cliente, validation: true })
            } else {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Cliente, validation: false })
            }
        }
        /****TIPO DE INPUT*****/
        else if (data.name == 'Como chega a carga?') {
            if (data.value == query[0].input) {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].input, validation: true })
            } else {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].input, validation: false })
            }
        }
        /****ELEGIBILIDADE*****/
        else if (data.name == 'Elegibilidade') {
            if (data.value == query[0].Campanha_tem_elegibilidade) {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Campanha_tem_elegibilidade, validation: true })
            } else {
                return response.push({ tipo: data.name, valorClickUp: data.value, valorSistema: query[0].Campanha_tem_elegibilidade, validation: false })
            }
        }
        /****FORNECEDOR*****/
        else if (data.name == 'Fornecedor') {
            if (data.value == query[0].Fornecedor) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Fornecedor,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Fornecedor,validation:false})
            }

        }
        /****NOME DA CAMPANHA*****/
        else if (data.name == 'Nome da Campanha') {
            if (data.value == query[0].Nome_da_Campanha) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Nome_da_Campanha,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Nome_da_Campanha,validation:false})
            }
            
        }
        /****ORÇAMENTO*****/
        else if (data.name == 'Quais são os requisitos para distribuição de pontos?') {
            if (data.value == query[0].Campanha_tem_orçamento) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Campanha_tem_orçamento,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Campanha_tem_orçamento,validation:false})
            }

        }
        /****PRAZO DE EXPIRAÇÃO*****/
        else if (data.name == 'Quanto tempo para que a venda expire? ') {
            if (data.value == query[0].Dias_para_expiração_das_vendas) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Dias_para_expiração_das_vendas,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Dias_para_expiração_das_vendas,validation:false})
            }

        }
        /****PAGAMENTO*****/
        else if (data.name == 'Quanto tempo para que as vendas sejam pagas?') {
            if (data.value == query[0].Tempo_pagamento) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Tempo_pagamento,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Tempo_pagamento,validation:false})
            }

        }
        /****AUDIENCIA TIPO*****/
        else if (data.name == 'Tipo Audiência') {
            if (data.value == query[0].Audiencia) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Audiencia,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Audiencia,validation:false})
            }

        }
        /****CAMPANHA TIPO*****/
        else if (data.name == 'Tipo de Campanha') {
            if (data.value == query[0].Tipo_de_campanha) {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Tipo_de_campanha,validation:true})
            } else {
                return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:query[0].Tipo_de_campanha,validation:false})
            }

        } else {
            return response.push({tipo:data.name,valorClickUp:data.value,valorSistema:'Não Mapeado',validation:false})
        }       

    })

    return response
}


module.exports = { ValidationCampaing }