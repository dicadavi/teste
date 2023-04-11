const { GoogleSpreadsheet } = require('google-spreadsheet')
const credentials = require('./credentials.json')

const docId = "1CR4vlumPDrahoyZkMUMUJH9iKgfdA28P2m67GeGN7YI"
const doc = new GoogleSpreadsheet(docId)
doc.useServiceAccountAuth(credentials, err =>{
    doc.getInfo((err, info) =>{
        console.log(infao)
        
    })  

    console.log("ERRO")
})

console.log("ERRO")