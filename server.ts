import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

//PASTE ROUTE PARAMS
//GET ROUTE PARAM
app.get("/pastes", async (req, res) => {
  try{
  const mostRecentTenPastes = await client.query('select * from paste_entries order by date desc limit 10');
  res.json(mostRecentTenPastes.rows);
  }
  catch(err){
    console.error(err.message)
  }
});

//GET SPECIFIC PASTE ROUTE PARAM
app.get("/pastes/:id", async (req, res) => {
  try{
    const id= parseInt(req.params.id);
    const specificPaste = await client.query('select * from paste_entries WHERE id=$1',[id]);
    res.json(specificPaste.rows);
  } catch(err){
    res.status(500).send("Sorry error!!");
    console.error(err);
  }
});

//POST ROUTE PARAM
app.post("/pastes/newpaste", async (req, res) => {
  try { 
  const {pastebody, title} = req.body;
  if (!pastebody){
    res.send('Please add a paste')
  }
  else {
  const newPost = await client.query('INSERT INTO paste_entries (pastebody, title) VALUES ($1, $2) RETURNING *', [pastebody, title]);
  console.log(newPost.rows);
  res.json(newPost.rows);
  }
} catch(err){
  res.status(500).send("Sorry error!!");
  console.error(err);
}
})

//DELETE A SPECIFIC PASTE ROUTE PARAM
app.delete("/pastes/:id", async (req, res)=>{
  try{
    const { id } = req.params;
    const deletePost= await client.query('DELETE FROM paste_entries WHERE id=$1',[id])
    res.send(`post with id: ${id} has been deleted`)
  }
  catch(err){
    res.status(500).send("Sorry error!!");
    console.error(err);
  }
})

//COMMENT ROUTE PARAMS

//GET 'pastes/:pasteId/comments' to get all comments corresponding to a specific paste.
app.get("/pastes/:id/comments", async (req,res) => {
  try{
    const { id } = req.params;
    const getAllComments = await client.query('SELECT * FROM comments WHERE pasteid = $1 order by date desc',[id])
    res.json(getAllComments.rows);
  }catch(err){
    res.status(500).send("Sorry error!!");
    console.error(err);
  }
})

//POST 'pastes/:pasteId/comments' to create a new comment specific to a given paste.
app.post("/pastes/:id/comments", async (req, res) => {
  try { 
  const { id } = req.params;
  const {commentbody} = req.body;
  if (!commentbody){
    res.send('Please add a comment')
  } else {
    const newComment = await client.query('INSERT INTO comments (commentbody, pasteid) VALUES ($1, $2) RETURNING *', [commentbody, id])
    res.json(newComment.rows);
  }} catch(err){
    res.status(500).send("Sorry error!!");
    console.error(err);
  }});

//DELETE 'pastes/:pasteId/comments/:commentId' to delete a comment of a given id that belongs on a given paste.
app.delete('/pastes/:pasteid/comments/:commentid', async (req,res) => {
  try {
    const { pasteid } = req.params;
    const { commentid } = req.params;
    const deleteComment = await client.query('DELETE FROM comments WHERE pasteid = $1 AND commentid = $2', [pasteid, commentid])
    res.send(`comment with comment id: ${commentid} on paste with id: ${pasteid} has been deleted`)
  } catch(err){
    res.status(500).send("Sorry error!!");
    console.error(err);
  }
})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
