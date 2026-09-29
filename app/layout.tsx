import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Taimoor Ali Waris — Full Stack Developer',description:'Full stack developer in Lahore. Explore my projects, development experience, and work with React, Node.js, and MongoDB.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
