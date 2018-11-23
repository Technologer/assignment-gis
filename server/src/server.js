import express from 'express';
import bodyParser from 'body-parser';
import * as db from './../db/index';

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// to enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.post('/api/pdt', (req, res) => {
  console.log(req.body)
  db.query(
    // 'SELECT ST_AsGeoJSON(geom) from accidents LIMIT 100',
    // 'SELECT latitude, longitude from accidents LIMIT 100',
    'SELECT st_asgeojson(geom) FROM accidents CROSS JOIN (SELECT st_setsrid(st_point(-0.12810230255126956, 51.54968430132381), 4326) as point) as test WHERE st_distance(geom::geography, test.point::geography) < 100',
    [],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(data.rows.map(item => JSON.parse(item.st_asgeojson)));
        // res.send(data.rows);
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
