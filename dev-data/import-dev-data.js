const fs= require('fs');
const mongoose= require('mongoose');
const dotenv= require('dotenv');
const Tour= require('./../models/tourModel')
const Review= require('./../models/reviewModel')
const User= require('./../models/userModel')

dotenv.config({path: './../config.env'}); //reads all config.env variables
                                       // and if we do process.env we can see all of them there
                                       // so its adding all this vars to node env vars


const db=process.env.DATABASE.replace('<PASSWORD>',process.env.DATBASE_PASSWORD);
mongoose.connect(db,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
    console.log('DB connection Success!');
}).catch(err=>{
    console.log(err);
    console.log('Error in connectoin');
});

///REad json file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/data/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/data/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/data/reviews.json`,'utf-8'));

//import data into db

const importData = async()=>{
    try{
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Data Successfully loaded');
    }
    catch(err)
    {
        console.log(err);
    }
    process.exit();
};

// delete all data from collections
const deleteData = async()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Successfully deleted');
    }
    catch(err)
    {
        console.log(err);
    }
    process.exit();
};

if(process.argv[2]==='--import')
    importData();
if(process.argv[2]==='--delete')
    deleteData();

console.log(process.argv);