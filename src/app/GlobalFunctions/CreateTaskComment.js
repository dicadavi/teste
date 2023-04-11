const axios = require('axios');

async function CreatTaskComent(taskId,body,Authorization) {
const  query = new URLSearchParams({
    custom_task_ids: 'false',
  }).toString();  
  
  

  const options = {
    method: 'POST',
    headers: {  
        'Content-Type': 'application/json',
        'Authorization': Authorization
    },
    data: body,
    url: `https://api.clickup.com/api/v2/task/${taskId}/comment?${query}`,
  };

 
 
  try {
    const response = await axios(options);
    return response.data
  } catch (error) {
    return error
  }

}


async function UpdateTaskComent(commentId,body,Authorization) {
  const  query = new URLSearchParams({
      custom_task_ids: 'false',
    }).toString();  
    
    
  
    const options = {
      method: 'PUT',
      headers: {  
          'Content-Type': 'application/json',
          'Authorization': Authorization
      },
      data: body,
      url: `https://api.clickup.com/api/v2/comment/${commentId}`,
    };
  
   
   
    try {
      const response = await axios(options);
      return response.data
    } catch (error) {
      return error
    }
  
  }


  async function GetTask(taskId,Authorization) {
    const  query = new URLSearchParams({
        custom_task_ids: 'false',
      }).toString();        
      
    
      const options = {
        method: 'GET',
        headers: {  
            'Content-Type': 'application/json',
            'Authorization': Authorization
        },
        url: `https://api.clickup.com/api/v2/task/${taskId}?${query}`,
      };
    
     
     
      try {
        const response = await axios(options);
        return response.data
      } catch (error) {
        return error
      }
    
    }


module.exports = { CreatTaskComent, UpdateTaskComent, GetTask }