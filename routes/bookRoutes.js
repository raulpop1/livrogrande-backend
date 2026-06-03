const express = require('express');
const router = express.Router();
const { Book, Publisher } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth'); 
let generatorInterval = null;

// 1. HEALTH CHECK (No token required)
router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

router.get('/publishers/list', async (req, res) => {
  try {
    const pubs = await Publisher.findAll();
    res.json(pubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL BOOKS (Normal Users & Admins)
router.get('/', verifyToken, async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [{ model: Publisher, as: 'publisher' }]
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE A BOOK (Admins Only) --> THIS WAS MISSING!
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE A BOOK (Admins Only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Book.update(req.body, { where: { id } });
    if (updated) {
      const updatedBook = await Book.findOne({ where: { id } });
      res.status(200).json(updatedBook);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE A BOOK (Admins Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Book.destroy({ where: { id } });
    if (deleted) res.status(204).send();
    else res.status(404).json({ message: 'Book not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/start-generator', verifyToken, isAdmin, async (req, res) => {
  try {
    // 1. Prevent multiple generators from running at the same time
    if (generatorInterval) clearInterval(generatorInterval);

    const defaultPublisher = await Publisher.findOne();
    const pubId = defaultPublisher ? defaultPublisher.id : null;
    const genres = ['Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'History', 'Biography'];
    
    // 2. Grab your Socket.io connection from the Express app
    const io = req.app.get('io'); 

    // 3. Start the continuous heartbeat (runs every 3000ms / 3 seconds)
    generatorInterval = setInterval(async () => {
      try {
        const newBook = await Book.create({
          title: `Livrogrande Bestseller #${Math.floor(Math.random() * 10000)}`,
          author: `Author ${Math.floor(Math.random() * 100)}`,
          genre: genres[Math.floor(Math.random() * genres.length)],
          year: 1900 + Math.floor(Math.random() * 124),
          publisherId: pubId
        });
        
        // 4. Emit a WebSocket signal to the frontend that a book was added!
        if (io) io.emit('book_added', newBook);
      } catch (err) {
        console.error("Interval Save Error:", err);
      }
    }, 3000); 

    res.status(200).json({ message: "Generator started! Adding 1 book every 3 seconds." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LIVE GENERATOR (Stop) ---
router.post('/stop-generator', verifyToken, isAdmin, (req, res) => {
  // If the timer is running, kill it!
  if (generatorInterval) {
    clearInterval(generatorInterval);
    generatorInterval = null;
    res.status(200).json({ message: "Generator stopped." });
  } else {
    res.status(400).json({ message: "Generator is not running." });
  }
});

module.exports = router;