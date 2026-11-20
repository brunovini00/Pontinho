import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

const root = document.getElementById("app");
if (!root) throw new Error("O elemento raiz do Pontinho não foi encontrado.");
createRoot(root).render(<Home />);
