import { login, logout } from './login';
import { displayMap } from './mapBox';
import { updateSetting } from './updateSettings';
import {bookTour} from './stripe'
import '@babel/polyfill'

// DOM elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn  = document.querySelector('.nav__el--logout');
const updateForm =  document.querySelector('.form-user-data');
const passwordForm =  document.querySelector('.form-user-password');
const bookBtn =  document.getElementById('book-tour');

//values


// delegation
if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}


if (loginForm)
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; 
    login(email,password);
});

if(logoutBtn){
    logoutBtn.addEventListener('click', logout);
}


if(updateForm)
updateForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSetting(form, 'data');
});

if(passwordForm)
passwordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'updating...'

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value; 
    const passwordConfirm = document.getElementById('password-confirm').value; 
    await updateSetting({passwordCurrent, password, passwordConfirm}, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value='';
    document.getElementById('password').value=''; 
    document.getElementById('password-confirm').value=''; 
});

if(bookBtn){
    bookBtn.addEventListener('click', e=>{
        e.target.textContent = 'Procesing...';
        const {tourId} = e.target.dataset;
        bookTour(tourId);
    })
}