const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3000;

// middleware  DB_USER = "midistie"   DB_PASS = "oE4lyq3S9Cze3Me8"
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ftktcj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function bootstrap() {
  try {
    await client.connect();
    const database = client.db("Midisite");
    const usersCollection = database.collection("Users");
    const appointmentsCollection = database.collection("Services");
    const bookingCollection = database.collection("Bookings");

    // bookings

    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        service: booking.service,
      };
      const alreadyBooked = await bookingCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already Booking on:${booking.appointmentDate}, Try another Day`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });


    //service 
    app.get('/appointmentOptions', async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentsCollection.find(query).toArray();

      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

      options.forEach(option => {
        const optionBooked = alreadyBooked.filter(book => book.service === option.name);
        const bookedSlots = optionBooked.map(book => book.slot);
        const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
        option.slots = remainingSlots
      })
      res.send(options)
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result)
    })



  } finally {
    // await client.close();
  }
}
bootstrap().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medisite Base Toute");
});

app.listen(port, () => {
  console.log(`Midisite Running on: ${port}`);
});
