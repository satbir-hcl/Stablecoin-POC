# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment setup

### Create several accounts

ECDSA:

* One to deploy the contracts (needs to be ECDSA key)

ED25519:

* One to create the remittance token (later called issuer)
* One per bank
* Two additional accounts for customers/users

Import the ED25519 accounts in hashpack

### Install the hashpack extension

https://hashpack.app

import the ED25519 accounts into Hashpack

### Setup .env

`cd web`

`cp .env.sample.env`

`nano .env`

update `ETH_PRIVATE_KEY` with your ECDSA key

## Build

`cd web`

`npm install -g truffle`

`npm install`

`truffle compile`

## Deploy the contracts

`cd web`

`truffle migrate` (also use this command if you modify the contracts to compile and deploy the modifications)

## Run the UI

`cd web`

`npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser, this will launch an all-in-one demo page.

You may alternatively open

Open [http://localhost:3000/demo](http://localhost:3000/demo) to view the browser-only demo.
Open [http://localhost:3000/setup](http://localhost:3000/setup) to view the setup page.
Open [http://localhost:3000/banks](http://localhost:3000/banks) to view the banks page.
Open [http://localhost:3000/customers](http://localhost:3000/customers) to view the customers page.

## Setup the deployed contract in the UI

Copy the remittance contract address output by truffle into the "setup" page and click on `Set`

Once the remittance address is set, yoy may create a remittance token using the `issuer` account in Hashpack.

## Additional npm commands

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.
