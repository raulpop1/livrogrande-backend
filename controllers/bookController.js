const { Book, Publisher } = require('../models');

let generatorInterval = null;

//read with filter by genre
exports.getBooks = async (req, res) => {
  try {
    const { genre } = req.query;
    const whereClause = genre ? { genre } : {};

    //fetch from PostgreSQL, automatically joining Publisher data (3NF)
    const books = await Book.findAll({
      where: whereClause,
      include: [{ model: Publisher, as: 'publisher' }],
      order: [['id', 'ASC']] 
    });
    
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Publisher, as: 'publisher' }]
    });
    
    if (book) res.json(book);
    else res.status(404).json({ message: "Book not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- CREATE ---
exports.createBook = async (req, res) => {
  try {
    const { title, author, year, genre, publisherId } = req.body;

    if (!title || !author) return res.status(400).json({ message: "Title and Author are required" });
    if (year && parseInt(year) > new Date().getFullYear()) return res.status(400).json({ message: "Year cannot be in the future" });

    const newBook = await Book.create({
      title, 
      author, 
      year: parseInt(year) || 2024, 
      genre: genre || 'General', 
      publisherId: publisherId || 1 
    });

    const completeBook = await Book.findByPk(newBook.id, {
      include: [{ model: Publisher, as: 'publisher' }]
    });
    
    const io = req.app.get('io');
    if (io) io.emit('book_added', completeBook);
    
    res.status(201).json(completeBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- UPDATE ---
exports.updateBook = async (req, res) => {
  try {
    const { title, author, year, genre, publisherId } = req.body;

    if (title === "" || author === "") return res.status(400).json({ message: "Title and Author cannot be empty" });
    if (year && parseInt(year) > new Date().getFullYear()) return res.status(400).json({ message: "Year cannot be in the future" });

    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    await book.update({ 
      title, 
      author, 
      year: parseInt(year), 
      genre, 
      publisherId 
    });

    const updatedBook = await Book.findByPk(req.params.id, {
      include: [{ model: Publisher, as: 'publisher' }]
    });

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- DELETE ---
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    await book.destroy();
    res.status(200).json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//basic statistics
exports.getStats = async (req, res) => {
  try {
    const totalBooks = await Book.count();
    
    // Groups the books by genre and counts them using SQL aggregation
    const byGenre = await Book.findAll({
      attributes: ['genre', [Book.sequelize.fn('COUNT', Book.sequelize.col('id')), 'count']],
      group: ['genre']
    });

    res.json({ total: totalBooks, byGenre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//auto fill generator
exports.startGenerator = (req, res) => {
  if (generatorInterval) return res.status(400).json({ message: "Generator already running" });

  const io = req.app.get('io');
  
  generatorInterval = setInterval(async () => {
    try {
      // Async database creation inside the interval
      const newBook = await Book.create({
        title: `Auto Book ${Date.now().toString().slice(-4)}`,
        author: "Robot Author",
        year: 2024,
        genre: "Automated",
        publisherId: 1 // Assign to the first publisher in the DB
      });

      const completeBook = await Book.findByPk(newBook.id, {
        include: [{ model: Publisher, as: 'publisher' }]
      });

      if (io) io.emit('book_added', completeBook);
      console.log("🤖 Generator added:", completeBook.title);
      
    } catch (err) {
      console.error("Generator DB Error:", err.message);
    }
  }, 3000); 

  res.status(200).json({ message: "Generator started" });
};

exports.stopGenerator = (req, res) => {
  console.log("🛑 Stop command received from network!"); 
  
  clearInterval(generatorInterval);
  generatorInterval = null;
  res.status(200).json({ message: "Generator stopped" });
};