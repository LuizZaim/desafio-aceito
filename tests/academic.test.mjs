import test from "node:test";
import assert from "node:assert/strict";
import { emptyAcademic, academicTransition, localAcademic } from "../src/core/academic.ts";
import { freshState, transition, fields, dateAfter } from "../src/core/domain.ts";

test("cartões acadêmicos aceitam somente apelido e quatro dígitos fictícios", () => {
  for (const action of [{last4:"4111111111111111"},{last4:"abcd"},{last4:1234},{cvv:"123"},{pan:"4111111111111111"}])
    assert.throws(() => academicTransition(emptyAcademic(), {type:"addDemoCard",label:"Teste",last4:"1234",...action}));
  const state = academicTransition(emptyAcademic(), {type:"addDemoCard",label:"  Cartão fictício  ",last4:"1234"});
  assert.deepEqual(Object.keys(state.cards[0]).sort(), ["id","label","last4"]);
  assert.equal(state.cards[0].label,"Cartão fictício");
  assert.equal(academicTransition(state,{type:"removeDemoCard",id:state.cards[0].id}).cards.length,0);
  assert.throws(() => academicTransition(state,{type:"removeDemoCard",id:"outro"}),/não encontrado/);
});

test("plano simulado concede um crédito uma única vez e não duplica benefício ao alternar", () => {
  let state = academicTransition(emptyAcademic(),{type:"selectAcademicPlan",plan:"academico"});
  assert.equal(state.subscription.priorityCredits,1);
  state = academicTransition(state,{type:"priorityInterest",id:"vila"});
  assert.equal(state.subscription.priorityCredits,0);
  assert.throws(() => academicTransition(state,{type:"priorityInterest",id:"mooca"}),/crédito/);
  state = academicTransition(state,{type:"selectAcademicPlan",plan:"gratuito"});
  state = academicTransition(state,{type:"selectAcademicPlan",plan:"academico"});
  assert.equal(state.subscription.priorityCredits,0);
  for(let i=0;i<10;i++) state = academicTransition(state,{type:"addPriorityCredit"});
  assert.throws(() => academicTransition(state,{type:"addPriorityCredit"}),/máximo/);
});

test("elenco valida dados, evita número duplicado e não edita IDs desconhecidos", () => {
  let state = academicTransition(emptyAcademic(),{type:"savePlayer",name:"Goleiro",number:1,position:"Goleiro"});
  const id = state.players[0].id;
  assert.throws(() => academicTransition(state,{type:"savePlayer",name:"Outro",number:1,position:"Atacante"}),/em uso/);
  for(const number of [-1,100,1.5,"10",undefined]) assert.throws(() => academicTransition(state,{type:"savePlayer",name:"Outro",number,position:"Atacante"}));
  assert.throws(() => academicTransition(state,{type:"savePlayer",id:"outro",name:"Outro",number:10,position:"Atacante"}),/não encontrado/);
  state = academicTransition(state,{type:"savePlayer",id,name:"Capitão",number:10,position:"Meio-campo"});
  assert.equal(state.players.length,1);
  assert.equal(state.players[0].number,10);
  state = academicTransition(state,{type:"teamField",field:"  Campo do bairro  "});
  assert.equal(state.preferredField,"Campo do bairro");
  state = academicTransition(state,{type:"removePlayer",id});
  assert.equal(state.players.length,0);
});

test("conquistas derivam do histórico e não aparecem na equipe recém-cadastrada", () => {
  let state = transition(freshState(),{type:"registerTeam",name:"Time do Bairro",district:"Tatuapé",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:""}).state;
  assert.deepEqual(localAcademic(state).achievements,[]);
  state = transition(state,{type:"interest",id:"vila"}).state;
  assert.deepEqual(localAcademic(state).achievements.map((row)=>row.id),["first-match"]);
  state = transition(state,{type:"schedule",id:"vila",date:dateAfter(5),time:"10:00",field:fields[0],home:state.profile.name}).state;
  assert.equal(localAcademic(state).achievements.length,1,"a future proposal is not a completed game");
});
