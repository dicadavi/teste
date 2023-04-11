require('dotenv').config({path:'./../../../.env' })


const express = require('express');
const app = express();
const port = 8800; //porta padrão
const mysql = require('mysql2');
const cors = require('cors')


app.use(express.json());
app.use( cors());


app.get('/', (req, res) => res.json({ message: 'Funcionando!' }));

//inicia o servidor
app.listen(port);
console.log('API funcionando!');





function execSQLQuery(sqlQry, res){
  const connection = mysql.createConnection({
    host     : process.env.HOST_DB,
    port     : process.env.PORT_DB,
    user     : process.env.USER_DB,
    password : process.env.PASSWORD_DB,
    database : process.env.DATABASE_DB
  });

  connection.query(sqlQry, (error, results, fields) => {
      if(error) 
        res.json(error);
      else
        res.json(results);
      connection.end();
      console.log('executou!');
  });
}

// ------------------------------------------------------- INICIO CARDIF---------------------------------------------------
app.get('/cardifVolks', (req, res) => {
    execSQLQuery(`select
    CASE 
      -- De acordo com o GIT, assim que a carga carrega o venda já é validada. WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) < 1 THEN "OK - Venda processando dentro do prazo"
      WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) > 60 THEN "ERRO - Venda processando por mais de 60 dias, deveria ser reprovado por ausente?"
      WHEN v.statusDetailId = 8 THEN IF(GROUP_CONCAT(sDuplicate.id)  is null, "ERRO - Venda duplicada não encontrada","OK - Duplicidade encontrado") -- A duplicidade é encontrada na venda aprovada, ou seja, se existir apenas duas vendas registradas e todas reprovadas não vai encontrar duplicidade
      WHEN s.id in (2035956,2035992,2033181,2078825,2078832,2035837,2105282,2105303,2090358,2047018,2075987,2125225,2098133,2098136,2129943,2129947,2124140) THEN "OK - O problema foi identificado e resolvido no passado."
      WHEN cs.saleDate < c.campaignStart and s.statusId = 2 or cs.saleDate > c.campaignEnd and s.statusId = 2 THEN "ERRO - Venda aprovada, mas a nota estava fora do período da campanha"
      WHEN cs.saleDate < c.campaignStart and s.statusId <> 2 or cs.saleDate > c.campaignEnd and s.statusId <> 2 THEN "OK - Venda não foi cadastrada dentro do período da campanha"
      WHEN v.id is null and DATEDIFF(NOW(),s.created)  < vr.validationPeriod THEN "OK - venda processando sem lote dentro do prazo"
      WHEN s.campaignId in (11102,11104) and cs.product REGEXP "(SPF)" and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda"
      WHEN s.campaignId in (11102,11104) and cs.product NOT REGEXP "(SPF)" and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda"
      WHEN s.campaignId in (11101,11103) and cs.product REGEXP "(Garantia)" and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda"
      WHEN s.campaignId in (11101,11103) and cs.product NOT REGEXP "(Garantia)" and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda"
      WHEN s.statusId = 1 and cs.id is null THEN "OK - Venda Processando Corretamente, pois não recebemos na carga ainda"
      WHEN s.campaignId in (11102,11104) and cs.product REGEXP "(SPF)" and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11101,11103) and cs.product REGEXP "(Garantia)" and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11102,11104) and cs.product NOT REGEXP "(SPF)" and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.campaignId in (11101,11103) and cs.product NOT REGEXP "(Garantia)" and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.statusId = 1 and cs.id is not null THEN "ERRO - Venda processando de forma errada, pois recebemos a venda na carga "
      ELSE "ERRO - Não Mapeado"
    END	AS ValidationQuery,DATEDIFF(NOW(),s.created)"Tempo criado",	
      s.id "SaleId",
     vr.validationPeriod, 
      s.statusId "StatusID",
      c.validationPeriod "PeriodoDeValidação",	
      c.companyId,
      statusSale.description "SaleStatus",
      statusValidation.description "ValidationDescription",
      statusDetailValidation.description "ValidationStatusDetail",
      statusDetailValidation.message "ValidationMessage",
      CONCAT(c.id, " ", c.internalName) "Campanha",
      IF(cs.saleDate >= c.campaignStart  and cs.saleDate <= c.campaignEnd, "True",if(cs.id is null, "Não se aplica no momento", "False")) "Dentro do período da campaha?",
      cs.saleDate "SaleDateCardif",
      s.created "SaleDateRegistro",
      c.campaignStart "InicioDaCampanha",
      c.campaignEnd "FimDaCampanha",
      s.input "SaleInput",
      p.name "ProductName",
      v.validationBatchId,
      u.cpf "CPF",
      if(cu.eligible,
      "Elegível",
      "Não") "Usuário Elegível?",
      t.amount "Transaction",
      cs.id "id na PlayCardifsales",
      cs.input "InputEncontrado",
      cs.created "CriaçãoDacarga",
      cs.product "ProdutoCardif",
      GROUP_CONCAT(sDuplicate.id) "sDuplicateID",
      GROUP_CONCAT(sDuplicate.input) "InputDuplicate"
  from
      Sale s
  LEFT JOIN playground.CardifSales cs on
      LPAD(cs.input, 50, '0') = LPAD(s.input, 50, '0')
  left join Status statusSale on
      statusSale.id = s.statusId
  left join Campaign c on
      c.id = s.campaignId
  left join ProductCampaign pc on
      pc.id = s.productCampaignId
  left join Product p on
      p.id = pc.productId
  left join Validation v on
      v.sourceTypeId = 1
      and v.sourceId = s.id
  LEFT JOIN ValidationRule vr on vr.id = 92
  left join Status statusValidation on
      statusValidation.id = v.statusId
  left join StatusDetail statusDetailValidation on
      statusDetailValidation.id = v.statusDetailId
  left join Credit c2 on
      c2.validationId = v.id
  left join Transaction t on
      t.id = c2.transactionId
  left join Seller s2 on
      s2.id = s.sellerId
  left join User u on
      u.id = s2.userId
  left join Account a on
      a.id = u.accountId
  left join CampaignUser cu on
      cu.userId = u.id
      and cu.campaignId = c.id
  left join Sale sDuplicate on s.input = sDuplicate.input and s.id <>sDuplicate.id and sDuplicate.statusId <> 3 
  where TRUE 
  and c.internalName  REGEXP "(Volks)"
   -- and s.id in (2029684,2029684,2029685,2029685,2029686,2029686,2029694,2029752,2029752,2029753)
  -- s.campaignId in (11101,11102,11103,11104)-- and s.id in (2089007,2086942,2098610,2089020)
  GROUP BY s.id, statusSale.id, v.id, c2.id, cu.id, cs.id 
  HAVING ValidationQuery REGEXP "(-)"`, res)
   // console.log(res)
})
app.get('/cardifDucati', (req, res) => {
    execSQLQuery(`select
    CASE 
      -- De acordo com o GIT, assim que a carga carrega o venda já é validada. WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) < 1 THEN "OK - Venda processando dentro do prazo"
          WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) > 60 THEN "ERRO - Venda processando por mais de 60 dias, deveria ser reprovado por ausente?"
      WHEN v.statusDetailId = 8 THEN IF(GROUP_CONCAT(sDuplicate.id)  is null, "ERRO - Venda duplicada não encontrada","OK - Duplicidade encontrado") -- A duplicidade é encontrada na venda aprovada, ou seja, se existir apenas duas vendas registradas e todas reprovadas não vai encontrar duplicidade
      WHEN cs.saleDate < c.campaignStart and s.statusId = 2 or cs.saleDate > c.campaignEnd and s.statusId = 2 THEN "ERRO - Venda aprovada, mas a nota estava fora do período da campanha"
      WHEN cs.saleDate < c.campaignStart and s.statusId <> 2 or cs.saleDate > c.campaignEnd and s.statusId <> 2 THEN "OK - Venda não foi cadastrada dentro do período da campanha"
      WHEN v.id is null and DATEDIFF(NOW(),s.created)  < vr.validationPeriod THEN "OK - venda processando sem lote dentro do prazo"
      WHEN s.campaignId in (11099) and cs.product REGEXP "(Garantia Estendida Original).........." and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda"
      WHEN s.campaignId in (11099) and cs.product NOT REGEXP "(Garantia Estendida Original).........." and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda"
      WHEN s.statusId = 1 and cs.id is null THEN "OK - Venda Processando Corretamente, pois não recebemos na carga ainda"
      WHEN s.campaignId in (11099) and cs.product REGEXP "(Garantia Estendida Original).........." and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11099) and cs.product NOT REGEXP "(Garantia Estendida Original).........." and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.statusId = 1 and cs.id is not null THEN "ERRO - Venda processando de forma errada, pois recebemos a venda na carga "
      ELSE "ERRO - Não Mapeado"
      END	AS ValidationQuery,DATEDIFF(NOW(),s.created)"Tempo criado",	
      s.id "SaleId",
     vr.validationPeriod, 
      s.statusId "StatusID",
      c.validationPeriod "PeriodoDeValidação",	
      c.companyId,
      statusSale.description "SaleStatus",
      statusValidation.description "ValidationDescription",
      statusDetailValidation.description "ValidationStatusDetail",
      statusDetailValidation.message "ValidationMessage",
      CONCAT(c.id, " ", c.internalName) "Campanha",
      IF(cs.saleDate >= c.campaignStart  and cs.saleDate <= c.campaignEnd, "True",if(cs.id is null, "Não se aplica no momento", "False")) "Dentro do período da campaha?",
      cs.saleDate "SaleDateCardif",
      s.created "SaleDateRegistro",
      c.campaignStart "InicioDaCampanha",
      c.campaignEnd "FimDaCampanha",
      s.input "SaleInput",
      p.name "ProductName",
      v.validationBatchId,
      u.cpf "CPF",
      if(cu.eligible,
      "Elegível",
      "Não") "Usuário Elegível?",
      t.amount "Transaction",
      cs.id "id na PlayCardifsales",
      cs.input "InputEncontrado",
      cs.created "CriaçãoDacarga",
      cs.product "ProdutoCardif",
      GROUP_CONCAT(sDuplicate.id) "sDuplicateID",
      GROUP_CONCAT(sDuplicate.input) "InputDuplicate"
  from
      Sale s
  LEFT JOIN playground.CardifSales cs on
      LPAD(cs.input, 50, '0') = LPAD(s.input, 50, '0')
  left join Status statusSale on
      statusSale.id = s.statusId
  left join Campaign c on
      c.id = s.campaignId
  left join ProductCampaign pc on
      pc.id = s.productCampaignId
  left join Product p on
      p.id = pc.productId
  left join Validation v on
      v.sourceTypeId = 1
      and v.sourceId = s.id
  LEFT JOIN ValidationRule vr on vr.id = 92
  left join Status statusValidation on
      statusValidation.id = v.statusId
  left join StatusDetail statusDetailValidation on
      statusDetailValidation.id = v.statusDetailId
  left join Credit c2 on
      c2.validationId = v.id
  left join Transaction t on
      t.id = c2.transactionId
  left join Seller s2 on
      s2.id = s.sellerId
  left join User u on
      u.id = s2.userId
  left join Account a on
      a.id = u.accountId
  left join CampaignUser cu on
      cu.userId = u.id
      and cu.campaignId = c.id
  left join Sale sDuplicate on s.input = sDuplicate.input and s.id <>sDuplicate.id and sDuplicate.statusId <> 3 
  where
  c.internalName  REGEXP "(ducati)"
  -- s.campaignId in (11101,11102,11103,11104)-- and s.id in (2089007,2086942,2098610,2089020)
  GROUP BY s.id, statusSale.id, v.id, c2.id, cu.id, cs.id 
  HAVING ValidationQuery REGEXP "(-)"`, res)
 
})


