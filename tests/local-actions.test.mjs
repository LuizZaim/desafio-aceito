import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as domain from "../src/core/domain.ts";
import * as academic from "../src/core/academic.ts";
// Exercise the exact Store operation while avoiding native React/SQLite imports.
const output = ts.transpileModule(readFileSync(new URL("../src/core/local-actions.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(output, { exports, require: (name) => {
  if(name === "./domain") return domain;
  if(name === "./academic") return academic;
  throw Error("Unexpected dependency " + name);
}});
const { applyLocalAction } = exports;
const run = (state, action) => applyLocalAction(state, action).state;
const registered = () => run(domain.freshState(), {
  type:"registerTeam",name:"Time da Apresentação",district:"Tatuapé",city:"São Paulo",state:"SP",category:"Masculino",level:"Amador",bio:"",
});

test("operação composta local não perde crédito quando o interesse falha nem duplica match", () => {
  let state=run(registered(),{type:"selectAcademicPlan",plan:"academico"});
  const before=structuredClone(state);
  assert.throws(()=>run(state,{type:"priorityInterest",id:"unknown-team"}),/não encontrada/);
  assert.equal(JSON.stringify(state),JSON.stringify(before),"failed operation leaves both wallet and team state untouched");
  state=run(state,{type:"priorityInterest",id:"vila"});
  assert.equal(state.academic.subscription.priorityCredits,0);
  assert.deepEqual(state.matches,["vila"]);
  state=run(state,{type:"addPriorityCredit"});
  const beforeDuplicate=structuredClone(state);
  assert.throws(()=>run(state,{type:"priorityInterest",id:"vila"}),/já registrado/);
  assert.equal(JSON.stringify(state),JSON.stringify(beforeDuplicate),"duplicate interest cannot partially debit the wallet");
});

test("crédito prioritário local não ignora reciprocidade, cadastro ou desativação", () => {
  const unregistered=run(domain.freshState(),{type:"addPriorityCredit"});
  assert.throws(()=>run(unregistered,{type:"priorityInterest",id:"leste"}),/equipe ativa/);
  let state=run(registered(),{type:"addPriorityCredit"});
  state=run(state,{type:"priorityInterest",id:"leste"});
  assert.equal(state.academic.subscription.priorityCredits,0);
  assert.deepEqual(state.interests,["leste"]);
  assert.deepEqual(state.matches,[],"priority does not fabricate the other team's interest");
  state=run(state,{type:"addPriorityCredit"});
  state=run(state,{type:"delete"});
  assert.throws(()=>run(state,{type:"priorityInterest",id:"vila"}),/equipe ativa/);
  assert.equal(state.academic.subscription.priorityCredits,1);
});

test("ações de elenco e campo preservam preferências e histórico ao passar pelo Store local", () => {
  let state=run(registered(),{type:"settings",push:false,email:false,dark:true});
  state=run(state,{type:"savePlayer",name:"Capitão",number:10,position:"Meio-campo"});
  state=run(state,{type:"teamField",field:"Campo do Bairro"});
  state=run(state,{type:"interest",id:"vila"});
  state=run(state,{type:"send",id:"vila",text:"Teste de conversa"});
  assert.equal(state.academic.players[0].name,"Capitão");
  assert.equal(state.academic.preferredField,"Campo do Bairro");
  assert.equal(state.settings.dark,true);
  assert.equal(state.messages.vila[0].text,"Teste de conversa");
});
