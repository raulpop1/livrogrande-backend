const publishers = [
  { id: 'p1', name: 'Verso Books', founded: 1970 },
  { id: 'p2', name: 'Tor Books', founded: 1980 },
  { id: 'p3', name: 'Penguin Classics', founded: 1946 },
  { id: 'p4', name: 'Vintage', founded: 1954 }
];

let books = [
  { id: '1', title: 'Liberalism: A Counter-History', author: 'Domenico Losurdo', year: 2005, genre: 'History', publisherId: 'p1' },
  { id: '2', title: 'The Three-Body Problem', author: 'Liu Cixin', year: 2008, genre: 'Science Fiction', publisherId: 'p2' },
  { id: '3', title: 'What Is to Be Done?', author: 'Vladimir Lenin', year: 1902, genre: 'Political Theory', publisherId: 'p3' },
  { id: '4', title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'Science Fiction', publisherId: 'p2' },
  { id: '5', title: 'Capital: Volume I', author: 'Karl Marx', year: 1867, genre: 'Political Theory', publisherId: 'p3' },
  { id: '6', title: 'The Dispossessed', author: 'Ursula K. Le Guin', year: 1974, genre: 'Science Fiction', publisherId: 'p2' },
  { id: '7', title: 'A People\'s History of the United States', author: 'Howard Zinn', year: 1980, genre: 'History', publisherId: 'p1' },
  { id: '8', title: '1984', author: 'George Orwell', year: 1949, genre: 'Fiction', publisherId: 'p3' },
  { id: '9', title: 'The Wretched of the Earth', author: 'Frantz Fanon', year: 1961, genre: 'Political Theory', publisherId: 'p1' },
  { id: '10', title: 'Brave New World', author: 'Aldous Huxley', year: 1932, genre: 'Fiction', publisherId: 'p4' },
  { id: '11', title: 'Stalingrad', author: 'Antony Beevor', year: 1998, genre: 'History', publisherId: 'p4' },
  { id: '12', title: 'Neuromancer', author: 'William Gibson', year: 1984, genre: 'Science Fiction', publisherId: 'p2' }
];

module.exports = { books, publishers };