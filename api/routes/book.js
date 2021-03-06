//URL:  http://localhost:3000/book
//Book table/route needs the following:
//Admin can create, read and delete also filtering of book data
//Student can create, read and delete also filtering of book data
//Update of book is not allowed, delete and create a new book will be required

//Constant variables and variables for all used api's and directories
const express = require('express');
const router = express.Router();
const mysql = require('promise-mysql');
const nodemailer = require('nodemailer');
const checkAuth = require("../auth/checkAuth");
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

//Creation of the transporter to send emails
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'selitnotifier@gmail.com',
    pass: 'selititrw324'
    }
});

//Create book
//This method is used to add a book to the system
//URL:  http://localhost:3000/book/addBook
//Requested data:   Key in header
//                  book_name
//                  book_edition
//                  book_isbn_10_number
//                  book_isbn_13_number
//                  book_price
//                  book_type
//                  author_name
//                  subject_code
//Data sent:        200 If the adding was successful
//                  400 If the adding was unsuccessful
try{
    router.post('/addBook', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the create book
        var ibook = 'INSERT INTO book set ?';
        var iauthor = 'INSERT INTO author set ?';
        var ibookauthor = 'INSERT INTO book_author set ?';
        var ibooksubject = 'INSERT INTO book_subject set ?';
        var fbook = 'SELECT * FROM book WHERE Book_Name = ? AND Book_Edition = ? AND Book_ISBN_10_Number = ? AND Book_ISBN_13_Number = ? AND Book_Price = ? AND Book_Type = ? AND STUDENT_Student_Number = ?';
        var fauthor = 'SELECT * FROM author WHERE Author_Name = ?';
        var fsubject = 'SELECT * FROM subject WHERE Subject_Code = ?';
        var fbookauthor = 'SELECT * FROM book_author WHERE BOOK_Book_Number = ? AND AUTHOR_Author_Number = ?';
        var fbooksubject = 'SELECT * FROM book_subject WHERE BOOK_Book_Number = ? AND SUBJECT_Subject_Number = ?';
        var fStudent = 'SELECT * FROM student WHERE Student_Number = ?';

        //Creating variables for not requested data
        var subject_number;
        var author_number;
        var book_number;
        
        //Creating the book object
        var book = {
            Book_Name:                  req.body.book_name,
            Book_Edition:               req.body.book_edition,
            Book_ISBN_10_Number:        req.body.book_isbn_10_number,
            Book_ISBN_13_Number:        req.body.book_isbn_13_number,
            Book_Price:                 req.body.book_price,
            Book_Type:                  req.body.book_type,
            STUDENT_Student_Number:     req.keystudentNumber
        };
        
        //Creating the author object
        var author = {
            Author_Name:   req.body.author_name
        };
        
        //Getting a connection to the MySQL database
        pool.getConnection()
        .then(function(conn) {
            connection = conn;

            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fsubject, req.body.subject_code);
        })
        .then(function(subjectRow){
            //If function to test if the data you want to find exists in the database
            if(subjectRow[0].length === 0)
            {                
                res.status(400).json({message:'Subject does not exist.'});
                connection.release();
            } else{
                if(subjectRow[0].Subject_Code === req.body.subject_code)
                {                    
                    subject_number = subjectRow[0].Subject_Number;
                }
            }
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fbook, [req.body.book_name, req.body.book_edition, req.body.book_isbn_10_number, req.body.book_isbn_13_number, req.body.book_price, req.body.book_type, 'DEFAULT', req.keystudentNumber]);
        })
        .then(function(bookRow){
            //If function to test if the data you want to add exists in the database
            if(bookRow.length === 0)
            {
                //Sending a SQL query to the database to add the book
                connection.query(ibook, book, (err, result) => {
                    if (err){                        
                        res.status(400).json({message:'Could not add Book'});
                        connection.release();
                    }                    
                });
            }
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fbook, [req.body.book_name, req.body.book_edition, req.body.book_isbn_10_number, req.body.book_isbn_13_number, req.body.book_price, req.body.book_type, req.keystudentNumber]);
        })
        .then(function(booksRow){
            //If function to test if the data you want to find exists in the database
            if(booksRow.length === 0)
            {               
                res.status(400).json({message:'Books data is empty.'}); 
                connection.release();
            } else {
                book_number = booksRow[0].Book_Number;
            }
            
            //Sending a SQL query to the database and making a PROMISE    
            return connection.query(fauthor, req.body.author_name);
        })
        .then(function(authorRow){
            //If function to test if the data you want to add exists in the database
            if(authorRow.length === 0)
            {
                //Sending a SQL query to the database
                connection.query(iauthor, author, (err, result) => {
                    if (err){
                        res.status(400).json({message:'Author was not added.'});
                        connection.release();
                    }                    
                    })
            }
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fauthor, req.body.author_name);
        })
        .then(function(authorsRow){
            //If function to test if the data you want to find exists in the database
            if(authorsRow.length === 0)
            {
                res.status(400).json({message:'Author was not found.'});
                connection.release();
            } else {
                if(authorsRow[0].Author_Name === req.body.author_name)
                {
                    author_number = authorsRow[0].Author_Number;
                }
            }
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fbookauthor, [book_number, author_number]);
        })
        .then(function(bookauthorRow){
            //If function to test if the data you want to find exists in the database
            if(bookauthorRow.length === 0){
                //Creating the book_author object
                var book_author = {
                    AUTHOR_Author_Number:       author_number,
                    BOOK_Book_Number:           book_number
                }
                //Sending a SQL query to the database
                connection.query(ibookauthor, book_author, (err, result) => {
                    if (err){
                        res.status(400).json({message:'Book_Author was not inserted.'});
                        connection.release();
                    }                    
                });
            }
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fbooksubject, [book_number, subject_number]);
        })
        .then(function(booksubjectRow){
            //If function to test if the data you want to find exists in the database
            if(booksubjectRow.length === 0){
                //Creating the book_subject object
                var book_subject = {
                    SUBJECT_Subject_Number:     subject_number,
                    BOOK_Book_Number:           book_number
                }
                //Sending a SQL query to the database
                connection.query(ibooksubject, book_subject, (err, result) => {
                    if (err){
                        res.status(400).json({message:'Book_Subject was not inserted.'});
                        connection.release();
                    }
                });           
            }
            return connection.query(fStudent, req.keystudentNumber);
        })
        .then(function(studentRows){
            //Creating the email for when a student adds a book
            var mailOptions = {
                from: 'selitnotifier@gmail.com',
                to: studentRows[0].Email_Address,
                subject: 'SELIT notification',
                text: 'You have added the following book: ' + req.body.book_name + ' for subject ' + req.body.subject_code + ' at R' + req.body.book_price + '.'
            };

            //Sending the email to the student
            transporter.sendMail(mailOptions, function(error){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent to ' + req.body.student_number + ' using '+ studentRows[0].Email_Address);
                }
            });
        })
        .then(function(nothing){
            //Responding to the request that the book was added to the database.
            res.status(200).json({message:'The Book and all related data was added to the database.'});
            connection.release();
        })
        .catch(function(err) {
            res.status(404).json({error:'Error occured with the create book sql statements.'});
            connection.release();
        });
    });
}
catch(error)
{
    res.status(500).json({message:'Error caught at Create Book in api/routes/book.js.'});
}

