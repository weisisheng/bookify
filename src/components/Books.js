import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Auth, API,graphqlOperation} from 'aws-amplify'
import { toast } from 'react-toastify';

import BookItem from './BookItem'
import SearchBox from './UI/SearchBox'
import { listBooks } from '../graphql/queries'
import { createBook, deleteBook } from '../graphql/mutations'

const Books = () => {
    const [bookData, setbookData] = useState()
    const [searchKey, setSearchKey] = useState()
    const [myBooks, setMyBooks] = useState()

   const [signInUser, setSignInUser] = useState(null)

    useEffect(() => {
        const fetchUser = async() => { 
            try{
                let user =  await Auth.currentAuthenticatedUser();
                await setSignInUser(user.attributes.sub)
             
            }
            catch(err) {
                console.log(err);
            }
        }
        fetchUser()
     },[])
    //https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor:keyes&key=AIzaSyCUjSXweCgK40ZnBNC_Z96mhHFD5wxhRg8

  const handleSubmit = () => {
    axios.get(`https://www.googleapis.com/books/v1/volumes?q=${searchKey}&key=${process.env.REACT_APP_API_KEY}`) 
      .then((response) => {
        setbookData(response.data.items)           
    })
    .catch((error) => {
    console.log(error)
    })
  }

  const fetchBooks = useCallback(async () => {
    try{
        const todoData = await API.graphql(graphqlOperation(listBooks,{
          filter : { userId : {eq: signInUser } }
        }))
        setMyBooks(todoData.data.listBooks.items);
        
    }
    catch(err){
        console.log("Error fetching", err);
    }
},[signInUser])

const removeBook = async (title) => {
  try{
      const book  = myBooks.filter(item => item.title === title)
      await API.graphql(graphqlOperation(deleteBook, {input:{id:book[0].id}}))
      setbookData(bookData.filter(item => item.volumeInfo.title !== book[0].title))
      toast.error(`${title} Removed Successfully`);
  }
  catch(err){
      console.log("Error in deleting",err);
  }
}

const addBooks = async ({title, authors, description, published, image, link, userId}) => {
  try{
    console.log("USER",signInUser);
      const book = {title, authors, description, published, image, link, userId:signInUser}
      let response = await API.graphql(graphqlOperation(createBook, {input:book}))
      toast.success(`${title} Added Successfully`);
      console.log(response);
  }
  catch(err){
      console.log("Error in creating", err)
  }
}


useEffect(() => {
    fetchBooks()
},[])

  console.log(myBooks);
  return (
        <div>
           <div className="flex justify-center">
             <SearchBox  onChange={(e) => (setSearchKey(e.target.value))} onClick={handleSubmit}/>             
           </div>
           <div className= "flex flex-wrap content-start">     
            {bookData ? (
                bookData.map((item) => (
                  <BookItem 
                   key={item.id}
                   title = {item.volumeInfo.title}
                   authors = {item.volumeInfo.authors}
                   description={item.volumeInfo.description}
                   published ={item.volumeInfo.publishedDate}
                   image={item.volumeInfo.imageLinks.thumbnail ? item.volumeInfo.imageLinks.thumbnail : "N/A"}
                   link={item.volumeInfo.previewLink}
                   bookAdded ={myBooks && myBooks.map(book => book.title )}
                   bookId = {myBooks && myBooks.map(book => book.id)}
                   books={myBooks}
                  removeBook={removeBook}
                  addBook={addBooks}
                 />
             ))
            ) :  
            (
            <div className= "pl-96 pt-10">
                <p className="font-bold	text-4xl text-gray-600" > All the books in the universe now under your finger tips..!!</p>
                </div>
             
            )
          }
            </div>            
        </div>
    )
}

export default Books
