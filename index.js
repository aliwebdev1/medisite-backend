const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3000;

// middleware  DB_USER = "midistie"   DB_PASS = "oE4lyq3S9Cze3Me8"
app.use(cors());
app.use(express.json());
app.use(fileUpload());

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
    const expertsCollection = database.collection("Experts");

    // bookings

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

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
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentsCollection.find(query).toArray();

      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingCollection
        .find(bookingQuery)
        .toArray();

      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.service === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
      });
      res.send(options);
    });

    // specialties
    app.get("/specialties", async (req, res) => {
      const query = {};
      const result = await appointmentsCollection
        .find(query)
        .project({ slots: 0, _id: 0 })
        .toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // update
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    // admin get
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // get expert
    app.get("/experts", async (req, res) => {
      const query = {};
      const result = await expertsCollection.find(query).toArray();
      res.send(result);
    });

    // add expert
    app.post("/add-expert", async (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const specialist = req.body.specialist;
      const image = req.files.image;
      const picData = image.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const expert = {
        name,
        email,
        specialist,
        image: imageBuffer,
      };
      const result = await expertsCollection.insertOne(expert);
      res.send(result);
    });
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
