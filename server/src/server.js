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

app.post('/api/accidents-on-road', (req, res) => {
  db.query(
    `WITH road as (
      SELECT way FROM 
          (SELECT st_setsrid(st_makepoint($1, $2), 4326) as geom) point 
          JOIN 
          (SELECT * FROM planet_osm_line WHERE highway is not NULL AND highway!='footway') line
          ON st_dwithin(point.geom::geography ,line.way::geography, 5) 
        LIMIT 1
    ),
    road_accidents as (
      SELECT geom FROM accidents07 a JOIN road r 
      ON 
      st_dwithin(r.way::geography ,a.geom::geography, 10)
    )
    
    SELECT st_asgeojson(way) as geo FROM road
    UNION ALL 
    SELECT st_asgeojson(geom) as geo FROM road_accidents`,
    [req.body.latlng.lng, req.body.latlng.lat],

    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        const response = data.rows.map(row => {
          let geoJSON = JSON.parse(row.geo);
          console.log(geoJSON);
          return Object.assign(
            {
              type: 'Feature',
              geometry: geoJSON
            },
            {}
          );
        });
        res.send(response);
      }
    }
  );
});

app.post('/api/accidents-cities', (req, res) => {
  db.query(
    `SELECT tab1.name, tab1.count, st_asgeojson(tab2.way) as polygon FROM (SELECT d.osm_id, d.name, count(*)
      from accidents07 a 
      JOIN 
      (SELECT DISTINCT * FROM planet_osm_polygon WHERE boundary=$1 AND admin_level=$2) d 
      ON ST_Within(a.geom, d.way)
      GROUP BY d.name, d.osm_id) tab1
	    JOIN planet_osm_polygon tab2 ON tab1.osm_id = tab2.osm_id`,
    ['administrative', '6'],

    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(row => {
            let geoJSON = JSON.parse(row.polygon);
            return Object.assign(
              {
                type: 'Feature',
                properties: {
                  accidents_count: row.count,
                  district_name: row.name
                },
                geometry: geoJSON
              },
              {}
            );
          })
        );
      }
    }
  );
});

app.post('/api/accidents-counties', (req, res) => {
  db.query(
    `WITH counties as (SELECT counties.osm_id, counties.name, counties.way FROM
      (SELECT * FROM planet_osm_polygon WHERE boundary='administrative' AND admin_level='6' AND name=$1) city
      JOIN
      (SELECT * FROM planet_osm_polygon WHERE boundary='administrative' AND admin_level='8') counties
      ON st_contains(city.way, counties.way)
    )
    SELECT tab1.name, tab1.count, st_asgeojson(tab2.way) as polygon 
    FROM 
    (SELECT d.osm_id, d.name, count(*)
          from accidents07 a 
          JOIN counties d 
          ON ST_Within(a.geom, d.way)
          GROUP BY d.name, d.osm_id) tab1
          JOIN planet_osm_polygon tab2 ON tab1.osm_id = tab2.osm_id`,
    [req.body.city],

    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(row => {
            let geoJSON = JSON.parse(row.polygon);
            return Object.assign(
              {
                type: 'Feature',
                properties: {
                  accidents_count: row.count,
                  district_name: row.name
                },
                geometry: geoJSON
              },
              {}
            );
          })
        );
      }
    }
  );
});

app.post('/api/accidents-in-range', (req, res) => {
  db.query(
    `
    WITH center_point as (SELECT st_setsrid(st_point($1, $2), 4326)::geography as geom)
    SELECT st_asgeojson(a.geom), st_distance(a.geom, point.geom) as distance, a.accident_date, a.acccident_time as accident_time, number_of_vehicle
      FROM accidents07 a
      CROSS JOIN center_point as point 
      WHERE ST_DWithin(a.geom::geography, point.geom, $3)
      UNION ALL
      SELECT st_asgeojson(st_buffer(geom, $3)), null, null, null, null FROM center_point
      `,
    [req.body.latlng.lng, req.body.latlng.lat, req.body.distance],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(item => {
            let geoJSON = JSON.parse(item.st_asgeojson);
            return Object.assign(
              {
                type: 'Feature',
                properties: {
                  distance: item.distance,
                  date: item.accident_date,
                  time: item.accident_time,
                  numberOfVehicle: item.number_of_vehicle
                },
                geometry: geoJSON
              },
              {}
            );
          })
        );
      }
    }
  );
});

app.post('/api/test', (req, res) => {
  db.query(
    `SELECT st_asgeojson(way) 
    FROM planet_osm_polygon WHERE boundary='administrative' AND admin_level='6' AND name='City of London'`,
    [],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(item => {
            let geoJSON = JSON.parse(item.st_asgeojson);
            return Object.assign(
              {
                type: 'Feature',
                properties: {
                  name: 'Coors Field',
                  amenity: 'Baseball Stadium',
                  popupContent: 'This is where the Rockies play!'
                },
                geometry: geoJSON
              },
              {}
            );
          })
        );
      }
    }
  );
});

app.get('/api/cities', (req, res) => {
  db.query(
    `SELECT DISTINCT name FROM planet_osm_polygon WHERE boundary='administrative' AND admin_level='6' AND name is not NULL`,
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
