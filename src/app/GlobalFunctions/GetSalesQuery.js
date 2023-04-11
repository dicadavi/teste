require('dotenv').config({ path: './../../../.env' })

const axios = require('axios');

async function getCardifSales(status) {
    try {
      const response = await axios.get('http://localhost:8800/cardif/ValidationSales/'+status);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }

  async function getOIGVfSales(status,Ano,mes) {
    try {
      const response = await axios.get(`http://localhost:8800/Sales/OIGV/${mes}/${Ano}/${status}`);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }

  async function getSalesNFE(Company,status) {
    try {
      const response = await axios.get(`http://localhost:8800/Sales/NFE/${Company}/${status}`);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }


  async function getSalesNFEMETA(Company) {
    try {
      const response = await axios.get(`http://localhost:8800/Sales/META/NFE/${Company}`);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }


  async function getCTMBOV() {
    try {
      const response = await axios.get('http://localhost:8800/CTMBOV');
      return response.data
    } catch (error) {
      console.error(error);
    }
  }
  async function getPagSeguros() {
    try {
      const response = await axios.get('http://localhost:8800/PagSeguros');
      return response.data
    } catch (error) {
      console.error(error);
    }
  }

  async function getSalesMetlife(status) {
    try {
      const response = await axios.get(`http://localhost:8800/Metlife/validationSales/${status}`);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }


  async function getCampaignValidation(campaignId) {
    try {
      const response = await axios.get(`http://localhost:8800/campaign/validation/${campaignId}`);
      return response.data
    } catch (error) {
      console.error(error);
    }
  }
 module.exports = { getCardifSales, getOIGVfSales, getSalesNFE, getSalesNFEMETA, getCTMBOV, getPagSeguros,getSalesMetlife, getCampaignValidation }