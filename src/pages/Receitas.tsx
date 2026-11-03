import "../styles/receitas.css";
import { useMemo, useState } from "react";
import { Search, X, ImageIcon } from "lucide-react";
type Receita={nome:string;categoria:string;ingredientes:string[];preparo:string};
const receitas:Receita[]=[
 {nome:'Bolo de banana com farinha de arroz',categoria:'Sem glúten',ingredientes:['1 xícara (chá) de polvilho doce','1 xícara (chá) de farinha de arroz','1/2 colher (chá) de sal','3 ovos médios','2 colheres (sopa) de óleo','150 ml de água em temperatura ambiente','2 colheres de açúcar','1 colher (sopa) de fermento biológico em pó','1/2 colher (chá) de goma de xantana'],preparo:'Misture os ingredientes secos, acrescente os líquidos e mexa até obter uma massa homogênea. Asse até dourar. Receita ilustrativa: confirme quantidades e preparo antes de prescrever.'},
 {nome:'Muffins salgados de frango',categoria:'Sem glúten',ingredientes:['Frango cozido desfiado','Ovos','Farinha sem glúten','Temperos a gosto'],preparo:'Misture os ingredientes, distribua em forminhas e asse até firmar. Receita ilustrativa.'},
 {nome:'Pizza com queijo de soja',categoria:'Sem lactose',ingredientes:['Massa de pizza sem leite','Molho de tomate','Queijo vegetal de soja','Orégano'],preparo:'Monte a pizza e asse até a massa ficar dourada. Receita ilustrativa.'},
 {nome:'Brigadeiro com leite de coco',categoria:'Sem lactose',ingredientes:['Leite de coco','Cacau em pó','Açúcar'],preparo:'Cozinhe em fogo baixo, mexendo até engrossar. Receita ilustrativa.'},
 {nome:'Soja torrada crocante',categoria:'Sem amendoim',ingredientes:['Grãos de soja','Azeite','Sal e especiarias'],preparo:'Tempere e leve ao forno até ficar crocante. Receita ilustrativa.'},
 {nome:'Crocante de sementes',categoria:'Sem amendoim',ingredientes:['Sementes de girassol','Sementes de abóbora','Azeite e temperos'],preparo:'Misture e asse até dourar. Receita ilustrativa.'}
];
const filtros=['Todos','Sem glúten','Sem lactose','Sem amendoim'];
export default function Receitas(){
 const [filtro,setFiltro]=useState('Todos');const [busca,setBusca]=useState('');const [selecionada,setSelecionada]=useState<Receita|null>(null);
 const lista=useMemo(()=>receitas.filter(r=>(filtro==='Todos'||r.categoria===filtro)&&r.nome.toLowerCase().includes(busca.toLowerCase())),[filtro,busca]);
 return <div className="recipes-page"><div className="recipes-toolbar"><div className="recipe-filters">{filtros.map(f=><button key={f} className={filtro===f?'selected':''} onClick={()=>setFiltro(f)}>{f}</button>)}</div><label className="recipe-search"><Search size={18}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar receitas..."/></label></div>
 <div className="recipes-grid">{lista.map(r=><article className="recipe-item" key={r.nome}><button className="recipe-preview" onClick={()=>setSelecionada(r)} aria-label={`Abrir ${r.nome}`}><span>Imagem em breve</span></button><h3>{r.nome}</h3><span className="recipe-badge">{r.categoria}</span><p>Receita demonstrativa</p><button className="recipe-prescribe" onClick={()=>setSelecionada(r)}>Ver detalhes</button></article>)}</div>
 {lista.length===0&&<p>Nenhuma receita encontrada.</p>}
 {selecionada&&<div className="recipe-overlay" onClick={()=>setSelecionada(null)} role="presentation"><div className="recipe-modal" role="dialog" aria-modal="true" aria-label={selecionada.nome} onClick={e=>e.stopPropagation()}><button className="recipe-close" onClick={()=>setSelecionada(null)} aria-label="Fechar"><X size={22}/></button><div className="recipe-modal-image"><ImageIcon size={36}/><span>Imagem da receita</span></div><h2>{selecionada.nome}</h2><div className="recipe-ingredients">{selecionada.ingredientes.map((ing,i)=><div className="recipe-ingredient" key={i}><span>{i+1}</span>{ing}</div>)}</div><div className="recipe-preparation"><h3>Modo de preparo</h3><p>{selecionada.preparo}</p></div></div></div>}
 </div>;
}
