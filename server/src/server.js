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
      SELECT *
      FROM accidents07 a JOIN road r 
      ON 
      st_dwithin(r.way::geography ,a.geom::geography, 10)
    )
    
    SELECT st_asgeojson(geom) as geo, accident_date, acccident_time as accident_time, number_of_vehicle FROM road_accidents
    UNION ALL 
    SELECT st_asgeojson(way) as geo, NULL, NULL, NULL FROM road`,
    [req.body.latlng.lng, req.body.latlng.lat],

    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        const response = data.rows.map(row => {
          let geoJSON = JSON.parse(row.geo);
          console.log(row);
          return createFeature(geoJSON, {
            date: row.accident_date,
            time: row.accident_time,
            numberOfVehicle: row.number_of_vehicle
          });
        });
        res.send(response);
      }
    }
  );
});

app.post('/api/accidents-area', (req, res) => {
  db.query(
    `SELECT tab2.name, tab1.count, st_asgeojson(tab2.way) as polygon, tab1.area
     FROM accidents_in_admin_level tab1
     JOIN planet_osm_polygon tab2 ON tab1.id = tab2.id
     WHERE tab1.admin_level = $1`,
    [req.body.adminLevel],

    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(row => {
            let geoJSON = JSON.parse(row.polygon);
            return createFeature(geoJSON, {
              accidentsCount: row.count,
              areaName: row.name,
              area: row.area
            });
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
            return createFeature(geoJSON, {
              accidents_count: row.count,
              district_name: row.name
            });
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
            return createFeature(geoJSON, {
              distance: item.distance,
              date: item.accident_date,
              time: item.accident_time,
              numberOfVehicle: item.number_of_vehicle
            });
          })
        );
      }
    }
  );
});

app.get('/api/schools', (req, res) => {
  db.query(
    `SELECT tab2.name, tab2.id FROM 
    (SELECT way from planet_osm_polygon WHERE name=$1 AND admin_level is not NULL) tab1
    JOIN
    (SELECT name, way, id FROM planet_osm_polygon WHERE (building in ('school', 'university') OR amenity='collage') AND name is not NULL) tab2
    ON st_contains(tab1.way, tab2.way)`,
    [req.query.city],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(data.rows);
      }
    }
  );
});

app.get('/api/accidents-school', (req, res) => {
  db.query(
    `WITH 	school as (SELECT way FROM planet_osm_polygon WHERE id=$1),
    accidents as (SELECT * FROM accidents07 a JOIN school s on st_dwithin(s.way::geography , a.geom::geography, 300)),
    lines as (SELECT ST_Intersection(tab1.range, tab2.way) as intersection FROM 
        (SELECT st_buffer(way::geography, 300) as range FROM school) tab1
          JOIN
          (SELECT way, name from planet_osm_line WHERE highway is not NULL AND highway!='footway') tab2
          ON st_intersects(tab1.range, tab2.way)),
  accidents_on_roads as (SELECT * FROM accidents a RIGHT JOIN lines r ON st_dwithin(r.intersection::geography ,a.geom::geography, 5))
  SELECT st_asgeojson(intersection) as way, count(*) from accidents_on_roads GROUP BY intersection`,
    [req.query.schoolId],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(row => {
            let geoJSON = JSON.parse(row.way);
            return createFeature(geoJSON, {
              accidentsCount: row.count
            });
          })
        );
      }
    }
  );
});

app.get('/api/school', (req, res) => {
  db.query(
    `SELECT name, st_asgeojson(way) as way
    FROM planet_osm_polygon WHERE id=$1`,
    [req.query.schoolId],
    (err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(
          data.rows.map(row => {
            let geoJSON = JSON.parse(row.way);
            return createFeature(geoJSON, {
              name: row.name
            });
          })
        );
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

function createFeature(geoJSON, properties) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: geoJSON
  };
}
