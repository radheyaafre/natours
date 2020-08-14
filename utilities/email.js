const nodemailer= require('nodemailer');
const pug= require('pug');
const htmlToText = require('html-to-text');
const catchAsync = require('./catchAsync');

module.exports = class Email{
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url,
        this.from = `Radhe ${process.env.EMAIL_FROM}`;
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            //send grid
            return 1;
        }else{
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    }

    async send(template, subject){
        // send the actual email
        // 1. render html based on pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject
        });

        //2. define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            html: html,
            subject: subject,
            text: htmlToText.fromString(html)
            //html: 
        }
        //create a transport and send email
        await this.newTransport().sendMail(mailOptions);

    }

    async sendWelcome(){
        await this.send('welcome', 'Welcome to the natours family');
        
    }
    async sendPasswordReset(){
        await this.send('passwordReset', 'yout password reset token valid for only 10 mins');
    }
}
