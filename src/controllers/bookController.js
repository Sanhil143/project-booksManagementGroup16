
const BookModel = require("../models/bookModel")
const UserModel = require("../models/userModel")
const reviewModel = require("../models/reviewModel")
const { isValid, isValidISBN, isValidObjectId, isValidReleasedAt, } = require("../Validations/Validator");


// create book

const createBooks = async function (req, res) {
    try {
        let data = req.body
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data
        if (data.length == 0) {
            return res.status(400).send({ status: false, msg: "please give some data to create a book" })
        }
        if (!title) {
            return res.status(400).send({ status: false, msg: "title is mandatory" })
        }
        if (!excerpt) {
            return res.status(400).send({ status: false, msg: "excerpt is mandatory" })
        }
        if (!userId) {
            return res.status(400).send({ status: false, msg: "userId is mandatory" })
        }
        if (!ISBN) {
            return res.status(400).send({ status: false, msg: "ISBN is mandatory" })
        }
        if (!category) {
            return res.status(400).send({ status: false, msg: "category is mandatory" })
        }
        if (!subcategory) {
            return res.status(400).send({ status: false, msg: "subcategory is mandatory" })
        }

        if (!releasedAt) {
            return res.status(400).send({ status: false, msg: "releasedAt is mandatory" })
        }


        if (!isValid(excerpt)) {
            return res.status(400).send({ status: false, msg: "invalid excerpt" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Enter Valid user Id" })
        }

        if (!isValidISBN(ISBN)) {
            return res.status(400).send({ status: false, msg: "invalid ISBN" })
        }

        if (!isValid(category)) {
            return res.status(400).send({ status: false, msg: "invalid category type" })
        }

        if (!isValid(subcategory)) {
            return res.status(400).send({ status: false, msg: "invalid subcategory type" })
        }

        if (!isValidReleasedAt(releasedAt)) {
            return res.status(400).send({ status: false, msg: "invalid date" })
        }

        let verifyTitle = await BookModel.findOne({ title: title })
        if (verifyTitle) {
            return res.status(400).send({ status: false, msg: "title already exists" })
        }

        let verifyISBN = await BookModel.findOne({ ISBN: ISBN })
        if (verifyISBN) {
            return res.status(400).send({ status: false, msg: " ISBN already exists" })
        }

        // if (req.decode.userId !== userId ) {
        //     res.status(403).send({ status: false, msg: "Not Authorized" })
        // }

        const newBook = await BookModel.create(data)
        return res.status(201).send({ status: true, msg: "book created successfully", data: newBook })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

// Get book by query
const getBook = async (req, res) => {
    try {
        let query = req.query;

        // check request body.

        // sending all books which are not Deleted.
        if (Object.keys(query).length == 0) {
            let books = await BookModel.find({ isDeleted: false }).sort({ title: 1 })
                .select({
                    title: 1,
                    excerpt: 1,
                    userId: 1,
                    category: 1,
                    releasedAt: 1,
                    reviews: 1,
                });

            if (Object.keys(books).length == 0) {
                return res
                    .status(404)
                    .send({ status: false, message: "No Books Found..." });
            }
            // let sortedBooks = books.sort((a, b) => (a.name > b.name ? 1 : -1))
            return res
                .status(200)
                .send({ status: true, message: "Success", data: books });
        }

        // Destructuring
        const { userId, category, subcategory } = query;

        // userId validation.
        if (!isValidObjectId(userId)) {            
        return res.status(400).send({ status: false, message: "Invalid User Id..." });            
       }
        if(userId == ''){
        return res.status(400).send({ status: false, message: "enter userId" });
        }

        // adding keys to data object for creating a filter.
        if (userId) query.userId = userId;
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;


        let filter = { ...query, isDeleted: false };

        // sorting books by title in ascending order.
        let bookList = await BookModel.find(filter).sort({ title: 1 })

        if (!bookList) {
            return res.status(400).send({ status: false, message: "Book Not Found..." })
        }

        if (Object.keys(bookList).length == 0) {
            return res.status(404).send({ status: false, message: "Book Not Found..." });
        }
        return res.status(200).send({ status: true, message: "Books list", data: bookList });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// Get book by param
const getBookById = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (!bookId) return res.status(400).send({ status: false, message: "Please Enter BookId" })

        if (!isValidObjectId(bookId))
            return res.status(400).send({ status: false, message: "Please enter valid object id" })

        let book = await BookModel.findOne({ _id: bookId, isDeleted: false }).lean()

        if (!book) return res.status(404).send({ status: false, message: "Book doesn't exists" })

        //Authorization
        if (req.loginUserId !== book.userId.toString()) {
            return res.status(403).send({ status: false, message: "unathorised user" })
        }

        let reviewData = await reviewModel.find({  bookId:book._id, isDeleted: false })

        book["reviewData"] = reviewData;
        return res.status(200).send({ status: true, data: book })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

// update by param
const updateBook = async (req, res) => {
    try {
        let body = req.body
        if (Object.keys(body).length === 0) {
            return res.status(400).send({ status: false, message: "Please insert data on body" })
        }
        let bookId = req.params.bookId
        if (!body) {
            return res.status(400).send({ status: false, message: "Please insert id on param" })
        }
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Please enter valid  id" })
        }
        //destructuring body
        const { title, excerpt, releasedAt, ISBN } = body

        //checking book presence
        let checkBook = await BookModel.findOne({ _id: bookId })

        if (!checkBook) {
            return res.status(404).send({ status: false, message: "book not found" })
        }
        if (checkBook.isDeleted == true) {
            return res.status(404).send({ status: false, message: "book id already deleted" })
        }

        if (title && !isValid(title)) {
            return res.status(400).send({ status: false, message: "title should be in valid format" })
        }
        let checkTitle = await BookModel.findOne({ title: title, isDeleted: false })
        console.log(checkTitle);
        if (checkTitle) {
            return res.status(400).send({ status: false, message: "title is already  exist" })
        }
        //excerpt validation
        if (excerpt && !isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "excerpt should be in valid format" })
        }
        //releasedAt validation
        if (releasedAt && !isValidReleasedAt(releasedAt)) {
            return res.status(400).send({ status: false, message: "enter valid release date in YYYY-MM-DD format..." })
        }
        // ISBN validation
        if (ISBN && !isValidISBN(ISBN)) {
            return res.status(400).send({ status: false, message: "enter valid ISBN number" })
        }
        let checkIsbn = await BookModel.findOne({ ISBN: ISBN, isDeleted: false })
        if (checkIsbn) {
            return res.status(400).send({ status: false, message: "ISBN is already exist" })
        }
        //storing value on obj
        let updatedKey = {}

        if (title) {
            updatedKey.title = title
        }
        if (excerpt) {
            updatedKey.excerpt = excerpt
        }
        if (releasedAt) {
            updatedKey.releasedAt = releasedAt
        }
        if (ISBN) {
            updatedKey.ISBN = ISBN
        }
        if (req.loginUserId !== checkBook.userId.toString()) {
            return res.status(403).send({ status: false, message: "unathorised user" })
        }

        let updateBook = await BookModel.findOneAndUpdate({ _id: bookId, isDeleted: false },
            { $set: updatedKey }, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updateBook })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// delete by param
const deleteBook = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (!bookId) {
            return res.status(400).send({ status: false, message: "please provide a bookId in params" });
        }
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "bookId is not matched" });
        }
        let checkBookId = await BookModel.findOne({ _id: bookId, isDeleted: false })

        if (!checkBookId) {
            return res.status(404).send({ status: false, message: "no book found" });
        }
        //Authorization
        if (req.loginUserId !== checkBookId.userId.toString()) {
            return res.status(403).send({ status: false, message: "unathorised user" })
        }

        let deletedBook = await BookModel.findByIdAndUpdate({ _id: bookId }, { $set: { isDeleted: true } },
            { new: true });
        return res.status(200).send({ status: true, message: "book sucessfully deleted", deletedBook });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};



module.exports = { createBooks, getBook, updateBook, deleteBook, getBookById }




