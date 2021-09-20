process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBookISBN; 
let testBook;

beforeEach(async()=> {
    const result = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('12345', 'http://amazon.com/test', 'test author', 'English', 100, 'test publisher', 'test title', 2020)
        RETURNING *`); 
    
    testBookISBN = result.rows[0].isbn
    testBook = result.rows[0]
})

afterEach(async()=>{
    await db.query(`DELETE FROM books`)
});

afterAll(async()=> {
    await db.end()
});

describe("GET /books", ()=>{
    test("GET a list of all", async ()=>{
        const resp = await request(app).get('/books');
        const books = resp.body.books;

        expect(resp.statusCode).toBe(200);
        expect(books[0]).toEqual(expect.objectContaining(testBook))
        expect(books[0].isbn).toEqual(testBookISBN)
    })
});

describe("GET /books/:id", ()=>{
    test("GET book by id(isbn)", async ()=>{
        const resp = await request(app).get(`/books/${testBookISBN}`);
        const book = resp.body.book;

        expect(resp.statusCode).toBe(200);
        expect(book).toEqual(expect.objectContaining(testBook))
        expect(book.isbn).toEqual(testBookISBN)
    });

    test("GET error with invalid id(isbn)", async ()=>{
        const resp = await request(app).get(`/books/999`);
    
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toHaveProperty("error")
    });
});

describe("POST /books/", ()=>{
    test("Create a new book", async ()=>{
        const test2 = {
            "isbn": "4567",
            "amazon_url": "http://amazon.com/test2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
          }

        const resp = await request(app).post(`/books`).send(test2);
        const book = resp.body.book;

        expect(resp.statusCode).toBe(201);
        expect(book).toEqual(expect.objectContaining(test2))
        expect(book.isbn).toEqual(test2.isbn)
    });

    test("GET error with invalid data", async ()=>{
        const invalidData = {
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
          }
        const resp = await request(app).post(`/books`).send(invalidData);

        expect(resp.statusCode).toBe(400);
        expect(resp.body).toHaveProperty("error")
    });
});

describe("PUT /books/:id", ()=>{
    test("Update Book with valid information", async ()=>{
        
        testBook.title = "New test title"
        const resp = await request(app).put(`/books/${testBookISBN}`).send(testBook);
        const book = resp.body.book;

        expect(resp.statusCode).toBe(200);
        expect(book).toEqual(expect.objectContaining(testBook))
        expect(book.title).toEqual(testBook.title)
    });

    test("GET error with invalid data", async ()=>{
        const invalidData = {
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
          }
        const resp = await request(app).put(`/books`).send(invalidData);

        expect(resp.statusCode).toBe(404);
        expect(resp.body).toHaveProperty("error")
    });
});

describe("DELETE /books/:id", ()=>{
    test("DELETE books with valid isbn", async ()=>{
        
        const successfulDeleteResponse = {message: "Book deleted"};
        const resp = await request(app).delete(`/books/${testBookISBN}`);
     
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(successfulDeleteResponse)

    });

    test("GET error with invalid isbn", async ()=>{
        
        const resp = await request(app).delete(`/books/999`);
     
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toHaveProperty("error")
    });

});