app.get('/cardif/sales/:input', (req, res) => {
    let input = req.params.input
    execSQLQuery(`
    select*
    FROM playground.CardifSales cs
    WHERE TRUE
    and cs.input regexp "(${input})"`, res)
 
})

app.get('/cardif/sales/', (req, res) => {
    execSQLQuery(`
    select*
    FROM playground.CardifSales cs`, res)
 
})


app.get("/cardif/ValidationSales/:status",  function(req,res) {
    let FilterStatus = req.params.status
    if(FilterStatus == "ERRO" || FilterStatus == "OK"){        
        FilterStatus = req.params.status
        console.log("entrou")
    }else{
        FilterStatus = "-"
    }
    execSQLQuery(`
    select
    CASE 
      -- De acordo com o GIT, assim que a carga carrega o venda já é validada. WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) < 1 THEN "OK - Venda processando dentro do prazo"
          WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) > 60 THEN "OK - Venda processando a pedido do cliente, até que ela solicite a reprovação das vendas."
      WHEN v.statusDetailId = 8 THEN IF(GROUP_CONCAT(sDuplicate.id)  is null, "ERRO - Nenhuma venda duplicada encontrada","OK - Duplicidade encontrado") -- A duplicidade é encontrada na venda aprovada, ou seja, se existir apenas duas vendas registradas e todas reprovadas não vai encontrar duplicidade
      WHEN cs.saleDate < c.campaignStart and s.statusId = 2 or cs.saleDate > c.campaignEnd and s.statusId = 2 THEN "ERRO - Venda aprovada, mas a venda estava fora do período da campanha"
      WHEN cs.saleDate < c.campaignStart and s.statusId <> 2 or cs.saleDate > c.campaignEnd and s.statusId <> 2 THEN "OK - Venda não foi cadastrada dentro do período da campanha"
      WHEN v.id is null and DATEDIFF(NOW(),s.created)  < vr.validationPeriod THEN "OK - venda processando sem lote, mas dentro do prazo definido"
      WHEN s.campaignId in (11099) and cs.product REGEXP "(Garantia Estendida Original).........." and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda "
      WHEN s.campaignId in (11099) and cs.product NOT REGEXP "(Garantia Estendida Original).........." and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda "
      WHEN s.statusId = 1 and cs.id is null THEN "OK - Venda Processando Corretamente, pois não recebemos na carga ainda"
      WHEN s.campaignId in (11099) and cs.product REGEXP "(Garantia Estendida Original).........." and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11099) and cs.product NOT REGEXP "(Garantia Estendida Original).........." and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.statusId = 1 and cs.id is not null THEN "ERRO - Venda processando de forma errada, pois recebemos a venda na carga "
      ELSE "ERRO - Não Mapeado "
      END	AS ValidationQuery,       
      DATEDIFF(NOW(),s.created)"Tempo criado",	      
      s.id "SaleId",
     vr.validationPeriod, 
      s.statusId "StatusID",
      c.validationPeriod "PeriodoDeValidação",	
      c.companyId,
      statusSale.description "SaleStatus",
      statusValidation.description "ValidationDescription",
      statusDetailValidation.description "ValidationStatusDetail",
      statusDetailValidation.message "ValidationMessage",
      CONCAT(c.id, " ", c.internalName) "Campanha",
      IF(cs.saleDate >= c.campaignStart  and cs.saleDate <= c.campaignEnd, "True",if(cs.id is null, "Não se aplica no momento", "False")) "Dentro do período da campaha?",
      cs.saleDate "SaleDateCardif",
      s.created "SaleDateRegistro",
      c.campaignStart "InicioDaCampanha",
      c.campaignEnd "FimDaCampanha",
      s.input "SaleInput",
      p.name "ProductName",
      v.validationBatchId,
      u.cpf "CPF",
      if(cu.eligible,
      "Elegível",
      "Não") "Usuário Elegível?",
      t.amount "Transaction",
      cs.id "id na PlayCardifsales",
      cs.input "InputEncontrado",
      cs.created "CriaçãoDacarga",
      cs.product "ProdutoCardif",
      GROUP_CONCAT(sDuplicate.id) "sDuplicateID",
      GROUP_CONCAT(sDuplicate.input) "InputDuplicate"
  from
      Sale s
  LEFT JOIN playground.CardifSales cs on
      LPAD(cs.input, 50, '0') = LPAD(s.input, 50, '0')
  left join Status statusSale on
      statusSale.id = s.statusId
  left join Campaign c on
      c.id = s.campaignId
  left join ProductCampaign pc on
      pc.id = s.productCampaignId
  left join Product p on
      p.id = pc.productId
  left join Validation v on
      v.sourceTypeId = 1
      and v.sourceId = s.id
  LEFT JOIN ValidationRule vr on vr.id = 92
  left join Status statusValidation on
      statusValidation.id = v.statusId
  left join StatusDetail statusDetailValidation on
      statusDetailValidation.id = v.statusDetailId
  left join Credit c2 on
      c2.validationId = v.id
  left join Transaction t on
      t.id = c2.transactionId
  left join Seller s2 on
      s2.id = s.sellerId
  left join User u on
      u.id = s2.userId
  left join Account a on
      a.id = u.accountId
  left join CampaignUser cu on
      cu.userId = u.id
      and cu.campaignId = c.id
  left join Sale sDuplicate on s.input = sDuplicate.input and s.id <>sDuplicate.id and sDuplicate.statusId <> 3 
  where
  c.internalName  REGEXP "(ducati)"
  -- s.campaignId in (11101,11102,11103,11104)-- and s.id in (2089007,2086942,2098610,2089020)
  GROUP BY s.id, statusSale.id, v.id, c2.id, cu.id, cs.id 
  HAVING ValidationQuery REGEXP "(${FilterStatus})"
  UNION 
  select
    CASE 
      -- De acordo com o GIT, assim que a carga carrega o venda já é validada. WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) < 1 THEN "OK - Venda processando dentro do prazo "
      WHEN s.statusId = 1 and DATEDIFF(NOW(),s.created) > 60 THEN "OK - Venda processando a pedido do cliente, até que ela solicite a reprovação das vendas."
      WHEN v.statusDetailId = 8 THEN IF(GROUP_CONCAT(sDuplicate.id)  is null,"ERRO - Nenhuma venda duplicada encontrada","OK - Duplicidade encontrado") -- A duplicidade é encontrada na venda aprovada, ou seja, se existir apenas duas vendas registradas e todas reprovadas não vai encontrar duplicidade
      WHEN s.id in (2035956,2035992,2033181,2078825,2078832,2035837,2105282,2105303,2090358,2047018,2075987,2125225,2098133,2098136,2129943,2129947,2124140) THEN "OK - O problema foi identificado e resolvido no passado."
      WHEN cs.saleDate < c.campaignStart and s.statusId = 2 or cs.saleDate > c.campaignEnd and s.statusId = 2 THEN "ERRO - Venda aprovada, mas a venda estava fora do período da campanha "
      WHEN cs.saleDate < c.campaignStart and s.statusId <> 2 or cs.saleDate > c.campaignEnd and s.statusId <> 2 THEN "OK - Venda não foi cadastrada dentro do período da campanha"
      WHEN v.id is null and DATEDIFF(NOW(),s.created)  < vr.validationPeriod THEN "OK - venda processando sem lote, mas dentro do prazo definido"
      WHEN s.campaignId in (11102,11104) and cs.product REGEXP "(SPF)" and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda "
      WHEN s.campaignId in (11102,11104) and cs.product NOT REGEXP "(SPF)" and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda "
      WHEN s.campaignId in (11101,11103) and cs.product REGEXP "(Garantia)" and s.statusId <> 2 THEN "ERRO - Produto Correto, mas a venda não foi aprovada ainda"
      WHEN s.campaignId in (11101,11103) and cs.product NOT REGEXP "(Garantia)" and s.statusId <> 3 THEN "ERRO - Produto incorreto, mas a venda não foi reprovada ainda"
      WHEN s.statusId = 1 and cs.id is null THEN "OK - Venda Processando Corretamente, pois não recebemos na carga ainda"
      WHEN s.campaignId in (11102,11104) and cs.product REGEXP "(SPF)" and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11101,11103) and cs.product REGEXP "(Garantia)" and s.statusId = 2 THEN "OK - Venda Aprovada corretamente"
      WHEN s.campaignId in (11102,11104) and cs.product NOT REGEXP "(SPF)" and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.campaignId in (11101,11103) and cs.product NOT REGEXP "(Garantia)" and s.statusId = 3 THEN "OK - Venda Reprovada corretamente"
      WHEN s.statusId = 1 and cs.id is not null THEN "ERRO - Venda processando de forma errada, pois recebemos a venda na carga"
      ELSE "ERRO - Não Mapeado "
      END	AS ValidationQuery,     
      DATEDIFF(NOW(),s.created)"Tempo criado",	
      s.id "SaleId",
     vr.validationPeriod, 
      s.statusId "StatusID",
      c.validationPeriod "PeriodoDeValidação",	
      c.companyId,
      statusSale.description "SaleStatus",
      statusValidation.description "ValidationDescription",
      statusDetailValidation.description "ValidationStatusDetail",
      statusDetailValidation.message "ValidationMessage",
      CONCAT(c.id, " ", c.internalName) "Campanha",
      IF(cs.saleDate >= c.campaignStart  and cs.saleDate <= c.campaignEnd, "True",if(cs.id is null, "Não se aplica no momento", "False")) "Dentro do período da campaha?",
      cs.saleDate "SaleDateCardif",
      s.created "SaleDateRegistro",
      c.campaignStart "InicioDaCampanha",
      c.campaignEnd "FimDaCampanha",
      s.input "SaleInput",
      p.name "ProductName",
      v.validationBatchId,
      u.cpf "CPF",
      if(cu.eligible,
      "Elegível",
      "Não") "Usuário Elegível?",
      t.amount "Transaction",
      cs.id "id na PlayCardifsales",
      cs.input "InputEncontrado",
      cs.created "CriaçãoDacarga",
      cs.product "ProdutoCardif",
      GROUP_CONCAT(sDuplicate.id) "sDuplicateID",
      GROUP_CONCAT(sDuplicate.input) "InputDuplicate"
  from
      Sale s
  LEFT JOIN playground.CardifSales cs on
      LPAD(cs.input, 50, '0') = LPAD(s.input, 50, '0')
  left join Status statusSale on
      statusSale.id = s.statusId
  left join Campaign c on
      c.id = s.campaignId
  left join ProductCampaign pc on
      pc.id = s.productCampaignId
  left join Product p on
      p.id = pc.productId
  left join Validation v on
      v.sourceTypeId = 1
      and v.sourceId = s.id
  LEFT JOIN ValidationRule vr on vr.id = 92
  left join Status statusValidation on
      statusValidation.id = v.statusId
  left join StatusDetail statusDetailValidation on
      statusDetailValidation.id = v.statusDetailId
  left join Credit c2 on
      c2.validationId = v.id
  left join Transaction t on
      t.id = c2.transactionId
  left join Seller s2 on
      s2.id = s.sellerId
  left join User u on
      u.id = s2.userId
  left join Account a on
      a.id = u.accountId
  left join CampaignUser cu on
      cu.userId = u.id
      and cu.campaignId = c.id
  left join Sale sDuplicate on s.input = sDuplicate.input and s.id <>sDuplicate.id and sDuplicate.statusId <> 3 
  where TRUE 
  and c.internalName  REGEXP "(Volks)"
   -- and s.id in (2029684,2029684,2029685,2029685,2029686,2029686,2029694,2029752,2029752,2029753)
  -- s.campaignId in (11101,11102,11103,11104)-- and s.id in (2089007,2086942,2098610,2089020)
  GROUP BY s.id, statusSale.id, v.id, c2.id, cu.id, cs.id 
  HAVING ValidationQuery REGEXP "(${FilterStatus})"
  `, res)
 
})
// -------------------------------------------------------FIM CARDIF---------------------------------------------------


