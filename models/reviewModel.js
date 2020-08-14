

//review //rating // created_at //refer tour // refer user


const mongoose= require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'review cant be empty']
    },
    rating :{
        type: Number,
        min: [1,'The rating must be above 0'],
        max: [5,'Rating must be below 5']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'There must be User to write a review']
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'review must belong to a Tour']
    },
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

reviewSchema.index({tour:1, user:1}, {uniqe: true});


reviewSchema.pre(/^find/,function(next){
    console.log('in pre of review');
  /*  this.populate({
        path: 'tour',
        select: 'name'
    }).populate({
        path: 'user',
        select: 'name photo'
    });*/

    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calcAverageRatings =async  function(tourId){
    const stats = await this.aggregate([
        { 
            $match: {tour: tourId}
        },
        {
            $group:{
                _id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }

    ]);
    
    console.log(stats);
    if(stats.length >0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    }else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
    
};
reviewSchema.post('save', function(){
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r= await this.findOne();
    console.log(this.r);
    next();
})

reviewSchema.post(/^findOneAnd/, async function(next){
    await this.r.constructor.calcAverageRatings(this.r.tour);
})
const Review = mongoose.model('Review',reviewSchema);
module.exports = Review;