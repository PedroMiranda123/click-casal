'use strict';

// PT-BR grocery term → Danish equivalent(s).
// Each entry is { pt: string[], da: string[] } so multi-word PT phrases (e.g. "peito de frango")
// are listed alongside shorter aliases and map to one or more Danish search terms.
// Add new entries here; matching logic in groceryMatching.js is untouched.

const GROCERY_TERMS = [
  { pt: ['leite'],                        da: ['mælk'] },
  { pt: ['ovos', 'ovo'],                  da: ['æg'] },
  { pt: ['pão', 'pao'],                   da: ['brød'] },
  { pt: ['manteiga'],                     da: ['smør'] },
  { pt: ['queijo'],                       da: ['ost'] },
  { pt: ['frango', 'peito de frango'],    da: ['kylling', 'kyllingebryst'] },
  { pt: ['carne moída', 'carne picada', 'carne moida'], da: ['hakket oksekød'] },
  { pt: ['arroz'],                        da: ['ris'] },
  { pt: ['macarrão', 'macarrao', 'massa'], da: ['pasta'] },
  { pt: ['tomate'],                       da: ['tomat'] },
  { pt: ['cebola'],                       da: ['løg'] },
  { pt: ['alho'],                         da: ['hvidløg'] },
  { pt: ['batata'],                       da: ['kartofler'] },
  { pt: ['iogurte'],                      da: ['yoghurt'] },
  { pt: ['café', 'cafe'],                 da: ['kaffe'] },
  { pt: ['açúcar', 'acucar'],             da: ['sukker'] },
  { pt: ['sal'],                          da: ['salt'] },
  { pt: ['azeite'],                       da: ['olivenolie'] },
  { pt: ['banana'],                       da: ['banan'] },
  { pt: ['maçã', 'maca'],                 da: ['æble'] },
  { pt: ['laranja'],                      da: ['appelsin'] },
  { pt: ['cenoura'],                      da: ['gulerod'] },
  { pt: ['alface'],                       da: ['salat'] },
  { pt: ['pepino'],                       da: ['agurk'] },
  { pt: ['presunto'],                     da: ['skinke'] },
  { pt: ['bacon'],                        da: ['bacon'] },
  { pt: ['salsicha'],                     da: ['pølse'] },
  { pt: ['água', 'agua'],                 da: ['vand'] },
  { pt: ['refrigerante'],                 da: ['sodavand'] },
  { pt: ['cerveja'],                      da: ['øl'] },
  { pt: ['vinho'],                        da: ['vin'] },
  { pt: ['chocolate'],                    da: ['chokolade'] },
  { pt: ['sorvete'],                      da: ['is'] },
  { pt: ['papel higiênico', 'papel higienico'], da: ['toiletpapir'] },
  { pt: ['sabão em pó', 'sabao em po', 'detergente'], da: ['vaskemiddel'] },
  { pt: ['creme de leite', 'nata'],       da: ['fløde'] },
  { pt: ['peixe'],                        da: ['fisk'] },
  { pt: ['salmão', 'salmao'],             da: ['laks'] },
  { pt: ['camarão', 'camarao'],           da: ['rejer'] },
  { pt: ['ervilha'],                      da: ['ærter'] },
  { pt: ['milho'],                        da: ['majs'] },
  { pt: ['feijão', 'feijao'],             da: ['bønner'] },
];

module.exports = { GROCERY_TERMS };
