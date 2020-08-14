const Tour = require('./../models/tourModel');
const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const factory = require('./handlerFactory');
const express = require('express');


const mnulterStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) =>{
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an Image! please upload only image.', 400), false);
    }
}
const upload = multer({
    storage: mnulterStorage,
    fileFilter: multerFilter
});


exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount:1},
    {name: 'images', maxCount:3}
]);

exports.resizeTourImages = catchAsync(async(req, res, next) =>{
    console.log(req.files);
    if(! req.files.imageCover || !req.files.images){
        return next();
    }
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images = [];
    await Promise.all(req.files.images.map(async(file,i) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(req.files.images[i].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${fileName}`);

        req.body.images.push(fileName);
    }));  
    next();

});


exports.aliasTopTours = (req,res,next)=> {
    req.query.limit='5';
    req.query.sort= '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour    = factory.getOne(Tour, {path: 'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req,res,next) =>{
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage : {$gte:3}}
            },
            {
                $group: {
                         _id: {$toUpper: '$difficulty'},
                        numTours: {$sum:1},
                        numOfRatings: {$sum: '$ratingsQuantity'},
                        avgRating: {$avg: '$ratingsAverage'},
                        avgPrice: {$avg: '$price'},
                        minPrice: {$min: '$price'},
                        maxPrice: {$max: '$price'}    
                    
                
            }
         },
         {
            $sort:{ avgPrice: 1}
        },
       // {
       //     $match: {_id: {$ne: 'EASY'}}
       // }
        ]);
        res.status(200).json({
            status:'Success',
            data:{
                stats
            }
        });
        //next();
});

exports.getMonthlyPlan = catchAsync(async(req,res,next) =>{
        const year= req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id: {
                        $month: '$startDates'},
                        numofTourStarts: {$sum: 1},
                        tours: { $push: '$name'} //push names of the tours
                }
            },
            {
                $addFields: { month: '$_id'}
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {numofTourStarts: -1} // 1==asc ..-1==desc
            },
            {
                $limit: 12
            }
        ]);
        res.status(200).json({
            status:'Success',
            data:{
                plan
            }
        });
       // next();
});

// router.route('/tours-within/:distance/center/:latlang/unit/:unit', tourController.getToursWithin);
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
  
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      );
    }
  
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });
  
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours
      }
    });
  });

  exports.getDistances = catchAsync( async(req, res ,next) =>{
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi'? 0.000621371 : 0.001; // meter to miles or km
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      );
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates:[lng * 1,lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier  // for m to km
            }
        },
        {
            $project:{
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
          data: distances
        }
      });
  });
  