// -------------------------------------------------------INICIO METLIFE---------------------------------------------------

app.get('/Metlife/validationSales/:status', (req, res) => {
    let FilterStatus = req.params.status
    if(FilterStatus == "ERRO" || FilterStatus == "OK"){        
        FilterStatus = req.params.status
        console.log("entrou")
    }else{
        FilterStatus = "-"
    }


    execSQLQuery(`SELECT vr.realm "APP" , 
    CASE 
        WHEN af.filterId = 15 and IF(af.negative,af.value REGEXP (u.cpf),af.value NOT REGEXP (u.cpf)) THEN "OK - Usuário não está na audiência da campanha"
        WHEN af.filterId = 1 and IF(af.negative,af.value REGEXP (s2.merchantId),af.value NOT REGEXP (s2.merchantId)) THEN "OK - Rede do usuário não está na audiencia da campanha"
        WHEN af.filterId = 4 and IF(af.negative,af.value REGEXP (s2.id),af.value NOT REGEXP (s2.id)) THEN "OK - Loja do usuário não está na audiencia da campanha"
        WHEN pss.id = 2 and ps.knownProductAliasId is not null THEN IF(ps.created >= DATE_ADD(NOW() , INTERVAL 0 DAY), "OK - Venda incluida hoje após processar o lote vai encontrar o alias","ERRO - Alias criado e encontrado, mas o status não foi atualizado")
        WHEN pss.id = 3 and u.invalid = 1 THEN "OK - Usuário indicado está com cadastro inativo"
        WHEN pss.id = 3 THEN IF(u.id is not null and u.created < DATE_ADD(NOW() , INTERVAL -1 DAY),"ERRO - Usuário está cadastrado no sistema", "OK - Usuário não está cadastrado no sistema ou se cadastrou hoje")
        WHEN pss.id = 9 and GROUP_CONCAT(DISTINCT cu.id) is null THEN "OK - Usuário não está na audiência das campanhas destinada a esse produto."
        WHEN pss.id = 9 and GROUP_CONCAT(DISTINCT IF(cu.campaignUserStatusId = 2,cu.campaignUserStatusId,null)) Is NULL THEN "OK - Usuário não deu aceite na campanha" 
        WHEN pss.id = 9 and  GROUP_CONCAT(DISTINCT IF(cu.campaignUserStatusId = 2,IF(afMaster.negative,IF(afMaster.filterId = 4  and afMaster.value NOT REGEXP (uss.storeId),true,false),IF(afMaster.filterId = 4  and afMaster.value  REGEXP (uss.storeId),true,false)),null)) = false THEN "OK - Usuário foi removido da audiência posterior ao aceite"
        WHEN pss.id = 9 THEN IF (GROUP_CONCAT(caMaster.id) is null, "OK - O produto não foi encontado em nenhuma campanha disponível dentro do período da Sale Date", "ERRO - Foi encontrado campanha para esse produto")
        WHEN pss.id = 1 THEN IF(vr.validationPeriod <= DATEDIFF(NOW(), ps.created ), "OK - Venda adicionada recentemente","ERRO - Venda processando fora do prazo definido" )
        WHEN pss.id = 4 and GROUP_CONCAT(DISTINCT cu.id)  is not null and  GROUP_CONCAT(DISTINCT  cu.campaignUserStatusId) = 2 and GROUP_CONCAT(DISTINCT  cu.modified)  >= DATE_ADD(NOW() , INTERVAL -1 DAY) THEN "OK - Usuário aceitou a campanha recetemente, a venda será atualizada"
        WHEN pss.id = 4 and GROUP_CONCAT(DISTINCT cu.id)  is not null THEN IF(GROUP_CONCAT(DISTINCT cu.campaignUserStatusId) <> 2, " OK - Usuário não Aceitou a campanha", "ERRO - O usuário deu aceite na campanha" )
        WHEN pss.id = 4 and GROUP_CONCAT(DISTINCT cu.id)  is null THEN if(u.id = null, "ERRO - Usuário não está cadastrado", "OK - Usuário não acessou ainda dentro do período da campanha ")
        WHEN pss.id = 10 THEN IF(s.id is null, "OK - O usuário não adicionou uma loja", "ERRO - Usuário está com cadastro completo")
        WHEN pss.id = 10 THEN IF(s.id is null, "OK - O usuário não adicionou uma loja", "ERRO - Usuário está com cadastro completo")
        WHEN pss.id = 6 and pb.id  is not null and ic.purchaseDate >= pb.boostStart and ic.purchaseDate <= pb.boostEnd THEN IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity = SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),"OK - Venda Acelerada {86}", CONCAT("ERRO - Venda não acelerada corretamente. O usuário recebeu: ",ROUND(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),2),IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) < 0," a mais", " a menos"))) #Vai indicar se o usuário recebeu mais dinheiro que deveria ou menos
        WHEN pss.id = 6 and pb.id  is not null and ic.purchaseDate >= pb.boostStart and ic.purchaseDate <= pb.boostEnd THEN IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity = SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),"OK - Venda Acelerada {88}", CONCAT("ERRO - Venda não acelerada corretamente. O usuário recebeu: ",ROUND(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),2),IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * sale.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) < 0," a mais", " a menos"))) #Vai indicar se o usuário recebeu mais dinheiro que deveria ou menos
        WHEN pss.id = 6 and SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) = MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * sale.quantity THEN "OK - Venda Paga corretamente"
        WHEN pss.id = 6 and SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) = MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * sale.quantity THEN "OK - Venda Paga corretamente"
        WHEN pss.id = 6 and v.created >= DATE_ADD(NOW() , INTERVAL - vr.paymentPeriod DAY) and SUM(t.amount) is null THEN "OK - Venda validada ainda recetemente"
        WHEN pss.id = 6 and SUM(t.amount) is null and mb.closed = 1 THEN "OK - Orçamento fechado"
        WHEN pss.id = 6 and SUM(t.amount) is null and mb.budget = mb.spend THEN "OK - Orçamento atingiu o limite"
        WHEN pss.id = 6 and SUM(DISTINCT SaldoFornecedor.a) <= 0 THEN "OK - O fornecedor não tem saldo disponível"
        WHEN ps.expirationDate < CURRENT_DATE() THEN "OK - A venda foi expirada e não será alterado pelo sistema." 
        WHEN vba.status NOT REGEXP "(Aprovado)" AND  SUM(t.amount) is null THEN CONCAT("OK - Lote de aprovação ainda não foi Aprovado pelo Cliente, verifique o lote: ", vbalr.validationBatchApproveId, ". Em CAMPANHAS > APROVAÇÃO DE PAGAMENTOS"  ) 
        WHEN vbalr.status NOT REGEXP "(Liberado)" and  SUM(t.amount) is null THEN  CONCAT("OK - Validation Aproved ainda não liberou o lote para aprovação do cliente. Status do Lote é: ", vbalr.status)
        WHEN pss.id = 6 and SUM(t.amount) is null THEN "ERRO - Usuário não recebeu pela venda aprovada"
        WHEN pss.id = 2 and kpa.id is null THEN "OK - Alias não criado para essa venda"
        WHEN pss.id = 5 THEN IF(s2.cnpj = ps.cnpj, "ERRO - Usuário está com o cnpj igual ao da PreSale", "OK - Usuário está cadastrado em um cnpj diferente do que veio na PreSale" )
        WHEN pss.id = 7 and sale.statusId = 2 THEN "ERRO - PreSale Cancelada, mas a Sale está aprovada"
        WHEN pss.id = 7 THEN GROUP_CONCAT("OK - ", ps.sellerKey) 
        WHEN pss.id = 6 THEN IF(SUM(DISTINCT  t.amount) = ps.reward, "OK - Venda paga com sucesso ", "ERRO - usuários não receberam") -- Não Paga vendedor, mas paga gerente	
        WHEN pss.id = 8 THEN "OK - Venda Duplicada"
        ELSE"ERRO - Não mapeado"
    END AS ValidationQuery, 
  vr.description "Fornecido por",
  ps.id "presaleId", 
  ps.saleId "Sale ID",
  vba.status "Status Validation Aproved",
  vbalr.status "Status ValidationAprovedLogReport", 
  pss.id "Presale Status ID",
  pss.description "PreSale Status Descrip", 
  ps.status "presaleStatus",
  ps.expirationDate "ExpirationDate",
  SUM(DISTINCT t.amount) "Soma Entregue",
  SUM(DISTINCT SaldoFornecedor.a) "Saldo disponível Fornecedor",
  SUM(DISTINCT  IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL))  "Valor do Vendedor",
  SUM(DISTINCT  IF (rdd.rewardDistributionTargetId <> 1 ,t.amount,NULL))  "Valor do Superiores",
  ps.reward "presaleReward",
  ps.minReward "presaleMinReward",
  ps.productCode,
  ps.validationRuleId "ValidationRuleId",
  ps.sourceIdentification "SourceIdentification",
  ps.cpf "presaleCPF",
  ps.cnpj "Presale CNPJ",
  ps.productDescription "Presale Produto",
  ps.quantity "presale QTD",
  ps.saleDate "PreSale SaleDate",
  st.description "Status Desc",
  ca.id "Id da campanha",
  ca.internalName "Nome da campanha",
  std.description "Status Detail Desc",
  std.message "Status Detail Message",
  vr.description "Validation Rule Name",
  ps.validationBatchId "validationBatchId",
  v.statusId "statusId do validation",
  v.statusDetailId "Detalhe do status do validation",
  se.sellerKey "Seller Key",
  ps.sellerKey "PS.Seller Key",
  GROUP_CONCAT(DISTINCT cs.key) "CStore Key",
  ps.created "Data de inclusão",
  kpa.id "ID Alias",
  kpa.matchDescription "Descript Alias",
  GROUP_CONCAT(DISTINCT p.name)"Produto Vinculado",
  #PreSaleDuplicate.id "PreSale duplicada",
  u.id "Id do usuário",
  u.cpf "CPF do usuário",
  u.created "Criado em",
  GROUP_CONCAT(DISTINCT kpp.productId) "Produto ID",
  GROUP_CONCAT(DISTINCT caMaster.id ) "Campanha Master vinculada a data e o produto",
  GROUP_CONCAT(DISTINCT "{",caMaster.campaignStart,"}") "Start_Campaing",
  GROUP_CONCAT(DISTINCT cu.id) "CampaingUserIDMaster" ,
  GROUP_CONCAT(DISTINCT cu.campaignUserStatusId) "StatusCampaingUser",
  GROUP_CONCAT(DISTINCT IF(cu.campaignUserStatusId = 2,IF(afMaster.negative,IF(afMaster.filterId = 4  and afMaster.value NOT REGEXP (uss.storeId),true,false),IF(afMaster.filterId = 4  and afMaster.value  REGEXP (uss.storeId),true,false)),"Não se aplica")) "Dentro da Audiência" -- Por enquanto só verifico audiencia por loja, negativa ou positiva
FROM  PreSale                              ps
  LEFT JOIN PreSaleStatus                  pss on pss.id = ps.preSaleStatusId
  LEFT JOIN Sale                           sale on ps.saleId = sale.Id
  LEFT JOIN Seller                         se on se.id = sale.sellerId #Seller da venda
  LEFT JOIN Status                         st on st.id = sale.statusId
  LEFT JOIN Campaign                       ca on ca.id = sale.campaignId
  LEFT JOIN Validation                     v on v.sourceTypeId = 1  and v.sourceId = sale.id
  LEFT JOIN prod_icv_db.StatusDetail       std on std.id = v.statusDetailId
  LEFT JOIN ValidationRule                 vr on vr.id = ps.validationRuleId
  LEFT JOIN CustomStore                    cs on cs.cnpj = ps.cnpj
  LEFT JOIN Company                        c3 ON ca.companyId = c3.id 
  LEFT JOIN KnownProductAlias              kpa ON kpa.id = ps.knownProductAliasId 
  LEFT JOIN KnownProduct                   kp ON kp.id = kpa.knownProductId 
  LEFT JOIN KnownProductProduct            kpp ON kpp.knownProductId = kp.id 
  LEFT JOIN User                         u ON u.cpf = ps.cpf and u.realm = vr.realm 
  LEFT JOIN Seller                         uss on uss.userId = u.id #Seller do Usuários
  LEFT JOIN Store s2                       ON s2.id = uss.storeId  #Loja do usuário
  LEFT JOIN Store                          s ON s.userId = u.id 
  LEFT JOIN Product                        p ON p.id = kpp.productId 
  LEFT JOIN ProductCampaign                pc ON p.companyId IN (10373) AND p.id = pc.productId 
  LEFT JOIN Campaign                       caMaster ON ps.saleDate >= caMaster.campaignStart and ps.saleDate <= caMaster.campaignEnd  and caMaster.id = pc.campaignId
  LEFT JOIN CampaignUser                   cu ON cu.userId = u.id and caMaster.id = cu.campaignId 
  LEFT JOIN Audience                       aMaster on aMaster.id = caMaster.audienceId
  LEFT JOIN AudienceFilter                 afMaster on afMaster.audienceId = aMaster.id 
  LEFT JOIN ProductBoost                   pb ON pb.id  = sale.productBoostId 
  LEFT JOIN Invoice                        i  ON sale.id = i.saleId 
  LEFT JOIN InvoiceCheck                   ic ON i.id = ic.invoiceId 
  LEFT JOIN Credit                         c2 ON c2.validationId = v.id 
  LEFT JOIN Transaction                  t ON c2.transactionId = t.id 
  LEFT JOIN RewardDistributionDetail       rdd ON c2.rewardDistributionDetailId = rdd.id
  LEFT JOIN MonthlyBudget                  mb on v.monthlyBudgetId = mb.id 
  LEFT JOIN Audience                       a on a.id = ca.audienceId 
  LEFT JOIN AudienceFilter                 af on af.audienceId = a.id 
  LEFT JOIN ValidationBatchApproveLogReport vbalr on vbalr.preSaleId = ps.id 
  LEFT JOIN ValidationBatchApproveItem      vbai on vbai.preSaleId = ps.id 
  LEFT JOIN ValidationBatchApprove          vba on vba.id = vbai.validationBatchApproveId 
  LEFT JOIN (
          SELECT 
              SUM(IF(t.transactionTypeId = 5 ,t.amount,NULL))-SUM(IF(t.transactionTypeId = 4 ,t.amount,NULL)) a, t.accountId b
            FROM Transaction t 
            WHERE t.accountId = 119761
        ) SaldoFornecedor ON SaldoFornecedor.b = 119761
      WHERE true		  	
      and ps.validationRuleId IN (84) and ps.expirationDate >= NOW() 
GROUP by pss.id, sale.id, se.id, st.id, ca.id, v.id, std.id, vr.id, c3.id , u.id, ps.id, s.id, pb.id,ic.id, mb.id, af.id, a.id, vba.status, vbalr.status 
HAVING ValidationQuery REGEXP "(${FilterStatus})"	`, res)
 
})

