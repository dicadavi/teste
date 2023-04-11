
function SepararLotes(erros,Dados) {
    let lotes = []
    let lotesporvalidation = []
    let lotesUnicos = []
    let lotesUnicosPorValidation = []
    definirlotes()


    erros.map(data =>{
        let LotesDinstinct = ""

    console.log(data.ValidationQuery)
    console.log(data.occurrence)
    let lotesfiltrados = filtrar(lotesporvalidation, data.ValidationQuery)
    lotesUnicosPorValidation = lotesfiltrados.filter((este, i) => lotesfiltrados.indexOf(este) === i);
    for (const valores of lotesUnicosPorValidation) {
        if (LotesDinstinct === "") {
            LotesDinstinct = valores
        } else {
            LotesDinstinct = LotesDinstinct + ", " + valores
        }
    }
    LotesDinstinct = ""
    })
    



    function definirlotes() {
        for (let variavel of Dados) {
            if (variavel.validationBatchId === null || variavel.validationBatchId === 0) {
                //Remove os validations null para não dar erro no porcessamento dos lotes
            } else {
                lotes.push(variavel.validationBatchId);
            }
            lotesporvalidation.push({ "Lote": variavel.validationBatchId, "Validation": variavel.ValidationQuery })
        }
        lotesUnicos = lotes.filter((este, i) => lotes.indexOf(este) === i);
       
    }
    
      
    
    function filtrar(lotesgeral, filter) {
        let arro = []
        for (let entry of lotesgeral) {
            if (entry.Validation === filter) {
                arro.push(entry.Lote)
            }
        }
        return arro
    }
    


    return lotesUnicos
}




module.exports = {SepararLotes}        