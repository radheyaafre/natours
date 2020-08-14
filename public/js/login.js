import axios from 'axios';
import {showAlert} from './alerts'
export const login = async (email, password) =>{
    try{
        const res= await axios({
            method: 'post',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email: email,
                password: password
            }
        });
        console.log(res);
        if(res.data.status ==='Success')
        {
            showAlert('success','login sucessfully');
            window.setTimeout(() => {
                location.assign('/')
            },1500);
        }
    }catch(err){
        showAlert('error', err.response.data.message);
    }   
}

export const logout = async() =>{
    try{
        console.log('in logut')
        const res = await axios({
            method: 'get',
            url:'http://127.0.0.1:3000/api/v1/users/logout'
        });
    
    if(res.data.status === 'success'){
        //location.reload(true);
        location.assign('/')
    }
    }catch(err){
        console.log(err.response);
        showAlert('error', 'error in logging out.. try again');
    }
}