// -------------------------------------------------------FIM METLIFE ---------------------------------------------------

// -------------------------------------------------------INICIO VALIDAÇÕES DE LOTES ---------------------------------------------------
// Validação De Saldo e Lotes
app.get("/ValidationBudget/Company/:Companyid", function(req,res){
    let CompanyID = req.params.Companyid
    execSQLQuery(`SELECT DISTINCT vb.id, vb.monthlyBudgetId, vb.description ,mb.closed, mb.budget, mb.spend, mb.year, mb.month,  SUM(rdd.reward) "SomaValorPorLote", IF((SUM(rdd.reward) + mb.spend) < mb.budget and mb.closed = false, "Disponível","Indisponível") "OrçamentoDisponivel", IF(SUM(DISTINCT a.currentBalance) >  SUM(rdd.reward), "Disponível","Indisponível") "SaldoDisponivel", a.currentBalance, a.name
FROM ValidationBatch vb 
INNER JOIN Company c2 ON c2.id = vb.companyId 
INNER JOIN Account a ON a.id = c2.accountId 
Inner JOIN Validation v on v.validationBatchId = vb.id 
Inner JOIN Sale s on s.id = v.sourceId
LEFT JOIN Campaign c on c.id = s.campaignId 
LEFT JOIN ProductCampaign pc on pc.campaignId = c.id 
LEFT JOIN ProductCampaignRewardDistribution pcrd on pcrd.productCampaignId = pc.id 
LEFT JOIN RewardDistributionDetail rdd on rdd.rewardDistributionId = pcrd.rewardDistributionId 
LEFT JOIN MonthlyBudget mb on mb.id = vb.monthlyBudgetId 
INNER JOIN StatusDetail sd2 on sd2.id = v.statusDetailId 
LEFT JOIN PreSale ps on ps.saleId = s.id 
LEFT JOIN ValidationBatchApproveLogReport vbalr on vbalr.preSaleId = ps.id 
LEFT JOIN ValidationBatchApproveItem vbai on vbai.preSaleId = ps.id 
LEFT JOIN ValidationBatchApprove vba on vba.id = vbai.validationBatchApproveId 
WHERE s.statusId = 1  
and sd2.statusId = 2
and IF(c2.id <> 10373, TRUE, vba.status REGEXP"(Aprovado)")
and IF(c2.id <> 10373, TRUE,vbalr.status REGEXP "(Liberado)")
and rdd.id is not null
and c2.id = ${CompanyID}
GROUP BY vb.id `,res)
})


app.get("/ValidationBudget/:id", function(req,res){
    let ValidationBatchID = req.params.id
    execSQLQuery(`SELECT DISTINCT vb.id, vb.monthlyBudgetId, vb.description ,mb.closed, mb.budget, mb.spend, mb.year, mb.month,  SUM(rdd.reward) "SomaValorPorLote", IF((SUM(rdd.reward) + mb.spend) < mb.budget and mb.closed = false, "Disponível","Indisponível") "OrçamentoDisponivel", IF(SUM(DISTINCT a.currentBalance) >  SUM(rdd.reward), "Disponível","Indisponível") "SaldoDisponivel", a.currentBalance, a.name
FROM ValidationBatch vb 
INNER JOIN Company c2 ON c2.id = vb.companyId 
INNER JOIN Account a ON a.id = c2.accountId 
Inner JOIN Validation v on v.validationBatchId = vb.id 
Inner JOIN Sale s on s.id = v.sourceId
LEFT JOIN Campaign c on c.id = s.campaignId 
LEFT JOIN ProductCampaign pc on pc.campaignId = c.id 
LEFT JOIN ProductCampaignRewardDistribution pcrd on pcrd.productCampaignId = pc.id 
LEFT JOIN RewardDistributionDetail rdd on rdd.rewardDistributionId = pcrd.rewardDistributionId 
LEFT JOIN MonthlyBudget mb on mb.id = vb.monthlyBudgetId 
INNER JOIN StatusDetail sd2 on sd2.id = v.statusDetailId 
LEFT JOIN PreSale ps on ps.saleId = s.id 
LEFT JOIN ValidationBatchApproveLogReport vbalr on vbalr.preSaleId = ps.id 
LEFT JOIN ValidationBatchApproveItem vbai on vbai.preSaleId = ps.id 
LEFT JOIN ValidationBatchApprove vba on vba.id = vbai.validationBatchApproveId 
WHERE s.statusId = 1  
and sd2.statusId = 2
and IF(c2.id <> 10373, TRUE, vba.status REGEXP"(Aprovado)")
and IF(c2.id <> 10373, TRUE,vbalr.status REGEXP "(Liberado)")
and rdd.id is not null
and vb.id = ${ValidationBatchID}
GROUP BY vb.id `,res)
})

// GetCompany
app.get("/Company", function(req,res){
    let IDFilter = req.params.id
    execSQLQuery(
        `SELECT*
        FROM Company c 
        WHERE c.enabled = true
        AND c.accountId is not null`
    ,res)
   
})

// -------------------------------------------------------FIM VALIDAÇÕES DE LOTES ---------------------------------------------------

