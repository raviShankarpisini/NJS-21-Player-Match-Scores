const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

let initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at https://localhost:3000/")
    );
  } catch (error) {
    console.log(`error message is ${error.message}`);
  }
};
initializeDbAndServer();

const convertPlayerDetailsDbToResponseDb = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbToResponseDb = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDbToResponseDb = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  getPlayerDetailsQuery = `
    SELECT 
        *
    FROM
        player_details;`;
  const playerDetailsArray = await database.all(getPlayerDetailsQuery);
  response.send(
    playerDetailsArray.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseDb(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  getSinglePlayerDetailsQuery = `
    SELECT 
        *
    FROM
        player_details
    WHERE
        player_id=${playerId};`;
  const playerDetailsArray = await database.get(getSinglePlayerDetailsQuery);
  response.send(convertPlayerDetailsDbToResponseDb(playerDetailsArray));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
     UPDATE 
        player_details
     SET
        player_name='${playerName}'
    WHERE
        player_id=${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id=${matchId};`;
  const matchDetails = await database.get(matchDetailsQuery);
  response.send(convertMatchDetailsDbToResponseDb(matchDetails));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const allMatchesOfAPlayerQuery = `
    SELECT 
        *
    FROM
        match_details NATURAL JOIN player_match_score
    WHERE
        player_id=${playerId};`;
  const allMatchesOfAPlayer = await database.all(allMatchesOfAPlayerQuery);
  response.send(
    allMatchesOfAPlayer.map((eachPlayer) =>
      convertMatchDetailsDbToResponseDb(eachPlayer)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const listOfPlayersOfAMatchQuery = `
    SELECT 
        *
    FROM
        player_details natural join player_match_score
    where match_id=${matchId};`;
  const listOfPlayerOfAMatch = await database.all(listOfPlayersOfAMatchQuery);
  response.send(
    listOfPlayerOfAMatch.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseDb(eachPlayer)
    )
  );
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `
    SELECT 
        player_id as playerId,
        player_name as playerName,
        SUM(score) as totalScore,
        SUM(fours) as totalFours,
        SUM(sixes) as totalSixes
    FROM
        player_details NATURAL JOIN player_match_score
    WHERE
        player_id=${playerId};`;
  const playerStats = await database.get(playerStatsQuery);
  response.send(playerStats);
});
module.exports = app;
