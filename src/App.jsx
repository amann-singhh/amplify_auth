import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from 'react-bootstrap';
import { ButtonGroup } from 'react-bootstrap';
import { InputGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import './App.css'
// import Amplify  from 'aws-amplify';
// import { Auth } from 'aws-amplify';
// import awsconfig from './aws-exports';

import { Amplify, Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);


Amplify.configure({
  Auth: {
    region: 'eu-north-1',  // Replace with your AWS region
    userPoolId: 'eu-north-1_7XRVX2RVm',  // Replace with your User Pool ID
    userPoolWebClientId: '7r8v0eupddjeom60ascq7lk7td',  // Replace with your User Pool Web Client ID
  }
});


// import Auth from '@aws-amplify/auth';
// Amplify.configure(awsconfig);

const NOTSIGNIN = 'You are NOT logged in';
const SIGNEDIN = 'You have logged in successfully';
const SIGNEDOUT = 'You have logged out successfully';
const WAITINGFOROTP = 'Enter OTP number';
const VERIFYNUMBER = 'Verifying number (Country code +XX needed)';

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('Welcome to Demo');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [otp, setOtp] = useState('');
  const [phoneNumber, setNumber] = useState('');
 
 

  // Function to generate a secure random password
  const generateSecurePassword = () => {
    // Example of generating a secure random password
    return uuidv4() + 'A1!';  // Ensure it meets Cognito's password policy
  };
  
  const password = generateSecurePassword();
  async function signUp(phoneNumber) {
  
    try {
      const { user } = await Auth.signUp({
        username: phoneNumber,
        password,
        attributes: {
          phone_number: phoneNumber,  // Storing phone number as an attribute
        },
      });
  
      console.log('Sign-up successful', user);
      // Optionally inform the user that sign-up was successful
    } catch (error) {
      console.error('Error during sign-up:', error);
  
      // Handle specific error types
      if (error.code === 'UsernameExistsException') {
        // Inform the user that the phone number is already registered
        console.error('This phone number is already registered.');
      } else if (error.code === 'InvalidPasswordException') {
        // This shouldn't happen as we're generating a secure password, but handle it just in case
        console.error('The password does not meet the requirements.');
      } else {
        // Handle other errors
        console.error('An unknown error occurred. Please try again.');
      }
    }
  }



async function signIn(phoneNumber, password) {
  setMessage(VERIFYNUMBER);
  if (!phoneNumber) {
    console.error('Phone number is required');
    return;
  }

  try {
    const cognitoUser = await Auth.signIn(phoneNumber, password);
    console.log('Sign-in successful', cognitoUser);
    // Optionally inform the user that sign-in was successful
    return cognitoUser;  // Return the cognitoUser for further use if needed
  } catch (error) {
    console.error('Error during sign-in:', error);

    // Handle specific error types
    if (error.code === 'UserNotFoundException') {
      console.error('User does not exist.');
    } else if (error.code === 'NotAuthorizedException') {
      console.error('Incorrect username or password.');
    } else if (error.code === 'UserNotConfirmedException') {
      console.error('User is not confirmed. Please check your email or phone for confirmation instructions.');
    } else {
      console.error('An unknown error occurred. Please try again.');
    }

    // Optionally provide a user-friendly message in the UI
  }
}


  async function verifyOtp () {
    if (!otp) {
      setMessage('OTP is required');
      return;
    }

    try {
      const cognitoUser = await Auth.sendCustomChallengeAnswer(session, otp);
      setUser(cognitoUser);
      setMessage('Signed in successfully');
      setSession(null);
      setOtp('');
    } catch (err) {
      console.error('Error verifying OTP:', err);

      switch (err.code) {
        case 'NotAuthorizedException':
          setMessage('Incorrect OTP. Please try again.');
          break;
        case 'LimitExceededException':
          setMessage('Attempt limit exceeded. Please try again later.');
          break;
        case 'UserNotFoundException':
          setMessage('User does not exist.');
          break;
        default:
          setMessage('An unknown error occurred. Please try again.');
      }

      setOtp('');
    }
  };







async function submitCustomChallengeAnswer(user, OTP) {
  if (!user || !OTP) {
    console.error('User and OTP are required');
    return;
  }

  try {
    const cognitoUser = await Auth.sendCustomChallengeAnswer(user, OTP);
    console.log('Custom challenge answer submitted successfully', cognitoUser);
    // Optionally inform the user that the OTP was accepted
    return cognitoUser;  // Return the cognitoUser for further use if needed
  } catch (error) {
    console.error('Error during custom challenge answer submission:', error);

    // Handle specific error types
    if (error.code === 'NotAuthorizedException') {
      console.error('Incorrect OTP. Please try again.');
    } else if (error.code === 'LimitExceededException') {
      console.error('Attempt limit exceeded. Please try again later.');
    } else if (error.code === 'UserNotFoundException') {
      console.error('User does not exist.');
    } else {
      console.error('An unknown error occurred. Please try again.');
    }

    // Optionally provide a user-friendly message in the UI
  }
}

  
useEffect(() => {
  verifyAuth();
}, []);

async function verifyAuth() {
  try {
    const currentUser = await Auth.currentAuthenticatedUser();
    setUser(currentUser);
    setMessage('Signed in');
  } catch (err) {
    console.error('Error verifying authentication:', err);
    setMessage('Not signed in');
  }
};


async function signOut(){
  if (!user) {
    setMessage(NOTSIGNIN);
    return;
  }

  try {
    await Auth.signOut();
    setUser(null);
    setOtp('');
    setMessage(SIGNEDOUT);
  } catch (err) {
    console.error('Error signing out:', err);
    setMessage(SIGNOUT_ERROR);
  }
};
 

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {!user && !session && (<div>
        <InputGroup className='mb-3'>
          <FormControl placeholder='PhoneNumber (+XX)'
          onChange={(event)=> setNumber(event.target.value)}
          />
          <Button variant ='outline-secondary' onClick={signIn}>Get OTP</Button>
        </InputGroup>
      </div>)}
      {!user && !session &&(
      <div>
        <InputGroup className='mb-3'>
          <FormControl placeholder='Your OTP'
          onChange={(event)=> setOtp(event.target.value)}
            value={otp}
          />
          <Button variant ='outline-secondary' onClick={verifyOtp}>Confirm</Button>
        </InputGroup>
        </div>
      )}

        <div>
        <ButtonGroup>
          <button variant='outline-secondary' onClick={verifyAuth}>Am i signed in?</button>
          <button variant='outline-danger' onClick={signOut}>Signout</button>
        </ButtonGroup>
      </div>
    </>
  )
}

export default App
