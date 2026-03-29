const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Deployment Tip: Use process.env.MONGO_URI for production
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:Password123@smartq.qmr301c.mongodb.net/SmartQ?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Connection Error:", err));

// --- SCHEMAS ---
const Provider = mongoose.model("Provider", new mongoose.Schema({
  providerId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  businessName: String,
  type: String, 
  location: String,
  avgServiceTime: { type: Number, default: 20 }, 
  queue: [{
    customerName: String,
    mobile: String,
    duration: Number,
    startTime: { type: Date, default: Date.now }
  }]
}));

const Customer = mongoose.model("Customer", new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  email: String,
  mobile: String
}));

// --- ROUTES ---
app.get("/api/providers", async (req, res) => {
  try {
    const data = await Provider.find({}, { password: 0 });
    res.json(data);
  } catch (e) { res.status(500).json([]); }
});

app.post("/api/provider/register", async (req, res) => {
  try {
    let time = 20;
    if(req.body.type === "Hospital") time = 30;
    if(req.body.type === "Salon") time = 45;
    const p = new Provider({ ...req.body, avgServiceTime: time });
    await p.save();
    res.json(p);
  } catch (err) { res.status(400).json({ message: "Business ID already taken!" }); }
});

app.post("/api/provider/login", async (req, res) => {
  const p = await Provider.findOne({ providerId: req.body.providerId, password: req.body.password });
  p ? res.json(p) : res.status(401).json({ message: "Invalid Credentials" });
});

app.post("/api/customer/register", async (req, res) => {
  try {
    const c = new Customer(req.body);
    await c.save();
    res.json(c);
  } catch (err) { res.status(400).json({ message: "Username already taken!" }); }
});

app.post("/api/customer/login", async (req, res) => {
  const c = await Customer.findOne({ userId: req.body.userId, password: req.body.password });
  c ? res.json(c) : res.status(401).json({ message: "Invalid Credentials" });
});

app.post("/api/join/:id", async (req, res) => {
  try {
    const p = await Provider.findById(req.params.id);
    p.queue.push({ 
      customerName: req.body.customerName, 
      mobile: req.body.mobile, 
      duration: p.avgServiceTime 
    });
    await p.save();
    res.json(p);
  } catch (e) { res.status(400).json({ message: "Failed to join" }); }
});

app.post("/api/complete/:providerId/:index", async (req, res) => {
  try {
    const p = await Provider.findById(req.params.providerId);
    p.queue.splice(req.params.index, 1);
    await p.save();
    res.json(p);
  } catch (e) { res.status(400).json({ message: "Failed to complete" }); }
});

// Deployment Tip: Use process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SmartQ Backend running on Port ${PORT}`));