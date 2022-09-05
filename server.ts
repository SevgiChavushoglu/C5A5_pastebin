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

//POST ROUTE PARAM
app.post("/pastes", async (req, res) => {
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
} catch (err) {
  console.error(err.message);
}
})

app.delete("pastes/:id", async (req, res)=>{
  try{
    const id= parseInt(req.params.id);
    const deletePost= await client.query('DELETE FROM paste_entities WHERE id=$1',[id])
    res.send(`paste with id:${id} has been deleted`)
  }
  catch(err){
    console.error(err.message)
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
