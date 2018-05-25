const fetch = require('node-fetch');
const util = require('util');
const { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList} = require('graphql');
const paresXML = util.promisify(require('xml2js').parseString);


const BookType = new GraphQLObjectType({
    name: 'Book',
    description: '...',
    fields: () => ({
        title: {
            type: GraphQLString,
            resolve: xml => 
                xml.GoodreadsResponse.book[0].title[0]
        },
        isbn: {
            type: GraphQLString,
            resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
        }
    })
})

const AuthorType = new GraphQLObjectType({
    name: "Author",
    description: '...',
    fields: () => ({
        name: {
            type: GraphQLString,
            resolve: xml => xml.GoodreadsResponse.author[0].name[0]
        },
        books: {
            type: new GraphQLList(BookType),
            resolve: xml =>{
                const array_ids = xml.GoodreadsResponse.author[0].books[0].book.map(element => element.id[0]._);
                console.log(array_ids);
                return Promise.all(array_ids.map(id => 
                    fetch(`https://www.goodreads.com/book/show/${ id }.xml?key=${ process.env.KEY }`)
                        .then(response => response.text())
                        .then(paresXML)
                        .then(i => {
                            console.log(i)
                            return i;
                        })
                ))
            }
        }
    }),
})

module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        description: '...',

        fields: () => ({
            author: {
                type: AuthorType,
                args: {
                    id: { type: GraphQLInt }
                },
                resolve: (root, args) => fetch(
                    `https://www.goodreads.com/author/show/${ args.id }?format=xml&key=${ process.env.KEY }`
                )
                .then(response => response.text())
                .then(paresXML)
            }
        })
    })
})