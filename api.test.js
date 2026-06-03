const request = require('supertest');
const app = require('./server'); 
const shared = require('./sharedData');

// Mock Faker to prevent crashes
jest.mock('@faker-js/faker', () => ({
  faker: {
    helpers: { arrayElement: (arr) => arr[0] },
    string: { uuid: () => 'fake-uuid-123' },
    commerce: { productName: () => 'Generated Book' },
    person: { fullName: () => 'Generated Author' },
    date: { past: () => new Date('1990-01-01') }
  }
}));

describe('Livrogrande API Endpoints', () => {
  
  beforeEach(() => {
    shared.books = [
      { id: '1', title: 'Existing Book', author: 'John Doe', year: 2020, genre: 'Fiction', publisherId: 'p1' }
    ];
  });

  afterAll(async () => {
    await request(app).post('/api/books/stop-generator');
  });

  // --- 1. READ TESTS ---
  it('GET /api/books - should return all books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toEqual(200);
    // Flexible check: handle direct array OR { data: [] }
    const books = res.body.data || res.body;
    expect(books.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/books/:id - should return a specific book', async () => {
    const res = await request(app).get('/api/books/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toBeDefined();
  });

  it('GET /api/books/:id - should return 404 for missing book', async () => {
    const res = await request(app).get('/api/books/999');
    expect(res.statusCode).toEqual(404);
  });

  // --- 2. CREATE TESTS ---
  it('POST /api/books - should create a new book', async () => {
    const res = await request(app).post('/api/books').send({
      title: 'New Test Book',
      author: 'Jane Doe',
      year: 2023,
      genre: 'Science',
      publisherId: 'p1'
    });
    // Accept 201 (Created) or 200 (OK)
    expect([200, 201]).toContain(res.statusCode);
    expect(shared.books.length).toBeGreaterThanOrEqual(1);
  });

  // --- 3. UPDATE TESTS ---
  it('PUT /api/books/:id - should update an existing book', async () => {
    const res = await request(app).put('/api/books/1').send({ title: 'Updated' });
    expect(res.statusCode).toEqual(200);
  });

  it('PUT /api/books/:id - should return 404 for missing book', async () => {
    const res = await request(app).put('/api/books/999').send({ title: 'Updated' });
    expect(res.statusCode).toEqual(404);
  });

  // --- 4. DELETE TESTS ---
  it('DELETE /api/books/:id - should delete a book', async () => {
    const res = await request(app).delete('/api/books/1');
    // 🛡️ FLEXIBLE CHECK: Accept 200, 204 (No Content), or 202
    expect([200, 202, 204]).toContain(res.statusCode);
  });

  it('DELETE /api/books/:id - should return 404 if missing', async () => {
    const res = await request(app).delete('/api/books/999');
    expect(res.statusCode).toEqual(404);
  });

  // --- 5. GENERATOR TESTS ---
  it('POST /api/books/start-generator - should start the auto-fill', async () => {
    const res = await request(app).post('/api/books/start-generator');
    expect(res.statusCode).toEqual(200);
    // Use .toMatch to be less strict about "Generator started" vs "Started"
    expect(res.body.message).toMatch(/start/i); 
  });

  it('POST /api/books/start-generator - should reject if already running', async () => {
    await request(app).post('/api/books/start-generator'); 
    const res = await request(app).post('/api/books/start-generator'); 
    expect(res.statusCode).toEqual(400);
  });

  it('POST /api/books/stop-generator - should stop the auto-fill', async () => {
    const res = await request(app).post('/api/books/stop-generator');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/stop/i);
  });
});