//Read Book
//This is a get method to get all the books in the system
//URL:  http://localhost:3000/book/getBook
//Requested data:   Key in header
//Data sent:        JSON format of all the books in the system
//                  400 If the adding was unsuccessful
try{
    router.get('/getBook', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Read Book
        var viewBookSQL = 'SELECT Book_Name, Book_Edition, Author_Name, Subject_Code, Book_Price, Book_ISBN_10_Number, Book_ISBN_13_Number, Book_Type, Date_Placed, Student_Number, First_Name, Contact_Number, Email_Address FROM book_detail;'

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Book data could not be found.'});
                    connection.release();
                }   
            });
        });
    });
}
catch(error)
{
    res.status(500).json({message:'Error caught at Read Book in api/routes/book.js.'});
}

//Admin Read Book
//This method is for administrators to view more information of the all books in the system
//URL:  http://localhost:3000/book/adminBook
//Requested data:   Admin Key in header
//Data sent:        JSON format of all the books in the system
//                  400 If the adding was unsuccessful
try{
    router.get('/adminBook', adminAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Read Book
        var viewBookSQL = 'SELECT * FROM book_detail'

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Book data could not be found.'});
                    connection.release();
                }   
            });
        });
    });
}
catch(error)
{
    res.status(500).json({message:'Error caught at Admin Read Book in api/routes/book.js.'});
}