// -------------------------------------------------------INICIO  VALIDAÇÃO DE NOTA FISCAL ---------------------------------------------------
app.get("/Sales/NFE/:company/:status", function(req,res){
    let CompanyID = req.params.company
    let FilterStatus = req.params.status


    if(FilterStatus == "ERRO" || FilterStatus == "OK"){        
        FilterStatus = req.params.status
        
    }else{
        FilterStatus = "-"
    }
    execSQLQuery(
        `-- ESSA É A QUERY ORIGINAL, DEVE SER GUARDADA COMO BACKUP
    

        SELECT
               c3.name "APP",
                CASE 
                        WHEN v.id is null and c.validationPeriod > DATEDIFF(NOW(), MIN(IF(s.statusId = 1, s.saleDate, null))) THEN "OK - Vendas Sem Lote "		
                        WHEN v.id is null and c.validationPeriod < DATEDIFF(NOW(), MIN(IF(s.statusId = 1, s.saleDate, null))) THEN "ERRO - Vendas Sem Lote fora do prazo "	
                        WHEN s.statusId = 1 and v.statusDetailId not in (1,20,42,43,44,45,46,47,61) THEN IF(v.created < DATE_ADD(NOW() , INTERVAL -1 DAY),"ERRO - Venda Processando com detalhe validado ", "OK - Venda processada hoje, o pagamento será finalizado até amanhã")
                        WHEN v.statusDetailId = 1  and s.statusId = 1 and c.validationPeriod < DATEDIFF(NOW(), MIN(IF(s.statusId = 1, s.saleDate, null))) THEN IF(api.status = "FINALIZADA","ERRO - Venda com status Inicial fora do prazo ", "OK - Venda Processando com status inicial por problema na consulta ") #Status Inicial 
                        WHEN s.statusId = 1 and c.validationPeriod >= DATEDIFF(NOW(), MIN(IF(s.statusId = 1, s.saleDate, null))) THEN "OK - Processando dentro do prazo " 
                        WHEN v.statusDetailId = 20 THEN IF(s.statusId=1,"ERRO - Precisa Ser Validado Manualmente ", "OK - Venda Já validada Manualmente ")
                        WHEN v.statusDetailId = 46  THEN IF (DATEDIFF(NOW(), MIN(IF(s.statusId = 1, s.saleDate, null))) > 15,"ERRO - Nota sendo consultada há muito tempo ","OK - A nota está no prazo de consulta ")
                        WHEN v.statusDetailId = 47  THEN "ERRO - Precisa ser criado alias "
                        WHEN v.statusDetailId = 61 and sRef.statusId in (2,3) THEN "ERRO - Nota Original já validada, mas a DANFE continua processando "
                        WHEN v.statusDetailId = 61 and c.campaignEnd < CURRENT_DATE() and sRef.id is null  THEN "ERRO - Nota original não cadastrada no período da campanha e a DANFE continua processando "
                        WHEN v.statusDetailId = 61 and sRef.id is null THEN "OK - Aguardando a nota original ser cadastrada "
                        WHEN v.statusDetailId = 61 and sRef.statusId = 1 THEN "OK - Aguardando a nota original ser aprovada "
                        WHEN mb.closed=1 THEN "ERRO - Orçamento fechado "
                            ELSE "ERRO - Não mapeado"
                END as ValidationQuery,
                s.id "SaleID", 
                v.id "ValidationID", 
                s.statusid "SaleStatusID", 
                sd.id "StatusDetailID", 
                SUM(DISTINCT  IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL))"Valor_recebido_Vendedor",
                SUM(DISTINCT IF (rdd.rewardDistributionTargetId > 1 ,t.amount,NULL))  "Valor_dos_Gerentes",
                MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null))  "Valor_definido_na_campanha_Vendedor",
                MAX(IF(rdd.rewardDistributionTargetId > 1, rdd.reward,null)) "Valor_definido_na_campanha_Gerente",
                v.created "ValidationCreated", 
                c.validationPeriod,
                s.saleDate, 
                api.status "ApiStatus",
                sRef.statusId "SaleReferenciaStatusID",
                sRef.Id "IdSaleReferenciada",
                sRef.input "InputSaleReferenciada",
                v.validationBatchId,
                sd.message,
                s.input "SaleInput", 
                s.quantity,
                s.validateAfter,
                c.id "CampaingID",
                c.internalName,
                c.campaignStart,
                c.campaignEnd,
                c.hasEligibility,
                c.campaignTypeId,
                MAX(c2.id) "CreditID",
                pb.id "ProductBoostID",
                ic.purchaseDate,
                pb.boostStart,
                pb.boostEnd,
                pb.rate,
                s3.blockPaymentValidation,
                s3.blockValidation,
                c3.id "CompanyID",
                v.evidenceTypeId, 
                v.evidenceId,
                ic.status "InvoiceCheckStatus",
                s2.cnpj,
                c.hasBudget,
                bli.budget,
                bli.current,
                sReferenciador.id "SaleReferenciadorID",
                sReferenciador.statusId "SaleReferenciadorStatusID"          
                    FROM Sale s -- VENDAS PROCESSANDO
                    LEFT JOIN Campaign c ON s.campaignId = c.id 
                    LEFT JOIN Validation v ON s.id = v.saleId 
                    LEFT JOIN ValidationBatch vb on vb.id=v.validationBatchId 
                    LEFT JOIN MonthlyBudget mb on mb.id =vb.monthlyBudgetId 
                    LEFT JOIN StatusDetail sd ON v.statusDetailId  = sd.id 
                    LEFT JOIN Store s2 ON s.storeId = s2.id 
                    LEFT JOIN Invoice i ON i.saleId = s.id 
                    LEFT JOIN InvoiceCheck ic ON ic.invoiceId = i.id 
                    LEFT JOIN nfe_api.Consulta api ON api.id = ic.requestKey
                    LEFT JOIN Sale sRef ON sRef.input = ic.reference 
                    LEFT JOIN CampaignUser cu ON s.campaignUserId = cu.id
                    LEFT JOIN CampaignUserBudgetLimitGroup cublg on cublg.campaignUserId = cu.id 
                    LEFT JOIN BudgetLimitItem bli on bli.id = cublg.budgetLimitItemId    
                    LEFT JOIN Company c3 ON c3.id = c.companyId 
                    LEFT JOIN ValidationBatchProcessing vbp ON vbp.validationBatchId = v.validationBatchId 
                    LEFT JOIN ValidationBatchPayment vbp2 ON vbp2.validationBatchId = v.validationBatchId 
                    LEFT JOIN Credit c2 ON c2.validationId = v.id 
                    LEFT JOIN Transaction t ON c2.transactionId = t.id 
                    LEFT JOIN ProductCampaign pc ON pc.campaignId = c.id 
                    LEFT JOIN ProductBoost pb ON pb.id  = s.productBoostId 
                    LEFT JOIN RewardDistributionDetail rdd ON c2.rewardDistributionDetailId = rdd.id 
                    LEFT JOIN Seller s3 ON s3.id = s.sellerId 
                    LEFT JOIN InvoiceCheck ic2 ON ic2.reference = s.input 
                    LEFT JOIN Invoice i2 ON ic2.invoiceId = i2.id 
                    LEFT JOIN Sale sReferenciador ON sReferenciador.id = i2.saleId 
                    WHERE s.statusId = 1 
                    and  c.companyId  in (${CompanyID}) -- <<<<<<<---------------------------------------------MUDAR De acordo com o fornecedor  
                    and c.campaignTypeId in (1,6) -- <<<---- 1 Vendeu ganhou e 6 é Meta
                    and IF(v.id is null,v.evidenceTypeId IS null,v.evidenceTypeId in (2)) -- <<<<<------------ registro por nota fiscal
                        -- and c.campaignEnd >  DATE_ADD(NOW() , INTERVAL -10 DAY) #Campanhas encerradas antes de 10 dias ou em andamento
                    and  YEAR ( s.created) = YEAR (CURRENT_DATE())  -- ------------------- Somente vendas deste ano
                    and c.campaignInputId = 3 -- ---- Pegar apenas Registro de notas
                    -- Filters
                    GROUP BY  s.id , v.id,c.id , sd.id, api.id, sRef.id, ic.id, c3.id, bli.id, ic2.id
                    HAVING ValidationQuery REGEXP "(${FilterStatus})"
        UNION   
            SELECT
               c3.name "APP",
                   CASE 
                WHEN c.campaignTypeId = 6 and s.statusId = 2 and v.statusDetailId = 16 or c.hasEligibility = 1 and s.statusId = 2 and v.statusDetailId = 16 THEN "OK - Venda tipo meta aprovada Verificar se foi pago na Query de meta "
                WHEN  c.campaignTypeId = 1 and c.hasEligibility = 0 and MAX(c2.id) is null and v.created <= DATE_ADD(NOW() , INTERVAL 1 DAY) and c.id in (11544) THEN "OK - Campanha de treinamento" #Treinamento
                WHEN v.statusDetailId not in (16,17,49) THEN "ERRO - Venda aprovada com status Inválidos " 
                WHEN c.campaignTypeId = 1 and c.hasEligibility = 0 and SUM(DISTINCT t.amount) <=0 THEN "ERRO - Não pagou "
                WHEN pb.id  is not null and ic.purchaseDate >= pb.boostStart and ic.purchaseDate <= pb.boostEnd THEN IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity = SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),"OK - Venda Acelerada ", CONCAT("ERRO - Venda não acelerada corretamente, o usuário recebeu: ",ROUND(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),2),IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) < 0," a mais", " a menos"), "")) #Vai indicar se o usuário recebeu mais dinheiro que deveria ou menos
                WHEN c.campaignTypeId = 1 and c.hasEligibility = 0 and SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) = MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * s.quantity THEN "OK - Venda Paga corretamente "
                WHEN c.campaignTypeId = 1 and c.hasEligibility = 0 and MAX(c2.id) is null and v.created <= DATE_ADD(NOW() , INTERVAL 1 DAY) THEN IF(s3.blockPaymentValidation <>1, "ERRO - Venda Sem Crédito ", "OK - Usuário não recebeu saldo, por estar bloqueado ")
                WHEN SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) <> MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * s.quantity THEN "ERRO - Venda Paga incorretamente "
                WHEN c.campaignTypeId = 6 and s.statusId = 2 and v.statusDetailId = 49 THEN IF (SUM(DISTINCT  IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL))>= 300, "OK - Venda valor muito alto aguardando aprovação do cliente", "ERRO - A venda não tem valor muito alto" )
                       ELSE"ERRO - Não mapeado"
            END AS ValidationQuery,
                s.id "SaleID", 
                v.id "ValidationID", 
                s.statusid "SaleStatusID", 
                sd.id "StatusDetailID", 
                SUM(DISTINCT  IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL))"Valor_recebido_Vendedor",
                SUM(DISTINCT IF (rdd.rewardDistributionTargetId > 1 ,t.amount,NULL))  "Valor_dos_Gerentes",
                MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null))  "Valor_definido_na_campanha_Vendedor",
                MAX(IF(rdd.rewardDistributionTargetId > 1, rdd.reward,null)) "Valor_definido_na_campanha_Gerente",
                v.created "ValidationCreated", 
                c.validationPeriod,
                s.saleDate, 
                api.status "ApiStatus",
                sRef.statusId "SaleReferenciaStatusID",
                sRef.Id "IdSaleReferenciada",
                sRef.input "InputSaleReferenciada",
                v.validationBatchId,
                sd.message,
                s.input "SaleInput", 
                s.quantity,
                s.validateAfter,
                c.id "CampaingID",
                c.internalName,
                c.campaignStart,
                c.campaignEnd,
                c.hasEligibility,
                c.campaignTypeId,
                MAX(c2.id) "CreditID",
                pb.id "ProductBoostID",
                ic.purchaseDate,
                pb.boostStart,
                pb.boostEnd,
                pb.rate,
                s3.blockPaymentValidation,
                s3.blockValidation,
                c3.id "CompanyID",
                v.evidenceTypeId, 
                v.evidenceId,
                ic.status "InvoiceCheckStatus",
                s2.cnpj,
                c.hasBudget,
                bli.budget,
                bli.current,
                sReferenciador.id "SaleReferenciadorID",
                sReferenciador.statusId "SaleReferenciadorStatusID" 
                FROM Sale s -- VENDAS APROVADAS
                LEFT JOIN Campaign c ON s.campaignId = c.id 
                LEFT JOIN Validation v ON s.id = v.saleId 
                LEFT JOIN StatusDetail sd ON v.statusDetailId  = sd.id 
                LEFT JOIN Invoice i  ON s.id = i.saleId 
                LEFT JOIN InvoiceCheck ic ON i.id = ic.invoiceId 
                LEFT JOIN nfe_api.Consulta api ON api.id = ic.requestKey
                LEFT JOIN Store s2 ON s.storeId = s2.id 
                LEFT JOIN Sale sRef ON sRef.input = ic.reference 
                LEFT JOIN Credit c2 ON c2.validationId = v.id 
                LEFT JOIN Transaction t ON c2.transactionId = t.id 
                LEFT JOIN ProductCampaign pc ON pc.campaignId = c.id 
                LEFT JOIN ProductBoost pb ON pb.id  = s.productBoostId 
                LEFT JOIN RewardDistributionDetail rdd ON c2.rewardDistributionDetailId = rdd.id 
                LEFT JOIN Seller s3 ON s3.id = s.sellerId 
                LEFT JOIN CampaignUser cu ON s.campaignUserId = cu.id 
                LEFT JOIN CampaignUserBudgetLimitGroup cublg on cublg.campaignUserId = cu.id 
                LEFT JOIN BudgetLimitItem bli on bli.id = cublg.budgetLimitItemId 
                LEFT JOIN Company c3 ON c3.id = c.companyId
                LEFT JOIN InvoiceCheck ic2 ON ic2.reference = s.input 
                LEFT JOIN Invoice i2 ON ic2.invoiceId = i2.id 
                LEFT JOIN Sale sReferenciador ON sReferenciador.id = i2.saleId  
                WHERE s.statusId = 2 and c.id  not in (11032, 11031,1130) -- #Esses ids é de uma campanha de treinamento
                and c.campaignInputId in (3,7)
                and v.evidenceTypeId  IN (2)
                and c.campaignTypeId in (1,6)
                and  c.companyId  in (${CompanyID}) -- -------------------------------------------MUDAR De acordo com o fornecedor  
                and  YEAR ( s.created) = YEAR (CURRENT_DATE())  -- ------------------- Somente vendas deste ano
                    -- Filters
                GROUP BY  s.id , v.id,c.id , sd.id, ic.id, pb.id, c3.id, sRef.id, bli.id, ic2.id 
                HAVING ValidationQuery REGEXP "(${FilterStatus})"
         UNION 
            SELECT 
                c3.name "APP",   
                CASE 
                    WHEN s.created > "2022-10-27 14:16:15" and SUBSTRING(s.input, 7, 14) REGEXP "(2402643000221|22962737000128|77941490019506|77941490015349|77941490020776|77941490000105|77941490003680|77941490012676|77941490012757|77941490022558|77941490025301|77941490027002|77941490029480|77941490026626|33041260094207|00070112000623|00070112000895|00070112000704|00070112000461|02402643000221)" and  v.statusDetailId = 30 and  c.companyId  = 3 OR s.created > "2022-10-27 14:16:15" and  SUBSTRING(s.input, 7, 8) REGEXP "(68993641|77941490|33041260|01441519)" and  v.statusDetailId = 30 and  c.companyId  = 3 THEN "ERRO - O CNPJ está na WHITELIST, ou seja não deveria reprovar por CNPJ a pedido do anunciante. Caso de dúvidas checar o código fonte de validação " #ISSO SÓ FUNCIONA PARA POSITIVO E O CÓDIGO ESTÁ NO GITHUB  OPR relacionado OPR-3794
                    WHEN v.evidenceTypeId = 1 THEN GROUP_CONCAT("OK - Venda aprovada manualmente  por: ", v.evidenceId)
                    WHEN v.statusDetailId = 6 and s.statusId = 3 THEN "OK - Venda Reprovada por Ausente " #Tem que validar se a venda não deveria ir para manual// Tivemos a confirmação no OPR-3563 que as vendas devem ficar reprovadas
                    WHEN v.statusDetailId = 9 and s.statusId = 3 and ic.purchaseDate > c.campaignStart and ic.purchaseDate < c.campaignEnd THEN CONCAT("ERRO - Venda Dentro do período, data da emissão: ",ic.purchaseDate, "") 
                    WHEN v.statusDetailId = 9 and s.statusId = 3 and ic.purchaseDate < c.campaignStart or  v.statusDetailId = 9 and s.statusId = 3 and ic.purchaseDate > c.campaignEnd THEN "OK - Venda Reprovada corretamente por período "
                    WHEN v.statusDetailId = 18 or v.statusDetailId = 30 THEN if(s2.cnpj = SUBSTRING(s.input, 7, 14), CONCAT("ERRO - Venda Reprovada, mas o CNPJ é igual",s2.cnpj," / ",SUBSTRING(s.input, 7, 14)," "),"OK - Venda Reprovada corretamente, pois o CNPJ é diferente ") #A venda é reprovada por região, quando a região da nota é diferente da região da loja, mas se o PDV é igual então tudo se anula
                    WHEN v.statusDetailId = 59 and ic.reference is NOT NULL THEN IF (ic.reference = sRef.input or s.input = ic.reference, CONCAT("OK - Nota de fato referenciada por:  "/*,sRef.input*/),"ERRO - Nota Referenciada Reprovada erroneamente ")
                    WHEN v.statusDetailId = 59 and ic.reference is NULL THEN IF(sReferenciador.id is not NULL and sReferenciador.statusId =2 ,CONCAT("OK - Nota de fato referenciada por: "/*,sReferenciador.id*/),"ERRO - Nota referenciadora não aprovada ou não existe ")
                    WHEN v.statusDetailId = 61  THEN IF(sRef.statusId = 2,"ERRO - Nota Original já aprovada, mas a DANFE continua Aguardando ","ERRO - Danfe reprovada sem a nota original estar aprovada ")
                    WHEN c.campaignTypeId = 1 and t.amount > 0 THEN CONCAT("ERRO - Venda reprovada que pagou o valor de: ",SUM(t.amount))
                    WHEN v.evidenceTypeId = 1 THEN CONCAT("OK - Venda reprovada manualmente por: ", v.evidenceId )	
                    WHEN v.statusDetailId = 47 THEN "ERRO - Venda reprovada por alias incorretamente "		
                    WHEN v.statusDetailId = 16 THEN "ERRO - venda aprovada com status de pagamento reprovado "
                    WHEN v.statusDetailId = 24  THEN if(s3.blockValidation = 1, "OK - Usuário com validação bloqueado ", "ERRO - usuário não está bloqueado ")
                    WHEN v.statusDetailId = 12 and c.hasBudget = 1 and bli.current >= bli.budget THEN GROUP_CONCAT("OK - A campanha chegou em seu limite de orçamento no valor :",bli.budget, " ") 
                    WHEN v.statusDetailId = 12 and c.hasBudget = 1 and bli.isSoldOut THEN GROUP_CONCAT("OK - A campanha chegou em seu limite de orçamento no valor :",bli.budget, " ") 
                    WHEN v.statusDetailId = 12 and c.hasBudget = 1 and bli.current < bli.budget THEN GROUP_CONCAT("ERRO - A campanha não chegou em seu limite de orçamento no valor :",bli.budget, " ")
                    WHEN v.statusDetailId = 12 and c.hasBudget = 0 THEN "ERRO - A campanha não tem limite de orçamento "
                    WHEN v.statusDetailId = 22 and ic.status = "INCOMPATIBLE" THEN "ERRO - Possivelmente o ic.rawresult está com erro, consulte "#Essa validação verifica o json do consumidor com o estabelcimento e ve se são iguais
                    WHEN v.statusDetailId = 46 and s.statusid = 3 THEN "ERRO - Venda Aguardando nova consulta, mas com status de pagamento reprovado. "
                     ELSE "ERRO - Não mapeado"
            END AS ValidationQuery,
                s.id "SaleID", 
                v.id "ValidationID", 
                s.statusid "SaleStatusID", 
                sd.id "StatusDetailID", 
                SUM(DISTINCT  IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL))"Valor_recebido_Vendedor",
                SUM(DISTINCT IF (rdd.rewardDistributionTargetId > 1 ,t.amount,NULL))  "Valor_dos_Gerentes",
                MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null))  "Valor_definido_na_campanha_Vendedor",
                MAX(IF(rdd.rewardDistributionTargetId > 1, rdd.reward,null)) "Valor_definido_na_campanha_Gerente",
                v.created "ValidationCreated", 
                c.validationPeriod,
                s.saleDate, 
                api.status "ApiStatus",
                sRef.statusId "SaleReferenciaStatusID",
                sRef.Id "IdSaleReferenciada",
                sRef.input "InputSaleReferenciada",
                v.validationBatchId,
                sd.message,
                s.input "SaleInput", 
                s.quantity,
                s.validateAfter,
                c.id "CampaingID",
                c.internalName,
                c.campaignStart,
                c.campaignEnd,
                c.hasEligibility,
                c.campaignTypeId,
                MAX(c2.id) "CreditID",
                pb.id "ProductBoostID",
                ic.purchaseDate,
                pb.boostStart,
                pb.boostEnd,
                pb.rate,
                s3.blockPaymentValidation,
                s3.blockValidation,
                c3.id "CompanyID",
                v.evidenceTypeId, 
                v.evidenceId,
                ic.status "InvoiceCheckStatus",
                s2.cnpj,
                c.hasBudget,
                bli.budget,
                bli.current ,
                sReferenciador.id "SaleReferenciadorID",
                sReferenciador.statusId "SaleReferenciadorStatusID"
            FROM Sale s -- VENDAS REPROVADAS
            LEFT JOIN Campaign c ON s.campaignId = c.id 
            LEFT JOIN Validation v ON s.id = v.saleId 
            LEFT JOIN StatusDetail sd ON v.statusDetailId  = sd.id 
            LEFT JOIN Invoice i  ON s.id = i.saleId 
            LEFT JOIN InvoiceCheck ic ON i.id = ic.invoiceId 
            LEFT JOIN nfe_api.Consulta api ON api.id = ic.requestKey
            LEFT JOIN Store s2 ON s.storeId = s2.id 
            LEFT JOIN Seller s3 ON s3.userId = v.userId
            LEFT JOIN Sale sRef ON sRef.input = ic.reference 
            LEFT JOIN Credit c2 ON c2.validationId = v.id 
            LEFT JOIN Transaction t ON c2.transactionId = t.id 
            LEFT JOIN ProductCampaign pc ON pc.campaignId = c.id 
            LEFT JOIN ProductBoost pb ON pb.id  = s.productBoostId 
            LEFT JOIN RewardDistributionDetail rdd ON c2.rewardDistributionDetailId = rdd.id 
            LEFT JOIN InvoiceCheck ic2 ON ic2.reference = s.input 
            LEFT JOIN Invoice i2 ON ic2.invoiceId = i2.id 
            LEFT JOIN Sale sReferenciador ON sReferenciador.id = i2.saleId  
            LEFT JOIN CampaignUser cu ON s.campaignUserId = cu.id 
            LEFT JOIN CampaignUserBudgetLimitGroup cublg on cublg.campaignUserId = cu.id 
            left join CampaignBudgetLimitGroup cblg on cblg.campaignId =c.id
            LEFT JOIN BudgetLimitGroup blg on cblg.budgetLimitGroupId =blg.id 
            LEFT JOIN BudgetLimitItem bli on IF(cublg.id is null,bli.budgetLimitGroupId = blg.id,bli.id = cublg.budgetLimitItemId) 
            LEFT JOIN Company c3 ON c3.id = c.companyId 
            LEFT JOIN ValidationBatchProcessing vbp ON vbp.validationBatchId = v.validationBatchId 
            WHERE s.statusId = 3
            and v.statusDetailId not in (4,31,32,20)
            and c.campaignTypeId in (1,6) -- #1 é vendeu ganhou e 6 é meta
            and  c.companyId  in (${CompanyID})  
            and  YEAR ( s.created) = YEAR (CURRENT_DATE())  -- --------------- Somente vendas deste ano
            GROUP BY  s.id , v.id,c.id , sd.id, ic.id,t.id, i2.id, sRef.id, api.id, bli.id, ic2.id
           HAVING ValidationQuery REGEXP "(${FilterStatus})"
        `
    ,res)
   
})
// ------------------------------------------------------- FIM  VALIDAÇÃO DE NOTA FISCAL ---------------------------------------------------
// ------------------------------------------------------- INICIO  VALIDAÇÃO DE NOTA META ---------------------------------------------------
app.get("/Sales/META/NFE/:company", function(req,res){
    let Company = req.params.company
    execSQLQuery(
        `SELECT
		c3.name "APP",
		CASE
		    WHEN MAX(c2.hasBudget) = 1 and MAX(bli.current) >= MAX(bli.budget) and MAX(IFNULL(bli.isSoldOut,0)) = 1 THEN CONCAT("OK - Limite de orçamento atingido, orçamento: ",MAX(bli.budget))
			WHEN SUM(s.quantity) < pt.target and MAX(Pmetas.d) = 0 THEN "OK - Usuário não alcançou a meta"
			WHEN a.currentBalance <= 0 THEN "OK - Fornecedor está sem saldo"
			WHEN SUM(s.quantity) < pt.target and MAX(Pmetas.d) <> 0 THEN "ERRO - Usuário não atingiu a meta, mas recebeu pontos na campanha"
			WHEN SUM(s.quantity) >= pt.target and MAX(Pmetas.d) = 0 THEN "ERRO - Usuário atingiu a meta, mas não recebeu pontos na campanha"
			WHEN FLOOR(SUM(s.quantity)/ pt.target) = MAX(Pmetas.d)/ tt.reward THEN "OK - O usuário recebeu corretamente pelas metas desta campanha"
			WHEN DATE_ADD(MAX(s.created),INTERVAL 7 DAY) <= NOW() THEN "OK - Validações ainda no prazo de pagamento"
			WHEN FLOOR(SUM(s.quantity)/ pt.target) <> MAX(Pmetas.d)/ tt.reward THEN CONCAT("ERRO - Usuário recebeu um valor diferente do que deveria, atingiu a meta ", FLOOR(SUM(s.quantity)/pt.target), " vezes")			
			ELSE "ERRO - Não mapeado"
		END AS ValidationQuery,
	    MAX(Pmetas.b) "validationBatchId",#LOte de metas
	    GROUP_CONCAT(DISTINCT v1.validationBatchId) "LotesDasVendas",
	    GROUP_CONCAT(DISTINCT s.id) "SalesIDs"
	FROM  CampaignTargetGroup ctg
	LEFT JOIN Sale s on s.campaignId = ctg.campaignId
	LEFT JOIN Status s2 ON  s2.id = s.statusId
	JOIN CampaignUser cu ON cu.id = s.campaignUserId and cu.campaignUserStatusId = 2
	LEFT JOIN Validation v1 ON v1.sourceTypeId = 1 AND v1.sourceId = s.id #and v1.created < DATE_ADD(NOW() , INTERVAL -1 DAY) #Reduz apenas vendas com validation criado até ontem
	LEFT JOIN TargetGroup tg ON tg.id = ctg.targetGroupId 
	LEFT JOIN Target tt ON tt.id = tg.targetId 
	LEFT JOIN ProductTarget pt ON pt.targetId = tt.id 
	LEFT JOIN Seller s3 ON s3.id = s.sellerId 
	LEFT JOIN Campaign c2 ON c2.id = s.campaignId
	LEFT JOIN CampaignBudgetLimitGroup cblg ON cblg.campaignId = c2.id
	LEFT JOIN BudgetLimitItem bli on bli.budgetLimitGroupId = cblg.budgetLimitGroupId
	LEFT JOIN Company c3 ON c3.id = c2.companyId 
	LEFT JOIN Account a ON a.id = c3.accountId  
	LEFT JOIN (
	    SELECT 
	        cu2.id a,
	        GROUP_CONCAT(DISTINCT v.validationBatchId) b,
	        GROUP_CONCAT(DISTINCT t.transactionDate) c,
	        IFNULL(SUM(t.amount),0)/COUNT(DISTINCT s.id) d,#Se der error apagar o /COUNT(DISTINCT s.id)
	        GROUP_CONCAT(DISTINCT t.id) e
	    FROM Campaign c2
	    JOIN CampaignUser cu2 ON cu2.campaignId = c2.id and cu2.campaignUserStatusId = 2
	    LEFT JOIN Validation v ON v.sourceTypeId = 3  AND v.sourceId = cu2.id
	    LEFT JOIN Sale s ON s.campaignUserId = cu2.id #Se Houver erro exluicr
	    LEFT JOIN Validation v2 ON v2.sourceTypeId = 1 and v2.saleId = s.id #Se Houver erro Excluir
	    LEFT JOIN Credit c ON c.validationId = v.id
	    LEFT JOIN Transaction t ON t.id = c.transactionId
	    WHERE c2.companyId IN (${Company})
	    GROUP BY cu2.id
	    HAVING COUNT(DISTINCT s.id) > 0
        ) Pmetas ON Pmetas.a = cu.id
	LEFT JOIN User u ON u.id = cu.userId #AND u.realm = "motorola"
	WHERE v1.statusDetailId  = 16
		AND c2.campaignTypeId = 6 # 6 É tipo Meta
		AND c2.campaignInputId in (3) #3 é registro de venda
		AND v1.evidenceTypeId  IN (2,1)# 2 é Nota fiscal e 1 Aprovado manualmente
		and c2.companyId  IN (${Company}) #<<<<<<<---------------------------------------------MUDAR De acordo com o fornecedor  
		AND YEAR (s.created) = YEAR(NOW())
	GROUP BY u.cpf, cu.id,pt.id, tt.id, c3.id, a.id
	HAVING ValidationQuery REGEXP "(ERRO)"`
    ,res)
   
})
// ------------------------------------------------------- FIM  VALIDAÇÃO DE NOTA META ---------------------------------------------------

