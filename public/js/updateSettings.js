import axios from 'axios';
import {showAlert} from './alerts'

// type is either password or data
export const updateSetting = async (data, type) =>{
    try{
        const url = type === 'password'
        ? '/api/v1/users/updateMyPassword' 
        : '/api/v1/users/updateMe';

        const res= await axios({
            method: 'PATCH',
            url: url,
            data: data
        });
        if(res.data.status ==='Success')
        {
            showAlert('success',`${type.toUpperCase()}updated sucessfully`);
        }
    }catch(err){
        showAlert('error', err.response.data.message);
    }   
}