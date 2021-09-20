process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let bookISBN; 
let book;

beforeEach(async()=> {
    const result = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('12345', 'http://amazon.com/test, 'test author', 'English', 100, 'test publisher', 'test title', 2020)
        RETURNING *`); 
    
    bookISBN = result.rows[0].isbn
    book = result.rows[0]
})

afterEach(async()=>{
    await db.query(`DELETE FROM books`)
});

afterAll(async()=> {
    await db.end()
});

describe("GET /books", function(){
    test("GET a list of all", async()=>{
        const resp = await request(app).get('/books');
        const books = resp.body.books;

        expect(resp.statusCode).toBe(200);
        expect(books).toEqual(expect.objectContaining(book))


    })
});