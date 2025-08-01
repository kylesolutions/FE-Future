import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import { persistor, Store } from './Redux/store.js'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> 
      <PersistGate loading={null} persistor={persistor}>
        <Provider store={Store}>
         <App />
        </Provider> 
      </PersistGate>
  </React.StrictMode>,
)