// ------------------------------------------------------ INICIO DA OIGV ---------------------------------------------------
app.get("/Sales/OIGV/:month/:year/:status", function(req,res){
    let FilterStatus = req.params.status
    let Month = req.params.month
    let Year = req.params.year

    if(FilterStatus == "ERRO" || FilterStatus == "OK"){        
        FilterStatus = req.params.status        
    }else{
        FilterStatus = "-"
    }

    execSQLQuery(
        `SELECT
        CASE 
            WHEN s.statusId = 1 and MONTH(s.created) < MONTH(NOW()) THEN "ERRO - Venda Processando, mas deveria ser encerrada"
            WHEN af.filterId = 15 and IF(af.negative,af.value REGEXP ROUND(u.cpf),af.value NOT REGEXP ROUND(u.cpf)) THEN "OK - Usuário não está na audiência da campanha"
            WHEN v.statusDetailId = 8 or v.statusDetailId = 4 and GROUP_CONCAT(Duplicate.a) is not null THEN IF(GROUP_CONCAT(Duplicate.a) is not null and GROUP_CONCAT(Duplicate.a)<> s.id, "OK - venda reprovada corretamente por duplicidade", "ERRO - Não encontrado venda duplicada")
            WHEN cbo.id is not null and s.statusId <> 2 THEN IF(MONTH(cbo.created) - 1 = MONTH(s.created) ,"ERRO - Registro encontrado, mas não foi aprovado", "OK - Registro foi encontrado, mas não foi registrado no mês anterior ao recebimento da carga")
            WHEN c.campaignInputId = 1 and pss.id = 6 and pb.id  is not null and ic.purchaseDate >= pb.boostStart and ic.purchaseDate <= pb.boostEnd THEN IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity = SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),"OK - Venda Acelerada ", CONCAT("ERRO - Venda não acelerada corretamente. O usuário recebeu: ",ROUND(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),2),IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) < 0," a mais", " a menos"))) #Vai indicar se o usuário recebeu mais dinheiro que deveria ou menos
            WHEN c.campaignInputId = 1 and pss.id = 6 and pb.id  is not null and ic.purchaseDate >= pb.boostStart and ic.purchaseDate <= pb.boostEnd THEN IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity = SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),"OK - Venda Acelerada ", CONCAT("ERRO - Venda não acelerada corretamente. O usuário recebeu: ",ROUND(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)),2),IF(MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * pb.rate * s.quantity - SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) < 0," a mais", " a menos"))) #Vai indicar se o usuário recebeu mais dinheiro que deveria ou menos
            WHEN c.campaignInputId = 1 and pss.id = 6 and SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) = MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * s.quantity THEN "OK - Venda Paga corretamente"
            WHEN c.campaignInputId = 1 and pss.id = 6 and SUM(DISTINCT IF (rdd.rewardDistributionTargetId = 1 ,t.amount,NULL)) = MAX(IF(rdd.rewardDistributionTargetId = 1, rdd.reward,null)) * s.quantity THEN "OK - Venda Paga corretamente"
            WHEN c.campaignInputId = 1 and pss.id = 6 and v.created >= DATE_ADD(NOW() , INTERVAL - vr.paymentPeriod DAY) and SUM(t.amount) is null THEN "OK - Venda validada ainda recentemente"
            WHEN c.campaignInputId = 1 and pss.id = 6 and SUM(t.amount) is null and mb.closed = 1 THEN "OK - Orçamento fechado"
            WHEN c.campaignInputId = 1 and pss.id = 6 and SUM(t.amount) is null and mb.budget = mb.spend THEN "OK - Orçamento atingiu o limite"
            WHEN c.campaignInputId = 1 and pss.id = 6 and SUM(t.amount) is null THEN "ERRO - Usuário não recebeu pela venda aprovada"
            WHEN v.statusId = 2 and c.campaignInputId = 11 and cbo.id is NULL THEN "ERRO - Registro não encontrado na BOV, mas está aprovado"
            WHEN  v.statusId = 2 and c.campaignInputId = 11 and cbo.id is not null and cutg.count < cutg.target THEN IF( SUM(t.amount) <= 0 or SUM(t.amount) is null, "OK - Usuário não atingiu a meta da campanha", GROUP_CONCAT("ERRO - Usuário não atingiu a meta, mas recebeu um valor de ",t.amount ))
            WHEN  v.statusId = 2 and c.campaignInputId = 11 and cbo.id is not null and cutg.count >= cutg.target THEN IF( SUM(t.amount) > 0 and cu.balance = cutg.count *  SUM(t.amount), "OK - Usuário atingiu a meta da campanha e recebeu corretamente", "ERRO - Usuário atingiu a meta, mas não recebeu o valor corretamente")
            -- WHEN s.statusId = 2 and cbo.id is not null THEN "OK - Registro encontrado e validado"
            WHEN v.statusDetailId = 62 and cbo.id is NULL and s.statusId = 3 THEN "OK - Venda reprovada, pois não foi encontrado na BOV a tempo"
            WHEN v.statusDetailId = 62 and cbo.id is NULL and s.statusId <> 3 THEN "ERRO - Venda com detalhe reprovada, mas o status de pagamento ainda não foi reprovado"
            WHEN v.statusDetailId = 62 and cbo.id is not  NULL THEN "ERRO - venda expirada, mas foi encontrado venda na BOV"
            WHEN s.productCampaignId is null THEN "ERRO - Venda Sem Produto"
            ELSE "ERRO - Não Mapeado"	
        END AS ValidationQuery,
        s.id "Sale ID",
        v.id "ValidationID",
        cu.balance "Acumulado",
        IF(v.statusId = 2,SUM(t.amount) * cutg.count - cu.balance, "Não se aplica") "Diferença Recebido x Acumulado", 
        cutg.count "Quantidade de Venda acumulada",
        cutg.target "Meta",
        cutg.achieved "Alcançou",
        v.validationBatchId,
        cu.id "CampaingUserID",
        s.campaignId "CampanhaID Sale",
        v.campaignId "CampanhaID Validation",
        v.statusId,
        v.statusDetailId,
        IF(v.evidenceTypeId = 8, "Venda Escrava", "Venda Normal") "Tipo de Venda",
        s.input,
        s.duplication,
        s.saleDate, 
        s.validateAfter,
        s.created,s.saleDate,
        cu.userId,
        cbo.*, GROUP_CONCAT(Duplicate.a) "ID da Venda Duplicada", 
        cbo.id is not null "Encontrado na BOV"
        /*cbo.NUMERO_PEDIDO,
        cbo.PRODUTO_VOIP ,
        cbo.PRODUTO_BL ,
        cbo.TIPO ,
        cbo.DATA_PEDIDO ,
        cbo.*/
    FROM Sale s 
    LEFT JOIN PreSale ps on ps.saleId = s.id 
    LEFT JOIN ValidationRule                 vr on vr.id = ps.validationRuleId
    LEFT JOIN PreSaleStatus                  pss on pss.id = ps.preSaleStatusId
    LEFT JOIN CtmBovOi cbo on cbo.NUMERO_PEDIDO = s.input 
    LEFT JOIN Validation v on v.sourceId = s.id
    LEFT JOIN Invoice    i  ON s.id = i.saleId 
    LEFT JOIN InvoiceCheck  ic ON i.id = ic.invoiceId 
    LEFT JOIN ProductBoost                   pb ON pb.id  = s.productBoostId 
    LEFT JOIN Campaign c on s.campaignId = c.id 
    LEFT JOIN Audience a on a.id = c.audienceId 
    LEFT JOIN AudienceFilter af on af.audienceId = a.id 
    LEFT JOIN CampaignUser cu on cu.campaignId = v.campaignId and cu.userId = v.userId 
    LEFT JOIN User u on u.id = cu.userId 
    LEFT JOIN CampaignUserTargetGroup cutg on cutg.campaignUserId = cu.id 
    LEFT JOIN Credit c2 on c2.validationId = v.id 
    LEFT JOIN Transaction t on t.id = c2.transactionId 
    LEFT JOIN RewardDistributionDetail       rdd ON c2.rewardDistributionDetailId = rdd.id
    LEFT JOIN MonthlyBudget mb on v.monthlyBudgetId = mb.id 
    LEFT JOIN (
            SELECT sDuplicate.id a,
            sDuplicate.campaignId b,
            sDuplicate.input c
            FROM Sale sDuplicate
            INNER JOIN Campaign c3 on c3.id = sDuplicate .campaignId 
            WHERE c3.companyId = 2 and sDuplicate .statusId = 2
            ) Duplicate ON Duplicate.a <> s.id and Duplicate.c = s.input  -- and Duplicate.b = s.campaignId 
    WHERE c.companyId = 2
    and YEAR(c.campaignStart) = ${Year} and MONTH(c.campaignStart) = ${Month}
    GROUP BY s.id, cbo.id, af.id, a.id, cu.id, v.id, u.id, cutg.id, pb.id,ic.id, pss.id, ps.id, vr.id 
    HAVING ValidationQuery REGEXP "${FilterStatus}"`
    ,res)
   
})


