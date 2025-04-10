import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig);

export default firebaseApp;