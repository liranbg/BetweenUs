# BetweenUS
## About the project
We're two 4th year students of Software Engineering and this is our graduation project.

In this project we implement an algorithm that will allow to share data between several participants in a secure manner.

The data shared in a party would be only decryptable by a participant (never by the server) once a certain threshold of confirmations by the party members has been received.

To achieve that, we've used a combination of several cryptography algorithms, which includes:
- [Shamir Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
- [AES Cryptography](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [RSA Cryptography](https://en.wikipedia.org/wiki/RSA_(cryptosystem))

We've implemented a certain flow containing said algorithms in a client side, and then set up a server to be a mediator between the clients.

The entire heavy lifting of encrypting / decrypting is done at the client side. The server is just the (encrypted) data broker.


> ###Repository Information
#### Issues Manager
[Issues Backlog](https://waffle.io/liranbg/JCEFinalProject)
#### Calendar Manager
[Calendar Manager](https://trello.com/b/nJPCPDXT/jcefinalproject)

# Developer Manual
## Server Side:
### Installation
In order to install the server, make sure npm (node.js package manager) is installed, tested with npm version 3.3.12.

Navigate to the directory of the server-side (/server), Install the dependencies, by executing the following command:
```
npm install
```

Create an **.env** file and put the credentials for the Cloudant account (Database used) in the following manner:
```
cloudant_username=USERNAME_HERE
cloudant_password=PASSWORD_HERE
```

And in the same path, run the following command:
```
node app.js start
```

That's it, the server should be up and running at this point.

A good indication of this working is:
```
$ node app.js start
Starting listening on port 3000
BetweenUs is up & listening on port 3000
Start creating databases indexes
[ 'UsersDB indexes has been created successfully',
  'GroupsDB indexes has been created successfully',
  'TransactionsDB indexes has been created successfully',
  'Notification stash DB indexes has been created successfully',
  'Done' ]
Done creating databases indexes
```
### Todo
- [ ] When one of the steps in a complex flow against the database fails, rollback the changes committed to db up until the step - so there's no residue of the failure. 
- [ ] Store user password in a non-plain manner, possibly salted hash.
- [ ] Add an API to remove group / transaction.
- [ ] In a transaction, mark the users that have already received enough shares and has requested the secret. (serves as an indicator to who has the secret information, in case of a leak).
- [ ] Add an option to leave a group.
- [ ] Add confirmation (share) revoking functionality.

### Bugs:
If you know about any bugs, let us know [here](https://github.com/liranbg/BetweenUs/issues/new)

## Client Side:
### Installation

In order to install the client, make sure npm (node.js package manager) is installed.

Then you will need to install react-native cli tools:
```
npm install react-native-cli
```

Navigate to the directory of the client-side (/client),
Install the dependencies, by executing the following command:
```
npm install
```

Then, start an adnroid emulator\your own device and execute the following command:
```
react-native run-android
```
Once its done, execute:
```
react-native start
```

and wait couple of seconds untill you will see the client-side app running on the android emulator\your own device

That's it, the client should be up and running at this point.

More information about running a react-native app on android can be found [here](https://facebook.github.io/react-native/)
### Todo
- [ ] Add Auto login with passphrase 
- [ ] Set long-polling to get automatical updates from server
- [ ] Add in User-settings to change password and edit-email
- [ ] An option to import\export private key
- [ ] An option to leave\delete groups\transactions
- [ ] A button to implement 'Request all shares' in a transaction.
- [ ] A recall button, to enable revoking a confirmation (share) if it hasn't been used it. 

### Bugs:
If you know about any bugs, let us know [here](https://github.com/liranbg/BetweenUs/issues/new)




