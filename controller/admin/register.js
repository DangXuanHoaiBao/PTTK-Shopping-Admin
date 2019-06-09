var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const Admin = require('../../models/admin');
const bcrypt = require('bcrypt');

const uri = "mongodb+srv://BaoDang:baodang@cluster0-ek6kq.mongodb.net/test?retryWrites=true&w=majority";

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register', layout: ""});
});

router.post('/register', function(req, res, next){
    req.checkBody('Username', 'username').notEmpty();
    req.checkBody('Name', "name").notEmpty();
    req.checkBody('Password', 'password').isLength({min: 5, max: 20});
    req.checkBody('ConfirmPassword', 'confirm password').isLength({min: 5, max: 20});
    req.checkBody('Email', 'email').isEmail();
    const errors = req.validationErrors();
    if(errors){
        let strErr;
        for(let i=0;i<errors.length; i++){
            if(errors[i].msg != undefined){
                strErr = strErr + ", " + errors[i].msg;
            }
        }
        strErr = strErr + " invalid!";
        res.render('register', {title: 'Register', 'mess': strErr, layout: ""});
    }
    else{
        MongoClient.connect(uri, {useNewUrlParser: true}, function(err, dbRef){
            if(err) return console.log(err);
            else{
                const adminCollection = dbRef.db('pttkshoppingdb').collection('Admin');
                let Asycn_Await = async()=>{
                    let cus = await adminCollection.findOne({Username: req.body.Username});
                    if(cus){
                        dbRef.close();
                        res.render('register', {title: 'Register', layout: "", 'mess': "Username is already exist"});
                    }
                    else{
                        if(req.body.Password == req.body.ConfirmPassword){
                            req.body.Password = bcrypt.hashSync(req.body.Password, 10);
                            const newCus = new Admin(req.body);
                            console.log(newCus);
                            adminCollection.insertOne(newCus, function(err, res){
                                dbRef.close();
                                if(err){
                                    return next(err);
                                }
                                else{
                                    console.log("insert is success");
                                }
                            });
                            req.login(newCus, function(err){
                                if(err){
                                    return next(err);
                                }
                                return res.render('index' , {title: "Home", 'mess': req.user.Username}); 
                            })
                        }
                        else{
                            dbRef.close();
                            res.render('register', {title: 'Register', 'mess': "Password and ConfirmPassword is not equal", layout: ""});
                        }
                    }
                }
                Asycn_Await();
            }
        });
    }
});

module.exports = router;