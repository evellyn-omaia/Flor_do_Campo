import Cabecalho from "../components/Cabecalho";
import Rodape from "../components/Rodape";
function PaginaInstitucional({ titulo, descricao }) { return <><Cabecalho /><main className="pagina-institucional"><div><h1>{titulo}</h1><p>{descricao}</p></div></main><Rodape /></>; }
export default PaginaInstitucional;
