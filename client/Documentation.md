# Client side documentation

## Communication with the server
Folder: api
File: server_interaction.js
This class holds all methods to interact with the server side

## Client side encryption
Folder: api
Files: secret.js, betweenus.js
These files holds the basic algorithms to encrypt and decrypt files,
betweenus.js: Decryption, encryption and Split & Join shares by Shamir Secret Sharing algorithm
secrets.js: The implementation of Shamir Secret Sharing algorithm

## Client side app implementation

### Components:
Folder: components
Files: *.js

These files containing used components in client side's app,
Representing shared data and actions throughout the app's pages
 
### Pages:
Folder: pages
Files: *.js

These files containing all pages in app
each page is responsible for different step in using our service 'BetweenUs'