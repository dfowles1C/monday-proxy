const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>1Concier — New Monday Item</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f3; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #e5e5e5; padding: 2rem; width: 100%; max-width: 600px; margin-top: 1rem; }
  .board-label { font-size: 12px; color: #888; margin-bottom: 4px; }
  .board-title { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 1.75rem; }
  .field { margin-bottom: 1.25rem; }
  label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
  input[type=text], input[typ
