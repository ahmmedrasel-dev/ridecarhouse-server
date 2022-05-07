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
    const agendCollection = client.db('ride_car_house').collection('agend')

    // Auth JSON Token.
    app.post('/login', (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRATE, {
        expiresIn: '1d'
      });
      res.send(accessToken)
    })

    app.get('/agends', async (req, res) => {
      const query = {};
      const coursor = agendCollection.find(query);
      const result = await coursor.toArray();
      res.send(result)
    })

    function verifyJWT(req, res, next) {
      const authHeaders = req.headers.authorization;
      if (!authHeaders) {
        return res.status(401).send({ message: 'Unauthorization Access' })
      }

      const token = authHeaders.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRATE, (err, decode) => {
        if (err) {
          return res.status(403).send({ message: 'Forbidden Access.' })
        }
        req.decode = decode
        next()
      })
    }

    app.get('/car-pages', async (req, res) => {
      const count = await carCollection.estimatedDocumentCount();
      res.send({ count });
    })


    app.get('/car', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.pageSize);
      const query = {};
      const cursor = carCollection.find(query);
      let product;
      if (page || size) {
        product = await cursor.skip(page * size).limit(size).toArray();
      } else {
        product = await cursor.toArray();
      }
      res.send(product);
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

    // Single Car API
    app.get('/car/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const car = await carCollection.findOne(query);
      res.send(car);
    })

    // Single Idividual APi
    app.get('/myitems', verifyJWT, async (req, res) => {
      const decodedEmail = req.decode.email;
      const email = req.query.email;
      if (email == decodedEmail) {
        const query = { email: email }
        const cursor = carCollection.find(query);
        const car = await cursor.toArray()
        res.send(car);
      }
      else {
        res.status(403).send({ message: 'Forbidden Access.' })
      }

    })

    // Add Quantity API;
    app.put('/add-quanity/:id', async (req, res) => {
      const id = req.params.id;
      const oldQty = parseInt(req.query.oldQty)
      const qty = parseInt(req.body.quantity);
      const total = (oldQty + qty)
      const filter = { _id: ObjectId(id) };
      const options = { upset: true }
      const updateQuanity = {
        $set: {
          quantity: total
        }
      };
      const result = await carCollection.updateOne(filter, updateQuanity, options);
      res.send({ message: 'Qauntity Added.' })
    })

    // Update Delivery Quanity.
    app.put('/delivered/:id', async (req, res) => {
      const id = req.params.id;
      const quantity = req.body;
      const filter = { _id: ObjectId(id) }
      const options = { upset: true }
      const updateQuanity = {
        $set: {
          quantity: quantity.newQuanity
        }
      };
      const result = await carCollection.updateOne(filter, updateQuanity, options);
      res.send(result)
    })

    // Delete Single Item.
    app.delete('/car/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await carCollection.deleteOne(query);
      res.send(result)
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