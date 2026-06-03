const { gql } = require('apollo-server-express');
const shared = require('../sharedData');

const typeDefs = gql`
  type Publisher {
    id: ID!
    name: String!
    founded: Int
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    year: Int
    genre: String
    publisherId: ID
    publisher: Publisher
  }

  type Query {
    getBooks(page: Int, limit: Int): [Book]
    getBookById(id: ID!): Book
    getPublishers: [Publisher]
  }

  type Mutation {
    addBook(title: String!, author: String!, year: Int, genre: String, publisherId: ID): Book
    updateBook(id: ID!, title: String, author: String, year: Int, genre: String, publisherId: ID): Book
    deleteBook(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    getBooks: (_, { page = 1, limit = 10 }) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return shared.books.slice(startIndex, endIndex);
    },
    getBookById: (_, { id }) => shared.books.find(b => b.id === id),
    getPublishers: () => shared.publishers,
  },

  Book: {
    publisher: (parentBook) => shared.publishers.find(p => p.id === parentBook.publisherId)
  },
  
  Mutation: {
    addBook: (_, args) => {
      // 1-to-many lookup
      const pub = shared.publishers.find(p => p.id === args.publisherId) || shared.publishers[0];
      const newBook = {
        id: Date.now().toString(),
        ...args,
        publisher: { name: pub.name }
      };
      shared.books.push(newBook);
      return newBook;
    },
    updateBook: (_, { id, ...rest }) => {
      const index = shared.books.findIndex(b => b.id === id);
      if (index !== -1) {
         const pub = shared.publishers.find(p => p.id === rest.publisherId) || shared.publishers[0];
         shared.books[index] = { ...shared.books[index], ...rest, publisher: { name: pub.name } };
         return shared.books[index];
      }
      return null;
    },
    deleteBook: (_, { id }) => {
      const index = shared.books.findIndex(b => b.id === id);
      if (index !== -1) {
        shared.books.splice(index, 1);
        return true;
      }
      return false;
    }
  }
};

module.exports = { typeDefs, resolvers };