//Read My Book
//Used to view the users book in the system
//URL:  http://localhost:3000/book/myBook
//Requested data:   Key in header
//Data sent:        JSON format of the users books in the system
//                  400 If the adding was unsuccessful
try{
    router.get('/myBook', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Read My Book
        var viewBookSQL = 'SELECT book.Book_Number, book.Book_Name, book.Book_Edition, book.Book_ISBN_10_Number, book.Book_ISBN_13_Number, book.Book_Price, book.Book_Type, book.Date_Placed, author.Author_Name,subject.Subject_Code FROM book, book_author, book_subject, author, subject where book.Book_Number = book_author.BOOK_Book_Number and book.Book_Number = book_subject.BOOK_Book_Number and book_author.AUTHOR_Author_Number = author.Author_Number and book_subject.SUBJECT_Subject_Number = subject.Subject_Number and book.STUDENT_Student_Number = ?'

        //Creating var to get the student_number of the person logged in
        var studentNumber = req.keystudentNumber;

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, studentNumber, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Data could not be found for personal books placed.'});
                    connection.release();
                }                
            });
        });
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Read My Book in api/routes/book.js.'});
}

//Delete Book
//This method is used to detele a book from the system if the book belongs to the user who initiated the deletion.
//URL:  http://localhost:3000/book/myBook/delete
//Requested data:   Key in header
//                  book_number
//Data sent:        200 If the deletion was successful
//                  400 If the deletion was unsuccessful
try{
    router.post('/myBook/delete', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Admin Delete Book
        var dBookauthor = 'DELETE FROM book_author where book_book_number = ?';
        var dBooksubject = 'DELETE FROM book_subject where book_book_number = ?';
        var dBook = 'DELETE FROM book where book_number = ?';
        var fBook = 'SELECT * FROM book where book_number = ?';

        //Creating variable to store the book_number to be deleted
        var bookNumber = req.body.book_number;
        
        pool.getConnection()
        .then(function(conn) {
            connection = conn;
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fBook, bookNumber);
        })
        .then(function(bookRow){
            //If function to test if the data you want to delete exists in the database
            if(bookRow.length === 0){
                res.status(400).json({error:'The Book you want to delete does not exist.'});
                connection.release();
            } else {
                //If statement to test if the book you want to delete belongs to you.
                if(bookRow[0].STUDENT_Student_Number === req.keystudentNumber){
                    //Sending a SQL query to delete the book_author record
                    connection.query(dBookauthor, bookRow[0].Book_Number, (err, result) => {
                        if (err){
                            res.status(400).json({message:'Book_Author could not be deleted.'});
                            connection.release();
                        }
                    });
                    //Sending a SQL query to delete the book_subject record
                    connection.query(dBooksubject, bookRow[0].Book_Number, (err, result) => {
                        if (err){
                            res.status(400).json({message:'Book_Subject could not be deleted.'});
                            connection.release();
                        }                    
                    });
                    //Sending a SQL query to delete the book
                    connection.query(dBook, bookRow[0].Book_Number, (err, result) => {
                        if (result){
                            res.status(200).json({message:'Book was deleted.'});
                            connection.release();
                        }
                        if (err){
                            res.status(400).json({message:'Book could not be deleted.'});
                            connection.release();
                        }                    
                    });
                } else {
                    res.status(400).json({message:'The book you want to delete does not belong to you.'});
                    connection.release();
                }
            }
        })
        .catch(function(err) {
            res.status(404).json({error:'Error occured with the delete book sql statements.'});
            connection.release();
        });

    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Delete Book in api/routes/book.js.'});
}

//Admin Delete Book
//This method is used by administrators to delete any book in the system.
//URL:  http://localhost:3000/book/adminbook/delete
//Requested data:   Admin key in header
//                  book_number
//Data sent:        200 If the deletion was successful
//                  400 If the deletion was unsuccessful
try{
    router.post('/adminBook/delete', adminAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Admin Delete Book
        var dBookauthor = 'DELETE FROM book_author where book_book_number = ?';
        var dBooksubject = 'DELETE FROM book_subject where book_book_number = ?';
        var dBook = 'DELETE FROM book where book_number = ?';
        var fBook = 'SELECT * FROM book where book_number = ?';

        //Creating variable to store the book_number to be deleted
        var bookNumber = req.body.book_number;
        
        pool.getConnection()
        .then(function(conn) {
            connection = conn;
            //Sending a SQL query to the database and making a PROMISE
            return connection.query(fBook, bookNumber);
        })
        .then(function(bookRow){
            //If function to test if the data you want to delete exists in the database
            if(bookRow.length === 0)
            {
                res.status(400).json({error:'The Book you want to delete does not exist.'});
                connection.release();
            } else {
                //Sending a SQL query to delete the book_author record
                connection.query(dBookauthor, bookRow[0].Book_Number, (err, result) => {
                    if (err){
                        res.status(400).json({message:'Book_Author could not be deleted.'});
                        connection.release();
                    }
                });
                //Sending a SQL query to delete the book_subject record
                connection.query(dBooksubject, bookRow[0].Book_Number, (err, result) => {
                    if (err){
                        res.status(400).json({message:'Book_Subject could not be deleted.'});
                        connection.release();
                    }                    
                });
                //Sending a SQL query to delete the book
                connection.query(dBook, bookRow[0].Book_Number, (err, result) => {
                    if (result){
                        res.status(200).json({message:'Book was deleted.'});
                        connection.release();
                    }
                    if (err){
                        res.status(400).json({message:'Book could not be deleted.'});
                        connection.release();
                    }                    
                });
            }
        })
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Admin Delete Book in api/routes/book.js.'});
}

//Filter Type Book
//This method is used to filter the books by book type
//URL:  http://localhost:3000/book/type
//Requested data:   Key in header
//                  book_type
//Data sent:        JSON format of all the filtered books
//                  400 If the filter was unsuccessful
try{
    router.post('/type', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Filter book types
        var viewBookSQL = 'SELECT Book_Name, Book_Edition, Author_Name, (Subject_Code), Book_Price, Book_ISBN_10_Number, Book_ISBN_13_Number, Book_Type, Date_Placed, Student_Number, First_Name, Contact_Number, Email_Address FROM book_detail where Book_Type = ?'

        //Creating variables for the data that was requested
        var bookType = req.body.book_type;

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, bookType, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Data could not be found for ' + bookType + 's.'});
                    connection.release();
                }                
            });
        });
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Filter Type Book in api/routes/book.js.'});
}

