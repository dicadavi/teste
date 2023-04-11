const functionClickUP = require('../../GlobalFunctions/CreateTaskComment')
const validationquery = require('../../GlobalFunctions/CampaignValidation')
require('dotenv').config({ path:'./../../../../.env' })
var Form = []
// 864e6y3c8 5
async function rodar() {
    const ResumoTask = await functionClickUP.GetTask('864e7wbh0',process.env.AUTHORIZATION_CLICKUP)
    ResumoTask.custom_fields.map(data =>{
       
        if(data.type == 'drop_down'){
            let type_config = data.type_config.options
            let Filtro = type_config.filter(function (obj) { return obj.orderindex == data.value; })
            //console.log(Filtro[0])
            if (Filtro.length > 0) {
                console.log(data.name,":",Filtro[0].name)
                Form.push({name:data.name,value:Filtro[0].name})
                // REALIZAR AQUI A VALIDAÇÃO DOS INPUTS DROP-DOWN
            }
        } else if (data.type == 'labels') {
            let type_config = data.type_config.options
            let Filtro = type_config.filter(function (obj) { return obj.id == data.value; })
            //console.log(Filtro[0])
            if (Filtro.length > 0) {
                console.log(data.name,":",Filtro[0].label)
                // REALIZAR AQUI A VALIDAÇÃO DOS INPUTS labels
                Form.push({name:data.name,value:Filtro[0].label})
            }
        }   else if (data.type == 'text') {
            if (data.value) {
                console.log(data.name,":",data.value)
                Form.push({name:data.name,value:data.value})
            }
        } else if (data.type == 'short_text') {
            if (data.value) {
                console.log(data.name,":",data.value)
                Form.push({name:data.name,value:data.value})
            }
         } else if (data.type == 'checkbox') {
            if (data.value) {
                console.log(data.name,":",data.value)
                Form.push({name:data.name,value:data.value})
            }
        }
        
    
    }) 

    // console.log(Form)
    const validation = await validationquery.ValidationCampaing(13299,Form)
    console.log(validation)
    
}


rodar()