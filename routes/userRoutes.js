
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authenticationController');


const router =express.Router();
router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

router.use(authController.protect); // protect all apis below this lines

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser );

router.use(authController.restrictTo('admin')); // below routes restricted to admin

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

    router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

    module.exports = router;