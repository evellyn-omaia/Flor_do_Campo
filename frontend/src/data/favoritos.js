import { usuarioAtual } from "./lojaLocal";
const chave=()=>`flor-do-campo-favoritos-${usuarioAtual()?.uid||"visitante"}`;
export function buscarFavoritos(){try{return JSON.parse(localStorage.getItem(chave()))||[]}catch{return []}}
export function produtoFavorito(id){return buscarFavoritos().some(x=>String(x.id)===String(id))}
export function alternarFavorito(produto){const lista=buscarFavoritos(),indice=lista.findIndex(x=>String(x.id)===String(produto.id));if(indice>=0)lista.splice(indice,1);else lista.push(produto);localStorage.setItem(chave(),JSON.stringify(lista));window.dispatchEvent(new Event("favoritos-atualizados"));return indice<0}
export function removerFavorito(id){localStorage.setItem(chave(),JSON.stringify(buscarFavoritos().filter(x=>String(x.id)!==String(id))));window.dispatchEvent(new Event("favoritos-atualizados"))}
