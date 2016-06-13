# BetweenUS

> ###Repository Information
#### Issues Manager
[Issues Backlog](https://waffle.io/liranbg/JCEFinalProject)
#### Calendar Manager
[Calendar Manager](https://trello.com/b/nJPCPDXT/jcefinalproject)

# Server usage:
## Installation
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
