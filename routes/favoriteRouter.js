const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')                                                   //if the options message is received on this particular route
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })      //preflight requests: first send HTTP options request
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})      //every time retrive dish information
    .populate('user')
    .populate('dishes')                       //ensure the author field will be populated with the information as required
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})      //use user_id to find the specific favorite document
    .then((favorite) => {
        if(favorite == null){          //if the favorite document not exists
            Favorites.create({
                user: req.user._id,
                dishes: req.body
            })
            favorite.save()
			.then((favorite) => {
                Favorites.finById(favorite._id).populate('user').populate('dishes')
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');    //res里的内容才是返回到client-side的
                    res.json(favorite);  
                })
			})
            .catch((err) => next(err));  
        }
        else{                     //exists
			for(i in req.body){
				if(favorite.dishes.indexOf(req.body[i]._id) === -1){   //no duplicity
					favorite.dishes.push(req.body[i]);
				}
			}	
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
            favorite.save()
			.then((favorite) => {
                Favorites.finById(favorite._id).populate('user').populate('dishes')
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');    //res里的内容才是返回到client-side的
                    res.json(favorite);  
                })
            })
            .catch((err) => next(err));
        }
    },(err)=>next(err))
    .catch((err) => next(err));
})
.delete(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOneAndRemove({user: req.user._id}) 
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
})

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); }) 
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findeOne({user:req.user._id})
    .then((favorites) => {
        if(!favorites){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites });
        }
        else{
            if(favorites.dishes.indexOf(req.params.dishId) < 0){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites });
            }
            else{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites }); 
            }
        }
    },(err)=>next(err))
    .catch((err)=>next(err))
})
.post(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})      //use user_id to find the specific favorite document
    .then((favorites) => {
        if(!favorites){          //if the favorite document not exists
            Favorites.create({
                user: req.user._id,
                dishes: [req.params.dishId]
            })
            favorite.save()
			.then((favorite) => {
                Favorites.finById(favorite._id).populate('user').populate('dishes')
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');    //res里的内容才是返回到client-side的
                    res.json(favorite);  
                })
			})
            .catch((err) => next(err));  
        }
        else{                     //exists
            for(var i=favorites.dishes.length-1; i>=0; i--){
                if(favorites.dishes[i]._id.equals(req.params.dishId)){     //if the favorite exists
                    var err = new Error('That dish is already a favorite');
                    err.status = 400;
                    next(err);
                }      
            }
            favorites.dishes.push(req.params.dishId);        //push into the document
            favorite.save()
			.then((favorite) => {
                Favorites.finById(favorite._id).populate('user').populate('dishes')
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');    //res里的内容才是返回到client-side的
                    res.json(favorite);  
                })
			})
            .catch((err) => next(err));   
        }
    },(err)=>next(err))
    .catch((err) => next(err));
})
.delete(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id}) 
    .then((favorite) => {
        if (favorite != null) {
            for(var i=favorite.dishes.length-1; i>=0; i--){
                if(favorite.dishes[i]._id.equals(req.params.dishId)){     //if the favorite exists
                    favorite.dishes.splice(i,1);
                    favorite.save()
                    .then((favorite) => {
                        Favorites.finById(favorite._id).populate('user').populate('dishes')
                        .then((favorite)=>{
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');    //res里的内容才是返回到client-side的
                            res.json(favorite);  
                        })
                    })
                    break;
                }      
            }
            if(i<0){    //didn't find the dish
                err = new Error('Dish ' + req.params.dishId + ' not found');
                err.status = 404;
                return next(err);      
            }    
        }
        else {
            err = new Error('You do not have any favorite dish!');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

module.exports = favoriteRouter;