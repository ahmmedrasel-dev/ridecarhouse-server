const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const jwt = require('jsonwebtoken');


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

    // Auth JSON Token.
    app.post('/login', (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRATE, {
        expiresIn: '1d'
      });
      res.send(accessToken)
    })

    function verifyJWT(req, res, next) {
      const authHeaders = req.headers.authorization;
      if (!authHeaders) {
        return res.status(401).send({ message: 'Unauthorization Access' })
      }
    }

    app.get('/car', async (req, res) => {
      const query = {};
      const cursor = carCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    // Add car in databse api.
    app.post('/add-car', async (req, res) => {
      const car = req.body;

      if (!car.car_name || !car.picture || !car.price && !car.quantity || !car.suplier || !car.brand || !car.product_details) {
        return res.send({ success: false, error: "Plese Provide All Information." });
      }

      await carCollection.insertOne(car);
      res.send({ success: true, message: 'Data Inserted!' })

    })

    // Single Car APi
    app.get('/car/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const car = await carCollection.findOne(query);
      res.send(car);
    })

    // Single Idividual APi
    app.get('/myitems', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const cursor = carCollection.find(query);
      const car = await cursor.toArray()
      res.send(car);
    })

    app.delete('/car/:id', async (req, res) => {
      const id = req.params.id
      console.log(id);
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