//Filter Price Book
//This method is used to filter the books by price
//URL:  http://localhost:3000/book/price
//Requested data: Key in header
//                book_price
//Data sent:        JSON format of all the filtered books
//                  400 If the filter was unsuccessful
try{
    router.post('/price', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Filter book types
        var viewBookSQL = 'SELECT Book_Name, Book_Edition, Author_Name, Subject_Code, Book_Price, Book_ISBN_10_Number, Book_ISBN_13_Number, Book_Type, Student_Number, Date_Placed, First_Name, Contact_Number, Email_Address FROM book_detail where Book_Price <= ?'

        //Creating variables for the data that was requested
        var bookPrice = req.body.book_price;

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, bookPrice, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Data could not be found.'});
                    connection.release();
                }                
            });
        });
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Filter Price Book in api/routes/book.js.'});
}

//Filter Subject Book
//This method is used to filter the books by subject
//URL:  http://localhost:3000/book/subject
//Requested data: Key in header
//                subject_code
//Data sent:        JSON format of all the filtered books
//                  400 If the filter was unsuccessful
try{
    router.post('/subject', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Filter book types
        var viewBookSQL = 'SELECT Book_Name, Book_Edition, Author_Name, Subject_Code, Book_Price, Book_ISBN_10_Number, Book_ISBN_13_Number, Book_Type, Date_Placed, Student_Number, First_Name, Contact_Number, Email_Address FROM book_detail where Subject_Code = ?;'

        //Creating variables for the data that was requested
        var bookSubject = req.body.subject_code;

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, bookSubject, (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Data could not be found.'});
                    connection.release();
                }                
            });
        });
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Filter Price Book in api/routes/book.js.'});
}

//Filter Subject and Price Book
//This method is used to filter the books by subject, price and book type
//URL:  http://localhost:3000/book/subject/price/type
//Requested data: Key in header
//                subject_code
//                book_price
//Data sent:        JSON format of all the filtered books
//                  400 If the filter was unsuccessful
try{
    router.post('/subject/price/type', checkAuth, jsonParser, (req, res, next) => {
        //Creating SQL variables for the Filter book types
        var viewBookSQL = 'SELECT Book_Name, Book_Edition, Author_Name, Subject_Code, Book_Price, Book_ISBN_10_Number, Book_ISBN_13_Number, Book_Type, Date_Placed, Student_Number, First_Name, Contact_Number, Email_Address FROM book_detail where Subject_Code = ? and Book_Type = ? and Book_Price <= ?;'

        //Creating variables for the data that was requested
        var bookSubject = req.body.subject_code;
        var bookPrice = req.body.book_price;
        var booType = req.body.book_type;

        //Getting a connection to the MySQL database
        pool.getConnection().then((connection) => {
            //Sending the SQL query to the database
            connection.query(viewBookSQL, [bookSubject, booType, bookPrice], (err, result) => {
                if (result){
                    res.status(200).json(result);
                    connection.release();
                }
                if (err){
                    res.status(400).json({message:'Data could not be found.'});
                    connection.release();
                }                
            });
        });
    });
}
catch(error)
{
    res.status(500).json({error:'Error caught at Filter Price Book in api/routes/book.js.'});
}

//Exporting all the different routes to app.js
module.exports = router;