app.get("/CTMBOV", function(req,res){
    execSQLQuery(
        `SELECT*
        FROM CtmBovOi cbo
        WHERE TRUE 
        and YEAR(cbo.created) = YEAR(NOW()) 
        and MONTH(cbo.created) >= Month(NOW())-2`
    ,res)
   
})

app.get("/PagSeguros", function(req,res){
    execSQLQuery(
        `SELECT *
        FROM PreSale ps
        WHERE TRUE 
       and YEAR(ps.created) = YEAR(NOW()) 
       and MONTH(ps.created) >= Month(NOW())-2
       and ps.validationRuleId = 104`
    ,res)
   
})

// ------------------------------------------------------ FIM DA OIGV ---------------------------------------------------
// ------------------------------------------------------ INICIO DA VALIDAÇÃO DE CAMPANHAS ---------------------------------------------------
app.get("/campaign/validation/:id", function(req,res){
    let campaignId = req.params.id
    execSQLQuery(
        `Select
        Case
            WHEN TRUE THEN 'Não Mapeado' 
        END as 'Aceite',
            r.appName  "Aplicativo",
            c2.name "Cliente",
            ci.name "input",
        CASE 
             WHEN c.hasEligibility  = 1 THEN 'Sim'
             WHEN c.hasEligibility  = 0 THEN 'Não'
             ELSE 'Flag incorreta, favor verificar'
        END AS "Campanha_tem_elegibilidade",
            c2.name "Fornecedor",
            c.name "Nome_da_Campanha",
        CASE 
             WHEN c.hasBudget = 1 THEN 'Sim'
             WHEN c.hasBudget = 0 THEN 'Não'
             ELSE 'Flag incorreta, favor verificar'
        END AS "Campanha_tem_orçamento",
        CASE 
            WHEN ci.id <> 1 THEN 'Sem data de expiração'
            WHEN ci.id =1 and vr.id is null THEN 'Informe o ValidationRule'
            WHEN ci.id = 1 and vr.id is not null THEN IF(vr.ruleConfig regexp 'expirationSaleinDays' is not null, JSON_VALUE(vr.ruleConfig, '$.expirationSaleinDays'), 30)
        END "Dias_para_expiração_das_vendas",
            CONCAT(c.validationPeriod + 2," dias") "Tempo_pagamento", -- 2 Dias para a venda Pagar
            f.name  "Audiencia",
            ct.name"Tipo_de_campanha",
            c.id "Id_da_campanha",	
            c.internalName "Nome_interno_Campanha",
            c.ruleId "Id_regulamento",	
            c.isGlobal, -- vai pelo checkpoint ou pela audiencia?
            c2.id "Id do fornecedor",		
            GROUP_CONCAT(DISTINCT pc.id ) "Ids_ProductCampaign" ,
            GROUP_CONCAT(DISTINCT pc.productId) "Id_produto",
            GROUP_CONCAT(DISTINCT p.name) "Nome_produto",
            GROUP_CONCAT(DISTINCT pc.reward) "Pontos",
            bt.Key "Tipo_orçamento",
            blg.description,
            GROUP_CONCAT(DISTINCT bliProduto.principalId) "PrincipalID_ProductCampaingID", 
            GROUP_CONCAT(DISTINCT bliUser.principalId) "PrincipalID_UserID" ,
            GROUP_CONCAT(DISTINCT bliLoja.principalId) "PrincipalID_StoreID" ,	
                CASE 
                      WHEN c.enabled = 1 THEN 'Sim'
                      WHEN c.enabled= 0 THEN 'Não'
                      ELSE 'Flag incorreta, favor verificar'
                 END AS "Campanha_habilitada"
        from
            Campaign c
        left join Audience a on
            a.id = c.audienceId
            LEFT JOIN AudienceFilter af on af.audienceId = a.id 
            LEFT JOIN Filter f on f.id = af.filterId 
            LEFT JOIN CampaignUser cu on cu.campaignId =c.id 
            LEFT JOIN Seller s on s.userId = cu.userId 
            LEFT JOIN Store s2 on s2.id = s.storeId 
        left join Company c2 on
            c2.id = c.companyId
            LEFT JOIN Vendor v on v.companyId = c2.id
            LEFT JOIN Realm r on r.name  = v.realm 
        left join CampaignType ct on
            ct.id = c.campaignTypeId
        left join CampaignInput ci on
            ci.id = c.campaignInputId
        left join CampaignTargetGroup ctg on
            ctg.campaignId = c.id
        left join TargetGroup tg ON
            tg.id = ctg.targetGroupId
        join ProductCampaign pc on
            pc.campaignId = c.id
        join Product p on
            p.id = pc.productId
        left join KnownProductProduct kpp on kpp.productId =p.id 
        left join KnownProduct kp on kp.id=kpp.knownProductId 
        left join CampaignBudgetLimitGroup cblg on cblg.campaignId =c.id
        LEFT JOIN BudgetLimitGroup blg on cblg.budgetLimitGroupId =blg.id 
        left join BudgetType bt on bt.id=blg.budgetTypeId 
        left join BudgetLimitItem bliProduto on bliProduto.budgetLimitGroupId = blg.id and pc.id=bliProduto.principalId and bt.id = 4
        LEFT JOIN BudgetLimitItem bliUser on bliUser.budgetLimitGroupId = blg.id  and bliUser.principalId = cu.userId and bt.id = 1
        LEFT JOIN BudgetLimitItem bliLoja on bliLoja.budgetLimitGroupId = blg.id  and bliLoja.principalId = s2.id and bt.id = 2
        LEFT JOIN BudgetLimitItem bliCampaing on bliCampaing.budgetLimitGroupId = blg.id  and bliCampaing.principalId = c.id  and bt.id = 3
        LEFT JOIN ValidationRule vr on vr.realm =v.realm 
        -- LEFT JOIN CampaignBoost cb 
        WHERE c.id = ${campaignId}
        and vr.id = 131
        GROUP by c.id, a.id, c2.id, ct.id, ci.id, ctg.campaignId, tg.id,bt.id, blg.id, r.id, f.id, vr.id `
    ,res)
   
})

// ------------------------------------------------------ FIM DA VALIDAÇÃO DE CAMPANHAS ---------------------------------------------------




// -------------------------------------------------------ZONA DE TESTE API ---------------------------------------------------
app.get("/Teste/:id/:te", function(req,res){
    let IDFilter = req.params.id
    let davi = req.params.te
    execSQLQuery(
        `SELECT *
        from Account a 
        INNER JOIN Company c on c.accountId = a.id 
        WHERE TRUE 
        AND a.id = ${IDFilter}`
    ,res)
   
})