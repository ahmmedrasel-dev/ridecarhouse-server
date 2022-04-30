const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion } = require('mongodb');


// Middleware.
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqdjl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get('/', (req, res) => {
  res.send('Surver is running')
})
async function run() {
  try {
    await client.connect();
    const carCollection = client.db('ride_car_house').collection('car');

    app.get('/car', async (req, res) => {
      const query = {};
      const cursor = carCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/add-car', async (req, res) => {
      const carItem = req.body;
      const result = await carCollection.insertOne(carItem);
      res.send({ success: true, message: 'Data Inserted!' })

    })

  }
  finally {
    // await client.close();
  }
}
run().catch(console.dir)


app.listen(port, () => {
  console.log(`Server is runnnig from Port: ${port}`)
})