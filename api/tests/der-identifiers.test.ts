import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

test("migração DER mantém dados, identifica caução/avaliação e não inventa endereço, geolocalização ou transação externa", async () => {
  const pg = new PGlite();
  try {
    for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql") && f < "006").sort()) await pg.exec(readFileSync(`migrations/${file}`,"utf8"));
    for (const id of ["a","b"]) {
      await pg.query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,'fixture-hash')",[id,"Organizador "+id,id+"@example.test"]);
      await pg.query("INSERT INTO teams(id,organizer_id,name,district,city,state,category,level) VALUES($1,$1,$2,'Tatuapé','São Paulo','SP','Masculino','Amador')",[id,"Time "+id]);
    }
    await pg.exec(`
      INSERT INTO team_matches(id,team_a_id,team_b_id) VALUES('match','a','b');
      INSERT INTO fields(id,name,normalized_key) VALUES('field','Arena Antiga • Rua Exemplo','arena antiga • rua exemplo');
      INSERT INTO games(id,match_id,team_a_id,team_b_id,proposer_team_id,home_team_id,field_id,starts_at,status,score_a,score_b)
      VALUES('game-one','match','a','b','a','a','field',CURRENT_TIMESTAMP,'Concluída',3,1),
            ('game-two','match','a','b','b','b','field',CURRENT_TIMESTAMP,'Concluída',0,2);
      INSERT INTO simulated_deposits(game_id,payer_team_id,reversed,penalty_cents) VALUES('game-one','a',TRUE,1000);
      INSERT INTO game_reviews(game_id,reviewer_team_id,target_team_id,skill,fair,punctuality,organization) VALUES('game-one','a','b',5,4,3,4);
    `);
    await pg.exec(readFileSync("migrations/006_der_entity_identifiers.sql","utf8"));
    const venue = (await pg.query<any>("SELECT name,address,latitude,longitude FROM fields WHERE id='field'")).rows[0];
    assert.deepEqual(venue,{name:"Arena Antiga • Rua Exemplo",address:null,latitude:null,longitude:null});
    const deposit = (await pg.query<any>("SELECT id,game_id,payer_team_id,amount_cents,paid,reversed,penalty_cents,simulated,external_transaction_id FROM simulated_deposits WHERE game_id='game-one'")).rows[0];
    assert.deepEqual(deposit,{id:"deposit-game-one",game_id:"game-one",payer_team_id:"a",amount_cents:5000,paid:true,reversed:true,penalty_cents:1000,simulated:true,external_transaction_id:null});
    const review = (await pg.query<any>("SELECT id,game_id,reviewer_team_id,target_team_id,skill,fair,punctuality,organization FROM game_reviews WHERE game_id='game-one'")).rows[0];
    assert.deepEqual(review,{id:"review-game-one-a",game_id:"game-one",reviewer_team_id:"a",target_team_id:"b",skill:5,fair:4,punctuality:3,organization:4});
    const nextDeposit = (await pg.query<any>("INSERT INTO simulated_deposits(game_id,payer_team_id) VALUES('game-two','b') RETURNING id,external_transaction_id")).rows[0];
    assert.match(nextDeposit.id,/^[a-f0-9-]{36}$/i);
    assert.equal(nextDeposit.external_transaction_id,null);
    const nextReview = (await pg.query<any>("INSERT INTO game_reviews(game_id,reviewer_team_id,target_team_id,skill,fair,punctuality,organization) VALUES('game-two','b','a',2,3,4,5) RETURNING id")).rows[0];
    assert.match(nextReview.id,/^[a-f0-9-]{36}$/i);
    await assert.rejects(()=>pg.query("INSERT INTO simulated_deposits(game_id,payer_team_id) VALUES('game-one','b')"),/unique constraint/i);
    await assert.rejects(()=>pg.query("INSERT INTO game_reviews(game_id,reviewer_team_id,target_team_id,skill,fair,punctuality,organization) VALUES('game-one','a','b',1,1,1,1)"),/unique constraint/i);
    await assert.rejects(()=>pg.query("UPDATE fields SET latitude=10 WHERE id='field'"),/check constraint/i);
    await assert.rejects(()=>pg.query("UPDATE fields SET latitude=91,longitude=10 WHERE id='field'"),/check constraint/i);
    await assert.rejects(()=>pg.query("UPDATE fields SET latitude=10,longitude=-181 WHERE id='field'"),/check constraint/i);
    await pg.query("UPDATE fields SET address='Rua Exemplo, 10',latitude=-23.55,longitude=-46.63 WHERE id='field'");
    const externalUnique = await pg.query<any>("SELECT contype FROM pg_constraint WHERE conname='simulated_deposits_external_transaction_unique'");
    assert.equal(externalUnique.rows[0].contype,"u");
    const primaryKeys = await pg.query<any>(`SELECT t.relname,a.attname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=ANY(c.conkey)
      WHERE c.contype='p' AND t.relname IN ('simulated_deposits','game_reviews') ORDER BY t.relname`);
    assert.deepEqual(primaryKeys.rows,[{relname:"game_reviews",attname:"id"},{relname:"simulated_deposits",attname:"id"}]);
  } finally { await pg.close(); }
});
