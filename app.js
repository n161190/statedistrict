const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getstateQuery = ` 
    SELECT 
      * 
    FROM 
      state;`;
  const movieArray = await database.all(getstateQuery);
  response.send(movieArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuery = ` 
    SELECT  
      *  
    FROM  
      state
    WHERE  
      state_id = ${stateId};`;
  const state = await database.get(getstateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const poststateQuery = ` 
  INSERT INTO 
    state (district_name, state_id, cases,cured,active,deaths) 
  VALUES 
    ('${districtName}', '${stateId}', '${cases}','${active}','${deaths}');`;
  const movie = await database.run(poststateQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictQuery = ` 
    SELECT  
      *  
    FROM  
      district
    WHERE  
      district_id = ${districtId};`;
  const district = await database.get(getdistrictQuery);
  response.send(convertDbObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedistrictQuery = ` 
  DELETE FROM 
    district
  WHERE 
    district_id = ${districtId};`;
  await database.run(deletedistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updatedistrictQuery = ` 
  UPDATE 
    district
  SET 
    district_name = '${districtName}', 
    state_id = '${stateId}', 
    cases = '${cases}',
    cured='${cured}',
    active='${active}',
    deaths='${deaths}'

  WHERE 
    district_id = ${districtId};`;

  await database.run(updatedistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const stateId = request.params;
  const getDistrictQuery = ` 
       SELECT 
       SUM(cases),
       SUM(cures),
       SUM(active),
       SUM(deaths)
       FROM 
         district 
        WHERE state_id=${stateId};`;
  const status = await database.all(getdistrictQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
