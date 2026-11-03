
import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizarCRN,
  validarEmail,
  validarSenha,
  validarCRN,
  validarNome,
} from "./validacaoAuth.js";

test("Deve aceitar um e-mail válido", () => {
  assert.equal(validarEmail("nutri@rotuscan.com"), true);
});

test("Deve rejeitar um e-mail inválido", () => {
  assert.equal(validarEmail("nutrirotuscan.com"), false);
});

test("Deve aceitar uma senha com 8 caracteres", () => {
  assert.equal(validarSenha("12345678"), true);
});

test("Deve rejeitar uma senha com menos de 8 caracteres", () => {
  assert.equal(validarSenha("1234567"), false);
});

test("Deve rejeitar uma senha com mais de 72 caracteres", () => {
  assert.equal(validarSenha("a".repeat(73)), false);
});

test("Deve normalizar o CRN", () => {
  assert.equal(normalizarCRN("crn-3 12345"), "CRN-3 12345");
});

test("Deve aceitar um CRN válido", () => {
  assert.equal(validarCRN("CRN-3 12345"), true);
});

test("Deve rejeitar um CRN inválido", () => {
  assert.equal(validarCRN("12345"), false);
});

test("Deve aceitar um nome válido", () => {
  assert.equal(validarNome("Maria Silva"), true);
});

test("Deve rejeitar um nome vazio", () => {
  assert.equal(validarNome("   "), false);
});
