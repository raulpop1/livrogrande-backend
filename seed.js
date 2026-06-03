const { sequelize } = require('./models');
const { Publisher, Book } = require('./models');

async function seed() {
  await sequelize.sync(); // Ensure connection

  // 1. Create a Publisher
  const pub1 = await Publisher.create({ name: 'Verso Books', location: 'London' });
  const pub2 = await Publisher.create({ name: 'Tor Books', location: 'New York' });

  // 2. Create Books linked to those publishers
  await Book.bulkCreate([
    { title: 'Liberalism: A Counter-History', author: 'Domenico Losurdo', year: 2005, genre: 'History', publisherId: pub1.id },
    { title: 'The Three-Body Problem', author: 'Liu Cixin', year: 2008, genre: 'Science Fiction', publisherId: pub2.id },
    { title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'Science Fiction', publisherId: pub2.id }
  ]);

  console.log("✅ Database seeded successfully!");
  process.exit();
}

seed();