const mongoose= require('mongoose');
const dotenv= require('dotenv');

dotenv.config({path: './config.env'}); //reads all config.env variables
                                       // and if we do process.env we can see all of them there
                                       // so its adding all this vars to node env vars


// for unhandled exceptions written in non async code
console.log('hiihiiiiiihiii');
// for ex: console.log(x);
process.on('uncaughtException', err => {
    console.log('hii', err.name, err.message, err.stack);
    console.log('Uncaught Exception..!');
    process.exit(1); //shutDown the process (APP)
     
});


const db=process.env.DATABASE.replace('<PASSWORD>',process.env.DATBASE_PASSWORD);
mongoose.connect(db,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
    console.log('DB connection Success!');
}); //.catch(err=>{
    //console.log(err);
    //console.log('Error in connectoin');s
//});

const app= require('./app');
//4 server start
//console.log(app.get('env'));
//console.log(process.env);
//console.log(app.get('env')); // set by express but nodeJs can also sets lots of env var


const port=process.env.PORT || 3000;
const server = app.listen(port,()=> {
    console.log('App running on port'+port);
});

// when in application there is a unhandled promice exception occures follo obj gets emmited
// we are subscribig to it as follow
process.on('unhandledRejection', err => {
    console.log('err', err.name, err.message,err.stack);
    console.log('Unhandled Rejections..!');
    server.close(() =>{
        process.exit(1); //shutDown the process (APP)
    });    
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received so shuting down the app gracefully..:)');
    server.close(() =>{
        console.log('Process terminated');
    });
})
