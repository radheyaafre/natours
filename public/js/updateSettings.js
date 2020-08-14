import axios from 'axios';
import {showAlert} from './alerts'

// type is either password or data
export const updateSetting = async (data, type) =>{
    console.log('data', data);
    try{
        const url = type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' 
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

        const res= await axios({
            method: 'PATCH',
            url: url,
            data: data
        });
        console.log(res);
        if(res.data.status ==='Success')
        {
            showAlert('success',`${type.toUpperCase()}updated sucessfully`);
        }
    }catch(err){
        showAlert('error', err.response.data.message);
    }   
}