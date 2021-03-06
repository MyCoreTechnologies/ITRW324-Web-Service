//URL:  http://localhost:3000/hostel
//Hostel table/route needs the following:
//Admin can create, read, update
//Creation of a hostel is only in extreme rare cases where the university adds a new hostel
//Hostel cannot be deleted due to the amount of students linked to each hostel

//Constant variables and variables for all used api's and directories
const express = require('express');
const router = express.Router();
const mysql = require('promise-mysql');
const adminAuth = require("../auth/adminAuth");
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

//Creation of a pool to connect to the MySQL database
var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "ITRW324",
    database: 'selit_database'
});

//Create Hostel
//This method is used to add a hostel to the system
//URL:  http://localhost:3000/hostel/addHostel
//Requested data:   Admin Key in header
//                  hostel_name
//Data sent:        200 If the adding was successful
//                  400 If the adding was unsuccessful
try{
    router.post('/addHostel', adminAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Create Hostel
        var iHostel = 'INSERT INTO hostel set ?';

        //Creating hostel object
        var hostel = {
            Hostel_Name:   req.body.hostel_name
        };

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending SQL query to the database
            connection.query(iHostel, hostel, (err, result) => {
                if (result){
                    res.status(200).json({message:'Hostel added'});
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Hostel could not be added.'});
                    connection.release();
                }            
            });
        });
    });
}
catch(error)
{
    res.status(500).json({message:'Error caught at Create Hostel in api/routes/hostel.js.'});
}

//Read Hostel
//This method is used to view all the hostels in the system
//URL:  http://localhost:3000/hostel/getHostel
//Requested data:   Admin Key in header
//Data sent:        JSON format of all the hostels in the system 
//                  400 If the adding was unsuccessful
try{
    router.get('/getHostel', adminAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Read Hostel
        var rHostel = 'SELECT * FROM hostel';

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending SQL query to the database
            connection.query(rHostel, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Could not retrieve hostel data.'});
                    connection.release();
                }            
            });
        });
    });
}
catch(error)
{
    res.status(500).json({message:'Error caught at Read Hostel in api/routes/hostel.js.'});
}

//Update Hostel
//This method is used to update a hostel when its needed
//URL:  http://localhost:3000/hostel/updateHostel
//Requested Data:   Administrator key in header
//                  o_hostel_name ----Original hostel name to be updated
//                  n_hostel_name ----New hostel name
//Data sent:        200 If the update was successful
//                  400 If the update was unsuccessful
try{
    router.post('/updateHostel', adminAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables to Update the hostel table
        var fHostel = 'SELECT * FROM hostel WHERE hostel_name = ?';
        var uHostel = 'UPDATE hostel SET hostel_name = ? WHERE hostel_name = ?';
        //Gettinig a connection to the MySQL database
        pool.getConnection()
        .then(function(conn) {
            connection = conn;
            //Sending the first query to the database and making a PROMISE
            return connection.query(fHostel, req.body.o_hostel_name);
        })
        .then(function(hostelRow){
            //If function to test if the data you want to update exists in the database
            if(hostelRow.length === 0)
            {
                res.status(400).json({message:'Hostel does not exist in databse'});
                connection.release();
            } else {
                //Sending the update query to the databse with the old and new values
                connection.query(uHostel, [req.body.n_hostel_name, req.body.o_hostel_name], (err, result) => {
                    if(result){
                        res.status(200).json({message:'Hostel was updated'});
                        connection.release();
                    }
                    if (err){
                        res.status(400).json({message:'Hostel could not be updated'});
                        connection.release();
                    }
                })
            }
        })
    });
}catch (error){
    res.status(500).json({message:'Error caught at Update Hostel in api/routes/hostel.js.'});
}

//Exporting all the different routes to app.js
module.exports = router;