import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
// import { scan } from  'react-scan';
//
// scan({
//     enabled:  true,
//     log:  true,
//     showToolbar:  true,
// });

createRoot(document.getElementById('root')!).render(
    <App/>
)
