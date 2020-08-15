/* eslint-disable */
import axios from 'axios';
import {showAlert} from './alerts'
const stripe = Stripe('pk_test_51HEwGaCrHIvmIQ6PeSfMnYHxjYk6iDtXlLW5PEISLP47bE6mHEYZETbW8V0ymqnW1OtnZocb36wty9O529iTsdHl00NljMIn6z')


export const bookTour = async tourId => {
    try{
        // get checkoout session from server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // create  checkout form + charge the credit card 
    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    })
    }catch(err){
        console.log(err);
        showAlert('error', err.response.data.message);
    }
    
};