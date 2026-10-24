import type { Metadata } from 'next';
import './style.css';
export const metadata:Metadata={title:'Belém Studio · Seu estúdio, em harmonia',description:'Painel privado de galerias fotográficas.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
