import express from 'express';
import bodyParser from 'body-parser';
import * as db from './../db/index';

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/pdt', (req, res) => {
  db.query(
    'SELECT * FROM test',
    [],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(data.rows);
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
