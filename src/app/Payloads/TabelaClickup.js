const randomfunction = require('../GlobalFunctions/Random');

//Adiciona mensagem ao comentário
function AddTexto(menssagem,isBanner = false, color = 'green') {
    
    if (isBanner) {
        return [
            {
                "text": menssagem,
                "attributes": {}
            },
            {
                "text": "\n",
                "attributes": {
                    "block-id": "block-aa66a755-0990-46ce-9e66-"+randomfunction.random(12),
                    "advanced-banner":"923c8f3e-003c-43f0-bc80-"+randomfunction.random(12),
                    "advanced-banner-color":color
                }
            }
        ]
    } else {
        return [
            {
                "text": menssagem,
                "attributes": {}
            },
            {
                "text": "\n",
                "attributes": {
                    "block-id": "block-aa66a755-0990-46ce-9e66-"+randomfunction.random(12)
                }
            }
        ]
    }
    
}

//Adiciona uma tabela ao comentário, essa função deve ser chamada por linha
function AddTabela(Titulo, Linhas) {
    var tabela = []
    const row = randomfunction.random(6)

    Titulo.map(data => {
        let update = [{
            "text": data,
            "attributes": {
                "bold": true
            }
        },
        {
            "text": "\n",
            "attributes": {
                "block-id": "block-38cd5e3e-3609-4dd4-8685-"+randomfunction.random(12),
                "table-row-color": "pink",
                "align": "center",
                "table-cell-line": {
                    "rowspan": "1",
                    "colspan": "1",
                    "row": "row-"+row,
                    "cell": "cell-"+randomfunction.random(6)
                }
            }
        }]

        tabela = tabela.concat(update)

    })


    
    Linhas.map(data => {
        let update = [{
            "text": data,
            "attributes": {}
        },
        {
            "text": "\n",
            "attributes": {
                "block-id": "block-e4b54dd8-94d7-4f35-a5d1-"+randomfunction.random(12),
                "advanced-banner": "9b7135f6-7e34-400a-9407-b424f6d906df",
                "advanced-banner-color": "green",
                "table-cell-line": {
                    "rowspan": "1",
                    "colspan": "1",
                    "row": "row-"+row,
                    "cell": "cell-"+randomfunction.random(6)
                }
            }
        }]

        tabela = tabela.concat(update)

    })

    return tabela

}


//Adiciona titulo com data ao comentário
function AddData(data) {
    return [{
        "text": data,
        "attributes": {
            "bold": true,
            "code": true
        }
    },
    {
        "text": "\n",
        "attributes": {
            "block-id": "block-145c890b-500f-4722-8ead-"+randomfunction.random(12),
            "header": 4
        }
    },
    {
        "text": "\n",
        "attributes": {
            "block-id": "block-d53f5327-3247-4c75-a10e-"+randomfunction.random(12)
        }
    }]

}
//Adiciona espaço ao comentário
function space() {
    return [{
        "text":"\n",
        "attributes":{
           "block-id":"block-393798d2-d0a9-451b-84be-"+randomfunction.random(12)
        }
     }]
}

module.exports = { AddData, AddTabela, AddTexto, space}

